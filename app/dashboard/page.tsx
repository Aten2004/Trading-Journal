'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ReferenceLine, 
  AreaChart, Area, ScatterChart, Scatter, ZAxis 
} from 'recharts';
import TradesTable from '../components/TradesTable';
import Navbar from '../components/Navbar';
import TradingInsights from '../components/TradingInsights';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Trade {
  id: string;
  open_date: string;
  close_date: string;
  open_time: string;
  close_time: string;
  symbol: string;
  direction: string;
  position_size: string;
  entry_price: string;
  exit_price: string;
  sl: string;
  tp: string;
  pnl: string;
  pnl_pct: string;
  strategy: string;
  time_frame: string;
  chart_pattern: string;
  risk_reward_ratio: string;
  holding_time: string;
  emotion: string;
  main_mistake: string;
  followed_plan: string;
  notes: string;
}

export default function Dashboard() {
  const { t, language } = useLanguage()
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('time_frame');

  useEffect(() => {
    if (user) {
        fetchTrades(1, true); 
    }
  }, [user]);

  const handleExportExcel = async () => {
    if (!user) return;
    setExporting(true);
    try {
        const response = await fetch(`/api/export-excel?username=${user.username}&lang=${language}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Trading_Journal_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            alert('Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Error downloading excel');
    } finally {
        setExporting(false);
    }
  };

  const groupStats = (field: keyof Trade) => {
    const stats: { [key: string]: { trades: number; pnl: number; wins: number } } = {};
    trades.forEach(t => {
        const key = String(t[field] || 'Unspecified');
        if (!stats[key]) stats[key] = { trades: 0, pnl: 0, wins: 0 };
        stats[key].trades += 1;
        stats[key].pnl += parseFloat(t.pnl || '0');
        if (parseFloat(t.pnl || '0') > 0) stats[key].wins += 1;
    });
    return stats;
  };

  const tfData = Object.entries(groupStats('time_frame')) 
    .map(([tf, stats]) => ({
      name: (tf === 'Unspecified' || tf === '') ? 'None' : tf,
      pnl: stats.pnl,
      trades: stats.trades,
      wins: stats.wins, 
      losses: stats.trades - stats.wins, 
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
    }))
    .sort((a, b) => {
      const order = ['None', 'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
      const getIndex = (name: string) => {
        const idx = order.indexOf(name);
        return idx === -1 ? 999 : idx;
      };
      return getIndex(a.name) - getIndex(b.name);
  });

  const fetchTrades = async (pageNum: number, isRefresh = false) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true); 
      } else if (pageNum === 1) {
        setLoading(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/get-trades?user=${user.username}&page=${pageNum}&limit=3000`);
      const result = await response.json();

      if (result.success) {
        if (isRefresh) {
          setTrades(result.trades);
        } else {
          setTrades(prev => pageNum === 1 ? result.trades : [...prev, ...result.trades]);
        }
        setHasMore(result.hasMore);
        setPage(pageNum); 
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false); 
    }
  };

  const getStratTrans = (key: string) => {
    const map: {[key: string]: string} = {
        'Trend Following': t('opt_strat_trend'),
        'Grid': t('opt_strat_grid'),
        'Scalping': t('opt_strat_scalp'),
        'Breakout': t('opt_strat_break'),
        'Range Trading': t('opt_strat_range'),
        'Reversal': t('opt_strat_reversal'),
        'High Conviction': t('opt_strat_conviction'),
        'Smart Money': t('opt_strat_smart'),
    };
    return map[key] || key;
  };
  
  const getMistakeTrans = (key: string) => {
    const map: {[key: string]: string} = {
        'No Mistake': t('opt_mis_no_mistake'),
        'No SL': t('opt_mis_no_sl'),
        'Oversize': t('opt_mis_oversize'),
        'Overtrade': t('opt_mis_overtrade'),
        'FOMO': t('opt_mis_fomo'),
        'Revenge': t('opt_mis_revenge'),
        'No Plan': t('opt_mis_no_plan'),
    };
    return map[key] || key;
  };

  // คำนวณข้อมูลกราฟ Chart Pattern 
  const patternData = Object.entries(groupStats('chart_pattern'))
    .map(([key, stats]) => {
       const map: {[key: string]: string} = {
          'Unclear': t('opt_pat_unclear'),
          'Uptrend': t('opt_pat_uptrend'),
          'Downtrend': t('opt_pat_downtrend'),
          'Bottom Zone': t('opt_pat_bottom'),
          'Top Zone': t('opt_pat_top'),
          'Sideways': t('opt_pat_sideways'),
          'Unspecified': t('opt_unspecified') || 'ไม่ระบุ',
       };
       const label = map[key] || key;

       return {
         name: label,
         pnl: stats.pnl,
         trades: stats.trades,
         wins: stats.wins,
         losses: stats.trades - stats.wins,
         winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
       };
    })
    .sort((a, b) => b.pnl - a.pnl);

    const directionData = Object.entries(groupStats('direction'))
    .map(([dir, stats]) => ({
      name: dir === 'Buy' ? (t('val_buy') || 'Buy') : (dir === 'Sell' ? (t('val_sell') || 'Sell') : dir),
      pnl: stats.pnl,
      trades: stats.trades,
      wins: stats.wins,
      losses: stats.trades - stats.wins,
      winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
    }))
    .sort((a, b) => b.trades - a.trades);

  const getPointMultiplier = (symbol: string, price: number) => {
    const sym = (symbol || '').toUpperCase();
    if (sym.includes('JPY')) return 1000; // คู่เงิน JPY (ทศนิยม 3 ตำแหน่ง)
    if (sym.includes('BTC') || sym.includes('ETH')) return 1; // Crypto (นับตามราคาดิบ)
    if (sym.includes('XAU') || price > 500) return 100; // ทองคำ/Indices (ทศนิยม 2 ตำแหน่ง)
    return 100000; // Forex ทั่วไป (ทศนิยม 5 ตำแหน่ง)
  };

  // คำนวณข้อมูลกราฟ Distance แยกตาม Strategy
  const distanceData = (() => {
    const stats: { [key: string]: { slDist: number; tpDist: number; count: number } } = {};
    
    trades.forEach(t => {
       const strat = t.strategy || 'Unspecified';
       const entry = parseFloat(t.entry_price || '0');
       const sl = parseFloat(t.sl || '0');
       const tp = parseFloat(t.tp || '0');
       const sym = t.symbol || '';

       // ต้องมีค่าครบถึงจะคำนวณ
       if (entry > 0 && sl > 0 && tp > 0) {
          const multiplier = getPointMultiplier(sym, entry);
          const slDist = Math.abs(entry - sl) * multiplier;
          const tpDist = Math.abs(entry - tp) * multiplier;

          if (!stats[strat]) stats[strat] = { slDist: 0, tpDist: 0, count: 0 };
          stats[strat].slDist += slDist;
          stats[strat].tpDist += tpDist;
          stats[strat].count += 1;
       }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
         name: getStratTrans(name),
         avgSL: Math.round(data.slDist / data.count),
         avgTP: Math.round(data.tpDist / data.count),
         count: data.count
      }))
      .sort((a, b) => b.count - a.count) // เรียงตามความนิยม
      .slice(0, 5); // เอาแค่ 5 อันดับแรก กราฟจะได้ไม่แน่น
  })();

  // Premium Equity Curve
  const equityData = (() => {
    const sortedTrades = [...trades].sort((a, b) => {
       const tA = new Date(`${a.open_date}T${a.open_time || '00:00'}`).getTime();
       const tB = new Date(`${b.open_date}T${b.open_time || '00:00'}`).getTime();
       return tA - tB;
    });

    let runningTotal = 0;
    return sortedTrades.map((t, index) => {
       runningTotal += parseFloat(t.pnl || '0');
       return {
          trade: index + 1,
          pnl: runningTotal,
          date: t.open_date,
       };
    });
  })();

  // Gradient Offset
  const gradientOffset = () => {
    if (equityData.length === 0) return 0;
    const dataMax = Math.max(...equityData.map((i) => i.pnl));
    const dataMin = Math.min(...equityData.map((i) => i.pnl));
  
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
  
    return dataMax / (dataMax - dataMin);
  };
  
  const off = gradientOffset();

  // --- Statistics Calculations ---
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => parseFloat(t.pnl || '0') > 0).length;
  const losingTrades = trades.filter((t) => parseFloat(t.pnl || '0') < 0).length;
  const breakEvenTrades = trades.filter((t) => parseFloat(t.pnl || '0') === 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0';

  const handleLoadMore = () => {
      fetchTrades(page + 1);
  };

  const handleRefresh = (targetPage?: number) => {
    const pageToLoad = targetPage ?? page;
    fetchTrades(pageToLoad, true);
  };
  
  // Time Analysis for Chart
  const hourlyPriceData = trades
  .filter(t => t.open_time && t.entry_price)
  .reduce((acc: any[], t) => {
    const hour = parseInt(t.open_time.split(':')[0]);
    const entry = parseFloat(t.entry_price || '0');
    const pnl = parseFloat(t.pnl || '0');
    if (isNaN(hour) || isNaN(entry)) return acc;

    const found = acc.find((d: any) => d.hour === hour);
    if (!found) {
      acc.push({ hour, trades: 1, sumEntry: entry, sumPnl: pnl });
    } else {
      found.trades += 1;
      found.sumEntry += entry;
      found.sumPnl += pnl;
    }
    return acc;
  }, [])
  .map((d: any) => ({
    hourLabel: `${d.hour.toString().padStart(2, '0')}:00`,
    avgEntry: d.sumEntry / d.trades,
    avgPnl: d.sumPnl / d.trades,
  }))
  .sort((a: any, b: any) => a.hourLabel.localeCompare(b.hourLabel));

  // Financial Stats
  const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
  const totalPnLFormatted = totalPnL.toFixed(2);

  const avgWin = winningTrades > 0 
    ? (trades.filter(t => parseFloat(t.pnl || '0') > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0) / winningTrades).toFixed(2)
    : '0';
  const avgLoss = losingTrades > 0
    ? (trades.filter(t => parseFloat(t.pnl || '0') < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0) / losingTrades).toFixed(2)
    : '0';

  const totalWins = trades.filter(t => parseFloat(t.pnl || '0') > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0);
  const totalLosses = Math.abs(trades.filter(t => parseFloat(t.pnl || '0') < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0';

  const avgRR = trades.length > 0
    ? (trades.reduce((sum, t) => sum + parseFloat(t.risk_reward_ratio || '0'), 0) / trades.length).toFixed(2)
    : '0';

  const maxDrawdown = trades.length > 0
    ? Math.min(...trades.map(t => parseFloat(t.pnl_pct || '0'))).toFixed(2)
    : '0';

  // Plan & Psychology
  const planFollowedCount = trades.filter(t => 
    ['true', 'yes'].includes(String(t.followed_plan).toLowerCase())
  ).length;
  const planAdherence = totalTrades > 0 ? ((planFollowedCount / totalTrades) * 100).toFixed(1) : '0';

  const mistakeCount: { [key: string]: number } = {};
  trades.forEach(t => {
    if (t.main_mistake && t.main_mistake !== 'No Mistake') {
      mistakeCount[t.main_mistake] = (mistakeCount[t.main_mistake] || 0) + 1;
    }
  });
  const topMistake = Object.keys(mistakeCount).length > 0
    ? Object.entries(mistakeCount).sort((a, b) => b[1] - a[1])[0]
    : null;

  // Best Strategy Logic
  const getBestStrategy = () => {
    const strategies = trades.reduce((acc: any, trade) => {
      const strategy = trade.strategy || 'Unknown';
      const pnl = parseFloat(trade.pnl) || 0;
      
      if (!acc[strategy]) {
        acc[strategy] = { trades: 0, pnl: 0, wins: 0, losses: 0 };
      }
      
      acc[strategy].trades += 1;
      acc[strategy].pnl += pnl;
      
      if (pnl > 0) acc[strategy].wins += 1;
      else if (pnl < 0) acc[strategy].losses += 1;
      
      return acc;
    }, {});

    let best = { strategy: 'N/A', winRate: 0, avgPnl: 0, trades: 0 };
    
    Object.entries(strategies).forEach(([strategy, stats]: [string, any]) => {
      const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
      const avgPnl = stats.trades > 0 ? stats.pnl / stats.trades : 0;
      
      if (stats.trades >= 3 && avgPnl > best.avgPnl && winRate >= 50) {
        best = { strategy, winRate, avgPnl, trades: stats.trades };
      }
    });

    if (best.strategy !== 'N/A') {
      return {
        name: best.strategy,
        winRate: best.winRate.toFixed(0),
        avgPnl: best.avgPnl.toFixed(2),
        trades: best.trades
      };
    }
    return null;
  };

  const bestStrategy = getBestStrategy();

  const strategyStats: { [key: string]: { trades: number; pnl: number; wins: number } } = {};
  trades.forEach(t => {
    if (t.strategy) {
      if (!strategyStats[t.strategy]) {
        strategyStats[t.strategy] = { trades: 0, pnl: 0, wins: 0 };
      }
      strategyStats[t.strategy].trades += 1;
      strategyStats[t.strategy].pnl += parseFloat(t.pnl || '0');
      if (parseFloat(t.pnl || '0') > 0) {
        strategyStats[t.strategy].wins += 1;
      }
    }
  });

  const emotionalTrades = trades.filter(t => t.emotion && parseInt(t.emotion) >= 7);
  const highEmotionLosses = emotionalTrades.filter(t => parseFloat(t.pnl || '0') < 0).length;
  const emotionImpact = emotionalTrades.length > 0
    ? ((highEmotionLosses / emotionalTrades.length) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">{t('msg_loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="max-w-[98%] mx-auto p-3 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t('dash_title')}</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {t('dash_subtitle')}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* ปุ่ม Export Excel */}
            <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm sm:text-base font-medium
                        bg-green-600 hover:bg-green-700 disabled:bg-slate-700
                        text-white shadow-lg transition-colors flex items-center justify-center gap-2"
            >
                {exporting ? t('btn_exporting') : t('btn_export')}
            </button>

            {/* ปุ่ม Refresh */}
            <button
                onClick={() => handleRefresh()}  
                disabled={refreshing}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm sm:text-base font-medium
                        bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800
                        text-white border border-slate-500 transition-colors"
            >
                {refreshing ? t('btn_refreshing') : t('btn_refresh')}
            </button>
          </div>
        </div>

        {/* Trades Table */}
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('dash_table_title')}</h3>
          <TradesTable trades={trades} onRefresh={handleRefresh} />

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-sm font-medium transition-colors border border-slate-600 flex items-center gap-2"
              >
                {loadingMore ? (
                    <>⏳</>
                ) : (
                    <>⬇️</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Performance Overview */}
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('dash_perf_title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_total_trades')}</div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{totalTrades}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {winningTrades} {t('unit_w')} · {losingTrades} {t('unit_l')} · {breakEvenTrades} {t('unit_be')}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_win_rate')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(winRate) >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                {winRate}%
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {t('stat_target_winrate')}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_total_pnl')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLFormatted} USD
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {t('stat_avg_win')}: +{avgWin} USD · {t('stat_avg_loss')}: {avgLoss} USD
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_profit_factor')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(profitFactor) >= 1.5 ? 'text-green-400' : parseFloat(profitFactor) >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                {profitFactor}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {t('stat_target_pf')}
              </div>
            </div>
          </div>
        </div>

        {/*Premium Equity Curve*/}
        {equityData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-emerald-400">🚀</span> {t('chart_equity_title')} 
            <span className="text-xs text-slate-500 font-normal mt-1">{t('chart_equity_sub')}</span>
          </h3>
          
          <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/50 via-blue-500/50 to-purple-500/50 opacity-70"></div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={off} stopColor="#10b981" stopOpacity={0.4} /> {/* เขียว Emerald */}
                      <stop offset={off} stopColor="#f43f5e" stopOpacity={0.4} /> {/* แดง Rose */}
                    </linearGradient>
                    <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                      <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                  
                  <XAxis 
                    dataKey="trade" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `${v}`} 
                    dy={10}
                  />
                  
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} 
                  />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [
                      <span key="val" className={value >= 0 ? "text-emerald-400 font-bold font-mono text-base" : "text-red-400 font-bold font-mono text-base"}>
                        {value > 0 ? '+' : ''}{value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                      </span>, 
                      <span key="name" className="text-slate-400 text-xs uppercase tracking-wider">{t('chart_equity_pnl')}</span>
                    ]}
                    labelFormatter={(label) => (
                      <span className="text-slate-500 text-xs font-semibold mb-2 block border-b border-slate-700 pb-1">
                        {t('chart_trade_label')} {label}
                      </span>
                    )}
                  />
                  
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} strokeWidth={1} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="url(#splitStroke)" 
                    strokeWidth={3} 
                    fill="url(#splitColor)" 
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: equityData[equityData.length-1]?.pnl >= 0 ? '#10b981' : '#f43f5e' }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        )}

        {/* --- ส่วนที่ 2: เมนูเลือกกราฟ (Tab Navigation) --- */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 w-max mx-auto sm:mx-0">
                {[
                    { id: 'time_frame', label: t('dash_tf_title') },
                    { id: 'direction', label: t('box_label_direction') || 'Direction' },
                    { id: 'distance', label: t('chart_dist_title') },
                    { id: 'pattern', label: t('box_chart_pattern') || 'Patterns' },
                    { id: 'hours', label: t('dash_chart_title') },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-8 min-h-[350px]">
          {/* Tab 1: Time Frame Analysis */}
           {activeTab === 'time_frame' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Net P&L */}
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-slate-200 text-sm font-medium">{t('chart_pnl_title')}</h4>
                        <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">{t('chart_tf_label')}</span>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tfData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} dy={10} interval={0} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                                <Tooltip isAnimationActive={false} cursor={{ fill: '#334155', opacity: 0.3 }} 
                                  content={({ active, payload, label }) => {
                                     if (active && payload && payload.length) {
                                       const data = payload[0].payload;
                                       return (
                                         <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                                           <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                                           <div className="flex justify-between items-center gap-4 mb-2">
                                             <span className="text-slate-400 text-xs">{t('stat_total_pnl')}</span>
                                             <span className={`text-sm font-bold font-mono ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                               {data.pnl > 0 ? '+' : ''}{data.pnl.toFixed(2)}
                                             </span>
                                           </div>
                                            <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span className="text-emerald-100">{data.wins} {t('unit_w')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                    <span className="text-red-100">{data.losses} {t('unit_l')}</span>
                                                </div>
                                            </div>
                                         </div>
                                       );
                                     } return null; }} 
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px', opacity: 0.8 }} />
                                <ReferenceLine y={0} stroke="#64748b" />
                                <Bar dataKey="pnl" name={t('stat_total_pnl')} fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {tfData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#34d399' : '#f87171'} />
                                    ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                    </div>
                </div>
                {/* Win Rate */}
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-slate-200 text-sm font-medium">{t('chart_winrate_title')}</h4>
                        <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">{t('chart_acc_label')}</span>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tfData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} dy={10} interval={0} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip cursor={{ fill: '#334155', opacity: 0.3 }} 
                                  content={({ active, payload, label }) => {
                                     if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                                              <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                                              <div className="flex justify-between items-center gap-4 mb-2">
                                                <span className="text-slate-400 text-xs">{t('stat_win_rate')}</span>
                                                <span className="text-sm font-bold font-mono text-sky-400">{data.winRate.toFixed(1)}%</span>
                                              </div>
                                               <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                        <span className="text-emerald-100">{data.wins} {t('unit_w')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                        <span className="text-red-100">{data.losses} {t('unit_l')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                     } return null; }} 
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px', opacity: 0.8 }} />

                                <ReferenceLine y={50} stroke="#ffffffff" strokeDasharray="4 4" opacity={0.5} />

                                <Bar dataKey="winRate" name={t('stat_win_rate')} fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
           )}

          {/* Tab 2: Direction Analysis */}
           {activeTab === 'direction' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="text-slate-200 text-sm font-medium">{t('chart_pnl_title')}</h4>
                     <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">USD</span>
                   </div>
                   <div className="h-[250px] md:h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={directionData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                         <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                         <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                         <Tooltip isAnimationActive={false} cursor={{ fill: '#334155', opacity: 0.3 }} 
                           content={({ active, payload, label }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload;
                               return (
                                 <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                                   <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                                   <div className="flex justify-between items-center gap-4 mb-2">
                                     <span className="text-slate-400 text-xs">{t('stat_total_pnl')}</span>
                                     <span className={`text-sm font-bold font-mono ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                       {data.pnl > 0 ? '+' : ''}{data.pnl.toFixed(2)}
                                     </span>
                                   </div>
                                   <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-emerald-100">{data.wins} {t('unit_w')}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        <span className="text-red-100">{data.losses} {t('unit_l')}</span>
                                      </div>
                                   </div>
                                 </div>
                               );
                             }
                             return null;
                           }}
                         />
                         <ReferenceLine y={0} stroke="#64748b" />
                         <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={60}>
                            {directionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#34d399' : '#f87171'} />
                            ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="text-slate-200 text-sm font-medium">{t('chart_winrate_title')}</h4>
                     <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">{t('chart_acc_label')}</span>
                   </div>
                   <div className="h-[250px] md:h-[300px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={directionData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                         <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                         <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                         <Tooltip isAnimationActive={false} cursor={{ fill: '#334155', opacity: 0.3 }} 
                           content={({ active, payload, label }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload;
                               return (
                                 <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                                   <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                                   <div className="flex justify-between items-center gap-4 mb-2">
                                     <span className="text-slate-400 text-xs">{t('stat_win_rate')}</span>
                                     <span className="text-sm font-bold font-mono text-sky-400">
                                       {data.winRate.toFixed(1)}%
                                     </span>
                                   </div>
                                   <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-emerald-100">{data.wins} {t('unit_w')}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        <span className="text-red-100">{data.losses} {t('unit_l')}</span>
                                      </div>
                                   </div>
                                 </div>
                               );
                             }
                             return null;
                           }}
                         />
                         <ReferenceLine y={50} stroke="#ffffffff" strokeDasharray="4 4" opacity={0.5} />
                         <Bar dataKey="winRate" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>
             </div>
           )}

           {/* Tab 3: Distance Analysis */}
           {activeTab === 'distance' && distanceData.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-slate-200 text-sm font-medium">{t('chart_dist_title_subtitle')}</h4>
                 <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">{t('chart_dist_subtitle')}</span>
               </div>

               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={distanceData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                     <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                     <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                     
                     <Tooltip 
                       isAnimationActive={false}
                       cursor={{ fill: '#334155', opacity: 0.3 }}
                       content={({ active, payload, label }) => {
                         if (active && payload && payload.length) {
                           const data = payload[0].payload;
                           return (
                             <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                               <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                               <div className="space-y-1">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-red-400 text-xs">{t('chart_dist_sl')}:</span>
                                    <span className="text-red-200 text-xs font-mono">{data.avgSL.toLocaleString()} {t('unit_pts')}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-emerald-400 text-xs">{t('chart_dist_tp')}:</span>
                                    <span className="text-emerald-200 text-xs font-mono">{data.avgTP.toLocaleString()} {t('unit_pts')}</span>
                                  </div>
                                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex justify-between gap-4">
                                    <span className="text-slate-500 text-xs">{t('th_trades_count')}:</span>
                                    <span className="text-slate-400 text-xs">{data.count}</span>
                                  </div>
                               </div>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px', opacity: 0.8 }} />
                     
                     <Bar dataKey="avgSL" name={t('chart_dist_sl')} fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Bar dataKey="avgTP" name={t('chart_dist_tp')} fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
           )}

           {/* Tab 4: Chart Patterns */}
           {activeTab === 'pattern' && patternData.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Net P&L แยกตาม Pattern */}
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-slate-200 text-sm font-medium">{t('chart_pnl_title')}</h4>
                        <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">USD</span>
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={patternData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.3} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`} />
                                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={11} width={80} tickLine={false} />
                                <Tooltip isAnimationActive={false} cursor={{ fill: '#334155', opacity: 0.3 }} 
                                  content={({ active, payload, label }) => {
                                     if (active && payload && payload.length) {
                                       const data = payload[0].payload;
                                       return (
                                         <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                                           <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                                           <div className="flex justify-between items-center gap-4 mb-2">
                                             <span className="text-slate-400 text-xs">{t('stat_total_pnl')}</span>
                                             <span className={`text-sm font-bold font-mono ${data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                               {data.pnl > 0 ? '+' : ''}{data.pnl.toFixed(2)}
                                             </span>
                                           </div>
                                            <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span className="text-emerald-100">{data.wins} {t('unit_w')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                    <span className="text-red-100">{data.losses} {t('unit_l')}</span>
                                                </div>
                                            </div>
                                         </div>
                                       );
                                     } return null; }} 
                                />
                                <ReferenceLine x={0} stroke="#64748b" />
                                <Bar dataKey="pnl" name={t('stat_total_pnl')} radius={[0, 4, 4, 0]} barSize={20}>
                                    {patternData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#34d399' : '#f87171'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Win Rate แยกตาม Pattern */}
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-slate-200 text-sm font-medium">{t('chart_winrate_title')}</h4>
                        <span className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded">{t('chart_acc_label')}</span>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={patternData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.3} />
                                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                                <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={11} width={80} tickLine={false} />
                                <Tooltip cursor={{ fill: '#334155', opacity: 0.3 }} 
                                  content={({ active, payload, label }) => {
                                     if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] z-50">
                                              <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1">{label}</p>
                                              <div className="flex justify-between items-center gap-4 mb-2">
                                                <span className="text-slate-400 text-xs">{t('stat_win_rate')}</span>
                                                <span className="text-sm font-bold font-mono text-sky-400">{data.winRate.toFixed(1)}%</span>
                                              </div>
                                               <div className="flex items-center gap-2 text-xs bg-slate-800/50 p-2 rounded-lg justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                        <span className="text-emerald-100">{data.wins} {t('unit_w')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                        <span className="text-red-100">{data.losses} {t('unit_l')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                     } return null; }} 
                                />
                                <ReferenceLine x={50} stroke="#ffffffff" strokeDasharray="4 4" opacity={0.5}/>
                                <Bar dataKey="winRate" name={t('stat_win_rate')} fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>
           )}

           {/* Tab 5: Trading Hours */}
           {activeTab === 'hours' && hourlyPriceData.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-slate-700/50 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-slate-200 text-sm font-medium">{t('box_dash_chart_title')}</h4>
               </div>
               <div className="h-[300px] md:h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={hourlyPriceData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                     <XAxis dataKey="hourLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={15} />
                     <YAxis yAxisId="left" stroke="#38bdf8" fontSize={11} tickLine={false} axisLine={false} 
                        tickFormatter={(value) => {
                          if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
                          return value.toFixed(0);
                        }}
                        domain={['auto', 'auto']}
                        width={50}
                     />
                     <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={(value) => {
                          if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
                          return value.toFixed(0);
                        }}
                        width={50}
                     />
                     <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[160px] z-50">
                                <p className="text-slate-300 text-xs font-semibold mb-2 border-b border-slate-700/50 pb-1 flex justify-between">
                                    <span>{t('label_open_time')}</span>
                                    <span className="text-white">{label}</span>
                                </p>
                                
                                <div className="flex justify-between items-center gap-4 mb-1">
                                  <span className="text-sky-400 text-xs">{t('chart_avg_entry')}</span>
                                  <span className="text-sm font-bold font-mono text-slate-200">
                                    {payload[0]?.value ? Number(payload[0].value).toLocaleString() : '-'}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center gap-4">
                                  <span className="text-orange-400 text-xs">{t('chart_avg_pnl')}</span>
                                  <span className={`text-sm font-bold font-mono ${Number(payload[1]?.value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {Number(payload[1]?.value) > 0 ? '+' : ''}{Number(payload[1]?.value).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                     />
                     <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px', opacity: 0.8 }} />
                     <ReferenceLine y={0} yAxisId="right" stroke="#64748b" strokeDasharray="3 3" opacity={0.5} />
                     <Line yAxisId="left" type="monotone" dataKey="avgEntry" stroke="#38bdf8" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#38bdf8' }} name={t('chart_avg_entry')} />
                     <Line yAxisId="right" type="monotone" dataKey="avgPnl" stroke="#f97316" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} name={t('chart_avg_pnl')} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>
           )}

        </div>

        {/* Risk Management */}
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('dash_risk_title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_avg_rr')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(avgRR) >= 2 ? 'text-green-400' : parseFloat(avgRR) >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                {avgRR}:1
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {t('stat_target_rr')}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_max_dd')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(maxDrawdown) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {maxDrawdown}%
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {t('stat_target_dd')}
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_plan_adherence')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(planAdherence) >= 80 ? 'text-green-400' : parseFloat(planAdherence) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {planAdherence}%
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {planFollowedCount}/{totalTrades} {t('stat_plan_note')}
              </div>
            </div>
          </div>
        </div>

        {/* Psychology & Behavior */}
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('dash_psycho_title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Common Mistake Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_common_mistake')}</div>
              {topMistake ? (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-red-400 mb-1">
                    {getMistakeTrans(topMistake[0])}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">{topMistake[1]} {t('unit_times')}</div>
                </>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-green-400">{t('stat_no_mistake')}</div>
              )}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_emotion_impact')}</div>
              <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(emotionImpact) < 40 ? 'text-green-400' : parseFloat(emotionImpact) < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {emotionImpact}%
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {t('stat_emotion_note')}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-purple-500/20 sm:col-span-2 md:col-span-1">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_best_strategy')}</div>
              {bestStrategy ? (
                <>
                  <div className="text-lg sm:text-xl font-bold text-purple-300 mb-1">
                    {getStratTrans(bestStrategy.name)}
                  </div>
                  
                  <div className="text-[10px] sm:text-xs text-slate-400">
                    {t('stat_win_rate')}: {bestStrategy.winRate}% • {t('th_avg_pnl')}: ${bestStrategy.avgPnl} • {bestStrategy.trades} {t('unit_trades')}
                  </div>
                  
                </>
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-slate-400 mb-1">N/A</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">{t('stat_best_strat_note')}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Strategy Breakdown Table */}
        {Object.keys(strategyStats).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('dash_strat_title')}</h3>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold text-xs sm:text-sm">{t('th_strategy_name')}</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold text-xs sm:text-sm">{t('th_trades_count')}</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold text-xs sm:text-sm">{t('th_winrate')}</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold text-xs sm:text-sm">{t('th_total_pnl')}</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold text-xs sm:text-sm">{t('th_avg_pnl')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(strategyStats)
                      .sort((a, b) => {
                        const avgA = a[1].pnl / a[1].trades;
                        const avgB = b[1].pnl / b[1].trades;
                        return avgB - avgA;
                      })
                      .map(([strategy, stats]) => {
                        const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
                        const avgPnl = stats.pnl / stats.trades;
                        return (
                          <tr key={strategy} className="border-b border-slate-700/50 text-xs sm:text-sm">
                            <td className="py-3 px-4 text-white">{getStratTrans(strategy)}</td>
                            <td className="py-3 px-4 text-slate-300">{stats.trades}</td>
                            <td className={`py-3 px-4 font-semibold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                              {winRate.toFixed(1)}%
                            </td>
                            <td className={`py-3 px-4 font-semibold ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)} USD
                            </td>
                            <td className={`py-3 px-4 font-semibold ${avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {avgPnl >= 0 ? '+' : ''}{avgPnl.toFixed(2)} USD
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <TradingInsights trades={trades} />

      </div>
    </div>
  );
}