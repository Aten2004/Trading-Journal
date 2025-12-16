'use client';

import { useState } from 'react';
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
  sl: string;
  tp: string;
  exit_price: string;
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

interface TradesTableProps {
  trades: Trade[];
  onRefresh: (page?: number) => Promise<void> | void;
}

export default function TradesTable({ trades, onRefresh }: TradesTableProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleCellClick = (tradeId: string, field: string, currentValue: string) => {
    // ห้ามแก้ไขช่องที่คำนวณอัตโนมัติ
    if (['pnl', 'pnl_pct', 'risk_reward_ratio', 'holding_time'].includes(field)) return;

    setEditingCell({ id: tradeId, field });
    setEditValue(currentValue);
  };

  // เพิ่ม Constants สำหรับ Dropdown ใน Component หรือนอก Component
  const TIME_FRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
  const CHART_PATTERNS = ['Unclear', 'Uptrend', 'Downtrend', 'Bottom Zone', 'Top Zone', 'Sideways'];

  const STRATEGIES = [
    'Reversal',        
    'High Conviction',
    'Smart Money',      
    'Trend Following',
    'Grid',
    'Scalping',
    'Breakout',
    'Range Trading'
  ];

  const getStrategyLabel = (strat: string) => {
    const map: { [key: string]: string } = {
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

  // Helper สำหรับแปล Pattern
  const getPatternLabel = (pat: string) => {
    const map: { [key: string]: string } = {
      'Unclear': t('opt_pat_unclear'),
      'Uptrend': t('opt_pat_uptrend'),
      'Downtrend': t('opt_pat_downtrend'),
      'Bottom Zone': t('opt_pat_bottom'),
      'Top Zone': t('opt_pat_top'),
      'Sideways': t('opt_pat_sideways'),
    };
    return map[pat] || pat;
  };

  const calculateDistance = (price1: string, price2: string, symbol: string) => {
    const p1 = parseFloat(price1);
    const p2 = parseFloat(price2);
    if (isNaN(p1) || isNaN(p2) || p1 === 0 || p2 === 0) return '-';
    
    const dist = Math.abs(p1 - p2);
    const sym = (symbol || '').toUpperCase();
    
    let multiplier = 100; // ค่า Default (สำหรับ ทองคำ/XAU, น้ำมัน, หุ้น) -> ทศนิยม 2 ตำแหน่ง ($1 = 100 จุด)

    if (sym.includes('JPY')) {
        // คู่เงิน JPY (เช่น USDJPY) ทศนิยม 3 ตำแหน่ง -> 1 Yen = 1000 จุด
        multiplier = 1000; 
    } else if (p1 < 500 && !sym.includes('XAU') && !sym.includes('BTC')) {
        // Forex คู่เงินทั่วไป (เช่น EURUSD) ทศนิยม 5 ตำแหน่ง -> 0.00001 = 1 จุด
        multiplier = 100000;
    } else if (sym.includes('BTC') || sym.includes('ETH')) {
        // Crypto (Bitcoin/ETH) -> มักนับ $1 = 1 จุด (ถ้าต้องการละเอียดแบบ Satoshis ให้เปลี่ยนเป็น 100)
        multiplier = 1;
    }
    return Math.round(dist * multiplier).toLocaleString();
  };

  const handleSave = async (tradeId: string, field: string) => {
    if (!user) return;

    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    if (String(trade[field as keyof Trade]) === editValue) {
        setEditingCell(null);
        return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/update-trade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tradeId,       
          field: field,      
          value: editValue, 
          username: user.username, 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await onRefresh();
        setMessage(t('tt_save_success'));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage((result.error || 'Update failed'));
      }
    } catch (error) {
      console.error(error);
      setMessage(t('tt_save_error'));
    } finally {
      setSaving(false);
      setEditingCell(null);
    }
  };

  const handleDelete = async (tradeId: string) => {
    if (!confirm(t('tt_confirm_del'))) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/delete-trade?id=${tradeId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await onRefresh();
        setMessage(t('tt_del_success'));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (error) {
      setMessage(t('tt_del_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tradeId: string, field: string) => {
    if (e.key === 'Enter') {
      handleSave(tradeId, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const getTrans = (key: string, type: 'strat' | 'mistake') => {
    if (type === 'strat') {
        const map: {[key: string]: string} = {
            'Trend Following': t('opt_strat_trend'),
            'Grid': t('opt_strat_grid'),
            'Scalping': t('opt_strat_scalp'),
            'Breakout': t('opt_strat_break'),
            'Range Trading': t('opt_strat_range'),
        };
        return map[key] || key;
    }
    if (type === 'mistake') {
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
    }
    return key;
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderEditableCell = (trade: Trade, field: keyof Trade) => {
    const isEditing = editingCell?.id === trade.id && editingCell?.field === field;
    const value = trade[field];

    // --- ส่วนการแก้ไข (Edit Mode) ---
    if (isEditing) {
      if (field === 'symbol') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[100px] bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option>XAUUSD</option>
            <option>EURUSD</option>
            <option>GBPUSD</option>
            <option>USDJPY</option>
            <option>BTCUSD</option>
          </select>
        );
      }

      if (field === 'time_frame') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[60px] bg-slate-600 text-white rounded px-2 py-1 text-xs"
          >
            <option value="">{t('opt_unspecified')}</option>
            {TIME_FRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
          </select>
        );
      }
      
      if (field === 'chart_pattern') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[80px] bg-slate-600 text-white rounded px-2 py-1 text-xs"
          >
            {CHART_PATTERNS.map((p) => <option key={p} value={p}>{getPatternLabel(p)}</option>)}
          </select>
        );
      }

      if (field === 'direction') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[100px] bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option value="Buy">Buy (ซื้อ)</option>
            <option value="Sell">Sell (ขาย)</option>
          </select>
        );
      }

      if (field === 'strategy') {
        return (
          <select 
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)} 
            onBlur={() => handleSave(trade.id, field)} 
            autoFocus 
            className="w-full min-w-[80px] max-w-[110px] bg-slate-600 text-white rounded px-1 py-1 text-xs truncate"
          >
            {STRATEGIES.map(s => (
                <option key={s} value={s}>{getStrategyLabel(s)}</option>
            ))}
          </select>
        );
      }
      
    if (field === 'main_mistake') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[100px] bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option value="No Mistake">{t('opt_mis_no_mistake')}</option>
            <option value="No SL">{t('opt_mis_no_sl')}</option>
            <option value="Oversize">{t('opt_mis_oversize')}</option>
            <option value="Overtrade">{t('opt_mis_overtrade')}</option>
            <option value="FOMO">{t('opt_mis_fomo')}</option>
            <option value="Revenge">{t('opt_mis_revenge')}</option>
            <option value="No Plan">{t('opt_mis_no_plan')}</option>
          </select>
        );
      }

      if (field === 'followed_plan') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[80px] bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      }

      if (field === 'emotion') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full min-w-[60px] bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>{num}</option>
             ))}
          </select>
        );
      }

      // Input fields
      if (field === 'notes') {
        return (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            rows={3}
            className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      }

      // Default Input
      return (
        <input
          type={field.includes('date') ? 'date' : field.includes('time') ? 'time' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSave(trade.id, field)}
          onKeyDown={(e) => handleKeyDown(e, trade.id, field)}
          autoFocus
          className="w-full min-w-[100px] bg-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    // --- ส่วนการแสดงผล (Display Mode) ---

    // Followed Plan Logic
    if (field === 'followed_plan') {
        let displayPlan = 'No';
        const valLower = String(value).toLowerCase();
        if (valLower === 'yes' || valLower === 'true') {
            displayPlan = 'Yes';
        }

        return (
          <div
            onClick={() => {
              setEditingCell({ id: trade.id, field });
              setEditValue(displayPlan); 
            }}
            className={`cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 min-h-[32px] flex items-center font-bold ${
                displayPlan === 'Yes' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {displayPlan}
          </div>
        );
    }

    if (field === 'strategy') {
      return (
        <div onClick={() => handleCellClick(trade.id, field, value)} className="cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 min-h-[32px] flex items-center whitespace-nowrap">
          {value} 
        </div>
      );
    }

    if (field === 'chart_pattern') {
      return (
        <div onClick={() => handleCellClick(trade.id, field, value)} className="cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 min-h-[32px] flex items-center whitespace-nowrap">
          {value}
        </div>
      );
    }

    const displayValue = field === 'notes' ? truncateText(value, 30) : (value || '-');

    // แสดงผลช่อง P&L Amount (Auto Calculated) + สี
    if (field === 'pnl' && value) {
        const numValue = parseFloat(value);
        const colorClass = numValue > 0 ? 'text-green-400 font-bold' : numValue < 0 ? 'text-red-400 font-bold' : 'text-slate-300';
        return (
            <div className={`cursor-default ${colorClass} whitespace-nowrap`}>
                {numValue > 0 ? '+' : ''}{parseFloat(value).toFixed(2)} USD
            </div>
        );
    }

    // แสดงผลช่อง P&L % (Auto Calculated) + สี
    if (field === 'pnl_pct' && value) {
        const numValue = parseFloat(value);
        const colorClass = numValue > 0 ? 'text-green-400' : numValue < 0 ? 'text-red-400' : 'text-slate-300';
        return (
            <div className={`cursor-default ${colorClass} whitespace-nowrap`}>
                {numValue > 0 ? '+' : ''}{parseFloat(value).toFixed(2)}%
            </div>
        );
    }

    return (
      <div
        onClick={() => handleCellClick(trade.id, field, value)}
        className="cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 min-h-[32px] flex items-center"
        title={field === 'notes' ? value : undefined}
      >
        {displayValue === '-' ? <span className="text-slate-500">-</span> : displayValue}
      </div>
    );
  };

  // Pagination
  const displayTrades = trades;
  const totalPages = Math.ceil(displayTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = displayTrades.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-xl">{t('msg_loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}
        >
          {message}
        </div>
      )}

      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {t('tt_edit_hint')}
        </p>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        {trades.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xl mb-2">{t('tt_no_data')}</p>
            <a
              href="/"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {t('tt_btn_start')}
            </a>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_no')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_symbol')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_open_date')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_close_date')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_open_time')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_close_time')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_dir')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('label_time_frame')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_pos')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_entry')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_exit')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_sl')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_tp')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">{t('th_pnl')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">{t('th_pnl_pct')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">{t('th_risk_dist')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">{t('th_reward_dist')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">{t('th_rr')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">{t('th_time')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_strategy')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('label_chart_pattern')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_emo')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_mistake')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_plan')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm min-w-[200px]">{t('th_notes')}</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">{t('th_del')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrades.map((trade, index) => (
                    <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-2 px-4 text-slate-400 text-sm">{trades.length - (startIndex + index)}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'symbol')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'open_date')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'close_date')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'open_time')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'close_time')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'direction')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'time_frame')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'position_size')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'entry_price')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'exit_price')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'sl')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'tp')}</td>
                      <td className="py-2 px-4 bg-blue-500/5 text-sm font-medium">
                        {renderEditableCell(trade, 'pnl')}
                      </td>
                      <td className="py-2 px-4 bg-blue-500/5 text-sm font-medium">
                        {renderEditableCell(trade, 'pnl_pct')}
                      </td>
                      <td className="py-2 px-4 bg-blue-500/5 ">
                        <div className="text-slate-400 text-sm">
                          {calculateDistance(trade.entry_price, trade.sl, trade.symbol)}
                        </div>
                      </td>
                      <td className="py-2 px-4 bg-blue-500/5">
                        <div className="text-slate-400 text-sm">
                          {calculateDistance(trade.tp, trade.entry_price, trade.symbol)}
                        </div>
                      </td>
                      <td className="py-2 px-4 bg-blue-500/5">
                        <div className="text-slate-400 text-xs">
                          {trade.risk_reward_ratio ? `${parseFloat(trade.risk_reward_ratio).toFixed(1)}:1` : '-'}
                        </div>
                      </td>
                      <td className="py-2 px-4 bg-blue-500/5">
                        <div className="text-slate-400 text-xs whitespace-nowrap">
                          {trade.holding_time && trade.holding_time.trim() !== '' 
                            ? trade.holding_time 
                            : '-'}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'strategy')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'chart_pattern')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'emotion')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'main_mistake')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'followed_plan')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">
                        <div className="max-w-[200px] overflow-hidden text-ellipsis">
                          {renderEditableCell(trade, 'notes')}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleDelete(trade.id)}
                          disabled={saving}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-700">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
                >
                  {t('tt_prev')}
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
                >
                  {t('tt_next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-slate-400 text-sm text-center">
        {trades.length} {t('tt_page_info')} {currentPage}/{totalPages}
      </div>
    </div>
  );
}