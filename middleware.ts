import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale } from './src/lib/i18n/config';

// Middleware for i18n routing
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }
  
  // Check if pathname already has a valid locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // For root path, redirect to default locale
  if (pathname === '/') {
    const locale = getLocaleFromRequest(request);
    const redirectPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    
    // Set locale cookie for future visits
    response.cookies.set('locale', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  }

  // For other paths without locale, add default locale
  const locale = getLocaleFromRequest(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

function getLocaleFromRequest(request: NextRequest): string {
  // 1. Check URL parameter (for manual language switching)
  const urlLocale = request.nextUrl.searchParams.get('lang');
  if (urlLocale && isValidLocale(urlLocale)) {
    return urlLocale;
  }

  // 2. Check cookie first (user preference)
  const cookieLocale = request.cookies.get('locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    return cookieLocale as any;
  } else {
    // Get user's country from headers (Cloudflare, Vercel, etc.)
    const userCountry = request.headers.get('CF-IPCountry') || 
                       request.headers.get('X-Vercel-IP-Country') ||
                       (request as any).geo?.country;
    
    // Country to locale mapping for smart detection
    const countryToLocale: Record<string, string> = {
      'SE': 'sv', // Sweden
      'DK': 'da', // Denmark  
      'NO': 'no', // Norway
      'FI': 'fi', // Finland
      'DE': 'de', // Germany
      'AT': 'de', // Austria
      'CH': 'de', // Switzerland (German)
      'FR': 'fr', // France
      'BE': 'fr', // Belgium (French)
      'CA': 'fr', // Canada (French)
      'ES': 'es', // Spain
      'MX': 'es', // Mexico
      'AR': 'es', // Argentina
      'IT': 'it', // Italy
      'PT': 'pt', // Portugal
      'BR': 'pt', // Brazil
      'NL': 'nl', // Netherlands
    };

    // Use country-based locale if available
    if (userCountry && countryToLocale[userCountry] && locales.includes(countryToLocale[userCountry] as any)) {
      return countryToLocale[userCountry] as any;
    } else {
      // Fallback to Accept-Language header
      const acceptLanguage = request.headers.get('Accept-Language');
      if (acceptLanguage) {
        const preferredLocale = acceptLanguage
          .split(',')
          .map(lang => lang.split(';')[0].trim().toLowerCase())
          .find(lang => locales.includes(lang.split('-')[0] as any));
        
        if (preferredLocale) {
          return preferredLocale.split('-')[0] as any;
        }
      }
    }
  }
  // 4. Fallback to default
  return defaultLocale;
}

function parseAcceptLanguage(acceptLanguage: string): string | null {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    // Check exact match
    if (locales.includes(code as any)) {
      return code;
    }
    
    // Check language part (e.g., 'en' from 'en-US')
    const langPart = code.split('-')[0];
    if (locales.includes(langPart as any)) {
      return langPart;
    }
  }

  return null;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
