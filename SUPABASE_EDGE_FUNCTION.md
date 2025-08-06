# 🌍 Supabase Edge Function Translation System

## Overview
This document explains the complete Supabase Edge Function implementation for smart, on-demand multilingual translation using pure storage (no database).

## 🏗️ Architecture

### **Pure Storage Flow**
```
User visits /sv 
→ Edge Function: Check if sv.json exists in Supabase Storage
→ If missing/stale: Load en.json + OpenAI translate + Save sv.json
→ Return translation to user
```

### **Files Structure**
```
supabase/
├── functions/translate/index.ts    ← Edge function code
├── config.toml                     ← Supabase configuration
scripts/
├── setup-supabase.ts              ← Initialize storage bucket
├── deploy-edge-function.ts        ← Deploy edge function
```

## 🚀 **Getting Started**

### **Step 1: Get Service Role Key**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → API → Copy `service_role` key
3. Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### **Step 2: Install Supabase CLI**
```bash
npm install -g supabase
```

### **Step 3: Initialize Storage**
```bash
npm run setup:supabase
```

### **Step 4: Deploy Edge Function**
```bash
npm run deploy:edge-function
```

## 🔧 **Edge Function Features**

### **Smart Translation Logic**
- ✅ **File Existence Check**: Checks if translation file exists in storage
- ✅ **Freshness Detection**: Uses SHA-256 hash to detect English content changes
- ✅ **On-Demand Generation**: Only creates translations when requested
- ✅ **Batch Processing**: Translates strings in batches with rate limiting
- ✅ **Metadata Tracking**: Stores translation metadata for cache management
- ✅ **Error Handling**: Graceful fallbacks and detailed error messages

### **API Endpoints**
```bash
# Get translation (creates if missing)
GET https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/translate?locale=sv

# Force regenerate translation
POST https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/translate
Content-Type: application/json
{
  "locale": "sv",
  "force": true
}
```

### **Supported Locales**
- `en` (English - master)
- `sv` (Swedish)
- `de` (German)
- `fr` (French)
- `es` (Spanish)
- `it` (Italian)
- `pt` (Portuguese)
- `nl` (Dutch)
- `da` (Danish)
- `no` (Norwegian)
- `fi` (Finnish)

## 📁 **Storage Structure**

### **Supabase Storage: `website-content` bucket**
```
translations/
├── en.json              ← Master English translation
├── sv.json              ← Generated Swedish translation
├── de.json              ← Generated German translation
└── ...
metadata.json            ← Translation tracking & freshness
```

### **Example Response**
```json
{
  "success": true,
  "locale": "sv",
  "translation": {
    "meta": {
      "locale": "sv",
      "lastUpdated": "2025-01-06T11:03:05.000Z",
      "translatedFrom": "en",
      "translationProvider": "openai",
      "generatedOnDemand": true
    },
    "common": {
      "home": "Hem",
      "about": "Om oss",
      "tours": "Turer"
    }
  },
  "generatedOnDemand": true,
  "lastUpdated": "2025-01-06T11:03:05.000Z",
  "provider": "supabase-edge-function"
}
```

## 🎯 **Integration with Next.js**

### **Update your translation loading**
```typescript
// In your Next.js app
const loadTranslation = async (locale: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate?locale=${locale}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    }
  );
  
  const data = await response.json();
  return data.translation;
};
```

## 🔒 **Security & Performance**

### **Security**
- ✅ **CORS Enabled**: Handles preflight requests
- ✅ **Input Validation**: Validates locale parameters
- ✅ **Rate Limiting**: Built-in delays between API calls
- ✅ **Service Role**: Uses elevated permissions for storage operations

### **Performance**
- ✅ **CDN Caching**: 1-hour cache headers on responses
- ✅ **Smart Caching**: Only regenerates when English content changes
- ✅ **Batch Processing**: Efficient translation of multiple strings
- ✅ **Global Distribution**: Supabase Edge Network

## 💰 **Cost Estimation**

### **Monthly Costs (10K visitors)**
- **Supabase Storage**: ~$0.25/month (1GB)
- **Edge Functions**: ~$2.00/month (100K invocations)
- **OpenAI API**: ~$5.00/month (translation costs)
- **Total**: ~$7.25/month

## 🧪 **Testing**

### **Test Edge Function Locally**
```bash
# Start Supabase local development
supabase start

# Test function
curl "http://127.0.0.1:54321/functions/v1/translate?locale=sv"
```

### **Test Production Function**
```bash
curl "https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/translate?locale=sv" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 🎉 **Benefits**

✅ **Pure Storage**: No database complexity  
✅ **Global CDN**: Files served worldwide  
✅ **On-Demand**: Creates translations only when needed  
✅ **SEO-Perfect**: Static JSON files for search engines  
✅ **Smart Caching**: Hash-based freshness detection  
✅ **Auto-Updates**: Regenerates when content changes  
✅ **Cost-Effective**: Pay only for what you use  
✅ **Scalable**: Handles traffic spikes automatically  

Your smart translation system is now ready for global deployment! 🌍
