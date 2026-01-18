'use client';

import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggleLanguage, language, t } = useLanguage();

  // ฟังก์ชันกำหนดสไตล์ปุ่มเมนู
  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `h-8 sm:h-10 min-w-[80px] sm:min-w-[110px] flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm whitespace-nowrap
    ${isActive 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-y-[-1px]' 
      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600'
    }`;
  };

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      {/* ปรับ px บนมือถือให้น้อยลงเล็กน้อย เพื่อเพิ่มพื้นที่ให้ตรงกลาง */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4"> 
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4"> 
          
          {/* 1. LOGO (ใช้ flex-shrink-0 เพื่อป้องกันโลโก้บี้) */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
             <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shadow-blue-500/20">
               {user ? user.username.charAt(0).toUpperCase() : 'T'}
             </div>
             <span className="text-lg font-bold text-white hidden md:block tracking-wide">
               {t('nav_title')}
             </span>
          </div>

          {/* 2. MENU LINKS (Scrollable Tabbar) */}
          {/* ปรับให้เป็น Scrollable แนวนอนบนมือถือ แต่ยังอยู่ตรงกลางบนจอใหญ่ */}
          <div className="flex-1 flex justify-start sm:justify-center overflow-x-auto [&::-webkit-scrollbar]:hidden -ms-overflow-style-none [scrollbar-width:none]">
            <div className="flex items-center gap-2 sm:gap-3 px-1">
                <Link href="/" className={getLinkClass('/')}>
                  <span className="text-base sm:text-lg">➕</span>
                  <span>{t('nav_record')}</span> 
                </Link>

                <Link href="/news" className={getLinkClass('/news')}>
                  <span className="text-base sm:text-lg">📰</span>
                  <span>ข่าว</span>
                </Link>

                <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                  <span className="text-base sm:text-lg">📊</span>
                  <span>{t('nav_dashboard')}</span>
                </Link>
            </div>
          </div>

          {/* 3. RIGHT SECTION (ใช้ flex-shrink-0 ป้องกันส่วนขวาหลุดจอ) */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
            
            {/* ปุ่มเปลี่ยนภาษา */}
            <button
              onClick={toggleLanguage}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg border border-slate-600 text-[10px] sm:text-xs font-bold text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              {language === 'en' ? 'TH' : 'EN'}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-700">
                <span className="hidden lg:block text-sm font-medium text-slate-300">
                  {user.username}
                </span>
                
                {/* ปุ่ม Logout */}
                <button 
                  onClick={logout} 
                  className="h-8 sm:h-9 px-2 sm:px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-all text-[10px] sm:text-xs font-medium flex items-center gap-1 sm:gap-2"
                  title="Logout"
                >
                  🚪 <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="h-8 sm:h-9 px-3 sm:px-4 flex items-center justify-center text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}