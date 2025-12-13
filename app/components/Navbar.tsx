'use client';

import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const { toggleLanguage, t } = useLanguage();

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              {t('nav_title')}
            </h1>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-2">
            
            {/* 1. ปุ่มเปลี่ยนภาษา (Fixed Width) */}
            <button
              onClick={toggleLanguage}
              className="w-16 h-8 sm:w-20 sm:h-9 flex items-center justify-center rounded-full border border-slate-600 text-xs sm:text-sm font-bold text-slate-300 hover:bg-slate-800 transition-all shadow-sm whitespace-nowrap"
            >
              {t('lang_btn')}
            </button>

            {/* 2. ปุ่ม Record Trade (Fixed Width) */}
            <a
              href="/"
              className={`w-28 sm:w-40 h-9 sm:h-10 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base ${
                pathname === '/'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              <span className="text-sm sm:text-lg">➕</span>
              <span className="truncate">{t('nav_record')}</span>
            </a>

            {/* 3. ปุ่ม Dashboard (Fixed Width) */}
            <a
              href="/dashboard"
              className={`w-28 sm:w-40 h-9 sm:h-10 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-base ${
                pathname === '/dashboard'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              <span className="text-sm sm:text-lg">📊</span>
              <span className="truncate">{t('nav_dashboard')}</span>
            </a>

          </div>
        </div>
      </div>
    </nav>
  );
}