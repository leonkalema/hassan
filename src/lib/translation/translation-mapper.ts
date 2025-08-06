/**
 * Translation Mapper
 * Maps the edge function's translation structure to the expected page structure
 */

export class TranslationMapper {
  private translations: any;

  constructor(translations: any) {
    this.translations = translations;
  }

  /**
   * Get translation value by dot notation key
   * Maps from expected page keys to actual edge function structure
   */
  get(key: string): string {
    // Your real data already has the correct nested structure!
    // No key mapping needed - just pass through the keys directly
    const keyMap: Record<string, string> = {
      // Most keys can be passed through directly since your data structure matches page expectations
    };

    // Since your real data structure matches page expectations, use keys directly
    const value = this.getNestedValue(this.translations, key);
    
    // Return the value or the original key if not found (for debugging)
    return value || key;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): string | undefined {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Create a translation function that can be used in components
   */
  createTranslator() {
    return (key: string, fallback?: string): string => {
      const value = this.get(key);
      
      // If we got back the key itself, it means translation wasn't found
      if (value === key && fallback) {
        return fallback;
      }
      
      return value;
    };
  }

  /**
   * Get all available translation keys (for debugging)
   */
  getAvailableKeys(): string[] {
    const keys: string[] = [];
    
    const extractKeys = (obj: any, prefix = ''): void => {
      if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'string') {
            keys.push(fullKey);
          } else if (typeof value === 'object' && value !== null) {
            extractKeys(value, fullKey);
          }
        }
      }
    };

    extractKeys(this.translations);
    return keys.sort();
  }

  /**
   * Debug helper to see the raw translation structure
   */
  getRawTranslations(): any {
    return this.translations;
  }
}
