// Sequential Translation Worker with AI Review
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.info('🔄 Sequential Translation Worker started');

// Configuration
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Language mapping
const languageMap = {
  'sv': 'Swedish', 'de': 'German', 'fr': 'French', 'es': 'Spanish',
  'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch', 'da': 'Danish',
  'no': 'Norwegian', 'ja': 'Japanese', 'zh': 'Chinese (Simplified)',
  'ru': 'Russian', 'fi': 'Finnish'
};

// Generate content hash
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// AI Translation with quality optimization
async function translateTextBulk(texts: string[], targetLang: string): Promise<string[]> {
  const targetLanguage = languageMap[targetLang] || targetLang;
  const delimiter = ' ||| ';
  const combinedText = texts.join(delimiter);
  
  const systemPrompt = `You are a professional translator specializing in travel and tourism content with expertise in ${targetLanguage}.

Translate the following English texts to ${targetLanguage}. Each text is separated by " ||| ".

CRITICAL QUALITY REQUIREMENTS:
1. Maintain marketing tone and emotional appeal
2. Use natural, native-sounding language for ${targetLanguage}
3. Consider local cultural context and SEO optimization
4. Keep proper nouns unchanged unless they have official translations
5. Return translations in EXACT SAME ORDER, separated by " ||| "
6. Translate EVERYTHING completely - never leave parts in English
7. Ensure consistency in terminology throughout
8. Use appropriate formality level for tourism industry

Example for ${targetLanguage}:
Input: "Home ||| About Us ||| Contact ||| Book Now"
Output: [Provide example in target language]

IMPORTANT: Return exactly ${texts.length} translations separated by " ||| "`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: combinedText }
        ],
        max_tokens: 4096,
        temperature: 0.1,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('Empty translation response');
    }

    const translations = translatedText.split(delimiter);
    
    if (translations.length !== texts.length) {
      throw new Error(`Translation count mismatch: expected ${texts.length}, got ${translations.length}`);
    }

    return translations.map(t => t.trim());
  } catch (error) {
    console.error('Bulk translation error:', error);
    throw error;
  }
}

