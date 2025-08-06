import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import toursData from '../../../data/tours.json';
import { locales, isValidLocale, Locale } from '../../../lib/i18n/config';
import { getServerTranslations } from '../../../lib/i18n/translations';
import { generateI18nMetadata, generateI18nStructuredData } from '../../../lib/i18n/seo';
import Navigation from '../../../components/Navigation';

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

  return await generateI18nMetadata(locale as Locale, 'about', '/about');
}

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Get translations for this locale
  const t = await getServerTranslations(locale as Locale);
  const { company, team } = toursData;

  // Generate structured data for SEO
  const structuredData = generateI18nStructuredData(locale as Locale, 'about', {
    company,
    team,
  });

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-rose-50">
        <Navigation locale={locale} t={t} company={company} />
        
        {/* Hero Section */}
        <section className="relative h-screen overflow-hidden">
          {/* Hero Image */}
          <div className="absolute inset-0">
            <img 
              src="https://cdn.midjourney.com/30c85e19-4138-47e6-bc0b-9e1c5cdbfcae/0_0.png" 
              alt="About us - Our story"
              className="w-full h-full object-cover scale-105"
            />
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
          
          {/* Hero Content - Positioned at bottom left */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-12">
            <div className="max-w-2xl">
              <div className="space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight drop-shadow-lg">
                  {t('about.hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed font-light drop-shadow-md max-w-xl">
                  {t('about.hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button className="group bg-white text-gray-900 px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                    <span className="group-hover:text-rose-600 transition-colors">
                      {t('about.hero.cta')}
                    </span>
                  </button>
                  <button className="border-2 border-white/80 text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-gray-900 transition-all duration-300 backdrop-blur-sm">
                    {t('about.hero.learnMore')}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 right-8 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('about.story.title')}</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {company.description}
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{company.founded}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('about.story.founded')}</h4>
                  <p className="text-gray-600">Started our journey in {company.founded}</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{company.team_size.split('+')[0]}+</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('about.story.teamSize')}</h4>
                  <p className="text-gray-600">{company.team_size}</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{company.countries_covered.split('+')[0]}+</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('about.story.countries')}</h4>
                  <p className="text-gray-600">{company.countries_covered}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('about.mission.title')}</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">🌍</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('about.mission.explore.title')}</h4>
                  <p className="text-gray-600">
                    {t('about.mission.explore.description')}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">🤝</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('about.mission.connect.title')}</h4>
                  <p className="text-gray-600">
                    {t('about.mission.connect.description')}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-lg p-8 shadow-sm">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">⭐</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">{t('about.mission.excellence.title')}</h4>
                  <p className="text-gray-600">
                    {t('about.mission.excellence.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('about.team.title')}</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {t('about.team.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gray-200 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-gray-500">👤</span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h4>
                  <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.experience}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-6">
              {t('about.cta.title')}
            </h3>
            <p className="text-xl text-blue-100 mb-8">
              {t('about.cta.subtitle')}
            </p>
            <Link 
              href={`/${locale}`}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              {t('about.cta.button')}
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12 mb-12">
              {/* Company Info */}
              <div className="md:col-span-1">
                <h4 className="text-2xl font-light text-gray-800 mb-4">
                  {company.name}
                </h4>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {t('home.hero.subtitle')}
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-rose-200 rounded-full flex items-center justify-center hover:bg-rose-300 transition-colors">
                    <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center hover:bg-amber-300 transition-colors">
                    <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-sky-200 rounded-full flex items-center justify-center hover:bg-sky-300 transition-colors">
                    <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.797v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h5 className="text-lg font-medium text-gray-800 mb-4">{t('footer.quickLinks')}</h5>
                <ul className="space-y-3">
                  <li>
                    <Link href={`/${locale}`} className="text-gray-600 hover:text-gray-800 transition-colors text-sm">
                      {t('navigation.home')}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/about`} className="text-gray-600 hover:text-gray-800 transition-colors text-sm">
                      {t('navigation.about')}
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm">
                      {t('navigation.tours')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm">
                      {t('navigation.contact')}
                    </a>
                  </li>
                </ul>
              </div>
              
              {/* Contact Info */}
              <div>
                <h5 className="text-lg font-medium text-gray-800 mb-4">{t('footer.contactUs')}</h5>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600 text-sm">hello@exploreventures.com</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600 text-sm">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-4 h-4 mr-3 mt-1 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600 text-sm leading-relaxed">123 Adventure Street<br />Travel City, TC 12345</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="border-t border-gray-200 pt-8 text-center">
              <p className="text-gray-500 text-sm">
                © 2024 {company.name}. {t('footer.copyright')}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
