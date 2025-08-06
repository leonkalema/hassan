import { Metadata } from 'next';
import { Locale, defaultLocale, seoConfig, generateAlternateUrls } from './config';
import { getServerTranslations } from './translations';
import seoData from '../../data/seo.json';

// Generate SEO metadata for internationalized pages
export async function generateI18nMetadata(
  locale: Locale,
  page: 'home' | 'about',
  pathname: string = '/'
): Promise<Metadata> {
  const t = await getServerTranslations(locale);
  const config = seoConfig[locale];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://explore-adventures.com';
  
  // Get localized SEO content
  const title = t(`seo.${page}.title`);
  const description = t(`seo.${page}.description`);
  
  // Generate alternate URLs for hreflang
  const alternateUrls = generateAlternateUrls(pathname, baseUrl);
  
  // Create canonical URL
  const canonicalUrl = locale === defaultLocale 
    ? `${baseUrl}${pathname}`
    : `${baseUrl}/${locale}${pathname}`;

  return {
    title,
    description,
    keywords: seoData.site.keywords,
    authors: [{ name: seoData.site.author }],
    creator: seoData.site.author,
    publisher: seoData.site.author,
    
    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
      languages: alternateUrls,
    },
    
    // Open Graph
    openGraph: {
      type: 'website',
      locale: config.htmlLang,
      url: canonicalUrl,
      siteName: seoData.site.name,
      title,
      description,
      images: seoData.socialMedia.openGraph.images,
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seoData.socialMedia.twitter.images,
    },
    
    // Robots
    robots: seoData.robots,
    
    // Verification
    verification: {
      google: seoData.site.verification.google,
    },
    
    // Additional metadata
    other: {
      'og:locale': config.htmlLang,
      'og:locale:alternate': Object.keys(alternateUrls)
        .filter(lang => lang !== locale)
        .map(lang => seoConfig[lang as Locale].htmlLang)
        .join(','),
    },
  };
}

// Generate structured data for internationalized content
export function generateI18nStructuredData(
  locale: Locale,
  page: 'home' | 'about',
  data: any
) {
  const config = seoConfig[locale];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://explore-adventures.com';
  
  const baseStructuredData = {
    ...seoData.structuredData.organization,
    url: locale === defaultLocale ? baseUrl : `${baseUrl}/${locale}`,
    inLanguage: config.htmlLang,
  };

  if (page === 'home') {
    return {
      ...baseStructuredData,
      name: data.company.name,
      description: data.company.description,
      foundingDate: data.company.founded,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Tour Packages',
        inLanguage: config.htmlLang,
        itemListElement: data.featured_tours.map((tour: any, index: number) => ({
          '@type': 'TourPackage',
          position: index + 1,
          name: tour.title,
          description: tour.description,
          touristType: 'Adventure Traveler',
          inLanguage: config.htmlLang,
          itinerary: {
            '@type': 'ItemList',
            name: tour.destination
          },
          offers: {
            '@type': 'Offer',
            price: tour.price.replace('$', '').replace(',', ''),
            priceCurrency: config.currency,
            availability: 'https://schema.org/InStock'
          }
        }))
      }
    };
  }

  if (page === 'about') {
    return {
      ...seoData.structuredData.aboutPage,
      mainEntity: {
        ...baseStructuredData,
        name: data.company.name,
        description: data.company.description,
        foundingDate: data.company.founded,
        employee: data.team.map((member: any) => ({
          '@type': 'Person',
          name: member.name,
          jobTitle: member.role,
          worksFor: {
            '@type': 'TravelAgency',
            name: data.company.name
          }
        }))
      }
    };
  }

  return baseStructuredData;
}

// Generate hreflang links for HTML head
export function generateHreflangLinks(pathname: string): Array<{
  rel: string;
  hrefLang: string;
  href: string;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://explore-adventures.com';
  const alternateUrls = generateAlternateUrls(pathname, baseUrl);
  
  return Object.entries(alternateUrls).map(([locale, url]) => ({
    rel: 'alternate',
    hrefLang: locale === defaultLocale ? 'x-default' : seoConfig[locale as Locale].htmlLang,
    href: url,
  }));
}