// AI Quality Review
async function reviewTranslationQuality(
  originalTexts: string[], 
  translatedTexts: string[], 
  targetLang: string
): Promise<{ score: number; notes: string; status: string }> {
  const targetLanguage = languageMap[targetLang] || targetLang;
  
  const reviewPrompt = `You are a professional translation quality reviewer specializing in ${targetLanguage} tourism content.

Review the following English to ${targetLanguage} translations for quality:

ORIGINAL TEXTS:
${originalTexts.map((text, i) => `${i + 1}. ${text}`).join('\n')}

TRANSLATED TEXTS:
${translatedTexts.map((text, i) => `${i + 1}. ${text}`).join('\n')}

Evaluate based on:
1. Accuracy (meaning preserved)
2. Fluency (natural ${targetLanguage})
3. Cultural appropriateness
4. Marketing effectiveness
5. Consistency
6. Completeness (no English left)

Provide:
- Score: 1-100 (100 = perfect)
- Status: "excellent" (90+), "good" (70-89), "needs_review" (50-69), "poor" (<50)
- Notes: Brief feedback on quality and any issues

Format your response as JSON:
{
  "score": 85,
  "status": "good",
  "notes": "High quality translation with natural flow. Minor terminology inconsistency in item 3."
}`;

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
          { role: 'user', content: reviewPrompt }
        ],
        max_tokens: 1024,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI review API error: ${response.status}`);
    }

    const data = await response.json();
    const reviewText = data.choices[0]?.message?.content?.trim();
    
    if (!reviewText) {
      throw new Error('Empty review response');
    }

    // Parse JSON response
    const review = JSON.parse(reviewText);
    return {
      score: review.score || 0,
      notes: review.notes || 'No notes provided',
      status: review.status || 'unknown'
    };
  } catch (error) {
    console.error('Translation review error:', error);
    return {
      score: 0,
      notes: `Review failed: ${error.message}`,
      status: 'review_failed'
    };
  }
}

// Extract translatable strings (same as before but optimized)
function extractTranslatableStrings(obj: any, prefix = ''): Array<{key: string, value: string}> {
  const strings: Array<{key: string, value: string}> = [];
  
  const skipKeys = new Set([
    'locale', 'currency', 'version', 'lastUpdated', 'translatedFrom', 
    'translationProvider', 'generatedOnDemand', 'hash', 'source',
    'phone', 'email', 'htmlLang', 'dateFormat', 'numberFormat'
  ]);
  
  const skipPrefixes = ['meta.', '_metadata.', 'seo.'];
  const skipValues = new Set([
    'USD', 'EUR', 'SEK', 'NOK', 'DKK', 'JPY', 'CNY',
    'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD.MM.YYYY',
    'en-US', 'sv-SE', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-PT', 
    'nl-NL', 'da-DK', 'no-NO', 'fi-FI', 'ja-JP', 'zh-CN'
  ]);
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (skipKeys.has(key)) continue;
    if (skipPrefixes.some(skipPrefix => fullKey.startsWith(skipPrefix))) continue;
    
    if (typeof value === 'string') {
      if (skipValues.has(value)) continue;
      
      if (value.trim() && 
          !value.startsWith('http') && 
          !value.startsWith('+') && 
          !value.includes('@') &&
          !value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        strings.push({ key: fullKey, value });
      }
    } else if (typeof value === 'object' && value !== null) {
      strings.push(...extractTranslatableStrings(value, fullKey));
    }
  }
  
  return strings;
}

// Rebuild object from translated strings
function rebuildObject(strings: Array<{key: string, value: string}>, baseObj: any): any {
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

// Process single translation job
async function processTranslationJob(jobId: number, locale: string, sourceHash: string) {
  console.log(`🔄 Processing translation job ${jobId} for ${locale.toUpperCase()}`);
  
  try {
    // Update job status to processing
    await supabase.rpc('update_translation_job_status', {
      job_id: jobId,
      new_status: 'processing'
    });

    // Load English source
    const { data: enData, error: enError } = await supabase.storage
      .from('data')
      .download('en.json');
      
    if (enError || !enData) {
      throw new Error('Failed to load English source');
    }

    const englishSource = JSON.parse(await enData.text());
    const translatableStrings = extractTranslatableStrings(englishSource);
    
    console.log(`📝 Translating ${translatableStrings.length} strings to ${locale}...`);

    // Process in batches
    const batchSize = 15;
    const translatedStrings: Array<{key: string, value: string}> = [];
    
    for (let i = 0; i < translatableStrings.length; i += batchSize) {
      const batch = translatableStrings.slice(i, i + batchSize);
      const textsToTranslate = batch.map(item => item.value);
      
      console.log(`🔄 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(translatableStrings.length/batchSize)}`);
      
      const translatedTexts = await translateTextBulk(textsToTranslate, locale);
      
      for (let j = 0; j < batch.length; j++) {
        translatedStrings.push({
          key: batch[j].key,
          value: translatedTexts[j]
        });
      }
      
      // Rate limiting
      if (i + batchSize < translatableStrings.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Build translated object
    const translatedObject = rebuildObject(translatedStrings, englishSource);
    
    // AI Quality Review
    console.log(`🤖 Running AI quality review for ${locale}...`);
    const originalTexts = translatableStrings.map(s => s.value);
    const translatedTexts = translatedStrings.map(s => s.value);
    const review = await reviewTranslationQuality(originalTexts, translatedTexts, locale);
    
    console.log(`📊 Quality score: ${review.score}/100 (${review.status})`);

    // Add metadata with review status
    translatedObject.meta = {
      ...translatedObject.meta,
      locale,
      lastUpdated: new Date().toISOString(),
      translatedFrom: 'en',
      translationProvider: 'openai-sequential',
      generatedOnDemand: false,
      qualityReview: {
        score: review.score,
        status: review.status,
        notes: review.notes,
        reviewedAt: new Date().toISOString()
      }
    };

    // Add "done" marker for high quality translations
    if (review.score >= 70) {
      translatedObject._translationStatus = {
        status: 'completed',
        quality: review.status,
        completedAt: new Date().toISOString(),
        done: true
      };
    }

    // Save translation file
    await supabase.storage
      .from('data')
      .upload(`${locale}.json`, JSON.stringify(translatedObject, null, 2), {
        upsert: true,
        contentType: 'application/json',
        cacheControl: '3600'
      });

    // Update job status
    await supabase.rpc('update_translation_job_status', {
      job_id: jobId,
      new_status: 'completed'
    });

    // Update AI review status
    await supabase.rpc('update_ai_review_status', {
      job_id: jobId,
      review_status: review.status,
      review_score: review.score,
      review_notes: review.notes
    });

    console.log(`✅ Translation job ${jobId} completed for ${locale} (Score: ${review.score})`);
    
  } catch (error) {
    console.error(`❌ Translation job ${jobId} failed:`, error);
    
    await supabase.rpc('update_translation_job_status', {
      job_id: jobId,
      new_status: 'failed',
      error_msg: error.message
    });
  }
}

// Main worker function
async function processNextJob() {
  const { data: jobs, error } = await supabase.rpc('get_next_translation_job');
  
  if (error) {
    console.error('Error getting next job:', error);
    return false;
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('📭 No pending translation jobs');
    return false;
  }
  
  const job = jobs[0];
  await processTranslationJob(job.job_id, job.locale, job.source_hash);
  return true;
}

// Edge function handler
Deno.serve(async (req) => {
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
    console.log('🚀 Sequential translation worker triggered');
    
    // Process jobs one by one
    let processedCount = 0;
    let hasMoreJobs = true;
    
    while (hasMoreJobs && processedCount < 5) { // Limit to 5 jobs per invocation
      hasMoreJobs = await processNextJob();
      if (hasMoreJobs) {
        processedCount++;
        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processedJobs: processedCount,
      message: processedCount > 0 ? 
        `Processed ${processedCount} translation jobs` : 
        'No pending jobs to process'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Worker error:', error);
    return new Response(JSON.stringify({
      error: 'Translation worker failed',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
