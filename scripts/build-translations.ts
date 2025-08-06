#!/usr/bin/env node

/**
 * Build-time translation generator
 * This script ensures translation files exist for essential languages.
 * In production, translations are handled by Supabase Edge Functions.
 */

import { locales, Locale } from '../src/lib/i18n/config';
import fs from 'fs';
import path from 'path';

// Essential languages to ensure exist
const ESSENTIAL_LANGUAGES: Locale[] = ['sv', 'de', 'fr', 'es'];

async function buildTranslations() {
  console.log('🏗️  Ensuring translation files exist...\n');
  
  const translationsDir = path.join(process.cwd(), 'src/data/i18n/translations');
  
  // Ensure translations directory exists
  if (!fs.existsSync(translationsDir)) {
    fs.mkdirSync(translationsDir, { recursive: true });
  }

  // Check if translation files exist, create basic ones if missing
  let successCount = 0;
  
  for (const locale of ESSENTIAL_LANGUAGES) {
    const filePath = path.join(translationsDir, `${locale}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`📝 Creating basic ${locale.toUpperCase()} translation file...`);
      
      // Create a basic translation file with empty structure
      const basicTranslation = {
        "nav": {
          "home": "Home",
          "about": "About",
          "tours": "Tours",
          "contact": "Contact"
        },
        "hero": {
          "title": "Discover Amazing Destinations",
          "subtitle": "Explore the world with our curated travel experiences",
          "cta": "Start Your Journey"
        },
        "stats": {
          "destinations": "Destinations",
          "customers": "Happy Customers",
          "experience": "Years Experience",
          "guides": "Expert Guides"
        },
        "footer": {
          "company": "Company",
          "quickLinks": "Quick Links",
          "contact": "Contact",
          "followUs": "Follow Us",
          "allRightsReserved": "All rights reserved"
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(basicTranslation, null, 2));
      console.log(`✅ Created ${locale.toUpperCase()} translation file`);
      successCount++;
    } else {
      console.log(`✅ ${locale.toUpperCase()} translation file already exists`);
      successCount++;
    }
  }

  console.log(`\n📊 Translation Files Summary:`);
  console.log(`✅ Files ready: ${successCount}/${ESSENTIAL_LANGUAGES.length}`);
  console.log('\n🎉 Translation files check completed!');
  console.log('🔄 Translations will be generated on-demand in production via Supabase Edge Functions');
  console.log('🚀 Build can proceed!');
}

// Run the build process
buildTranslations().catch(error => {
  console.error('💥 Build translation process failed:', error);
  process.exit(1);
});
