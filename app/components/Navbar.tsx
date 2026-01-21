'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggleLanguage, language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // ปิด Sidebar เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ล็อกการเลื่อนหน้าจอเมื่อเปิด Sidebar
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ฟังก์ชันกำหนดสไตล์ปุ่มเมนู (ปรับสำหรับ Sidebar แนวตั้ง)
  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
    ${isActive 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <>
      {/* --- TOP NAVBAR --- */}
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4"> 
          <div className="flex items-center justify-between h-16"> 
            
            {/* 1. LEFT: LOGO & TITLE */}
            <div className="flex items-center gap-3">
              {/* Logo Box */}
               <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                 {user ? user.username.charAt(0).toUpperCase() : 'T'}
               </div>
               {/* Web Name */}
               <span className="text-lg font-bold text-white tracking-wide">
                 {t('nav_title')}
               </span>
            </div>

            {/* 2. RIGHT: LANG & MENU BUTTON */}
            <div className="flex items-center gap-3">
              
              {/* ปุ่มเปลี่ยนภาษา (บน Top Bar) */}
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex h-9 px-3 rounded-lg border border-slate-600 text-xs font-bold text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors items-center gap-1"
              >
                {language === 'en' ? 'TH' : 'EN'}
              </button>

              {/* ปุ่ม Hamburger Menu */}
              <button 
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                {/* Icon Menu */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* --- OVERLAY BACKDROP (Fade มืด) --- */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* --- SIDEBAR (TAPBAR) --- */}
      <div 
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-slate-900 border-l border-slate-700 z-[70] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Sidebar Header: Close Button */}
        <div className="flex items-center justify-end p-4 border-b border-slate-800">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          
          {/* User Profile Section */}
          {user ? (
            <div className="mb-8 flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm text-slate-400">{t('nav_welcome')}</p>
                <p className="text-lg font-bold text-white truncate">{user.username}</p>
              </div>
            </div>
          ) : (
             <div className="mb-8">
                <Link 
                  href="/login"
                  className="w-full py-3 flex items-center justify-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  Login / Register
                </Link>
             </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Menu</p>
            
            <Link href="/" className={getLinkClass('/')}>
              <span className="text-xl">➕</span>
              <span>{t('nav_record')}</span> 
            </Link>

            <Link href="/news" className={getLinkClass('/news')}>
              <span className="text-xl">📰</span>
              <span>{t('nav_news')}</span>
            </Link>

            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              <span className="text-xl">📊</span>
              <span>{t('nav_dashboard')}</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer: Logout & Lang */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex flex-col gap-3">
            
            {/* ปุ่มเปลี่ยนภาษาใน Sidebar */}
            <button
              onClick={toggleLanguage}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800 transition-all flex items-center justify-between group"
            >
              <span className="text-sm font-medium">{t('nav_language')}</span>
              <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-slate-300 group-hover:bg-blue-500/10 group-hover:text-blue-400">
                {language === 'en' ? 'TH' : 'EN'}
              </span>
            </button>

            {/* ปุ่ม Logout */}
            {user && (
              <button 
                onClick={logout} 
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                {t('nav_logout')}
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}