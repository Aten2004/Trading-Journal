'use client';

import { useState } from 'react';
import Navbar from './components/Navbar';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { t } = useLanguage(); 
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    open_date: '', 
    close_date: '', 
    open_time: '',
    close_time: '',
    symbol: 'XAUUSD',
    direction: 'Buy',
    position_size: '',
    entry_price: '',
    exit_price: '',
    sl: '',
    tp: '',
    pnl: '',
    pnl_pct: '',
    strategy: 'Trend Following',
    emotion: '',
    main_mistake: 'No Mistake',
    followed_plan: 'Yes',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล / Please login first');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/add-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          username: user.username 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(t('msg_success')); 
        setFormData({
          open_date: '', close_date: '', open_time: '', close_time: '',
          symbol: 'XAUUSD', direction: 'Buy', position_size: '',
          entry_price: '', exit_price: '', sl: '', tp: '',
          pnl: '', pnl_pct: '', strategy: 'Trend Following',
          emotion: '', main_mistake: 'No Mistake',
          followed_plan: 'Yes', notes: '',
        });
      } else {
        setMessage(t('msg_error') + result.error);
      }
    } catch (error) {
      setMessage(t('msg_fail'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('page_title')}</h2>
            <p className="text-slate-400 text-sm sm:text-base">{t('page_subtitle')}</p>
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
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              {t('section_details')}
            </h2>

            {/* แถวที่ 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_symbol')} <span className="text-slate-500">{t('opt_optional')}</span>
                </label>
                <select name="symbol" value={formData.symbol} onChange={handleChange} className="input-field">
                  <option>XAUUSD</option>
                  <option>EURUSD</option>
                  <option>GBPUSD</option>
                  <option>USDJPY</option>
                  <option>BTCUSD</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_open_date')} <span className="text-slate-500">{t('opt_optional')}</span>
                </label>
                <input type="date" name="open_date" value={formData.open_date} onChange={handleChange} className="input-field" />
              </div>
            </div>

            {/* แถวที่ 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_open_time')} <span className="text-slate-500">{t('opt_optional')}</span>
                </label>
                <input type="time" name="open_time" value={formData.open_time} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_close_date')} <span className="text-slate-500 text-xs">{t('opt_optional')}</span>
                </label>
                <input type="date" name="close_date" value={formData.close_date} onChange={handleChange} className="input-field" />
              </div>
            </div>

            {/* แถวที่ 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_close_time')} <span className="text-slate-500">{t('opt_optional')}</span>
                </label>
                <input type="time" name="close_time" value={formData.close_time} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_direction')} <span className="text-slate-500">{t('opt_optional')}</span>
                </label>
                <select name="direction" value={formData.direction} onChange={handleChange} className="input-field">
                  <option value="Buy">Buy (ซื้อ)</option>
                  <option value="Sell">Sell (ขาย)</option>
                </select>
              </div>
            </div>

            {/* แถวที่ 4: Position, Entry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    {t('label_position')} <span className="text-slate-500">{t('opt_optional')}</span>
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="position_size" 
                      value={formData.position_size} 
                      onChange={handleChange} 
                      placeholder={t('ph_position')} 
                      className="input-field" 
                    />
                </div>
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    {t('label_entry')} <span className="text-slate-500">{t('opt_optional')}</span>
                    </label>
                    <input type="number" step="0.01" name="entry_price" value={formData.entry_price} onChange={handleChange} className="input-field" />
                </div>
            </div>

             {/* แถวที่ 5: Exit, SL */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    {t('label_exit')} <span className="text-slate-500">{t('opt_optional')}</span>
                    </label>
                    <input type="number" step="0.01" name="exit_price" value={formData.exit_price} onChange={handleChange} className="input-field" />
                </div>
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    {t('label_sl')} <span className="text-slate-500">{t('opt_optional')}</span>
                    </label>
                    <input type="number" step="0.01" name="sl" value={formData.sl} onChange={handleChange} className="input-field" />
                </div>
             </div>

             {/* แถวที่ 6: TP, Strategy */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    {t('label_tp')} <span className="text-slate-500">{t('opt_optional')}</span>
                    </label>
                    <input type="number" step="0.01" name="tp" value={formData.tp} onChange={handleChange} className="input-field" />
                </div>
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    {t('label_strategy')} <span className="text-slate-500">{t('opt_optional')}</span>
                    </label>
                    <select name="strategy" value={formData.strategy} onChange={handleChange} className="input-field">
                      <option value="Trend Following">{t('opt_strat_trend')}</option>
                      <option value="Grid">{t('opt_strat_grid')}</option>
                      <option value="Scalping">{t('opt_strat_scalp')}</option>
                      <option value="Breakout">{t('opt_strat_break')}</option>
                      <option value="Range Trading">{t('opt_strat_range')}</option>
                    </select>
                </div>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('section_psycho')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_emotion')} <span className="text-slate-500">{t('opt_optional')}</span>
                </label>
                <input type="number" min="1" max="10" name="emotion" value={formData.emotion} onChange={handleChange} placeholder={t('ph_emotion')} className="input-field" />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  {t('label_mistake')}
                </label>
                <select name="main_mistake" value={formData.main_mistake} onChange={handleChange} className="input-field">
                  <option value="No Mistake">{t('opt_mis_no_mistake')}</option>
                  <option value="No SL">{t('opt_mis_no_sl')}</option>
                  <option value="Oversize">{t('opt_mis_oversize')}</option>
                  <option value="Overtrade">{t('opt_mis_overtrade')}</option>
                  <option value="FOMO">{t('opt_mis_fomo')}</option>
                  <option value="Revenge">{t('opt_mis_revenge')}</option>
                  <option value="No Plan">{t('opt_mis_no_plan')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
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

            <div className="mb-6">
              <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                {t('label_notes')} <span className="text-slate-500">{t('opt_optional')}</span>
              </label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="input-field" placeholder={t('ph_notes')} />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 mb-6">
              <p className="text-blue-300 text-xs sm:text-sm">
                💡 {t('msg_auto_calc')}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              {isSubmitting ? t('btn_saving') : t('btn_save')}
            </button>
          </form>
        </div>
      </div>
      <style jsx>{`
        .input-field {
          width: 100%;
          background-color: rgb(51 65 85); /* bg-slate-700 */
          color: white;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem; /* text-sm */
          border: 1px solid rgb(71 85 105); /* border-slate-600 */
          outline: none;
        }
        .input-field:focus {
          border-color: rgb(59 130 246); /* focus:border-blue-500 */
        }
        @media (min-width: 640px) {
          .input-field {
            font-size: 1rem; /* sm:text-base */
          }
        }
      `}</style>
    </div>
  );
}