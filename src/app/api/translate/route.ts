import { NextRequest, NextResponse } from 'next/server';
import { SmartTranslator } from '@/lib/translation/smart-translator';
import { isValidLocale } from '@/lib/i18n/config';

// Initialize the smart translator with OpenAI API key
const translator = new SmartTranslator(
  process.env.OPENAI_API_KEY || ''
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

    console.log(`🌍 API request for ${locale} translation (force: ${force})`);

    // Get or generate translation
    const translation = await translator.getTranslation(locale);

    return NextResponse.json({
      success: true,
      locale,
      translation,
      generatedOnDemand: translation.meta?.generatedOnDemand || false,
      lastUpdated: translation.meta?.lastUpdated
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate translation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale, force } = body;

    if (!locale || !isValidLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid or missing locale parameter' },
        { status: 400 }
      );
    }

    console.log(`🔄 Forcing regeneration of ${locale} translation`);

    // Force regenerate translation
    const translation = await translator.generateTranslation(locale);

    return NextResponse.json({
      success: true,
      locale,
      translation,
      regenerated: true,
      lastUpdated: translation.meta?.lastUpdated
    });

  } catch (error) {
    console.error('Translation regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate translation' },
      { status: 500 }
    );
  }
}
