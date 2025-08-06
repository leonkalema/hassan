import { Locale } from '../i18n/config';

/**
 * Fast Translation Server Client
 * Uses Supabase fast translation server for instant translation loading
 */
export class EdgeTranslator {
  private fastServerUrl: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(fastServerUrl: string) {
    this.fastServerUrl = fastServerUrl;
  }

  /**
   * Load translation for a specific locale from fast server
   * Uses caching for optimal performance
   */
  async loadTranslation(locale: Locale, includeStatus = false): Promise<any> {
    const cacheKey = `translation_${locale}`;
    const now = Date.now();

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      console.log(`📦 Using cached translation for ${locale}`);
      return cached.data;
    }

    try {
      console.log(`⚡ Loading translation for ${locale} from fast server...`);
      
      const response = await fetch(this.fastServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          locale,
          includeStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Fast server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Translation loading failed');
      }

      const translation = result.translation;
      
      // Cache the successful result
      this.cache.set(cacheKey, {
        data: translation,
        timestamp: now
      });
      
      console.log(`✅ Translation loaded for ${locale}`);
      
      // Log quality information if available
      if (result.quality) {
        console.log(`📊 Quality: ${result.quality.score}/100 (${result.quality.status})`);
      }
      
      // Log completion status
      if (result.translationComplete) {
        console.log(`✅ Translation marked as complete`);
      } else if (result.fallback) {
        console.log(`⚠️ Using English fallback for ${locale}`);
      }
      
      return translation;
      
    } catch (error) {
      console.error(`❌ Failed to load translation for ${locale}:`, error);
      
      // Try to return cached version even if expired
      const cachedTranslation = this.cache.get(cacheKey);
      if (cachedTranslation) {
        console.log(`🔄 Using expired cache for ${locale} due to error`);
        return cachedTranslation.data;
      }
      
      // Final fallback: return empty object with locale info
      return {
        meta: {
          locale,
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Force regenerate translation for a locale
   */
  async regenerateTranslation(locale: Locale): Promise<any> {
    console.log(`🔄 Force regenerating translation for ${locale}...`);
    
    try {
      const response = await fetch(this.fastServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          locale,
          force: true
        })
      });

    } catch (error) {
      console.error(`❌ Failed to regenerate translation for ${locale}:`, error);
    }
  }

  /**
   * Preload translations for multiple locales
   * Useful for warming up cache
   */
  async preloadTranslations(locales: Locale[]): Promise<void> {
    console.log(`🔥 Preloading translations for: ${locales.join(', ')}`);
    
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
   * Check if translation exists in cache
   */
  hasCachedTranslation(locale: Locale): boolean {
    const cached = this.cache.get(`translation_${locale}`);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.CACHE_TTL;
  }

  /**
   * Clear cache for specific locale or all locales
   */
  clearCache(locale?: Locale): void {
    if (locale) {
      this.cache.delete(`translation_${locale}`);
      console.log(`🗑️ Cleared cache for ${locale}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all translation cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; locales: string[] } {
    const locales = Array.from(this.cache.keys())
      .map(key => key.replace('translation_', ''))
      .sort();
      
    return {
      size: this.cache.size,
      locales
    };
  }

  /**
   * Force refresh translation from server
   */
  async refreshTranslation(locale: Locale): Promise<any> {
    this.clearCache(locale);
    return this.loadTranslation(locale);
  }

  /**
   * Load translation with status information
   */
  async loadTranslationWithStatus(locale: Locale): Promise<any> {
    return this.loadTranslation(locale, true);
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

// Export singleton instance with fast server URL
const FAST_SERVER_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/serve-translation`
  : 'https://koeppsasfaextkwyeiuv.supabase.co/functions/v1/serve-translation';

export const edgeTranslator = new EdgeTranslator(FAST_SERVER_URL);
