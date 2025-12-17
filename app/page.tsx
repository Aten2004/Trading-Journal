'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { t } = useLanguage(); 
  const { user } = useAuth();
  const router = useRouter();

  const TIME_FRAMES = [
    'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'
  ];

  const STRATEGIES = [
    'Reversal',         
    'High Conviction',  
    'Smart Money',      
    'Trend Following',  
    'Breakout',         
    'Scalping',         
    'Grid'              
  ];

  const CHART_PATTERNS = [
    'Unclear',      
    'Uptrend',      
    'Downtrend',    
    'Bottom Zone',  
    'Top Zone',     
    'Sideways'      
  ];

  const [formData, setFormData] = useState({
    symbol: 'XAUUSD',          
    direction: 'Buy',          
    open_date: '',            
    open_time: '',          
    close_date: '',          
    close_time: '',          
    time_frame: '',           
    position_size: '',        
    entry_price: '',           
    exit_price: '',              
    sl: '',                      
    tp: '',                    
    strategy: 'Reversal',       
    chart_pattern: 'Unclear',   
    pnl: '',
    pnl_pct: '',
    emotion: '', 
    main_mistake: 'No Mistake',
    followed_plan: 'Yes',
    notes: '',
});

// State สำหรับสลับโหมด (True = แสดงครบ, False = แสดงแบบย่อ)
const [showAdvanced, setShowAdvanced] = useState(false);

const LOT_TO_TROY = 100; // 1 lot = 100 oz

const [positionUnit, setPositionUnit] = useState<"Troy" | "Lot">("Troy");

const handlePositionSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setFormData(prev => ({
    ...prev,
    position_size: value,
  }));
};

