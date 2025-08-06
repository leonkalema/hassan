import Link from 'next/link';
import { Locale } from '../lib/i18n/config';

interface NavigationProps {
  locale: Locale;
  t: (key: string) => string;
  company: {
    name: string;
  };
}

export default function Navigation({ locale, t, company }: NavigationProps) {
  return (
    <nav className="bg-transparent backdrop-blur-sm absolute top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <h1 className="text-xl font-light text-white drop-shadow-lg">
              {company.name}
            </h1>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href={`/${locale}`} 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium drop-shadow-lg"
            >
              {t('navigation.home')}
            </Link>
            <Link 
              href={`/${locale}/about`} 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium drop-shadow-lg"
            >
              {t('navigation.about')}
            </Link>
            <a 
              href="#" 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium drop-shadow-lg"
            >
              {t('navigation.tours')}
            </a>
            <a 
              href="#" 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium drop-shadow-lg"
            >
              {t('navigation.contact')}
            </a>
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium transition-colors border border-white/30">
              {t('navigation.travelResponsibly')}
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white/90 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
