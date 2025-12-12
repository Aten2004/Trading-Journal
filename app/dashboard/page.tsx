'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts';
import TradesTable from '../components/TradesTable';
import Navbar from '../components/Navbar';

// ✅ แก้ไข Interface ให้ตรงกับ Google Sheets (open_date, close_date)
interface Trade {
  id: string;
  open_date: string;  // เปลี่ยนจาก date เป็น open_date
  close_date: string; // เพิ่ม close_date
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
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/get-trades');
      const result = await response.json();
      if (result.success) {
        setTrades(result.trades);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  // คำนวณสถิติพื้นฐาน
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => parseFloat(t.pnl || '0') > 0).length;
  const losingTrades = trades.filter((t) => parseFloat(t.pnl || '0') < 0).length;
  const breakEvenTrades = trades.filter((t) => parseFloat(t.pnl || '0') === 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0';

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrades();
    setRefreshing(false);
  };
  
  // เพิ่มการวิเคราะห์ช่วงเวลา
  const timeAnalysis = () => {
    const hourlyStats: { [hour: number]: { trades: number; wins: number; losses: number; pnl: number } } = {};
    
    trades.forEach(t => {
      if (t.open_time) {
        const hour = parseInt(t.open_time.split(':')[0]);
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
        }
        
        hourlyStats[hour].trades += 1;
        const pnl = parseFloat(t.pnl || '0');
        hourlyStats[hour].pnl += pnl;
        
        if (pnl > 0) hourlyStats[hour].wins += 1;
        else if (pnl < 0) hourlyStats[hour].losses += 1;
      }
    });
    
