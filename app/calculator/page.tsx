'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

export default function CalculatorPage() {
  const { t } = useLanguage();

  // State สำหรับรับค่า
  const [symbol, setSymbol] = useState('XAUUSD');
  const [direction, setDirection] = useState('Buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [positionSize, setPositionSize] = useState('');
  const [positionUnit, setPositionUnit] = useState<"Troy" | "Lot">("Troy");
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');

  // State สำหรับผลลัพธ์
  const [results, setResults] = useState({
    tpProfit: 0,
    tpPoints: 0,
    slLoss: 0,
    slPoints: 0,
    rr: 0,
  });

  const LOT_TO_TROY = 100; // 1 Lot ทอง = 100 Oz

  // ฟังก์ชันคำนวณ
  useEffect(() => {
    calculateResults();
  }, [symbol, direction, entryPrice, positionSize, positionUnit, tpPrice, slPrice]);

  const calculateResults = () => {
    const entry = parseFloat(entryPrice);
    const sizeInput = parseFloat(positionSize);
    const tp = parseFloat(tpPrice);
    const sl = parseFloat(slPrice);

    if (!entry || !sizeInput) {
      setResults({ tpProfit: 0, tpPoints: 0, slLoss: 0, slPoints: 0, rr: 0 });
      return;
    }

    // 1. แปลง Size
    let lots = sizeInput;
    if (symbol === 'XAUUSD' && positionUnit === 'Troy') {
      lots = sizeInput / LOT_TO_TROY;
    }

    // 2. Config Contract & Point
    let contractSize = 100000; 
    let pointMultiplier = 100000; 

    if (symbol === 'XAUUSD') {
      contractSize = 100; 
      pointMultiplier = 100; 
    } else if (symbol.includes('JPY')) {
      contractSize = 100000;
      pointMultiplier = 1000; 
    } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
      contractSize = 1;
      pointMultiplier = 1;
    } else if (symbol === 'US30' || symbol === 'NAS100') {
      contractSize = 1; 
      pointMultiplier = 100; 
    }

    // 3. Calculation
    const dirMult = direction === 'Buy' ? 1 : -1;
    let tpProfitVal = 0;
    let slLossVal = 0;
    let tpDist = 0;
    let slDist = 0;

    if (tp) {
        tpProfitVal = (tp - entry) * dirMult * lots * contractSize;
        tpDist = Math.abs(tp - entry) * pointMultiplier;
        if (symbol.includes('JPY')) tpProfitVal /= (entry / 100);
    }

    if (sl) {
        slLossVal = (sl - entry) * dirMult * lots * contractSize;
        slDist = Math.abs(sl - entry) * pointMultiplier;
        if (symbol.includes('JPY')) slLossVal /= (entry / 100);
    }

    let rrVal = 0;
    if (Math.abs(slLossVal) > 0) {
        rrVal = Math.abs(tpProfitVal / slLossVal);
    }

    setResults({
        tpProfit: tpProfitVal,
        tpPoints: tpDist,
        slLoss: slLossVal,
        slPoints: slDist,
        rr: rrVal
    });
  };

  const handleUnitToggle = (newUnit: "Troy" | "Lot") => {
    if (positionUnit !== newUnit && positionSize) {
        const val = parseFloat(positionSize);
        if (!isNaN(val)) {
            if (newUnit === "Lot") setPositionSize((val / LOT_TO_TROY).toString());
            else setPositionSize((val * LOT_TO_TROY).toString());
        }
    }
    setPositionUnit(newUnit);
  };

  const formatValue = (val: number) => {
    const isPositive = val > 0;
    const isNegative = val < 0;
    const sign = isPositive ? '+' : ''; 
    
    let colorClass = 'text-white';
    if (isPositive) colorClass = 'text-emerald-400';
    if (isNegative) colorClass = 'text-red-400';

    return (
        <span className={`text-4xl font-bold ${colorClass}`}>
            {sign}{val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                🧮 {t('calc_title')}
            </h2>
            <p className="text-slate-400 text-sm">{t('calc_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* --- Left: Input Form --- */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl h-fit">
               <h3 className="text-white font-semibold mb-4 pb-2 border-b border-slate-700 flex items-center gap-2">
                 📝 {t('section_details')}
               </h3>

               <div className="space-y-5">
                 {/* Symbol & Direction */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-300 mb-2 text-sm">{t('label_symbol')}</label>
                        <select 
                            value={symbol} 
                            onChange={(e) => setSymbol(e.target.value)} 
                            className="input-field font-bold text-yellow-400"
                        >
                            <option>XAUUSD</option>
                            <option>EURUSD</option>
                            <option>GBPUSD</option>
                            <option>USDJPY</option>
                            <option>BTCUSD</option>
                            <option>US30</option>
                            <option>NAS100</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-300 mb-2 text-sm">{t('label_direction')}</label>
                        <div className="flex bg-slate-700/50 rounded-lg p-1 border border-slate-600">
                            <button
                                onClick={() => setDirection('Buy')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${direction === 'Buy' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setDirection('Sell')}
                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${direction === 'Sell' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Sell
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* Position Size (Updated UI) */}
                 <div>
                    <label className="block text-slate-300 mb-2 text-sm flex justify-between">
                        {t('label_position')}
                        {symbol === 'XAUUSD' && (
                            <span className="text-xs text-slate-500">
                                ({positionUnit === 'Troy' ? '100 Oz = 1 Lot' : 'Standard Lot'})
                            </span>
                        )}
                    </label>
                    
                    {symbol === 'XAUUSD' && (
                        /* ปรับ CSS ตรงนี้: เอา w-fit ออก และใช้ flex-1 ที่ปุ่มเพื่อให้เต็มกรอบ */
                        <div className="flex mb-2 bg-slate-700/50 rounded-lg p-1 border border-slate-600">
                            <button 
                                onClick={() => handleUnitToggle("Troy")} 
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                                    positionUnit === "Troy" 
                                        ? "bg-blue-600 text-white shadow-lg" 
                                        : "text-slate-300 hover:text-white"
                                }`}
                            >
                                {t('unit_troy_oz')}
                            </button>
                            <button 
                                onClick={() => handleUnitToggle("Lot")} 
                                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                                    positionUnit === "Lot" 
                                        ? "bg-blue-600 text-white shadow-lg" 
                                        : "text-slate-300 hover:text-white"
                                }`}
                            >
                                {t('unit_lots')}
                            </button>
                        </div>
                    )}

                    <input 
                        type="number" 
                        value={positionSize} 
                        onChange={(e) => setPositionSize(e.target.value)} 
                        className="input-field text-lg font-mono" 
                        placeholder="0.00" 
                    />
                 </div>

                 {/* Entry Price */}
                 <div>
                    <label className="block text-slate-300 mb-2 text-sm">{t('label_entry')}</label>
                    <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="input-field text-xl font-bold text-white" placeholder="0.00" />
                 </div>

                 {/* TP & SL Inputs */}
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                    <div>
                        <label className="block text-emerald-400 mb-2 text-sm font-bold">{t('label_tp')}</label>
                        <input type="number" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} className="input-field border-emerald-500/30 focus:border-emerald-500" placeholder="TP Price" />
                    </div>
                    <div>
                        <label className="block text-red-400 mb-2 text-sm font-bold">{t('label_sl')}</label>
                        <input type="number" value={slPrice} onChange={(e) => setSlPrice(e.target.value)} className="input-field border-red-500/30 focus:border-red-500" placeholder="SL Price" />
                    </div>
                 </div>

               </div>
            </div>

            {/* --- Right: Results --- */}
            <div className="flex flex-col gap-4">
                
                {/* Reward Card */}
                <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800 rounded-xl p-6 border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🚀</span>
                    </div>
                    <h4 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2">{t('res_profit')} (Reward)</h4>
                    <div className="flex items-baseline gap-2">
                        {formatValue(results.tpProfit)}
                        <span className="text-sm text-emerald-400">USD</span>
                    </div>
                    <div className="mt-2 text-emerald-200/60 text-sm font-mono bg-emerald-900/30 px-2 py-1 rounded w-fit">
                        {t('res_points')}: {results.tpPoints.toLocaleString()} pts
                    </div>
                </div>

                {/* Risk Card */}
                <div className="bg-gradient-to-br from-red-900/40 to-slate-800 rounded-xl p-6 border border-red-500/30 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🛡️</span>
                    </div>
                    <h4 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">{t('res_loss')} (Risk)</h4>
                    <div className="flex items-baseline gap-2">
                        {formatValue(results.slLoss)}
                        <span className="text-sm text-red-400">USD</span>
                    </div>
                    <div className="mt-2 text-red-200/60 text-sm font-mono bg-red-900/30 px-2 py-1 rounded w-fit">
                         {t('res_points')}: {results.slPoints.toLocaleString()} pts
                    </div>
                </div>

                {/* R:R Card */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center justify-between">
                    <div>
                        <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{t('res_rr')}</h4>
                        <div className={`text-3xl font-bold ${results.rr >= 2 ? 'text-blue-400' : results.rr >= 1 ? 'text-yellow-400' : 'text-slate-300'}`}>
                            1 : {results.rr.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="text-xs text-slate-500 mb-1">{t('stat_target_rr')}</div>
                         <div className={`text-xs px-2 py-1 rounded font-bold ${results.rr >= 2 ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                            {results.rr >= 2 ? 'Excellent' : results.rr >= 1.5 ? 'Good' : 'Risky'}
                         </div>
                    </div>
                </div>

            </div>

          </div>
        </div>
      </div>
        
      <style jsx>{`
        .input-field {
          width: 100%;
          background-color: rgb(15 23 42); 
          color: white;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid rgb(51 65 85);
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}