const handleUnitToggle = (newUnit: "Troy" | "Lot") => {
  setPositionUnit(prevUnit => {
    if (!formData.position_size) return newUnit;

    const current = parseFloat(formData.position_size);
    if (isNaN(current)) return newUnit;

    let converted = current;

    // Troy -> Lot : แปลงเป็น lot
    if (prevUnit === "Troy" && newUnit === "Lot") {
      converted = current / LOT_TO_TROY;
    }
    // Lot -> Troy : แปลงกลับเป็น oz
    else if (prevUnit === "Lot" && newUnit === "Troy") {
      converted = current * LOT_TO_TROY;
    }

    setFormData(prev => ({
      ...prev,
      position_size: converted.toString(),
    }));

    return newUnit;
  });
};

  // โหลดค่าล่าสุดจาก LocalStorage ตอนเปิดหน้าเว็บ
  useEffect(() => {
    const savedDefaults = localStorage.getItem('tradeDefaults');
    if (savedDefaults) {
      try {
        const parsed = JSON.parse(savedDefaults);
        setFormData(prev => ({
          ...prev,
          symbol: parsed.symbol || 'XAUUSD',
          time_frame: parsed.time_frame || 'M30', 
          position_size: parsed.position_size || '',
          strategy: parsed.strategy || 'Reversal',
          chart_pattern: parsed.chart_pattern || 'Unclear',
          main_mistake: parsed.main_mistake || 'No Mistake',
        }));
        setPositionUnit(parsed.positionUnit || 'Lots');
      } catch (e) {
        console.error("Error loading defaults", e);
      }
    } else {
        setFormData(prev => ({ ...prev, time_frame: 'M30' }));
    }
  }, []);

  const getStrategyLabel = (strat: string) => {
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
    return map[strat] || strat;
  };

  const getPatternLabel = (pat: string) => {
    const map: {[key: string]: string} = {
        'Unclear': t('opt_pat_unclear'),
        'Uptrend': t('opt_pat_uptrend'),
        'Downtrend': t('opt_pat_downtrend'),
        'Bottom Zone': t('opt_pat_bottom'),
        'Top Zone': t('opt_pat_top'),
        'Sideways': t('opt_pat_sideways'),
    };
    return map[pat] || pat;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // HANDLERS
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล / Please login first');
      return;
    }
    setIsSubmitting(true);
    setMessage('');

    // --- ส่วนที่แก้ไข: แปลงหน่วยเป็น Lot ก่อนส่งไปบันทึก ---
    let finalSize = parseFloat(formData.position_size) || 0;
    if (positionUnit === "Troy") {
      finalSize = finalSize / 100; // 100 Troy Oz = 1 Lot
    }

    // บันทึกค่าที่ใช้บ่อยลงเครื่องผู้ใช้
    localStorage.setItem('tradeDefaults', JSON.stringify({
    symbol: formData.symbol,
    time_frame: formData.time_frame,
    strategy: formData.strategy,
    chart_pattern: formData.chart_pattern,
    main_mistake: formData.main_mistake,
    position_size: formData.position_size,
    positionUnit,
  }));

  try {
    const response = await fetch('/api/add-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...formData, 
        position_size: finalSize.toString(), 
        username: user.username 
      }),
    });

      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          open_date: '', 
          open_time: '',
          close_date: '', 
          close_time: '', 
          entry_price: '', 
          exit_price: '',
          sl: '',
          tp: '',
          notes: ''
        }));

        router.push('/dashboard'); 

      } else {
        const errorMsg = result.error || t('msg_fail').replace('❌ ', '').replace('❌', '');
        setMessage('❌ ' + errorMsg);
      }

    } catch (error) {
      console.error(error);
      setMessage('❌ ' + t('msg_fail').replace('❌ ', '').replace('❌', ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto"> {/* ปรับความกว้างให้เหมาะสม */}
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t('page_title')}</h2>
                <p className="text-slate-400 text-sm">{t('page_subtitle')}</p>
            </div>
            {/* ปุ่มสลับโหมด */}
            <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg border border-slate-600 transition-all flex items-center gap-2 whitespace-nowrap"
            >
                {showAdvanced ? t('btn_simple_mode') : t('btn_adv_mode')}
            </button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                message.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-slate-700">
            
            {/* ================================================================= */}
            {/* ส่วนที่ 1: ข้อมูลหลัก (Simple Mode - แสดงตลอดเวลา) */}
            {/* ================================================================= */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
              
              {/* Symbol */}
              <div>
                <label className="block text-slate-300 mb-2 text-sm">{t('label_symbol')}</label>
                <select name="symbol" value={formData.symbol} onChange={handleChange} className="input-field font-bold text-yellow-400">
                  <option>XAUUSD</option>
                  <option>EURUSD</option>
                  <option>GBPUSD</option>
                  <option>USDJPY</option>
                  <option>BTCUSD</option>
                  <option>US30</option>
                  <option>NAS100</option>
                </select>
              </div>

              {/* Direction (Design: ปุ่มกดขนาดใหญ่) */}
              <div>
                <label className="block text-slate-300 mb-2 text-sm">{t('label_direction')}</label>
                <div className="flex bg-slate-700/50 rounded-lg p-1 border border-slate-600">
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, direction: 'Buy'})}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-200 ${formData.direction === 'Buy' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {t('val_buy')} 🟢
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, direction: 'Sell'})}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-200 ${formData.direction === 'Sell' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {t('val_sell')} 🔴
                    </button>
                </div>
              </div>

              {/* Entry & Exit (Group) */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 bg-slate-700/20 rounded-xl border border-slate-600/30">
                  <div>
                    <label className="block text-slate-300 mb-2 text-sm">{t('label_entry')}</label>
                    <input type="number" step="any" name="entry_price" value={formData.entry_price} onChange={handleChange} className="input-field text-lg" placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 text-sm">{t('label_exit')}</label>
                    <input type="number" step="any" name="exit_price" value={formData.exit_price} onChange={handleChange} className="input-field text-lg" placeholder="0.00" />
                  </div>
              </div>
              
              {/* SL & TP */}
              <div>
                <label className="block text-slate-300 mb-2 text-sm text-red-400">{t('label_sl')}</label>
                <input type="number" step="any" name="sl" value={formData.sl} onChange={handleChange} className="input-field" placeholder="Stop Loss" />
              </div>
              <div>
                <label className="block text-slate-300 mb-2 text-sm text-green-400">{t('label_tp')}</label>
                <input type="number" step="any" name="tp" value={formData.tp} onChange={handleChange} className="input-field" placeholder="Take Profit" />
              </div>
            </div>

            {/* ================================================================= */}
            {/* ส่วนที่ 2: ข้อมูลละเอียด (Advanced Mode - ซ่อน/แสดง) */}
            {/* ================================================================= */}
            
            {showAdvanced && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 pt-6 border-t border-slate-700 mt-6">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-6 font-semibold">
                  {t('section_details_more')}
                </h3>

              {/* Size + Unit Toggle */}
              <div className="mb-6">
                <label className="block text-slate-300 mb-2 text-sm">
                  {t('label_position')}
                </label>

                <div className="flex mb-2 bg-slate-700/50 rounded-lg p-1 border border-slate-600">
                  <button
                    type="button"
                    onClick={() => handleUnitToggle("Troy")}
                    className={`flex-1 py-2 rounded-md text-xs font-bold ${
                      positionUnit === "Troy"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {t('unit_troy_oz')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitToggle("Lot")}
                    className={`flex-1 py-2 rounded-md text-xs font-bold ${
                      positionUnit === "Lot"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {t('unit_lots')}
                  </button>
                </div>

                <input
                  type="number"
                  step="any"
                  name="position_size"
                  value={formData.position_size}
                  onChange={handlePositionSizeChange}
                  placeholder={t('ph_position')}
                  className="input-field"
                />
                <p className="text-xs text-slate-400 mt-1">
                </p>
              </div>

              {/* Dates & Times*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-2 text-xs">
                      {t('label_open_date')}
                    </label>
                    <input
                      type="date"
                      name="open_date"
                      value={formData.open_date}
                      onChange={handleChange}
                      className="input-field text-sm text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-xs">
                      {t('label_open_time')}
                    </label>
                    <input
                      type="time"
                      name="open_time"
                      value={formData.open_time}
                      onChange={handleChange}
                      className="input-field text-sm text-slate-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-2 text-xs">
                      {t('label_close_date')}
                    </label>
                    <input
                      type="date"
                      name="close_date"
                      value={formData.close_date}
                      onChange={handleChange}
                      className="input-field text-sm text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-xs">
                      {t('label_close_time')}
                    </label>
                    <input
                      type="time"
                      name="close_time"
                      value={formData.close_time}
                      onChange={handleChange}
                      className="input-field text-sm text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Time Frame & Strategy*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">
                    {t('label_time_frame')}
                  </label>
                  <select
                    name="time_frame"
                    value={formData.time_frame}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">{t('opt_unspecified')}</option>
                    {TIME_FRAMES.map(tf => (
                      <option key={tf} value={tf}>
                        {tf}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">
                    {t('label_strategy')}
                  </label>
                  <select
                    name="strategy"
                    value={formData.strategy}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {STRATEGIES.map(s => (
                      <option key={s} value={s}>
                        {getStrategyLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chart Pattern & Main Mistake */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">
                    {t('label_chart_pattern')}
                  </label>
                  <select
                    name="chart_pattern"
                    value={formData.chart_pattern}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {CHART_PATTERNS.map(p => (
                      <option key={p} value={p}>
                        {getPatternLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 text-sm">
                    {t('label_mistake')}
                  </label>
                  <select
                    name="main_mistake"
                    value={formData.main_mistake}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="No Mistake">{t('opt_mis_no_mistake')}</option>
                    <option value="No SL">{t('opt_mis_no_sl')}</option>
                    <option value="Oversize">{t('opt_mis_oversize')}</option>
                    <option value="Overtrade">{t('opt_mis_overtrade')}</option>
                    <option value="FOMO">{t('opt_mis_fomo')}</option>
                    <option value="Revenge">{t('opt_mis_revenge')}</option>
                    <option value="No Plan">{t('opt_mis_no_plan')}</option>
                  </select>
                </div>
              </div>

              {/* Psychology Section */}
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 mt-8 pt-4 border-t border-slate-700/50">
                  {t('section_psycho')}
                </h2>

                {/* Emotion + Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  <div>
                    <label className="block text-slate-300 mb-2 text-sm">
                      {t('label_emotion')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      name="emotion"
                      value={formData.emotion}
                      onChange={handleChange}
                      placeholder={t('ph_emotion')}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-2 text-sm">
                      {t('label_plan')}
                    </label>
                    <select
                      name="followed_plan"
                      value={formData.followed_plan}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="Yes">Yes ✓</option>
                      <option value="No">No ✗</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-slate-300 mb-2 text-sm">
                    {t('label_notes')}
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="input-field"
                    placeholder={t('ph_notes')}
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 mb-6">
                  <p className="text-blue-300 text-xs sm:text-sm">
                    💡 {t('msg_auto_calc')}
                  </p>
                    </div>
                  </div>
                )}

            {/* ปุ่มกดบันทึก */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all text-lg"
            >
              {isSubmitting ? t('btn_saving') : t('btn_save')}
            </button>
          </form>

        </div>
      </div>
      <style jsx>{`
        .input-field {
          width: 100%;
          background-color: rgb(30 41 59); 
          color: white;
          border-radius: 0.5rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.95rem;
          border: 1px solid rgb(51 65 85);
          outline: none;
        }
        .input-field:focus {
          border-color: rgb(59 130 246);
          background-color: rgb(15 23 42);
        }
        @media (min-width: 640px) {
          .input-field {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}