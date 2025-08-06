// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
console.info('🌍 Translation Edge Function started');
// Use environment variables for credentials
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Generate content hash for change detection
async function generateHash(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
}
// Translate text using OpenAI
async function translateText(text, targetLang) {
  const languageMap = {
    'sv': 'Swedish',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish'
  };
  const targetLanguage = languageMap[targetLang] || targetLang;
  const systemPrompt = `You are a professional translator specializing in travel and tourism content. Translate text from English to ${targetLanguage} following these rules:

1. Maintain the marketing tone and appeal
2. Keep any HTML tags intact
3. Preserve the meaning and cultural context
4. Use natural, native-sounding language
5. Keep proper nouns (company names, place names) unchanged unless they have official translations
6. Return ONLY the translation, no explanations or additional text`;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 2048,
        temperature: 0.1,
        top_p: 0.9
      })
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}
// Extract translatable strings from object
function extractTranslatableStrings(obj, prefix = '') {
  const strings = [];
  for (const [key, value] of Object.entries(obj)){
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      if (!fullKey.startsWith('meta.') && key !== 'currency' && key !== 'locale') {
        strings.push({
          key: fullKey,
          value
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      strings.push(...extractTranslatableStrings(value, fullKey));
    }
  }
  return strings;
}
// Rebuild object from translated strings
function rebuildObject(strings, baseObj) {
  const result = JSON.parse(JSON.stringify(baseObj));
  for (const { key, value } of strings){
    const keys = key.split('.');
    let current = result;
    for(let i = 0; i < keys.length - 1; i++){
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  return result;
}
// Load English source translation from storage (your real data)
async function loadEnglishSource() {
  const { data, error } = await supabase.storage.from('data').download('en.json');
  if (error || !data) {
    throw new Error('English source translations not found in data bucket');
  }
  const text = await data.text();
  return JSON.parse(text);
}
// Check if translation file exists and is fresh
async function isTranslationFresh(locale) {
  const { data: translationData } = await supabase.storage.from('data').download(`${locale}.json`);
  if (!translationData) {
    return {
      exists: false,
      fresh: false
    };
  }
  const { data: metadataData } = await supabase.storage.from('data').download('metadata.json');
  if (!metadataData) {
    return {
      exists: true,
      fresh: false
    };
  }
  try {
    const metadata = JSON.parse(await metadataData.text());
    const englishSource = await loadEnglishSource();
    const currentHash = await generateHash(JSON.stringify(englishSource));
    const storedHash = metadata.translations?.[locale]?.sourceHash;
    return {
      exists: true,
      fresh: currentHash === storedHash
    };
  } catch (error) {
    return {
      exists: true,
      fresh: false
    };
  }
}
// Update metadata file
async function updateMetadata(locale, sourceHash) {
  let metadata = {
    translations: {},
    sourceContent: {}
  };
  const { data: existingMetadata } = await supabase.storage.from('data').download('metadata.json');
  if (existingMetadata) {
    try {
      metadata = JSON.parse(await existingMetadata.text());
    } catch (error) {
      console.warn('Failed to parse existing metadata, creating new');
    }
  }
  if (!metadata.translations) {
    metadata.translations = {};
  }
  metadata.translations[locale] = {
    lastUpdated: new Date().toISOString(),
    sourceHash,
    generatedOnDemand: true,
    provider: 'openai'
  };
  await supabase.storage.from('data').upload('metadata.json', JSON.stringify(metadata, null, 2), {
    upsert: true,
    contentType: 'application/json'
  });
}
// Generate translation for a specific locale
async function generateTranslation(locale, forceUpdate = false) {
  if (locale === 'en') {
    return await loadEnglishSource();
  }
  console.log(`🌍 Generating translation for ${locale.toUpperCase()}...`);
  const { exists, fresh } = await isTranslationFresh(locale);
  if (exists && fresh && !forceUpdate) {
    console.log(`✅ Translation for ${locale} is up-to-date, loading from storage`);
    const { data } = await supabase.storage.from('data').download(`${locale}.json`);
    if (data) {
      return JSON.parse(await data.text());
    }
  }
  const englishSource = await loadEnglishSource();
  const sourceHash = await generateHash(JSON.stringify(englishSource));
  const translatableStrings = extractTranslatableStrings(englishSource);
  console.log(`📝 Translating ${translatableStrings.length} strings to ${locale}...`);
  const batchSize = 5;
  const translatedStrings = [];
  for(let i = 0; i < translatableStrings.length; i += batchSize){
    const batch = translatableStrings.slice(i, i + batchSize);
    const batchPromises = batch.map(async ({ key, value })=>{
      const translatedValue = await translateText(value, locale);
      return {
        key,
        value: translatedValue
      };
    });
    const batchResults = await Promise.all(batchPromises);
    translatedStrings.push(...batchResults);
    if (i + batchSize < translatableStrings.length) {
      await new Promise((resolve)=>setTimeout(resolve, 1000));
    }
  }
  const translatedObject = rebuildObject(translatedStrings, englishSource);
  translatedObject.meta = {
    ...translatedObject.meta,
    locale,
    lastUpdated: new Date().toISOString(),
    translatedFrom: 'en',
    translationProvider: 'openai',
    generatedOnDemand: true
  };
  await supabase.storage.from('data').upload(`${locale}.json`, JSON.stringify(translatedObject, null, 2), {
    upsert: true,
    contentType: 'application/json',
    cacheControl: '3600'
  });
  await updateMetadata(locale, sourceHash);
  console.log(`✅ Generated and saved translation for ${locale}`);
  return translatedObject;
}
// Main edge function handler
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  try {
    let locale;
    let force = false;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      locale = url.searchParams.get('locale') || '';
      force = url.searchParams.get('force') === 'true';
    } else if (req.method === 'POST') {
      const body = await req.json();
      locale = body.locale || '';
      force = body.force || false;
    } else {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    const supportedLocales = [
      'en',
      'sv',
      'de',
      'fr',
      'es',
      'it',
      'pt',
      'nl',
      'da',
      'no',
      'fi'
    ];
    if (!locale || !supportedLocales.includes(locale)) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing locale parameter',
        supportedLocales
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    console.log(`🌍 Edge Function request for ${locale} translation (force: ${force})`);
    const translation = await generateTranslation(locale, force);
    return new Response(JSON.stringify({
      success: true,
      locale,
      translation,
      generatedOnDemand: translation.meta?.generatedOnDemand || false,
      lastUpdated: translation.meta?.lastUpdated,
      provider: 'supabase-edge-function'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Translation generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
