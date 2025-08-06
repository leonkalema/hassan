'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags, getLocaleFromPathname, removeLocaleFromPathname, addLocaleToPathname, Locale } from '../lib/i18n/config';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const cleanPathname = removeLocaleFromPathname(pathname);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
        aria-label="Select language"
      >
        <span>{localeFlags[currentLocale]}</span>
        <span>{localeNames[currentLocale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {locales.map((locale) => {
                const localizedPath = addLocaleToPathname(cleanPathname, locale);
                const isActive = locale === currentLocale;
                
                return (
                  <Link
                    key={locale}
                    href={localizedPath}
                    className={`flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="text-lg">{localeFlags[locale]}</span>
                    <span className={isActive ? 'font-medium' : ''}>{localeNames[locale]}</span>
                    {isActive && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
