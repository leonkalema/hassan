#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script initializes the Supabase storage bucket and uploads initial content
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://koeppsasfaextkwyeiuv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setupSupabase() {
  console.log('🚀 Setting up Supabase storage for translation system...\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('💡 Get it from Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Check if bucket exists, create if not
    console.log('📦 Checking storage bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'website-content');

    if (!bucketExists) {
      console.log('📦 Creating website-content bucket...');
      const { error } = await supabase.storage.createBucket('website-content', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 10, // 10MB limit
        allowedMimeTypes: ['application/json', 'text/plain']
      });

      if (error) {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }

    // 2. Upload English master translation file
    console.log('\n📄 Setting up English master translation...');
    
    // Load existing English translation
    const englishPath = path.join(process.cwd(), 'src/data/i18n/translations/en.json');
    
    try {
      const englishContent = await fs.readFile(englishPath, 'utf-8');
      
      const { error: uploadError } = await supabase.storage
        .from('website-content')
        .upload('translations/en.json', englishContent, {
          upsert: true,
          contentType: 'application/json'
        });

      if (uploadError) {
        throw new Error(`Failed to upload English translations: ${uploadError.message}`);
      }
      
      console.log('✅ English master translation uploaded');
    } catch (fileError) {
      console.log('⚠️  English translation file not found locally, creating basic one...');
      
      // Create basic English translation structure
      const basicEnglish = {
        meta: {
          locale: 'en',
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        },
        common: {
          home: 'Home',
          about: 'About Us',
          tours: 'Tours',
          contact: 'Contact',
          bookNow: 'Book Now',
          exploreMore: 'Explore More',
          learnMore: 'Learn More',
          readMore: 'Read More',
          from: 'from',
          duration: 'Duration',
          destination: 'Destination',
          price: 'Price',
          language: 'Language'
        },
        home: {
          title: 'Discover the World with Us',
          subtitle: 'We are a premier tour operator dedicated to creating unforgettable travel experiences',
          cta: 'Explore Tours',
          featuredTours: 'Featured Tours',
          viewAllTours: 'View All Tours',
          stats: {
            travelers: 'Happy Travelers',
            destinations: 'Destinations',
            experience: 'Years Experience',
            packages: 'Tour Packages'
          }
        },
        about: {
          title: 'About Explore Adventures',
          subtitle: 'Learn more about our journey and the passionate team behind your next adventure',
          story: 'Our Story',
          founded: 'Founded',
          teamSize: 'Team Size',
          countries: 'Countries',
          mission: 'Our Mission',
          values: {
            explore: {
              title: 'Explore',
              description: 'We believe in the transformative power of travel and exploration'
            },
            connect: {
              title: 'Connect',
              description: 'Building meaningful connections between travelers and destinations'
            },
            excellence: {
              title: 'Excellence',
              description: 'Delivering exceptional service and unforgettable experiences'
            }
          },
          team: {
            title: 'Meet Our Team',
            subtitle: 'Our passionate team of travel experts is dedicated to making your journey extraordinary'
          },
          cta: {
            title: 'Ready to Start Your Adventure?',
            subtitle: 'Let us help you create memories that will last a lifetime',
            button: 'Explore Our Tours'
          }
        },
        footer: {
          copyright: 'All rights reserved.'
        },
        seo: {
          home: {
            title: 'Home | Explore Adventures - Premier Tour Operator',
            description: 'Discover amazing travel destinations with Explore Adventures. Professional tour operator offering unforgettable experiences worldwide.'
          },
          about: {
            title: 'About Us | Explore Adventures - Our Story & Team',
            description: 'Learn about Explore Adventures, a premier tour operator dedicated to creating exceptional travel experiences with our passionate team.'
          }
        }
      };

      const { error: uploadError } = await supabase.storage
        .from('website-content')
        .upload('translations/en.json', JSON.stringify(basicEnglish, null, 2), {
          upsert: true,
          contentType: 'application/json'
        });

      if (uploadError) {
        throw new Error(`Failed to upload basic English translations: ${uploadError.message}`);
      }
      
      console.log('✅ Basic English translation created and uploaded');
    }

    // 3. Create initial metadata file
    console.log('\n📊 Setting up metadata...');
    const initialMetadata = {
      translations: {
        en: {
          lastUpdated: new Date().toISOString(),
          sourceHash: 'initial',
          generatedOnDemand: false,
          provider: 'manual'
        }
      },
      sourceContent: {
        'en.json': {
          hash: 'initial',
          lastModified: new Date().toISOString()
        }
      }
    };

    const { error: metadataError } = await supabase.storage
      .from('website-content')
      .upload('metadata.json', JSON.stringify(initialMetadata, null, 2), {
        upsert: true,
        contentType: 'application/json'
      });

    if (metadataError) {
      throw new Error(`Failed to upload metadata: ${metadataError.message}`);
    }
    
    console.log('✅ Metadata file created');

    // 4. Test the setup
    console.log('\n🧪 Testing setup...');
    const { data: files } = await supabase.storage
      .from('website-content')
      .list('translations');

    console.log(`✅ Found ${files?.length || 0} files in translations folder`);

    console.log('\n🎉 Supabase setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Test translation generation: GET /api/supabase-translate?locale=sv');
    console.log('2. Your Supabase storage is ready for on-demand translations');
    console.log('3. Files will be created automatically when users visit different locales');

  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabase().catch(error => {
  console.error('💥 Setup process failed:', error);
  process.exit(1);
});
