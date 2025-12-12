'use client';

import { useState } from 'react';
import Navbar from './components/Navbar';

export default function Home() {
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
    followed_plan: 'true',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/add-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('✅ บันทึกเทรดสำเร็จ!');
        setFormData({
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
          followed_plan: 'true',
          notes: '',
        });
      } else {
        setMessage('❌ เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      setMessage('❌ ไม่สามารถบันทึกข้อมูลได้');
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
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">บันทึกการเทรด</h2>
            <p className="text-slate-400 text-sm sm:text-base">บันทึกการเทรดของคุณอย่างเป็นระบบ</p>
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
              ข้อมูลการเทรด | Trade Details
            </h2>

            {/* แถวที่ 1: Symbol + Open Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  สินทรัพย์ | Symbol <span className="text-slate-500">(optional)</span>
                </label>
                <select
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option>XAUUSD</option>
                  <option>EURUSD</option>
                  <option>GBPUSD</option>
                  <option>USDJPY</option>
                  <option>BTCUSD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  วันที่เปิด | Open Date <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="date"
                  name="open_date"
                  value={formData.open_date}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* แถวที่ 2: Open Time + Close Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  เวลาที่เปิด | Open Time <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="time"
                  name="open_time"
                  value={formData.open_time}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  วันที่ปิด | Close Date <span className="text-slate-500 text-xs">(ว่าง = วันเดียวกับเปิด)</span>
                </label>
                <input
                  type="date"
                  name="close_date"
                  value={formData.close_date}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* แถวที่ 3: Close Time + Direction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  เวลาที่ปิด | Close Time <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="time"
                  name="close_time"
                  value={formData.close_time}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  ทิศทาง | Direction <span className="text-slate-500">(optional)</span>
                </label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
              </div>
            </div>

            {/* ส่วนที่เหลือของฟอร์ม (Position, Prices, P&L, Strategy...) เหมือนเดิม */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Position Size */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    ขนาดออเดอร์ | Position Size (Troy Oz) <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="position_size"
                    value={formData.position_size}
                    onChange={handleChange}
                    placeholder="เช่น 1, 0.5, 2"
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Entry Price */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    ราคาเข้า | Entry Price <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="entry_price"
                    value={formData.entry_price}
                    onChange={handleChange}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Exit Price */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    ราคาออก | Exit Price <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="exit_price"
                    value={formData.exit_price}
                    onChange={handleChange}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Stop Loss */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    จุดตัดขาดทุน | Stop Loss <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="sl"
                    value={formData.sl}
                    onChange={handleChange}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Take Profit */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    จุดทำกำไร | Take Profit <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="tp"
                    value={formData.tp}
                    onChange={handleChange}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* P&L */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    กำไร/ขาดทุน | P&L <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="pnl"
                    value={formData.pnl}
                    onChange={handleChange}
                    placeholder="เช่น 100, -50"
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* P&L % */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    กำไร/ขาดทุน % | P&L % <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    name="pnl_pct"
                    value={formData.pnl_pct}
                    onChange={handleChange}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Strategy */}
                <div>
                    <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                    กลยุทธ์ | Strategy <span className="text-slate-500">(optional)</span>
                    </label>
                    <select
                    name="strategy"
                    value={formData.strategy}
                    onChange={handleChange}
                    className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                    <option>Trend Following</option>
                    <option>Grid</option>
                    <option>Scalping</option>
                    <option>Breakout</option>
                    <option>Range Trading</option>
                    </select>
                </div>
            </div>

            {/* จิตวิทยาและวินัย */}
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">จิตวิทยาและวินัย | Psychology & Discipline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  ระดับอารมณ์ | Emotion Level (1-10) <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  name="emotion"
                  value={formData.emotion}
                  onChange={handleChange}
                  placeholder="1 = สงบมาก | 10 = กลัว/โลภมาก"
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  ข้อผิดพลาดหลัก | Main Mistake
                </label>
                <select
                  name="main_mistake"
                  value={formData.main_mistake}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option>No Mistake</option>
                  <option>No SL</option>
                  <option>Oversize</option>
                  <option>Overtrade</option>
                  <option>FOMO</option>
                  <option>Revenge</option>
                  <option>No Plan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                  ทำตามแผนไหม | Followed Plan?
                </label>
                <select
                  name="followed_plan"
                  value={formData.followed_plan}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Yes ✓</option>
                  <option value="false">No ✗</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 mb-2 text-sm sm:text-base">
                บันทึกเพิ่มเติม | Notes <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full bg-slate-700 text-white rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="ทำไมเข้า/ออก? สภาพตลาดเป็นอย่างไร? มีอะไรที่ควรปรับปรุง?"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 mb-6">
              <p className="text-blue-300 text-xs sm:text-sm">
                💡 <strong>Risk/Reward Ratio</strong> และ <strong>Holding Time</strong> จะถูกคำนวณอัตโนมัติ
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกเทรด | Save Trade'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}