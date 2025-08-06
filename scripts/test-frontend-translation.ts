#!/usr/bin/env node

/**
 * Test Frontend Translation Mapping
 * This script tests the TranslationMapper to ensure page keys work correctly
 */

import { edgeTranslator } from '../src/lib/translation/edge-translator';
import { TranslationMapper } from '../src/lib/translation/translation-mapper';
import { createTranslator } from '../src/lib/i18n/translations';

async function testFrontendTranslation() {
  console.log('🧪 Testing Frontend Translation Mapping...\n');

  try {
    // Load English translation from edge function
    console.log('1️⃣ Loading English translation from edge function...');
    const englishTranslation = await edgeTranslator.loadTranslation('en');
    console.log('✅ English translation loaded');
    console.log('📊 Raw structure keys:', Object.keys(englishTranslation));

    // Create translation mapper
    console.log('\n2️⃣ Creating translation mapper...');
    const mapper = new TranslationMapper(englishTranslation);
    const t = createTranslator(englishTranslation);
    console.log('✅ Translation mapper created');

    // Test key mappings that your pages use
    console.log('\n3️⃣ Testing page key mappings...');
    
    const testKeys = [
      'navigation.home',
      'navigation.about',
      'home.hero.title',
      'home.hero.subtitle',
      'home.hero.cta',
      'home.featuredTours.title',
      'about.hero.title',
      'about.hero.subtitle',
      'common.bookNow',
      'common.exploreMore'
    ];

    console.log('🔍 Testing translation keys:');
    for (const key of testKeys) {
      const value = t(key);
      const status = value === key ? '❌ MISSING' : '✅ FOUND';
      console.log(`   ${status} ${key} → "${value}"`);
    }

    // Show available keys from edge function
    console.log('\n4️⃣ Available keys from edge function:');
    const availableKeys = mapper.getAvailableKeys();
    console.log('📋 First 15 available keys:');
    availableKeys.slice(0, 15).forEach(key => {
      const value = mapper.get(key);
      console.log(`   • ${key} → "${value}"`);
    });

    // Test Swedish translation mapping
    console.log('\n5️⃣ Testing Swedish translation mapping...');
    const swedishTranslation = await edgeTranslator.loadTranslation('sv');
    const swedishMapper = new TranslationMapper(swedishTranslation);
    const tSv = createTranslator(swedishTranslation);

    console.log('🇸🇪 Swedish key mappings:');
    const swedishTestKeys = ['navigation.home', 'home.hero.title', 'about.hero.title'];
    for (const key of swedishTestKeys) {
      const value = tSv(key);
      const status = value === key ? '❌ MISSING' : '✅ FOUND';
      console.log(`   ${status} ${key} → "${value}"`);
    }

    console.log('\n🎉 Frontend translation mapping test completed!');
    
    // Summary
    const workingKeys = testKeys.filter(key => t(key) !== key).length;
    const totalKeys = testKeys.length;
    
    console.log('\n📋 Summary:');
    console.log(`   • Working key mappings: ${workingKeys}/${totalKeys}`);
    console.log(`   • Edge function connectivity: ✅`);
    console.log(`   • Translation mapping: ${workingKeys === totalKeys ? '✅' : '⚠️'}`);
    console.log(`   • Swedish translation: ✅`);
    
    if (workingKeys === totalKeys) {
      console.log('\n🌍 Your pages should now show translated text instead of keys!');
      console.log('🚀 Ready to test in browser: npm run dev');
    } else {
      console.log('\n⚠️  Some key mappings need adjustment in TranslationMapper');
      console.log('💡 Check the key mapping in src/lib/translation/translation-mapper.ts');
    }

  } catch (error) {
    console.error('💥 Frontend translation test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure edge function is working');
    console.log('2. Check TranslationMapper key mappings');
    console.log('3. Verify translation structure matches expectations');
    process.exit(1);
  }
}

// Run the test
testFrontendTranslation().catch(error => {
  console.error('💥 Test process failed:', error);
  process.exit(1);
});
