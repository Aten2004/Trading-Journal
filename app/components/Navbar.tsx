'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toggleLanguage, language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // --- Notification Logic ---
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoadingNoti, setIsLoadingNoti] = useState(false);

  // Helper: Convert VAPID Key
  const urlBase64ToUint8Array = (base64String: string) => {
    try {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      console.error("VAPID Key Error:", error);
      return null;
    }
  };

  // 🔄 Function: Sync ข้อมูลลง Sheet (แจ้ง Backend ว่าเครื่องนี้เป็นของฉัน)
  const syncSubscription = useCallback(async (sub: PushSubscription, currentUser: any) => {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            subscription: sub.toJSON(), 
            username: currentUser.username,
            userId: currentUser.id 
        }),
      });
      console.log(`✅ Notification Synced: Owner is now [${currentUser.username}]`);
    } catch (error) {
      console.error('❌ Sync Failed:', error);
    }
  }, []);

  // ✅ Auto Check & Sync เมื่อ User Login หรือ Refresh
  useEffect(() => {
    let isMounted = true;

    const initializeNotification = async () => {
        // ต้องมี Service Worker และ User Login แล้วเท่านั้น
        if ('serviceWorker' in navigator && 'PushManager' in window && user) {
            try {
                // 1. Register Service Worker (ถ้ายังไม่มี)
                const reg = await navigator.serviceWorker.register('/sw.js');
                
                // 2. เช็คว่ามี Subscription อยู่แล้วไหม
                const sub = await reg.pushManager.getSubscription();
    
                if (sub) {
                    // กรณี A: เคยเปิดแจ้งเตือนไว้แล้ว (Browser จำได้)
                    if (isMounted) setIsSubscribed(true); 
                    // ยิง Sync ไป Backend ทันที เพื่อบอกว่า "User คนนี้ Login เครื่องนี้นะ"
                    await syncSubscription(sub, user);
                } else {
                    // กรณี B: ยังไม่เคย Subscribe (หรือเคยปิดไป)
                    if (isMounted) setIsSubscribed(false);
                }
            } catch (err) {
                console.error("Auto-Sync Error:", err);
            }
        }
    };

    // หน่วงเวลาเล็กน้อยกันรวน
    const timeoutId = setTimeout(() => {
        initializeNotification();
    }, 1000);

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
    };
  }, [user, syncSubscription]); // รันใหม่ทุกครั้งที่ user เปลี่ยน (เช่น สลับ Account)

  // 🔔 ปุ่มกดเปิด (Manual Subscribe)
  const subscribeUser = async () => {
    if (!user) return alert(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อนครับ' : 'Please login first');
    
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    if (!vapidKey) return alert("System Error: ไม่พบ VAPID Key");

    setIsLoadingNoti(true);
    try {
      const convertedKey = urlBase64ToUint8Array(vapidKey);
      if (!convertedKey) throw new Error("Invalid VAPID Key");

      const registration = await navigator.serviceWorker.ready;
      
      // ขอ Permission จาก Browser (จะเด้ง Popup ถ้ายังไม่เคยขอ)
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      // ได้ Endpoint มาแล้ว -> ส่งไปบันทึก
      await syncSubscription(sub, user);

      setIsSubscribed(true);
      alert(language === 'th' ? '🔔 เปิดแจ้งเตือนเรียบร้อย!' : '🔔 Notifications Enabled!');
    } catch (error) {
      console.error(error);
      alert(language === 'th' ? 'กรุณากด Allow เพื่อรับการแจ้งเตือน' : 'Please allow notifications');
    } finally {
      setIsLoadingNoti(false);
    }
  };

  // 🔕 ปุ่มกดปิด (Manual Unsubscribe)
  const unsubscribeUser = async () => {
    if (!confirm(language === 'th' ? 'ต้องการปิดการแจ้งเตือนเครื่องนี้ใช่ไหม?' : 'Turn off notifications on this device?')) return;
    setIsLoadingNoti(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        // 1. แจ้ง Backend ให้ปรับ status เป็น active=FALSE
        await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        // 2. สั่ง Browser ให้เลิกรับ (Optional: ถ้าอยากให้ปุ่มกลับมาเป็น Subscribe อีกครั้ง)
        await sub.unsubscribe();
        
        setIsSubscribed(false);
        alert(language === 'th' ? '🔕 ปิดแจ้งเตือนแล้ว' : '🔕 Notifications Disabled');
      }
    } catch (error) {
      console.error(error);
      alert('Error unsubscribing');
    } finally {
      setIsLoadingNoti(false);
    }
  };

  // UI Helper
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

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
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4"> 
          <div className="flex items-center justify-between h-16"> 
            
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                 {user ? user.username.charAt(0).toUpperCase() : 'T'}
               </div>
               <span className="text-lg font-bold text-white tracking-wide">
                 {t('nav_title')}
               </span>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleLanguage} className="hidden sm:flex h-9 px-3 rounded-lg border border-slate-600 text-xs font-bold text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors items-center gap-1">
                {language === 'en' ? 'TH' : 'EN'}
              </button>
              <button onClick={() => setIsOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay & Sidebar Code (คงเดิม) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      <div 
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-slate-900 border-l border-slate-700 z-[70] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-end p-4 border-b border-slate-800">
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
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
                <Link href="/login" className="w-full py-3 flex items-center justify-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                  Login / Register
                </Link>
             </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Menu</p>
            <Link href="/" className={getLinkClass('/')}><span className="text-xl">➕</span><span>{t('nav_record')}</span></Link>
            <Link href="/news" className={getLinkClass('/news')}><span className="text-xl">📰</span><span>{t('nav_news')}</span></Link>
            <Link href="/dashboard" className={getLinkClass('/dashboard')}><span className="text-xl">📊</span><span>{t('nav_dashboard')}</span></Link>
            <Link href="/calculator" className={getLinkClass('/calculator')}><span className="text-xl">🧮</span><span>{t('nav_calc')}</span></Link>
            <Link href="/withdrawals" className={getLinkClass('/withdrawals')}><span className="text-xl">💸</span><span>{t('withdraw_title')}</span></Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex flex-col gap-3">
            <div className="flex w-full gap-2 sm:gap-3">
              <button
                onClick={isSubscribed ? unsubscribeUser : subscribeUser}
                disabled={isLoadingNoti}
                className={`flex-1 h-11 sm:h-10 rounded-lg border 
                  ${isSubscribed 
                    ? 'border-green-500 text-green-400 bg-green-500/10' 
                    : 'border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800'}
                  text-[11px] sm:text-xs font-medium flex items-center justify-between px-2.5 sm:px-3 transition-colors min-w-0`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="text-sm sm:text-base">{isSubscribed ? '🔔' : '🔕'}</span>
                  <span className="truncate">
                    {isSubscribed ? (language === 'th' ? 'เปิดอยู่' : 'On') : (t('nav_notification') ?? 'Notifications')}
                  </span>
                </span>
                {isLoadingNoti && <span className="animate-spin text-[10px]">⏳</span>}
              </button>
              
              <button onClick={toggleLanguage} className="flex-1 h-11 sm:h-10 rounded-lg border border-slate-700 text-[11px] sm:text-xs font-medium text-slate-300 flex items-center justify-between px-2.5 sm:px-3 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800 transition-colors min-w-0">
                <span className="flex items-center gap-1.5 sm:gap-2 min-w-0"><span className="truncate">{t('nav_language')}</span></span>
                <span className="text-[10px] sm:text-[11px] font-bold bg-slate-800 px-2 py-0.5 rounded">{language === 'en' ? 'TH' : 'EN'}</span>
              </button>
            </div>

            {user && (
              <button onClick={logout} className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2">
                {t('nav_logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}