import fs from 'fs/promises';
import path from 'path';
import { Locale, defaultLocale, isValidLocale } from './config';
import { EdgeTranslator, edgeTranslator } from '../translation/edge-translator';
import { TranslationMapper } from '../translation/translation-mapper';

// Initialize the appropriate translator based on environment
const getTranslator = () => {
  // Use EdgeTranslator for production and development
  // This provides smart, on-demand translation via Supabase Edge Function
  return edgeTranslator;
};

const translator = getTranslator();

// Cache for loaded translations (EdgeTranslator has its own cache, but keeping for fallback)
const translationCache = new Map<string, any>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Load translations with smart on-demand generation via EdgeTranslator
export async function loadTranslations(locale: Locale): Promise<any> {
  try {
    // Use EdgeTranslator for smart, on-demand translation loading
    console.log(`🌍 Loading translations for ${locale} via EdgeTranslator...`);
    
    const translations = await translator.loadTranslation(locale);
    
    // Cache the translations locally as backup
    translationCache.set(locale, translations);
    
    return translations;
  } catch (error) {
    console.warn(`Failed to load translations for ${locale} via EdgeTranslator:`, error);
    
    // Check local cache as fallback
    if (translationCache.has(locale)) {
      console.log(`📦 Using local cache fallback for ${locale}`);
      return translationCache.get(locale);
    }
    
    // Fallback to default locale if available
    if (locale !== defaultLocale) {
      console.log(`🔄 Falling back to ${defaultLocale} for ${locale}`);
      return loadTranslations(defaultLocale);
    }
    
    // Return empty object if even default locale fails
    return {};
  }
}

// Translation dictionary type
export type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

// Get nested translation value
export function getNestedValue(obj: TranslationDictionary, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the key if translation not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

// Translation function with mapping support
export function createTranslator(translations: TranslationDictionary) {
  const mapper = new TranslationMapper(translations);
  const t = mapper.createTranslator();
  
  return function(key: string, fallback?: string): string {
    const value = t(key, fallback);
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && value === key) {
      console.warn(`Translation missing for key: ${key}`);
      console.log('Available keys:', mapper.getAvailableKeys().slice(0, 10)); // Show first 10 keys
    }
    
    return value;
  };
}

// Hook for translations in components (for client-side usage)
// Note: This would be used in client components with 'use client' directive

// Server-side translation helper with smart loading
export async function getServerTranslations(locale: Locale) {
  const translations = await loadTranslations(locale);
  return createTranslator(translations);
}

// Check if translation needs update (for development/admin use)
export async function checkTranslationStatus(locale: Locale): Promise<{
  exists: boolean;
  upToDate: boolean;
  lastUpdated?: string;
  generatedOnDemand?: boolean;
}> {
  try {
    // Use EdgeTranslator to get translation status
    const status = translator.getTranslationStatus(locale);
    const translations = await translator.loadTranslation(locale);
    
    return {
      exists: status.cached,
      upToDate: status.fresh,
      lastUpdated: translations.meta?.lastUpdated,
      generatedOnDemand: translations.meta?.generatedOnDemand
    };
  } catch (error) {
    return {
      exists: false,
      upToDate: false
    };
  }
}

// Force regenerate translation (for admin use)
export async function regenerateTranslation(locale: Locale): Promise<any> {
  // Use EdgeTranslator to force regenerate translation
  const translations = await translator.regenerateTranslation(locale);
  
  // Clear local cache to force reload
  translationCache.delete(locale);
  
  return translations;
}