    return Object.entries(hourlyStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        ...stats,
        winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0
      }))
      .sort((a, b) => a.hour - b.hour);
  };

  const hourlyData = timeAnalysis();
  const bestHour = hourlyData.length > 0
    ? hourlyData.reduce((best, current) => 
        current.pnl > best.pnl ? current : best
      )
    : null;

  // Total P&L
  const totalPnL = trades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
  const totalPnLFormatted = totalPnL.toFixed(2);

  // Average Win & Loss
  const avgWin = winningTrades > 0 
    ? (trades.filter(t => parseFloat(t.pnl || '0') > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0) / winningTrades).toFixed(2)
    : '0';
  const avgLoss = losingTrades > 0
    ? (trades.filter(t => parseFloat(t.pnl || '0') < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0) / losingTrades).toFixed(2)
    : '0';

  // Profit Factor = Total Wins / |Total Losses|
  const totalWins = trades.filter(t => parseFloat(t.pnl || '0') > 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0);
  const totalLosses = Math.abs(trades.filter(t => parseFloat(t.pnl || '0') < 0).reduce((sum, t) => sum + parseFloat(t.pnl), 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0';

  // Average R:R
  const avgRR = trades.length > 0
    ? (trades.reduce((sum, t) => sum + parseFloat(t.risk_reward_ratio || '0'), 0) / trades.length).toFixed(2)
    : '0';

  // Maximum Drawdown (แบบง่าย: ใช้ P&L % ต่ำสุด)
  const maxDrawdown = trades.length > 0
    ? Math.min(...trades.map(t => parseFloat(t.pnl_pct || '0'))).toFixed(2)
    : '0';

    const hourlyPriceAnalysis = () => {
    const stats: {
      [hour: number]: { trades: number; avgEntry: number; avgPnl: number; sumEntry: number; sumPnl: number };
    } = {};

    trades.forEach(t => {
      if (!t.open_time || !t.entry_price) return;

      const hour = parseInt(t.open_time.split(':')[0]);
      const entry = parseFloat(t.entry_price || '0');
      const pnl = parseFloat(t.pnl || '0');
      if (isNaN(hour) || isNaN(entry)) return;

      if (!stats[hour]) {
        stats[hour] = { trades: 0, avgEntry: 0, avgPnl: 0, sumEntry: 0, sumPnl: 0 };
      }

      stats[hour].trades += 1;
      stats[hour].sumEntry += entry;
      stats[hour].sumPnl += pnl;
    });

    return Object.entries(stats)
      .map(([hour, s]) => ({
        hour: Number(hour),
        trades: s.trades,
        avgEntry: s.sumEntry / s.trades,
        avgPnl: s.sumPnl / s.trades,
      }))
      .sort((a, b) => a.hour - b.hour);
  };

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


  // Plan Adherence Rate
  const planFollowedCount = trades.filter(t => t.followed_plan === 'true').length;
  const planAdherence = totalTrades > 0 ? ((planFollowedCount / totalTrades) * 100).toFixed(1) : '0';

  // Mistake Analysis
  const mistakeCount: { [key: string]: number } = {};
  trades.forEach(t => {
    if (t.main_mistake && t.main_mistake !== 'No Mistake') {
      mistakeCount[t.main_mistake] = (mistakeCount[t.main_mistake] || 0) + 1;
    }
  });
  const topMistake = Object.keys(mistakeCount).length > 0
    ? Object.entries(mistakeCount).sort((a, b) => b[1] - a[1])[0]
    : null;

  // ✅ ฟังก์ชันคำนวณกลยุทธ์ที่ดีที่สุด
  const getBestStrategy = () => {
    const strategies = trades.reduce((acc: any, trade) => {
      const strategy = trade.strategy || 'Unknown';
      const pnl = parseFloat(trade.pnl) || 0;
      
      if (!acc[strategy]) {
        acc[strategy] = { 
          trades: 0, 
          pnl: 0, 
          wins: 0,
          losses: 0
        };
      }
      
      acc[strategy].trades += 1;
      acc[strategy].pnl += pnl;
      
      if (pnl > 0) {
        acc[strategy].wins += 1;
      } else if (pnl < 0) {
        acc[strategy].losses += 1;
      }
      
      return acc;
    }, {});

    // หากลยุทธ์ที่ดีที่สุด: Win Rate สูงสุด + Avg P&L เป็นบวก
    let best = { 
      strategy: 'N/A', 
      winRate: 0, 
      avgPnl: 0, 
      trades: 0 
    };
    
    Object.entries(strategies).forEach(([strategy, stats]: [string, any]) => {
      const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
      const avgPnl = stats.trades > 0 ? stats.pnl / stats.trades : 0;
      
      // ต้องมีอย่างน้อย 3 เทรด และ Win Rate >= 50%
      if (stats.trades >= 3 && avgPnl > best.avgPnl && winRate >= 50) {
        best = {
          strategy,
          winRate,
          avgPnl,
          trades: stats.trades
        };
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

  // เรียกใช้ฟังก์ชัน
  const bestStrategy = getBestStrategy();

  // Strategy Performance (เก็บไว้เพื่อแสดงในตาราง)
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

  // Emotional Analysis
  const emotionalTrades = trades.filter(t => t.emotion && parseInt(t.emotion) >= 7);
  const highEmotionLosses = emotionalTrades.filter(t => parseFloat(t.pnl || '0') < 0).length;
  const emotionImpact = emotionalTrades.length > 0
    ? ((highEmotionLosses / emotionalTrades.length) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="max-w-[98%] mx-auto p-4 sm:p-6 lg:p-8">
       {/* Header (Responsive: Stack on mobile, Row on desktop) */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Trading Dashboard</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              วิเคราะห์และปรับปรุงการเทรดของคุณด้วยข้อมูลเชิงลึก
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm sm:text-base font-medium
                      bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800
                      text-white border border-slate-500 transition-colors"
          >
            {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}
          </button>
        </div>

        {/* Trades Table - ย้ายขึ้นมาด้านบนสุด */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">📝 ตารางเทรดทั้งหมด</h3>
          <TradesTable trades={trades} onRefresh={handleRefresh} />
        </div>

        {hourlyPriceData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            ⏰ กราฟช่วงเวลาที่เข้าเทรด
          </h3>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-slate-700">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyPriceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hourLabel" stroke="#cbd5f5" />
                  <YAxis yAxisId="left" stroke="#38bdf8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#f97316" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  {/* ราคาเข้าเฉลี่ย */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgEntry"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Avg Entry"
                  />
                  {/* P&L เฉลี่ย */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgPnl"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Avg P&L"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              เส้นฟ้า = ราคาเข้าเฉลี่ยแต่ละช่วงเวลา · เส้นส้ม = P&L เฉลี่ยต่อเทรดในช่วงนั้น
            </p>
          </div>
        </div>
      )}

        {/* Performance Overview */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">📈 ภาพรวมผลการเทรด</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">เทรดทั้งหมด</div>
              <div className="text-3xl font-bold text-white">{totalTrades}</div>
              <div className="text-xs text-slate-500 mt-2">
                {winningTrades}W · {losingTrades}L · {breakEvenTrades}BE
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Win Rate</div>
              <div className={`text-3xl font-bold ${parseFloat(winRate) >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                {winRate}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                เป้าหมาย: ≥50%
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Total P&L</div>
              <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLFormatted} USD
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Avg Win: +{avgWin} USD · Avg Loss: {avgLoss} USD
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Profit Factor</div>
              <div className={`text-3xl font-bold ${parseFloat(profitFactor) >= 1.5 ? 'text-green-400' : parseFloat(profitFactor) >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                {profitFactor}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                เป้าหมาย: ≥1.5 (ดี), ≥2.0 (ยอดเยี่ยม)
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">🛡️ การจัดการความเสี่ยง</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Avg Risk:Reward</div>
              <div className={`text-3xl font-bold ${parseFloat(avgRR) >= 2 ? 'text-green-400' : parseFloat(avgRR) >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                {avgRR}:1
              </div>
              <div className="text-xs text-slate-500 mt-2">
                เป้าหมาย: ≥2:1 (ดีมาก), ≥1.5:1 (ดี)
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Max Drawdown</div>
              <div className={`text-3xl font-bold ${parseFloat(maxDrawdown) > -15 ? 'text-green-400' : parseFloat(maxDrawdown) > -25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {maxDrawdown}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                เป้าหมาย: &lt;15% (ดี), &lt;25% (ยอมรับได้)
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Plan Adherence</div>
              <div className={`text-3xl font-bold ${parseFloat(planAdherence) >= 80 ? 'text-green-400' : parseFloat(planAdherence) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {planAdherence}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {planFollowedCount}/{totalTrades} เทรดทำตามแผน
              </div>
            </div>
          </div>
        </div>

        {/* Psychology & Behavior */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">🧠 จิตวิทยาและพฤติกรรม</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">ข้อผิดพลาดที่พบบ่อย</div>
              {topMistake ? (
                <>
                  <div className="text-xl font-bold text-red-400 mb-1">{topMistake[0]}</div>
                  <div className="text-xs text-slate-500">{topMistake[1]} ครั้ง</div>
                </>
              ) : (
                <div className="text-xl font-bold text-green-400">ไม่มีข้อผิดพลาด 🎉</div>
              )}
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">ผลกระทบของอารมณ์</div>
              <div className={`text-3xl font-bold ${parseFloat(emotionImpact) < 40 ? 'text-green-400' : parseFloat(emotionImpact) < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {emotionImpact}%
              </div>
              <div className="text-xs text-slate-500 mt-2">
                ขาดทุนเมื่ออารมณ์สูง (≥7/10)
              </div>
            </div>

            {/* ✅ แก้ไขส่วนแสดงกลยุทธ์ที่ดีที่สุด */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
              <div className="text-slate-400 text-sm mb-1">กลยุทธ์ที่ดีที่สุด</div>
              {bestStrategy ? (
                <>
                  <div className="text-lg font-bold text-purple-300 mb-1">{bestStrategy.name}</div>
                  <div className="text-xs text-slate-400">
                    Win Rate: {bestStrategy.winRate}% • Avg: ${bestStrategy.avgPnl} • {bestStrategy.trades} เทรด
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-slate-400 mb-1">N/A</div>
                  <div className="text-xs text-slate-500">ต้องมี ≥3 เทรดและ Win Rate ≥50%</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Strategy Breakdown */}
        {Object.keys(strategyStats).length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">🎯 วิเคราะห์ตามกลยุทธ์</h3>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold">กลยุทธ์</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold">จำนวนเทรด</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold">Win Rate</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold">Total P&L</th>
                      <th className="text-left text-slate-300 py-3 px-4 font-semibold">Avg P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(strategyStats)
                      .sort((a, b) => {
                        // เรียงตาม Avg P&L
                        const avgA = a[1].pnl / a[1].trades;
                        const avgB = b[1].pnl / b[1].trades;
                        return avgB - avgA;
                      })
                      .map(([strategy, stats]) => {
                        const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
                        const avgPnl = stats.pnl / stats.trades;
                        return (
                          <tr key={strategy} className="border-b border-slate-700/50">
                            <td className="py-3 px-4 text-white">{strategy}</td>
                            <td className="py-3 px-4 text-slate-300">{stats.trades}</td>
                            <td className={`py-3 px-4 font-semibold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                              {winRate.toFixed(1)}%
                            </td>
                            <td className={`py-3 px-4 font-semibold ${stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}
                            </td>
                            <td className={`py-3 px-4 font-semibold ${avgPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {avgPnl >= 0 ? '+' : ''}{avgPnl.toFixed(2)}
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

        {/* Key Insights */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">💡 สิ่งที่ควรทำต่อไป</h3>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <ul className="space-y-3 text-slate-300">
              {parseFloat(winRate) < 50 && (
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Win Rate ต่ำกว่า 50% - ลองปรับเงื่อนไข entry/exit หรือเลือกเทรดที่มี probability สูงกว่า</span>
                </li>
              )}
              {parseFloat(avgRR) < 1.5 && (
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>R:R ต่ำกว่า 1.5:1 - พยายามหา setup ที่มี risk:reward ดีกว่า หรือให้ profit run มากขึ้น</span>
                </li>
              )}
              {parseFloat(planAdherence) < 80 && (
                <li className="flex items-start space-x-2">
                  <span className="text-red-400">🚨</span>
                  <span>ทำตามแผนได้น้อยกว่า 80% - นี่คือสาเหตุหลักของความล้มเหลว ต้องฝึกวินัยให้มากขึ้น</span>
                </li>
              )}
              {topMistake && topMistake[1] > 3 && (
                <li className="flex items-start space-x-2">
                  <span className="text-red-400">🚨</span>
                  <span>ข้อผิดพลาด &quot;{topMistake[0]}&quot; เกิดขึ้นบ่อย ({topMistake[1]} ครั้ง) - ควรแก้ไขปัญหานี้เป็นอันดับแรก</span>
                </li>
              )}
              {parseFloat(emotionImpact) > 60 && (
                <li className="flex items-start space-x-2">
                  <span className="text-red-400">🚨</span>
                  <span>อารมณ์กระทบผลการเทรดมาก - พักให้มากขึ้นเมื่อรู้สึกเครียด และอย่าเทรดต่อเนื่อง</span>
                </li>
              )}
              {parseFloat(profitFactor) >= 2 && parseFloat(winRate) >= 55 && parseFloat(planAdherence) >= 80 && (
                <li className="flex items-start space-x-2">
                  <span className="text-green-400">✅</span>
                  <span>คุณกำลังทำได้ดีมาก! รักษาวินัยและแผนการเทรดไว้แบบนี้ต่อไป</span>
                </li>
              )}
              {!bestStrategy && totalTrades >= 3 && (
                <li className="flex items-start space-x-2">
                  <span className="text-yellow-400">⚠️</span>
                  <span>ยังไม่มีกลยุทธ์ที่มี Win Rate ≥50% - ลองทบทวนแผนการเทรดและหา setup ที่มีโอกาสชนะสูงกว่า</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}