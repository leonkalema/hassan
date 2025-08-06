// Fast Read-Only Translation Server
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.info('⚡ Fast Translation Server started');

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cache for frequently requested translations
const translationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get translation with caching
async function getTranslation(locale: string): Promise<any> {
  // Check cache first
  const cached = translationCache.get(locale);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`📦 Cache hit for ${locale}`);
    return cached.data;
  }

  try {
    // Try to load translation file
    const { data, error } = await supabase.storage
      .from('data')
      .download(`${locale}.json`);

    if (error || !data) {
      console.log(`❌ Translation not found for ${locale}, falling back to English`);
      
      // Fallback to English
      const { data: enData, error: enError } = await supabase.storage
        .from('data')
        .download('en.json');
        
      if (enError || !enData) {
        throw new Error('English fallback also failed');
      }
      
      const englishTranslation = JSON.parse(await enData.text());
      
      // Cache English fallback with shorter TTL
      translationCache.set(locale, {
        data: {
          ...englishTranslation,
          _fallback: true,
          _originalLocale: 'en'
        },
        timestamp: Date.now()
      });
      
      return {
        ...englishTranslation,
        _fallback: true,
        _originalLocale: 'en'
      };
    }

    const translation = JSON.parse(await data.text());
    
    // Cache successful translation
    translationCache.set(locale, {
      data: translation,
      timestamp: Date.now()
    });
    
    console.log(`✅ Loaded translation for ${locale}`);
    return translation;
    
  } catch (error) {
    console.error(`Translation loading error for ${locale}:`, error);
    throw error;
  }
}

// Check translation status
async function getTranslationStatus(locale: string): Promise<any> {
  try {
    const { data: jobs, error } = await supabase
      .from('translation_jobs')
      .select('*')
      .eq('locale', locale)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking translation status:', error);
      return { status: 'unknown', error: error.message };
    }

    if (!jobs || jobs.length === 0) {
      return { status: 'no_job', message: 'No translation job found' };
    }

    const job = jobs[0];
    return {
      status: job.status,
      priority: job.priority,
      attempts: job.attempts,
      aiReviewStatus: job.ai_review_status,
      aiReviewScore: job.ai_review_score,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message
    };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
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
    let locale: string;
    let includeStatus = false;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      locale = url.searchParams.get('locale') || '';
      includeStatus = url.searchParams.get('status') === 'true';
    } else if (req.method === 'POST') {
      const body = await req.json();
      locale = body.locale || '';
      includeStatus = body.includeStatus || false;
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Validate locale
    const supportedLocales = [
      'en', 'sv', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'da', 'no', 'fi', 'ja', 'zh'
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

    console.log(`⚡ Fast translation request for ${locale}`);
    
    // Get translation
    const translation = await getTranslation(locale);
    
    // Prepare response
    const response: any = {
      success: true,
      locale,
      translation,
      cached: translationCache.has(locale),
      fallback: translation._fallback || false,
      provider: 'supabase-fast-server'
    };

    // Include status if requested
    if (includeStatus) {
      response.jobStatus = await getTranslationStatus(locale);
    }

    // Add quality information if available
    if (translation.meta?.qualityReview) {
      response.quality = {
        score: translation.meta.qualityReview.score,
        status: translation.meta.qualityReview.status,
        reviewedAt: translation.meta.qualityReview.reviewedAt
      };
    }

    // Add completion status if available
    if (translation._translationStatus?.done) {
      response.translationComplete = true;
      response.completedAt = translation._translationStatus.completedAt;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': translation._fallback ? 
          'public, max-age=300' :  // 5 minutes for fallbacks
          'public, max-age=3600',  // 1 hour for complete translations
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Fast translation server error:', error);
    
    return new Response(JSON.stringify({
      error: 'Translation serving failed',
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
