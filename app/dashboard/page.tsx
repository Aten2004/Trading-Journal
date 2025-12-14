'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
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
  risk_reward_ratio: string;
  holding_time: string;
  emotion: string;
  main_mistake: string;
  followed_plan: string;
  notes: string;
}

export default function Dashboard() {
  const { t } = useLanguage(); 
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) {
        fetchTrades(1, true); // โหลดหน้า 1 ใหม่เสมอเมื่อ user เปลี่ยน
    }
  }, [user]);

  const handleExportExcel = async () => {
    if (!user) return;
    setExporting(true);
    try {
        // ส่งชื่อ User ไปด้วยตอน Export (ถ้า API Export รองรับ)
        const response = await fetch(`/api/export-excel?username=${user.username}`);
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

  // ปรับแก้ฟังก์ชัน fetchTrades ให้รับ page ได้
  const fetchTrades = async (pageNum: number, isRefresh = false) => {
    if (!user) return;
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      // เรียก API แบบส่ง page และ limit
      const response = await fetch(`/api/get-trades?user=${user.username}&page=${pageNum}&limit=20`);
      const result = await response.json();

      if (result.success) {
        if (isRefresh || pageNum === 1) {
            setTrades(result.trades); // ถ้าโหลดใหม่ ให้ทับของเดิม
        } else {
            setTrades(prev => [...prev, ...result.trades]); // ถ้าโหลดเพิ่ม ให้ต่อท้าย
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // --- Statistics Calculations ---
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => parseFloat(t.pnl || '0') > 0).length;
  const losingTrades = trades.filter((t) => parseFloat(t.pnl || '0') < 0).length;
  const breakEvenTrades = trades.filter((t) => parseFloat(t.pnl || '0') === 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0';

  const handleLoadMore = () => {
      fetchTrades(page + 1);
  };

  const handleRefresh = () => {
      fetchTrades(1, true);
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
  const planFollowedCount = trades.filter(t => String(t.followed_plan).toLowerCase() === 'true').length;
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
                onClick={handleRefresh}
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

        {/* Chart Section */}
        {hourlyPriceData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
            {t('dash_chart_title')}
          </h3>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 sm:p-6 border border-slate-700">
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyPriceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hourLabel" stroke="#cbd5f5" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#38bdf8" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', fontSize: '12px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgEntry"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name={t('chart_avg_entry')}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgPnl"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name={t('chart_avg_pnl')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-2 text-center sm:text-left">
              {t('dash_chart_legend')}
            </p>
          </div>
        </div>
        )}

        {/* Performance Overview */}
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">{t('dash_perf_title')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_total_trades')}</div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{totalTrades}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-2">
                {winningTrades}{t('unit_w')} · {losingTrades}{t('unit_l')} · {breakEvenTrades}{t('unit_be')}
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
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
              <div className="text-slate-400 text-xs sm:text-sm mb-1">{t('stat_common_mistake')}</div>
              {topMistake ? (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-red-400 mb-1">{topMistake[0]}</div>
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
                  <div className="text-lg sm:text-xl font-bold text-purple-300 mb-1">{bestStrategy.name}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">
                    Win Rate: {bestStrategy.winRate}% • Avg: ${bestStrategy.avgPnl} • {bestStrategy.trades} {t('unit_trades')}
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
                            <td className="py-3 px-4 text-white">{strategy}</td>
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