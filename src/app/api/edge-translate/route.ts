import { NextRequest, NextResponse } from 'next/server';
import { edgeTranslator } from '@/lib/translation/edge-translator';
import { isValidLocale } from '@/lib/i18n/config';

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

    console.log(`🌍 Edge Translate API request for ${locale} (force: ${force})`);

    // Load translation using EdgeTranslator
    const translation = await edgeTranslator.loadTranslation(locale, force);
    const hasCached = edgeTranslator.hasCachedTranslation(locale);

    return NextResponse.json({
      success: true,
      locale,
      translation,
      cached: hasCached,
      provider: 'edge-translator'
    });

  } catch (error) {
    console.error('Edge Translate API error:', error);
    return NextResponse.json(
      { error: 'Failed to load translation', details: error instanceof Error ? error.message : 'Unknown error' },
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

    console.log(`🔄 Force regenerating ${locale} translation via Edge Translate API`);

    // Force regenerate translation
    const translation = await edgeTranslator.regenerateTranslation(locale);

    return NextResponse.json({
      success: true,
      locale,
      translation,
      regenerated: true,
      provider: 'edge-translator'
    });

  } catch (error) {
    console.error('Edge Translate regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate translation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    // Test connection by trying to load English translation
    const testTranslation = await edgeTranslator.loadTranslation('en');
    const isConnected = testTranslation && testTranslation.meta;
    
    if (isConnected) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
