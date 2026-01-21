'use client';

import React, { useEffect, useRef, memo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

// Greeting & Market Sessions 
const MarketSessions = () => {
    const { t, language } = useLanguage();
    const [currentTime, setCurrentTime] = useState<string>('');
    const [currentDate, setCurrentDate] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false); 

    useEffect(() => {
        setIsMounted(true); 
        
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
                timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false 
            }));
            setCurrentDate(now.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                timeZone: 'Asia/Bangkok',
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [language]);

    const sessions = [
        { 
            name: '🇦🇺 Sydney', 
            time: '05:00 - 14:00', 
            open: 5, 
            close: 14,
            descKey: 'desc_sydney'
        },
        { 
            name: '🇯🇵 Tokyo', 
            time: '06:00 - 15:00', 
            open: 6, 
            close: 15,
            descKey: 'desc_tokyo'
        },
        { 
            name: '🇬🇧 London', 
            time: '14:00 - 23:00', 
            open: 14, 
            close: 23,
            descKey: 'desc_london'
        },
        { 
            name: '🇺🇸 New York', 
            time: '19:00 - 04:00', 
            open: 19, 
            close: 4, 
            descKey: 'desc_newyork' 
        } 
    ];

    const checkStatus = (open: number, close: number) => {
        if (!isMounted) return false; 

        const now = new Date();
        const thaiHour = parseInt(now.toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Bangkok', 
            hour: 'numeric', 
            hour12: false 
        }));
        
        if (open > close) { 
            return thaiHour >= open || thaiHour < close;
        }
        return thaiHour >= open && thaiHour < close;
    };

    if (!isMounted) {
        return (
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-xl animate-pulse">
                <div className="h-6 md:h-8 bg-slate-700/50 rounded w-1/3 mb-4 md:mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-20 md:h-24 bg-slate-700/30 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 mb-4 md:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                        ☕ {t('news_greeting')} <span className="text-emerald-400 text-base sm:text-lg">({currentTime})</span>
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm">📅 {currentDate}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {sessions.map((s, idx) => {
                    const isOpen = checkStatus(s.open, s.close);
                    return (
                        <div key={idx} className={`relative p-2 md:p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
                            isOpen 
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-100 md:scale-105 z-10' 
                            : 'bg-slate-800/50 border-slate-700 opacity-60 grayscale'
                        }`}>
                            <div className={`absolute top-2 right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></div>
                            <span className="text-[13px] text-xs sm:text-sm font-bold text-white mb-1">{s.name}</span>
                            <span className="text-[11px] sm:text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full mb-1 font-mono whitespace-nowrap">{s.time}</span>
                            <span className="text-[10px] sm:text-[9px] text-slate-500 mt-1 text-center leading-tight">{t(s.descKey as any)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Technical Analysis (Slider Tabs)
const CustomTechnicalWidget = () => {
    const { t, language } = useLanguage();
    const [interval, setInterval] = useState('15m');
    const container = useRef<HTMLDivElement>(null);

    const timeframes = [
        { label: '1m', val: '1m' },
        { label: '5m', val: '5m' },
        { label: '15m', val: '15m' },
        { label: '30m', val: '30m' },
        { label: '1h', val: '1h' },
        { label: '2h', val: '2h' }, 
        { label: '4h', val: '4h' },
        { label: '1D', val: '1D' },
        { label: '1W', val: '1W' }, 
        { label: '1M', val: '1M' }, 
    ];

    useEffect(() => {
        if (container.current) {
            container.current.innerHTML = '';
            const script = document.createElement('script');
            script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
            script.type = "text/javascript";
            script.async = true;
            script.innerHTML = JSON.stringify({
                "interval": interval,
                "width": "100%",
                "isTransparent": false,
                "height": "100%", 
                "symbol": "OANDA:XAUUSD",
                "showIntervalTabs": false,
                "displayMode": "single",
                "locale": language,
                "colorTheme": "dark"
            });
            container.current.appendChild(script);
        }
    }, [interval, language]);

    return (
        <div className="h-[450px] flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center sticky top-0 z-20">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">{t('tech_title')}</h3>
            </div>
            
            <div className="px-2 py-2 bg-slate-800 border-b border-slate-700/50 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden -ms-overflow-style-none [scrollbar-width:none]">
                {timeframes.map((tf) => (
                    <button
                        key={tf.val}
                        onClick={() => setInterval(tf.val)}
                        className={`px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                            interval === tf.val 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {tf.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 relative bg-slate-800 p-1">
                 <div className="tradingview-widget-container h-full w-full" ref={container}>
                    <div className="tradingview-widget-container__widget"></div>
                 </div>
            </div>
        </div>
    );
};

// Cheat Sheet
const SimpleCheatSheet = () => {
    const { t } = useLanguage();

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg h-fit">
            <h3 className="text-yellow-400 font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wider">
                {t('cheat_title')}
            </h3>
            <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-[#1e293b] border border-slate-700/50">
                    <div>
                        <div className="text-slate-200 font-bold text-xs">{t('cheat_dxy')}</div>
                        <div className="text-[10px] text-slate-500">{t('cheat_dxy_desc')}</div>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 whitespace-nowrap">
                        {t('action_sell')}
                    </span>
                </div>

                <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-[#1e293b] border border-slate-700/50">
                    <div>
                        <div className="text-slate-200 font-bold text-xs">{t('cheat_war')}</div>
                        <div className="text-[10px] text-slate-500">{t('cheat_war_desc')}</div>
                    </div>
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 whitespace-nowrap">
                        {t('action_buy')}
                    </span>
                </div>

                <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-[#1e293b] border border-slate-700/50">
                    <div>
                        <div className="text-slate-200 font-bold text-xs">{t('cheat_fed')}</div>
                        <div className="text-[10px] text-slate-500">{t('cheat_fed_desc')}</div>
                    </div>
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 whitespace-nowrap">
                        {t('action_buy')}
                    </span>
                </div>
            </div>
        </div>
    );
};

// YouTube Channels
const YouTubeRecommendations = () => {
    const { t } = useLanguage();
    const channels = [
        { name: 'InterGOLD Gold Trade', id: '@InterGOLDGoldTrade', desc: 'ข่าวทองรายวัน & วิเคราะห์กราฟ', color: 'bg-yellow-700' },
        { name: 'HSHsocial ฮั่วเซ่งเฮง', id: '@HSHsocialCH', desc: 'แนวโน้มทองจากร้านทองใหญ่', color: 'bg-red-700' },
        { name: 'YLG Bullion', id: '@ylgbullion', desc: 'ทิศทางราคาทองคำ YLG', color: 'bg-amber-600' },
        { name: 'TNN Wealth', id: '@TNNWealth', desc: 'เกาะติดเศรษฐกิจโลก & การลงทุน', color: 'bg-orange-600' },
        { name: 'Money Chat Thailand', id: '@MoneyChat', desc: 'คุยเฟื่องเรื่องการเงินเชิงลึก', color: 'bg-blue-600' },
        { name: 'ทันโลกกับ Trader KP', id: '@traderkp', desc: 'ภาพใหญ่เศรษฐกิจ & ทองคำ', color: 'bg-indigo-600' },
        { name: 'Kim Property Live', id: '@KimPropertyLive', desc: 'วิเคราะห์วิกฤต & ฟองสบู่', color: 'bg-slate-600' },
    ];

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg h-fit">
            <h3 className="text-red-400 font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wider">
                {t('youtube_title')}
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {channels.map((ch, idx) => (
                    <a 
                        key={idx}
                        href={`https://www.youtube.com/${ch.id}/videos`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-xl bg-[#1e293b] border border-slate-700/50 hover:bg-slate-700 hover:border-slate-500 transition-all group"
                    >
                        <div className={`w-8 h-8 rounded-full ${ch.color} flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0`}>
                            {ch.name.substring(0, 2)}
                        </div>
                        <div>
                            <div className="text-slate-200 font-bold text-xs group-hover:text-white line-clamp-1">{ch.name}</div>
                            <div className="text-[12px] text-slate-500 group-hover:text-slate-400 line-clamp-1">{ch.desc}</div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

// News Feed
const ThaiNewsFeed = () => {
    const { t } = useLanguage();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        setLoading(true);
        try {
        const res = await fetch('/api/thai-news');
        const data = await res.json();
        if (data.news) setNews(data.news);
        } catch (error) { console.error("News Error:", error); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNews(); }, []);

  return (
    <div className="h-[500px] sm:h-[600px] lg:h-[750px] w-full border border-slate-700 bg-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col">
      <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center sticky top-0 z-20">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">{t('news_header')}</h3>
        <button onClick={fetchNews} className="text-slate-400 hover:text-white transition-colors">🔄</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#0f172a] custom-scrollbar">
        {loading ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <span className="animate-spin text-xl">⏳</span> {t('news_loading')}
           </div>
        ) : news.length > 0 ? (
           news.map((item, index) => (
             <a 
               key={index} 
               href={item.link} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex gap-3 sm:gap-4 bg-slate-800 border border-slate-700/50 p-2 sm:p-3 rounded-xl hover:bg-slate-700/50 hover:border-blue-500/30 transition-all group relative z-10"
             >
                {/* รูปภาพข่าว (แสดงถ้ามี) - Responsive */}
                <div className="w-[90px] h-[65px] sm:w-[130px] sm:h-[90px] bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 relative">
                    {item.image ? (
                        <img src={item.image} alt="news" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-800">
                             <span className="text-xl sm:text-2xl opacity-50">📰</span>
                        </div>
                    )}
                </div>

                {/* เนื้อหาข่าว */}
                <div className="flex flex-col justify-between w-full py-0.5">
                    <h4 className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-blue-400 leading-snug line-clamp-2">
                        {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                        <span className="text-[9px] sm:text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 font-mono">
                            {item.displayDateTime}
                        </span>
                    </div>
                </div>
             </a>
           ))
        ) : (
           <div className="text-center py-10 text-slate-500 text-xs">
               {t('news_no_data')}
           </div>
        )}
      </div>
    </div>
  );
};

// Ticker Tape
const TickerTapeWidget = memo(() => {
    const { language } = useLanguage();
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (container.current) {
        container.current.innerHTML = '';
        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
          "symbols": [
            { "proName": "OANDA:XAUUSD", "title": "Gold" }, 
            { "proName": "TVC:DXY", "title": "DXY" }, 
            { "proName": "TVC:US10Y", "title": "Bond 10Y" }, 
            { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" } 
          ],
          "showSymbolLogo": true,
          "colorTheme": "dark",
          "isTransparent": false,
          "displayMode": "adaptive",
          "locale": language
        });
        container.current.appendChild(script);
      }
    }, [language]);
    return <div className="tradingview-widget-container w-full h-[46px] bg-slate-900" ref={container}><div className="tradingview-widget-container__widget"></div></div>;
});
TickerTapeWidget.displayName = 'TickerTapeWidget';

// --- Main Page ---

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 font-sans">
      <Navbar />
      
      {/* Top: Ticker Tape */}
      <div className="sticky top-[56px] sm:top-[64px] z-40 border-b border-slate-800 shadow-sm">
         <TickerTapeWidget />
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-4 sm:py-8">
        
        {/* Greeting Section */}
        <MarketSessions />

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          
          {/* Left Column (News & Technical) */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6 order-1">
             <CustomTechnicalWidget />
             <YouTubeRecommendations />
             <ThaiNewsFeed />
          </div>

          {/* Right Column (Cheat Sheet or Other Content) */}
          <div className="lg:col-span-8 order-2">
             <SimpleCheatSheet />
          </div>

        </div>
      </div>
    </div>
  );
}