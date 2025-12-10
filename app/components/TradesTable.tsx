'use client';

import { useState } from 'react';  // ลบ useEffect ออก

interface Trade {
  id: string;
  date: string;
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
  risk_reward_ratio: string;
  holding_time: string;
  emotion: string;
  main_mistake: string;
  followed_plan: string;
  notes: string;
}

interface TradesTableProps {
  trades: Trade[];
  onRefresh: () => Promise<void> | void;
}

export default function TradesTable({ trades, onRefresh }: TradesTableProps) {
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ❌ ลบ useEffect, fetchTrades, handleRefresh ทั้งหมดออก

  const handleCellClick = (tradeId: string, field: string, currentValue: string) => {
    setEditingCell({ id: tradeId, field });
    setEditValue(currentValue);
  };

  const handleSave = async (tradeId: string, field: string) => {
    setSaving(true);
    setMessage('');
    try {
      const trade = trades.find((t) => t.id === tradeId);
      if (!trade) return;

      const updatedTrade = { ...trade, [field]: editValue };
      const response = await fetch('/api/update-trade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTrade),
      });

      const result = await response.json();
      if (result.success) {
        // ✅ เรียก onRefresh แทน setTrades
        await onRefresh();
        setMessage('✅ บันทึกสำเร็จ');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (error) {
      setMessage('❌ ไม่สามารถบันทึกได้');
    } finally {
      setSaving(false);
      setEditingCell(null);
    }
  };

  const handleDelete = async (tradeId: string) => {
    if (!confirm('ต้องการลบข้อมูลนี้?')) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch(`/api/delete-trade?id=${tradeId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        // ✅ เรียก onRefresh แทน setTrades
        await onRefresh();
        setMessage('✅ ลบสำเร็จ');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + result.error);
      }
    } catch (error) {
      setMessage('❌ ไม่สามารถลบได้');
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

  // ฟังก์ชันตัดข้อความ
  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderEditableCell = (trade: Trade, field: keyof Trade) => {
    const isEditing = editingCell?.id === trade.id && editingCell?.field === field;
    const value = trade[field] || '';

    if (isEditing) {
      // Dropdown fields
      if (field === 'symbol') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(trade.id, field)}
            autoFocus
            className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option>XAUUSD</option>
            <option>EURUSD</option>
            <option>GBPUSD</option>
            <option>USDJPY</option>
            <option>BTCUSD</option>
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
            className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option>Buy</option>
            <option>Sell</option>
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
            className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option>Trend Following</option>
            <option>Grid</option>
            <option>Scalping</option>
            <option>Breakout</option>
            <option>Range Trading</option>
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
            className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option>No Mistake</option>
            <option>No SL</option>
            <option>Oversize</option>
            <option>Overtrade</option>
            <option>FOMO</option>
            <option>Revenge</option>
            <option>No Plan</option>
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
            className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
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

      return (
        <input
          type={field === 'date' ? 'date' : field.includes('time') ? 'time' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSave(trade.id, field)}
          onKeyDown={(e) => handleKeyDown(e, trade.id, field)}
          autoFocus
          className="w-full bg-slate-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    // แสดง Notes แบบตัดคำ
    const displayValue = field === 'notes' ? truncateText(value, 30) : (value || '-');

    return (
      <div
        onClick={() => handleCellClick(trade.id, field, value)}
        className="cursor-pointer hover:bg-slate-700/50 rounded px-2 py-1 min-h-[32px] flex items-center"
        title={field === 'notes' ? value : undefined} // แสดง tooltip เมื่อ hover
      >
        {displayValue === '-' ? <span className="text-slate-500">-</span> : displayValue}
      </div>
    );
  };

  // Pagination
  const reversedTrades = trades.slice().reverse();
  const totalPages = Math.ceil(reversedTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrades = reversedTrades.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-xl">กำลังโหลด...</div>
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
          คลิกที่ช่องเพื่อแก้ไข • กด Enter เพื่อบันทึก • กด Esc เพื่อยกเลิก
        </p>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        {trades.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-xl mb-2">🤷 ยังไม่มีข้อมูลเทรด</p>
            <a
              href="/"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              เริ่มบันทึกเทรด
            </a>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">#</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">วันที่</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">เวลาเปิด</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">เวลาปิด</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Symbol</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Direction</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Position</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Entry</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Exit</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">SL</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">TP</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">P&L</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">P&L %</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">R:R</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm bg-blue-500/10">Holding</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Strategy</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Emotion</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Mistake</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">Plan?</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm min-w-[200px]">Notes</th>
                    <th className="text-left text-slate-300 py-4 px-4 font-semibold text-sm">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrades.map((trade, index) => (
                    <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-2 px-4 text-slate-400 text-sm">{trades.length - (startIndex + index)}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'date')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'open_time')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'close_time')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'symbol')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'direction')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'position_size')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'entry_price')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'exit_price')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'sl')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'tp')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'pnl')}</td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'pnl_pct')}</td>
                      <td className="py-2 px-4 bg-blue-500/5">
                        <div className="text-slate-400 text-xs">
                          {trade.risk_reward_ratio ? `${parseFloat(trade.risk_reward_ratio).toFixed(1)}:1` : '-'}
                        </div>
                      </td>
                      <td className="py-2 px-4 bg-blue-500/5">
                        <div className="text-slate-400 text-xs">
                          {trade.holding_time ? `${trade.holding_time}h` : '-'}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-slate-300 text-sm">{renderEditableCell(trade, 'strategy')}</td>
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
                  ← ก่อนหน้า
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
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-slate-400 text-sm text-center">
        {trades.length} เทรด • แสดงหน้า {currentPage}/{totalPages} • Auto-refresh ทุก 30 วินาที
      </div>
    </div>
  );
}
