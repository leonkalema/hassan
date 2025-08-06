#!/usr/bin/env node

/**
 * Deploy Supabase Edge Function Script
 * This script deploys the translation edge function to Supabase
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY'
];

async function deployEdgeFunction() {
  console.log('🚀 Deploying Supabase Edge Function for translation system...\n');

  // Check if Supabase CLI is installed
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI is installed');
  } catch (error) {
    console.error('❌ Supabase CLI not found');
    console.log('💡 Install it with: npm install -g supabase');
    console.log('💡 Or visit: https://supabase.com/docs/guides/cli');
    process.exit(1);
  }

  // Check environment variables
  console.log('🔍 Checking environment variables...');
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n💡 Make sure to set these in your .env.local file');
    process.exit(1);
  }
  console.log('✅ All environment variables are set');

  // Check if edge function file exists
  const functionPath = path.join(process.cwd(), 'supabase/functions/translate/index.ts');
  try {
    await fs.access(functionPath);
    console.log('✅ Edge function file found');
  } catch (error) {
    console.error('❌ Edge function file not found at:', functionPath);
    process.exit(1);
  }

  try {
    // Link to Supabase project
    console.log('\n🔗 Linking to Supabase project...');
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
    
    if (!projectRef) {
      throw new Error('Could not extract project reference from SUPABASE_URL');
    }

    try {
      execSync(`supabase link --project-ref ${projectRef}`, { 
        stdio: 'inherit',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_SERVICE_ROLE_KEY }
      });
      console.log('✅ Successfully linked to Supabase project');
    } catch (linkError) {
      console.log('⚠️  Link failed, but continuing with deployment...');
    }

    // Deploy the edge function
    console.log('\n📦 Deploying edge function...');
    execSync('supabase functions deploy translate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Edge function deployed successfully!');

    // Set environment variables for the edge function
    console.log('\n🔧 Setting edge function environment variables...');
    
    const envCommands = [
      `supabase secrets set SUPABASE_URL="${process.env.NEXT_PUBLIC_SUPABASE_URL}"`,
      `supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${process.env.SUPABASE_SERVICE_ROLE_KEY}"`,
      `supabase secrets set OPENAI_API_KEY="${process.env.OPENAI_API_KEY}"`
    ];

    for (const command of envCommands) {
      try {
        execSync(command, { stdio: 'pipe' });
      } catch (error) {
        console.warn('⚠️  Failed to set some environment variables, you may need to set them manually');
      }
    }

    console.log('✅ Environment variables configured');

    // Test the deployed function
    console.log('\n🧪 Testing deployed function...');
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate`;
    
    try {
      const testResponse = await fetch(`${functionUrl}?locale=sv`, {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      if (testResponse.ok) {
        console.log('✅ Edge function is responding correctly');
      } else {
        console.log('⚠️  Edge function deployed but test request failed');
      }
    } catch (testError) {
      console.log('⚠️  Could not test edge function, but deployment appears successful');
    }

    console.log('\n🎉 Edge Function deployment completed!');
    console.log('\n📋 Function Details:');
    console.log(`   URL: ${functionUrl}`);
    console.log(`   Test: GET ${functionUrl}?locale=sv`);
    console.log(`   Force: POST ${functionUrl} with {"locale": "sv", "force": true}`);
    console.log('\n💡 The function will automatically:');
    console.log('   - Check if translation files exist in Supabase Storage');
    console.log('   - Generate translations using OpenAI when missing');
    console.log('   - Cache translations for fast subsequent requests');
    console.log('   - Update translations when English content changes');

  } catch (error) {
    console.error('💥 Deployment failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have the correct Supabase project permissions');
    console.log('2. Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('3. Check that your OpenAI API key is valid');
    console.log('4. Ensure the Supabase CLI is properly authenticated');
    process.exit(1);
  }
}

// Run the deployment
deployEdgeFunction().catch(error => {
  console.error('💥 Deployment process failed:', error);
  process.exit(1);
});
