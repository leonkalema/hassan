import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { locales, isValidLocale, seoConfig } from '../../lib/i18n/config';
import { generateI18nMetadata, generateHreflangLinks } from '../../lib/i18n/seo';
import { notFound } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate static params for all supported locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Generate metadata for each locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return await generateI18nMetadata(locale, 'home', '/');
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  const config = seoConfig[locale];
  const hreflangLinks = generateHreflangLinks('/');

  return (
    <html lang={config.htmlLang} suppressHydrationWarning>
      <head>
        {/* Hreflang links for SEO */}
        {hreflangLinks.map((link, index) => (
          <link
            key={index}
            rel={link.rel}
            hrefLang={link.hrefLang}
            href={link.href}
          />
        ))}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
