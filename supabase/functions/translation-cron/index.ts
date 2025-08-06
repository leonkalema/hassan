// Translation Cron Job - Triggers sequential translation worker
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info('⏰ Translation Cron Job started');

const TRANSLATION_WORKER_URL = 'https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/translation-worker';

// Trigger translation worker
async function triggerTranslationWorker(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🚀 Triggering translation worker...');
    
    const response = await fetch(TRANSLATION_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        trigger: 'cron',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Worker response: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Translation worker response:', result);
    
    return {
      success: true,
      message: result.message || 'Translation worker triggered successfully'
    };
    
  } catch (error) {
    console.error('❌ Failed to trigger translation worker:', error);
    return {
      success: false,
      message: `Failed to trigger worker: ${error.message}`
    };
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
    console.log('⏰ Translation cron job triggered');
    
    const result = await triggerTranslationWorker();
    
    return new Response(JSON.stringify({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
      trigger: 'cron'
    }), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response(JSON.stringify({
      error: 'Cron job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
