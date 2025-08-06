import { notFound } from 'next/navigation';

// Supported locales configuration
export const locales = ['en', 'sv', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'da', 'no', 'fi', 'ja', 'zh'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

// Locale metadata
export const localeNames: Record<Locale, string> = {
  en: 'English',
  sv: 'Svenska',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  da: 'Dansk',
  no: 'Norsk',
  fi: 'Suomi',
  ja: '日本語',
  zh: '中文',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  sv: '🇸🇪',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  da: '🇩🇰',
  no: '🇳🇴',
  fi: '🇫🇮',
  ja: '🇯🇵',
  zh: '🇨🇳'
};

export const localeRegions: Record<Locale, string> = {
  en: 'US',
  sv: 'SE',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  nl: 'NL',
  da: 'DK',
  no: 'NO',
  fi: 'FI',
  ja: 'JP',
  zh: 'CN'
};

// Validate locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale from pathname
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return defaultLocale;
}

// Remove locale from pathname
export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return '/' + segments.slice(2).join('/');
  }
  
  return pathname;
}

// Add locale to pathname
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return pathname;
  }
  
  const cleanPathname = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPathname}`;
}

// Generate alternate URLs for hreflang
export function generateAlternateUrls(pathname: string, baseUrl: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  locales.forEach(locale => {
    const localizedPath = addLocaleToPathname(pathname, locale);
    alternates[locale] = `${baseUrl}${localizedPath}`;
  });
  
  return alternates;
}

// SEO configuration per locale
export const seoConfig: Record<Locale, {
  htmlLang: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
}> = {
  en: {
    htmlLang: 'en-US',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
  },
  sv: {
    htmlLang: 'sv-SE',
    currency: 'SEK',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'sv-SE',
  },
  de: {
    htmlLang: 'de-DE',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'de-DE',
  },
  fr: {
    htmlLang: 'fr-FR',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'fr-FR',
  },
  es: {
    htmlLang: 'es-ES',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'es-ES',
  },
  it: {
    htmlLang: 'it-IT',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'it-IT',
  },
  pt: {
    htmlLang: 'pt-PT',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'pt-PT',
  },
  nl: {
    htmlLang: 'nl-NL',
    currency: 'EUR',
    dateFormat: 'DD-MM-YYYY',
    numberFormat: 'nl-NL',
  },
  da: {
    htmlLang: 'da-DK',
    currency: 'DKK',
    dateFormat: 'DD-MM-YYYY',
    numberFormat: 'da-DK',
  },
  no: {
    htmlLang: 'no-NO',
    currency: 'NOK',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'no-NO',
  },
  fi: {
    htmlLang: 'fi-FI',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'fi-FI',
  },
  ja: {
    htmlLang: 'ja-JP',
    currency: 'JPY',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'ja-JP',
  },
  zh: {
    htmlLang: 'zh-CN',
    currency: 'CNY',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'zh-CN',
  },
};
