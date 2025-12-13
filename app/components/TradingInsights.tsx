'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Trade {
  id: string;
  open_date: string;
  open_time: string;
  pnl: string;
  pnl_pct: string;
  risk_reward_ratio: string;
  holding_time: string;
  emotion: string;
  main_mistake: string;
  followed_plan: string;
  entry_price: string;
  exit_price: string;
  direction: string;
  symbol: string;
  position_size: string;
  strategy: string;
}

interface TradingInsightsProps {
  trades: Trade[];
}

export default function TradingInsights({ trades }: TradingInsightsProps) {
  const { t } = useLanguage();
  if (!trades || trades.length === 0) return null;

  // --- Helpers ---
  const parseDurationToMinutes = (durationStr: string): number => {
    if (!durationStr) return 0;
    let minutes = 0;
    const parts = durationStr.split(' ');
    parts.forEach(p => {
      if (p.includes('d')) minutes += parseInt(p) * 1440;
      if (p.includes('h')) minutes += parseInt(p) * 60;
      if (p.includes('m')) minutes += parseInt(p);
    });
    return minutes;
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to calculate Standard Deviation
  const calculateStdDev = (values: number[]) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  };

  // --- Safe Date Sorting (Newest First) ---
  const sortedTrades = [...trades].sort((a, b) => {
    // กรณีไม่มีวันที่ ให้ไปอยู่ท้ายสุด
    if (!a.open_date) return 1;
    if (!b.open_date) return -1;

    // เติมเวลา 00:00 หากไม่มีเวลา เพื่อให้ Date Object ทำงานได้
    const timeA = a.open_time ? a.open_time : '00:00';
    const timeB = b.open_time ? b.open_time : '00:00';

    const dateA = new Date(`${a.open_date}T${timeA}`);
    const dateB = new Date(`${b.open_date}T${timeB}`);

    // ป้องกัน Invalid Date
    const timeValA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
    const timeValB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();

    return timeValB - timeValA; // Descending (มากไปน้อย = ใหม่ไปเก่า)
  });

  const oldestToNewestTrades = [...sortedTrades].reverse();

  // --- Basic Stats ---
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => parseFloat(t.pnl || '0') > 0);
  const losingTrades = trades.filter((t) => parseFloat(t.pnl || '0') < 0);
  const breakEvenTrades = trades.filter((t) => parseFloat(t.pnl || '0') === 0);
  
  const winCount = winningTrades.length;
  const lossCount = losingTrades.length;
  const winRateRatio = totalTrades > 0 ? (winCount / totalTrades) : 0;
  
  const avgWin = winCount > 0 ? winningTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / winCount : 0;
  const avgLoss = lossCount > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + parseFloat(t.pnl), 0) / lossCount) : 0;
  const avgPnl = trades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0) / totalTrades;

  const expectancy = (winRateRatio * avgWin) - ((1 - winRateRatio) * avgLoss);
  
  // SQN Calculation (System Quality Number)
  const pnlValues = trades.map(t => parseFloat(t.pnl || '0'));
  const stdDevPnl = calculateStdDev(pnlValues);
  const sqn = stdDevPnl > 0 ? (avgPnl / stdDevPnl) * Math.sqrt(totalTrades) : 0;

  // --- Advanced Logic for 20+ Items ---

  // 1. Revenge Trading: Size increases after loss
  let isRevenge = false;
  // ตรวจสอบแค่ 5 ไม้ล่าสุด (ซึ่งตอนนี้มั่นใจได้แล้วว่า sortedTrades[0] คือล่าสุดจริง)
  for (let i = 0; i < Math.min(sortedTrades.length - 1, 5); i++) {
    const current = sortedTrades[i];
    const prev = sortedTrades[i+1];
    if (parseFloat(prev.pnl) < 0 && parseFloat(current.position_size) > parseFloat(prev.position_size) * 1.2) {
      isRevenge = true;
      break;
    }
  }

  // 2. Direction Bias
  const buyTrades = trades.filter(t => t.direction === 'Buy');
  const sellTrades = trades.filter(t => t.direction === 'Sell');
  const buyWinRate = buyTrades.length > 0 ? (buyTrades.filter(t => parseFloat(t.pnl) > 0).length / buyTrades.length) * 100 : 0;
  const sellWinRate = sellTrades.length > 0 ? (sellTrades.filter(t => parseFloat(t.pnl) > 0).length / sellTrades.length) * 100 : 0;
  let biasDirection = '';
  let biasWinRate = 0;
  if (totalTrades > 10) {
    if (buyWinRate < 30 && sellWinRate > 50) { biasDirection = 'Buy'; biasWinRate = buyWinRate; }
    if (sellWinRate < 30 && buyWinRate > 50) { biasDirection = 'Sell'; biasWinRate = sellWinRate; }
  }

  // 3. Strategy Hopping
  const recentStrategies = new Set(sortedTrades.slice(0, 10).map(t => t.strategy)).size;
  const isStrategyHopping = recentStrategies >= 3;

  // 4. Tilt Detection (Frequency & Losses)
  let isTilting = false;
  if (sortedTrades.length >= 4) {
    const recent = sortedTrades.slice(0, 4);
    // เช็คว่า 4 ไม้ล่าสุดแดงเถือกไหม
    const allLosses = recent.every(t => parseFloat(t.pnl) < 0);
    if (allLosses) isTilting = true; 
  }

  // 5. Monday Blues
  const dayStats: { [key: string]: number } = {};
  trades.forEach(t => {
    const day = getDayName(t.open_date);
    if (day) {
        dayStats[day] = (dayStats[day] || 0) + parseFloat(t.pnl || '0');
    }
  });
  const isMondayBad = (dayStats['Monday'] || 0) < -100; // Threshold

  // 6. Streak Logic (Fixed)
  let currentLosingStreak = 0;
  let currentWinningStreak = 0;
  
  if (sortedTrades.length > 0) {
    // ตรวจสอบไม้ล่าสุด (sortedTrades[0])
    if (parseFloat(sortedTrades[0].pnl) < 0) {
      // ถ้าล่าสุดแพ้ นับย้อนหลังไปเรื่อยๆ จนกว่าจะเจอชนะ
      for (const t of sortedTrades) { 
        if (parseFloat(t.pnl) < 0) currentLosingStreak++; 
        else break; 
      }
    } else if (parseFloat(sortedTrades[0].pnl) > 0) {
      // ถ้าล่าสุดชนะ
      for (const t of sortedTrades) { 
        if (parseFloat(t.pnl) > 0) currentWinningStreak++; 
        else break; 
      }
    }
  }

  // 7. No SL Hazard
  const hasNoSL = trades.some(t => t.main_mistake === 'No SL' || (parseFloat(t.pnl) < -avgLoss * 2 && (!t.sl || t.sl === '')));

  // 8. Breakeven Abuse
  const beRate = totalTrades > 0 ? (breakEvenTrades.length / totalTrades) * 100 : 0;
  const isBeAbuse = beRate > 30;

  // 9. Overconfidence (Loss after big win)
  let isOverconfident = false;
  for (let i = 0; i < Math.min(sortedTrades.length - 1, 5); i++) {
    if (parseFloat(sortedTrades[i+1].pnl) > avgWin * 2 && parseFloat(sortedTrades[i].pnl) < 0) {
      isOverconfident = true;
      break;
    }
  }

  // Metrics for Optimizations
  const realRR = avgLoss > 0 ? avgWin / avgLoss : 0;
  const avgHoldWin = winningTrades.reduce((sum, t) => sum + parseDurationToMinutes(t.holding_time), 0) / (winCount || 1);
  const avgHoldLoss = losingTrades.reduce((sum, t) => sum + parseDurationToMinutes(t.holding_time), 0) / (lossCount || 1);
  const trendRiderRatio = avgHoldWin > 0 && avgHoldLoss > 0 ? avgHoldWin / avgHoldLoss : 0;
  
  // Recovery
  const maxDD = Math.min(...trades.map(t => parseFloat(t.pnl_pct || '0')));
  const currentDrawdown = parseFloat(sortedTrades[0]?.pnl_pct || '0'); 
  const isRecovered = maxDD < -10 && currentDrawdown > -2;

  // Recent Improvement
  const recentAvgPnl = sortedTrades.slice(0, 5).reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0) / 5;
  const isImproving = recentAvgPnl > avgPnl && totalTrades > 10;

  const uniqueDays = new Set(trades.map(t => t.open_date)).size;
  const avgTradesPerDay = uniqueDays > 0 ? totalTrades / uniqueDays : 0;

  // Find Best Day & Hour
  const bestDayEntry = Object.entries(dayStats).reduce((best, cur) => cur[1] > best[1] ? cur : best, ['None', -Infinity]);
  const bestDay = bestDayEntry[1] > 0 ? bestDayEntry[0] : null;

  const hourlyStats: { [key: number]: number } = {};
  trades.forEach(t => {
      if(t.open_time) {
          const h = parseInt(t.open_time.split(':')[0]);
          if(!isNaN(h)) hourlyStats[h] = (hourlyStats[h] || 0) + parseFloat(t.pnl || '0');
      }
  });
  const bestHourEntry = Object.entries(hourlyStats).reduce((best, cur) => cur[1] > best[1] ? cur : best, ['0', -Infinity]);
  const bestHour = bestHourEntry[1] > 0 ? bestHourEntry[0] : null;


  return (
    <div className="mb-8">
      {/* Header Expectancy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h3 className="text-xl font-semibold text-white flex items-center">
          🧠 <span className="ml-2">{t('insight_title')}</span>
        </h3>
        <div className={`text-xs px-3 py-1.5 rounded-full border font-medium ${expectancy > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {t('insight_sys_exp')}: {expectancy > 0 ? '+' : ''}{expectancy.toFixed(2)} USD {t('insight_per_trade')}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* === Red Flags (Warnings) === */}
        <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-5 shadow-lg shadow-red-900/5">
          <h4 className="text-red-300 font-bold mb-4 flex items-center pb-3 border-b border-red-500/10 text-base">
            <span className="mr-2 text-xl">⚠️</span> {t('insight_red_title')}
          </h4>
          <ul className="space-y-4 text-slate-300 text-sm">
            
            {/* 1. Revenge Trading */}
            {isRevenge && (
              <li className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <div className="font-bold text-red-200 mb-1 flex items-center">
                  <span className="mr-2">🔥</span> {t('insight_revenge_title')}
                </div>
                <span className="text-red-100/80 text-xs block">{t('insight_revenge_desc')}</span>
              </li>
            )}

            {/* 2. Streak Alert (Losing) */}
            {currentLosingStreak >= 3 && (
              <li className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <div className="font-bold text-red-200 mb-1 flex items-center">
                  <span className="mr-2">🛑</span> {t('insight_streak_title')} ({currentLosingStreak} {t('insight_streak_suffix')})
                </div>
                <span className="text-red-100/80 text-xs leading-relaxed block mt-1">
                  {t('insight_streak_desc')}
                </span>
              </li>
            )}

            {/* 3. Negative R:R Realized */}
            {avgLoss > avgWin && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">📉</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_rr_mismatch_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_rr_mismatch_desc').replace('${win}', avgWin.toFixed(0)).replace('${loss}', avgLoss.toFixed(0))}
                  </span>
                </div>
              </li>
            )}

            {/* 4. Direction Bias */}
            {biasDirection && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🧭</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_bias_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_bias_desc').replace('{dir}', biasDirection).replace('{rate}', biasWinRate.toFixed(0))}
                  </span>
                </div>
              </li>
            )}

            {/* 5. No SL Hazard */}
            {hasNoSL && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">💣</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_no_sl_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_no_sl_desc')}</span>
                </div>
              </li>
            )}

            {/* 6. Strategy Hopping */}
            {isStrategyHopping && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🤹</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_strategy_hop_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_strategy_hop_desc')}</span>
                </div>
              </li>
            )}

            {/* 7. Tilt */}
            {isTilting && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🤬</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_tilt_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_tilt_desc')}</span>
                </div>
              </li>
            )}

            {/* 8. Monday Blues */}
            {isMondayBad && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">📅</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_monday_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_monday_desc')}</span>
                </div>
              </li>
            )}

            {/* 9. Overconfidence */}
            {isOverconfident && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🦁</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_overconfidence_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_overconfidence_desc')}</span>
                </div>
              </li>
            )}

            {/* 10. Breakeven Abuse */}
            {isBeAbuse && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">✋</span>
                <div>
                  <strong className="text-red-300 block">{t('insight_breakeven_abuse_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_breakeven_abuse_desc')}</span>
                </div>
              </li>
            )}

            {/* Default Safe Message */}
            {!isRevenge && !hasNoSL && !isTilting && avgLoss <= avgWin && currentLosingStreak < 3 && (
              <li className="text-center text-slate-500 py-4 italic">
                {t('insight_safe')}
              </li>
            )}
          </ul>
        </div>

        {/* === Optimization (Green Flags) === */}
        <div className="bg-blue-950/10 border border-blue-500/20 rounded-xl p-5 shadow-lg shadow-blue-900/5">
          <h4 className="text-blue-300 font-bold mb-4 flex items-center pb-3 border-b border-blue-500/10 text-base">
            <span className="mr-2 text-xl">🚀</span> {t('insight_opt_title')}
          </h4>
          <ul className="space-y-4 text-slate-300 text-sm">

            {/* 1. Expectancy */}
            <li className="flex items-start">
              <span className="mr-3 text-lg">📊</span>
              <div>
                <strong className="text-blue-200 block">{t('insight_exp_title')}</strong>
                <span className="text-slate-400 text-xs block mt-0.5">
                  {t('insight_exp_desc')} <strong>${expectancy.toFixed(2)}</strong> 
                  {expectancy > 0 ? t('insight_exp_pos') : t('insight_exp_neg')}
                </span>
              </div>
            </li>

            {/* 2. Best Time */}
            {bestHour && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">⏰</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_hour_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_hour_desc')} <strong>{bestHour}:00 - {parseInt(bestHour)+1}:00</strong> {t('insight_hour_desc_end')}
                  </span>
                </div>
              </li>
            )}

            {/* 3. Best Day */}
            {bestDay && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">📅</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_day_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_day_desc')} <strong>{bestDay}</strong> {t('insight_day_desc_end')}
                  </span>
                </div>
              </li>
            )}

            {/* 4. Hot Hand Fallacy */}
            {currentWinningStreak >= 4 && (
              <li className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                <div className="font-bold text-yellow-200 mb-1 flex items-center">
                  <span className="mr-2">⚡</span> {t('insight_hot_title')}
                </div>
                <span className="text-yellow-100/80 text-xs leading-relaxed block mt-1">
                  {t('insight_hot_desc_1')} {currentWinningStreak} {t('insight_hot_desc_2')}
                </span>
              </li>
            )}

            {/* 5. Sniper Entry (High Realized R:R) */}
            {realRR >= 2 && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🎯</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_sniper_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_sniper_desc').replace('{ratio}', realRR.toFixed(2))}
                  </span>
                </div>
              </li>
            )}

            {/* 6. Consistency King (Low Std Dev) */}
            {sqn > 2 && stdDevPnl < avgPnl * 2 && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">⚖️</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_consistency_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_consistency_desc')}</span>
                </div>
              </li>
            )}

            {/* 7. SQN Score */}
            {totalTrades > 20 && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">💎</span>
                <div>
                  <strong className={`${sqn > 2.5 ? 'text-purple-300' : 'text-blue-300'} block`}>
                    {sqn > 2.5 ? t('insight_sqn_super_title') : t('insight_sqn_good_title')}
                  </strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {(sqn > 2.5 ? t('insight_sqn_super_desc') : t('insight_sqn_good_desc')).replace('{score}', sqn.toFixed(2))}
                  </span>
                </div>
              </li>
            )}

            {/* 8. Trend Rider */}
            {trendRiderRatio > 2 && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🌊</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_trend_rider_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_trend_rider_desc').replace('{ratio}', trendRiderRatio.toFixed(1))}
                  </span>
                </div>
              </li>
            )}

            {/* 9. Recovery */}
            {isRecovered && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🥊</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_recovery_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_recovery_desc')}</span>
                </div>
              </li>
            )}

            {/* 10. Improving */}
            {isImproving && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">📈</span>
                <div>
                  <strong className="text-green-300 block">{t('insight_improving_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">{t('insight_improving_desc')}</span>
                </div>
              </li>
            )}

            {/* 11. Overtrading */}
            {avgTradesPerDay > 5 && winRateRatio < 0.45 && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">🛑</span>
                <div>
                  <strong className="text-yellow-300 block">{t('insight_over_title')}</strong>
                  <span className="text-slate-400 text-xs block mt-0.5">
                    {t('insight_over_desc_1')} {avgTradesPerDay.toFixed(1)} {t('insight_over_desc_2')}
                  </span>
                </div>
              </li>
            )}

            {totalTrades < 10 && (
              <li className="flex items-start">
                <span className="mr-3 text-lg">📝</span>
                <div>
                  <strong className="text-slate-300 block">{t('insight_more_title')}</strong>
                  <span className="text-slate-500 text-xs block mt-0.5">
                    {t('insight_more_desc_1')}{totalTrades}{t('insight_more_desc_2')}
                  </span>
                </div>
              </li>
            )}

          </ul>
        </div>
      </div>
    </div>
  );
}