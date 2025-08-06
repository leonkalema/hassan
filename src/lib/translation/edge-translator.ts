import { Locale } from '../i18n/config';

/**
 * Edge Function Translation Loader
 * Uses Supabase Edge Function for smart, on-demand translation generation
 */
export class EdgeTranslator {
  private edgeUrl: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(edgeUrl: string = 'https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/data') {
    this.edgeUrl = edgeUrl;
  }

  /**
   * Load translation for a specific locale
   * Uses smart caching and falls back to edge function generation
   */
  async loadTranslation(locale: Locale, force = false): Promise<any> {
    const cacheKey = `translation_${locale}`;
    const now = Date.now();

    // Check cache first (unless forcing refresh)
    if (!force && this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0;
      if (now < expiry) {
        console.log(`📦 Using cached translation for ${locale}`);
        return this.cache.get(cacheKey);
      }
    }

    try {
      console.log(`🌍 Loading translation for ${locale} from edge function...`);
      
      const response = await fetch(`${this.edgeUrl}?locale=${locale}&force=${force}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXBwc2FzZmFleHRrd3llaXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY5MDEsImV4cCI6MjA3MDA1MjkwMX0.w57n1eP117sQs9-P4jegDcCawHduZiiWh6P9jRiVRYQ'}`
        }
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Translation failed');
      }

      const translation = data.translation;

      // Cache the translation
      this.cache.set(cacheKey, translation);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      console.log(`✅ Translation loaded for ${locale} (${data.generatedOnDemand ? 'generated' : 'cached'})`);
      return translation;

    } catch (error) {
      console.error(`❌ Failed to load translation for ${locale}:`, error);
      
      // Return fallback English translation if available
      if (locale !== 'en' && this.cache.has('translation_en')) {
        console.log(`🔄 Falling back to English for ${locale}`);
        return this.cache.get('translation_en');
      }

      // Return basic fallback structure
      return this.getFallbackTranslation(locale);
    }
  }

  /**
   * Force regenerate translation for a locale
   */
  async regenerateTranslation(locale: Locale): Promise<any> {
    console.log(`🔄 Force regenerating translation for ${locale}...`);
    
    try {
      const response = await fetch(this.edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXBwc2FzZmFleHRrd3llaXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY5MDEsImV4cCI6MjA3MDA1MjkwMX0.w57n1eP117sQs9-P4jegDcCawHduZiiWh6P9jRiVRYQ'}`
        },
        body: JSON.stringify({
          locale,
          force: true
        })
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Translation regeneration failed');
      }

      // Update cache
      const cacheKey = `translation_${locale}`;
      this.cache.set(cacheKey, data.translation);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      console.log(`✅ Translation regenerated for ${locale}`);
      return data.translation;

    } catch (error) {
      console.error(`❌ Failed to regenerate translation for ${locale}:`, error);
      throw error;
    }
  }

  /**
   * Preload translations for multiple locales
   */
  async preloadTranslations(locales: Locale[]): Promise<void> {
    console.log(`📦 Preloading translations for: ${locales.join(', ')}`);
    
    const promises = locales.map(locale => 
      this.loadTranslation(locale).catch(error => {
        console.warn(`Failed to preload ${locale}:`, error);
        return null;
      })
    );

    await Promise.all(promises);
    console.log('✅ Translation preloading completed');
  }

  /**
   * Get translation status for a locale
   */
  getTranslationStatus(locale: Locale): {
    cached: boolean;
    fresh: boolean;
    lastLoaded?: Date;
  } {
    const cacheKey = `translation_${locale}`;
    const cached = this.cache.has(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey) || 0;
    const fresh = cached && Date.now() < expiry;

    return {
      cached,
      fresh,
      lastLoaded: cached ? new Date(expiry - this.CACHE_DURATION) : undefined
    };
  }

  /**
   * Clear translation cache
   */
  clearCache(locale?: Locale): void {
    if (locale) {
      const cacheKey = `translation_${locale}`;
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      console.log(`🗑️ Cleared cache for ${locale}`);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
      console.log('🗑️ Cleared all translation cache');
    }
  }

  /**
   * Test edge function connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.edgeUrl}?locale=en`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXBwc2FzZmFleHRrd3llaXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzY5MDEsImV4cCI6MjA3MDA1MjkwMX0.w57n1eP117sQs9-P4jegDcCawHduZiiWh6P9jRiVRYQ'}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Edge function connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get basic fallback translation structure
   */
  private getFallbackTranslation(locale: Locale): any {
    return {
      meta: {
        locale,
        lastUpdated: new Date().toISOString(),
        fallback: true,
        version: '1.0.0'
      },
      navigation: {
        home: 'Home',
        about: 'About Us',
        tours: 'Tours',
        contact: 'Contact'
      },
      common: {
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
        hero: {
          title: 'Discover the World with Us',
          subtitle: 'We are a premier tour operator dedicated to creating unforgettable travel experiences',
          cta: 'Explore Tours'
        },
        featuredTours: {
          title: 'Featured Tours',
          viewAll: 'View All Tours'
        },
        stats: {
          travelers: 'Happy Travelers',
          destinations: 'Destinations',
          experience: 'Years Experience',
          packages: 'Tour Packages'
        }
      },
      about: {
        hero: {
          title: 'About Explore Adventures',
          subtitle: 'Learn more about our journey and the passionate team behind your next adventure'
        },
        story: {
          title: 'Our Story',
          content: 'We are passionate about creating unforgettable travel experiences.'
        },
        mission: {
          title: 'Our Mission',
          content: 'To provide exceptional travel experiences that create lasting memories.'
        },
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
  }
}

// Export singleton instance
export const edgeTranslator = new EdgeTranslator();
