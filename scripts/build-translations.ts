#!/usr/bin/env node

/**
 * Build-time translation generator
 * This script runs during the build process to pre-generate translations
 * for essential languages, ensuring they're available as static files
 * for SEO and faster loading in production.
 */

import { SmartTranslator } from '../src/lib/translation/smart-translator';
import { locales, Locale } from '../src/lib/i18n/config';

// Essential languages to pre-generate (you can customize this)
const ESSENTIAL_LANGUAGES: Locale[] = ['sv', 'de', 'fr', 'es'];

// Optional: All supported languages (uncomment to pre-generate everything)
// const ESSENTIAL_LANGUAGES = locales.filter(locale => locale !== 'en');

async function buildTranslations() {
  console.log('🏗️  Starting build-time translation generation...\n');

  // Get API key from environment
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    console.log('💡 Set it in your build environment or .env file');
    process.exit(1);
  }

  const translator = new SmartTranslator(apiKey);

  // Test API connection first
  console.log('🔍 Testing OpenAI API connection...');
  try {
    const testResult = await translator.translateText('Hello', 'sv');
    console.log('✅ API connection successful');
    console.log(`Test translation: "Hello" → "${testResult}"\n`);
  } catch (error) {
    console.error('❌ API connection failed:', error);
    process.exit(1);
  }

  // Generate translations for essential languages
  let successCount = 0;
  let failCount = 0;

  for (const locale of ESSENTIAL_LANGUAGES) {
    try {
      console.log(`🌍 Generating ${locale.toUpperCase()} translation...`);
      await translator.generateTranslation(locale);
      successCount++;
      console.log(`✅ ${locale.toUpperCase()} completed\n`);
      
      // Rate limiting between languages
      if (locale !== ESSENTIAL_LANGUAGES[ESSENTIAL_LANGUAGES.length - 1]) {
        console.log('⏳ Waiting 2 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to generate ${locale}:`, error);
      failCount++;
    }
  }

  // Summary
  console.log('📊 Build Translation Summary:');
  console.log(`✅ Successful: ${successCount}/${ESSENTIAL_LANGUAGES.length}`);
  console.log(`❌ Failed: ${failCount}/${ESSENTIAL_LANGUAGES.length}`);

  if (failCount > 0) {
    console.log('\n⚠️  Some translations failed but build can continue');
    console.log('🔄 Missing translations will be generated on-demand in production');
  }

  console.log('\n🎉 Build-time translation generation completed!');
  console.log('📁 Translation files saved to src/data/i18n/translations/');
  console.log('🚀 Your site is ready for deployment with pre-generated translations!');
}

// Run the build process
buildTranslations().catch(error => {
  console.error('💥 Build translation process failed:', error);
  process.exit(1);
});
