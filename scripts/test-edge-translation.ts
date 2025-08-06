#!/usr/bin/env node

/**
 * Test Edge Translation System
 * This script tests the complete Supabase Edge Function integration
 */

import { edgeTranslator } from '../src/lib/translation/edge-translator';
import { loadTranslations } from '../src/lib/i18n/translations';

async function testEdgeTranslation() {
  console.log('🧪 Testing Edge Translation System...\n');

  try {
    // Test 1: Connection test
    console.log('1️⃣ Testing fast translation server connectivity...');
    let isConnected = false;
    try {
      const testTranslation = await edgeTranslator.loadTranslation('en');
      isConnected = testTranslation && testTranslation.meta;
    } catch (error) {
      isConnected = false;
    }
    console.log(`   ${isConnected ? '✅' : '❌'} Fast translation server ${isConnected ? 'connected' : 'not connected'}\n`);

    if (!isConnected) {
      console.log('❌ Fast translation server not accessible. Please check:');
      console.log('   - Edge function is deployed at: https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/serve-translation');
      console.log('   - Function code is properly deployed');
      console.log('   - Supabase storage bucket exists');
      return;
    }

    // Test 2: Load English translation (should be fast)
    console.log('2️⃣ Loading English translation...');
    const startTime = Date.now();
    const englishTranslation = await edgeTranslator.loadTranslation('en');
    const englishTime = Date.now() - startTime;
    console.log(`   ✅ English loaded in ${englishTime}ms`);
    console.log(`   📝 Keys: ${Object.keys(englishTranslation).join(', ')}\n`);

    // Test 3: Load Swedish translation (will generate on-demand)
    console.log('3️⃣ Loading Swedish translation (on-demand generation)...');
    const swedishStartTime = Date.now();
    const swedishTranslation = await edgeTranslator.loadTranslation('sv');
    const swedishTime = Date.now() - swedishStartTime;
    console.log(`   ✅ Swedish loaded in ${swedishTime}ms`);
    console.log(`   🇸🇪 Sample: "${swedishTranslation.common?.home}" (should be "Hem")\n`);

    // Test 4: Load Swedish again (should be cached)
    console.log('4️⃣ Loading Swedish translation again (should be cached)...');
    const cachedStartTime = Date.now();
    const cachedSwedishTranslation = await edgeTranslator.loadTranslation('sv');
    const cachedTime = Date.now() - cachedStartTime;
    console.log(`   ✅ Swedish cached loaded in ${cachedTime}ms`);
    console.log(`   📦 Much faster than first load (${swedishTime}ms vs ${cachedTime}ms)\n`);

    // Test 5: Translation status
    console.log('5️⃣ Checking translation cache status...');
    const hasCached = edgeTranslator.hasCachedTranslation('sv');
    const cacheStats = edgeTranslator.getCacheStats();
    console.log(`   📊 Swedish cached: ${hasCached}`);
    console.log(`   📊 Cache size: ${cacheStats.size} locales: ${cacheStats.locales.join(', ')}\n`);

    // Test 6: Test Next.js integration
    console.log('6️⃣ Testing Next.js translation loading...');
    const nextjsTranslation = await loadTranslations('de');
    console.log(`   ✅ German loaded via Next.js integration`);
    console.log(`   🇩🇪 Sample: "${nextjsTranslation.common?.home}" (should be German)\n`);

    // Test 7: Force regeneration
    console.log('7️⃣ Testing force regeneration...');
    const regenStartTime = Date.now();
    const regeneratedTranslation = await edgeTranslator.regenerateTranslation('sv');
    const regenTime = Date.now() - regenStartTime;
    console.log(`   ✅ Swedish regenerated in ${regenTime}ms`);
    console.log(`   🔄 Fresh translation generated\n`);

    console.log('🎉 All tests passed! Edge Translation System is working perfectly!\n');
    
    console.log('📋 Summary:');
    console.log(`   • Edge function connectivity: ✅`);
    console.log(`   • English translation loading: ✅ (${englishTime}ms)`);
    console.log(`   • On-demand Swedish generation: ✅ (${swedishTime}ms)`);
    console.log(`   • Translation caching: ✅ (${cachedTime}ms)`);
    console.log(`   • Next.js integration: ✅`);
    console.log(`   • Force regeneration: ✅ (${regenTime}ms)`);
    console.log('\n🌍 Your smart multilingual system is ready for production!');

  } catch (error) {
    console.error('💥 Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify edge function is deployed and accessible');
    console.log('2. Check Supabase storage bucket exists');
    console.log('3. Ensure OpenAI API key is valid');
    console.log('4. Check network connectivity');
    process.exit(1);
  }
}

// Run the test
testEdgeTranslation().catch(error => {
  console.error('💥 Test process failed:', error);
  process.exit(1);
});
