// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface TranslateRequest {
  locale: string;
  force?: boolean;
}

interface TranslationMetadata {
  translations: Record<string, {
    lastUpdated: string;
    sourceHash: string;
    generatedOnDemand: boolean;
    provider: string;
  }>;
  sourceContent: Record<string, {
    hash: string;
    lastModified: string;
  }>;
}

console.info('🌍 Translation Edge Function started');

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate content hash for change detection
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Translate text using OpenAI
async function translateText(text: string, targetLang: string): Promise<string> {
  const languageMap: Record<string, string> = {
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 2048,
        temperature: 0.1,
        top_p: 0.9
      }),
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
function extractTranslatableStrings(obj: any, prefix = ''): { key: string; value: string }[] {
  const strings: { key: string; value: string }[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      if (!fullKey.startsWith('meta.') && key !== 'currency' && key !== 'locale') {
        strings.push({ key: fullKey, value });
      }
    } else if (typeof value === 'object' && value !== null) {
      strings.push(...extractTranslatableStrings(value, fullKey));
    }
  }
  
  return strings;
}

// Rebuild object from translated strings
function rebuildObject(strings: { key: string; value: string }[], baseObj: any): any {
  const result = JSON.parse(JSON.stringify(baseObj));
  
  for (const { key, value } of strings) {
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
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
async function loadEnglishSource(): Promise<any> {
  const { data, error } = await supabase.storage
    .from('data')
    .download('en.json');

  if (error || !data) {
    throw new Error('English source translations not found');
  }

  const text = await data.text();
  return JSON.parse(text);
}

// Check if translation file exists and is fresh
async function isTranslationFresh(locale: string): Promise<{ exists: boolean; fresh: boolean }> {
  // Try to load existing translation
  const { data: existingData } = await supabase.storage
    .from('data')
    .download(`${locale}.json`);

  if (!existingData) {
    return { exists: false, fresh: false };
  }

  // Load metadata to check freshness
  const { data: metadataData } = await supabase.storage
    .from('data')
    .download('metadata.json');

  if (!metadataData) {
    return { exists: true, fresh: false }; // Assume stale if no metadata
  }

  try {
    const metadata: TranslationMetadata = JSON.parse(await metadataData.text());
    const englishSource = await loadEnglishSource();
    const currentHash = await generateHash(JSON.stringify(englishSource));
    const storedHash = metadata.translations?.[locale]?.sourceHash;

    return {
      exists: true,
      fresh: currentHash === storedHash
    };
  } catch (error) {
    return { exists: true, fresh: false };
  }
}

// Update metadata file
async function updateMetadata(locale: string, sourceHash: string): Promise<void> {
  let metadata: TranslationMetadata = {
    translations: {},
    sourceContent: {}
  };

  // Try to load existing metadata
  const { data: existingMetadata } = await supabase.storage
    .from('data')
    .download('metadata.json');

  if (existingMetadata) {
    try {
      metadata = JSON.parse(await existingMetadata.text());
    } catch (error) {
      console.warn('Failed to parse existing metadata, creating new');
    }
  }

  // Update metadata
  if (!metadata.translations) {
    metadata.translations = {};
  }

  metadata.translations[locale] = {
    lastUpdated: new Date().toISOString(),
    sourceHash,
    generatedOnDemand: true,
    provider: 'openai'
  };

  // Upload updated metadata
  const { error } = await supabase.storage
    .from('data')
    .upload('metadata.json', JSON.stringify(metadata, null, 2), {
      upsert: true,
      contentType: 'application/json'
    });

  if (error) {
    console.error('Failed to update metadata:', error);
  }
}

// Generate translation for a specific locale
async function generateTranslation(locale: string, forceUpdate = false): Promise<any> {
  if (locale === 'en') {
    return await loadEnglishSource();
  }

  console.log(`🌍 Generating translation for ${locale.toUpperCase()}...`);

  // Check if translation exists and is fresh
  const { exists, fresh } = await isTranslationFresh(locale);
  
  if (exists && fresh && !forceUpdate) {
    console.log(`✅ Translation for ${locale} is up-to-date, loading from storage`);
    const { data } = await supabase.storage
      .from('data')
      .download(`${locale}.json`);
    
    if (data) {
      return JSON.parse(await data.text());
    }
  }

  // Load English source
  const englishSource = await loadEnglishSource();
  const sourceHash = await generateHash(JSON.stringify(englishSource));

  // Extract translatable strings
  const translatableStrings = extractTranslatableStrings(englishSource);
  console.log(`📝 Translating ${translatableStrings.length} strings to ${locale}...`);

  // Translate strings in batches
  const batchSize = 5;
  const translatedStrings: { key: string; value: string }[] = [];

  for (let i = 0; i < translatableStrings.length; i += batchSize) {
    const batch = translatableStrings.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ({ key, value }) => {
      const translatedValue = await translateText(value, locale);
      return { key, value: translatedValue };
    });

    const batchResults = await Promise.all(batchPromises);
    translatedStrings.push(...batchResults);

    // Rate limiting between batches
    if (i + batchSize < translatableStrings.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Rebuild translation object
  const translatedObject = rebuildObject(translatedStrings, englishSource);
  
  // Update meta information
  translatedObject.meta = {
    ...translatedObject.meta,
    locale,
    lastUpdated: new Date().toISOString(),
    translatedFrom: 'en',
    translationProvider: 'openai',
    generatedOnDemand: true
  };

  // Save translation file to storage
  const { error } = await supabase.storage
    .from('data')
    .upload(`${locale}.json`, JSON.stringify(translatedObject, null, 2), {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '3600' // 1 hour cache
    });

  if (error) {
    throw new Error(`Failed to save translation: ${error.message}`);
  }

  // Update metadata
  await updateMetadata(locale, sourceHash);

  console.log(`✅ Generated and saved translation for ${locale}`);
  return translatedObject;
}

// Main edge function handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    let locale: string;
    let force = false;

    // Handle both GET and POST requests
    if (req.method === 'GET') {
      const url = new URL(req.url);
      locale = url.searchParams.get('locale') || '';
      force = url.searchParams.get('force') === 'true';
    } else if (req.method === 'POST') {
      const body: TranslateRequest = await req.json();
      locale = body.locale || '';
      force = body.force || false;
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Validate locale
    const supportedLocales = ['en', 'sv', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'da', 'no', 'fi'];
    if (!locale || !supportedLocales.includes(locale)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or missing locale parameter',
          supportedLocales 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`🌍 Edge Function request for ${locale} translation (force: ${force})`);

    // Generate or load translation
    const translation = await generateTranslation(locale, force);

    return new Response(
      JSON.stringify({
        success: true,
        locale,
        translation,
        generatedOnDemand: translation.meta?.generatedOnDemand || false,
        lastUpdated: translation.meta?.lastUpdated,
        provider: 'supabase-edge-function'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600', // 1 hour cache
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Translation generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
