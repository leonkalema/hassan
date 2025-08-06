import { NextRequest, NextResponse } from 'next/server';
import { SupabaseTranslator } from '@/lib/translation/supabase-translator';
import { isValidLocale } from '@/lib/i18n/config';

// Initialize the Supabase translator
const translator = new SupabaseTranslator(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.OPENAI_API_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const force = searchParams.get('force') === 'true';

    if (!locale || !isValidLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid or missing locale parameter' },
        { status: 400 }
      );
    }

    console.log(`🌍 Supabase API request for ${locale} translation (force: ${force})`);

    // Get or generate translation using Supabase storage
    const translation = await translator.generateTranslation(locale, force);

    return NextResponse.json({
      success: true,
      locale,
      translation,
      generatedOnDemand: translation.meta?.generatedOnDemand || false,
      lastUpdated: translation.meta?.lastUpdated,
      provider: 'supabase-storage'
    });

  } catch (error) {
    console.error('Supabase translation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate translation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale, force = true } = body;

    if (!locale || !isValidLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid or missing locale parameter' },
        { status: 400 }
      );
    }

    console.log(`🔄 Forcing regeneration of ${locale} translation via Supabase`);

    // Force regenerate translation
    const translation = await translator.generateTranslation(locale, force);

    return NextResponse.json({
      success: true,
      locale,
      translation,
      regenerated: true,
      lastUpdated: translation.meta?.lastUpdated,
      provider: 'supabase-storage'
    });

  } catch (error) {
    console.error('Supabase translation regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate translation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    const connectionTest = await translator.testConnection();
    
    if (connectionTest.supabase && connectionTest.openai) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
