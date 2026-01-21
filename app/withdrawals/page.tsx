'use client';

import { useState, useEffect, useMemo, useCallback } from 'react'; 
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext'; // เพิ่ม import

interface Withdrawal {
  id: string;
  date: string;
  amount: number;
  bank: string;
  is_profit: boolean;
  notes: string;
}

const THAI_BANKS = [
  { code: 'KBANK', name: 'ธ.กสิกรไทย (KBANK)' },
  { code: 'SCB', name: 'ธ.ไทยพาณิชย์ (SCB)' },
  { code: 'BBL', name: 'ธ.กรุงเทพ (BBL)' },
  { code: 'KTB', name: 'ธ.กรุงไทย (KTB)' },
  { code: 'BAY', name: 'ธ.กรุงศรีฯ (BAY)' },
  { code: 'TTB', name: 'ธ.ทหารไทยธนชาต (ttb)' },
  { code: 'GSB', name: 'ธ.ออมสิน (GSB)' },
  { code: 'KKP', name: 'ธ.เกียรตินาคินภัทร (KKP)' },
  { code: 'CIMBT', name: 'ธ.ซีไอเอ็มบี ไทย (CIMBT)' },
  { code: 'TISCO', name: 'ธ.ทิสโก้ (TISCO)' },
  { code: 'UOB', name: 'ธ.ยูโอบี (UOB)' },
  { code: 'LHFG', name: 'ธ.แลนด์ แอนด์ เฮ้าส์ (LH Bank)' },
  { code: 'BAAC', name: 'ธ.ก.ส. (BAAC)' },
  { code: 'GHB', name: 'ธ.อาคารสงเคราะห์ (GH Bank)' },
  { code: 'ICBC', name: 'ธ.ไอซีบีซี (ICBC)' },
  { code: 'OTHER', name: 'อื่นๆ (Other)' },
];

export default function WithdrawalsPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage(); // เรียกใช้ useLanguage
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [id, setId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('KBANK');
  const [isProfit, setIsProfit] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter State
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Tax Calculation State
  const [otherIncome, setOtherIncome] = useState(0);

  const fetchWithdrawals = useCallback(async () => {
    if (!user) return; 

    try {
      const res = await fetch(`/api/withdrawals?username=${user.username}`);
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error('Failed to load withdrawals', error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchWithdrawals();
    }
  }, [user, fetchWithdrawals]);

  const resetForm = () => {
    setId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setBank('KBANK');
    setIsProfit(true);
    setNotes('');
    setIsEditMode(false);
  };

  const handleEdit = (item: Withdrawal) => {
    setId(item.id);
    setDate(item.date);
    setAmount(item.amount.toString());
    setBank(THAI_BANKS.find(b => item.bank.includes(b.code))?.code || 'OTHER');
    setIsProfit(item.is_profit);
    setNotes(item.notes);
    setIsEditMode(true);
    window.scrollTo({ top: 810, behavior: 'smooth' });
  };

  const handleDelete = async (deleteId: string) => {
    if (!confirm(t('confirm_delete'))) return; // ใช้ t()
    if (!user) return;
    
    try {
      const res = await fetch(`/api/withdrawals?id=${deleteId}&username=${user.username}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchWithdrawals();
        if (id === deleteId) resetForm();
        showNotification(t('msg_delete_success'), 'success'); // ใช้ t()
      } else {
        showNotification(t('msg_delete_fail'), 'error'); // ใช้ t()
      }
    } catch (error) {
      console.error(error);
      showNotification(t('msg_delete_error'), 'error'); // ใช้ t()
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const body = {
        id, 
        username: user.username, 
        date,
        amount,
        bank: THAI_BANKS.find(b => b.code === bank)?.name || bank,
        is_profit: isProfit,
        notes,
      };

      await fetch('/api/withdrawals', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      resetForm();
      fetchWithdrawals();
      showNotification(isEditMode ? t('msg_update_success') : t('msg_save_success'), 'success'); // ใช้ t()
    } catch (error) {
      showNotification(t('msg_save_error'), 'error'); // ใช้ t()
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTax = (netIncome: number) => {
    let tax = 0;
    if (netIncome > 150000) tax += (Math.min(netIncome, 300000) - 150000) * 0.05;
    if (netIncome > 300000) tax += (Math.min(netIncome, 500000) - 300000) * 0.10;
    if (netIncome > 500000) tax += (Math.min(netIncome, 750000) - 500000) * 0.15;
    if (netIncome > 750000) tax += (Math.min(netIncome, 1000000) - 750000) * 0.20;
    if (netIncome > 1000000) tax += (Math.min(netIncome, 2000000) - 1000000) * 0.25;
    if (netIncome > 2000000) tax += (netIncome - 2000000) * 0.30;
    return tax;
  };

  const availableYears = useMemo(() => {
    const years = withdrawals.map(w => new Date(w.date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [withdrawals]);

  const filteredWithdrawals = withdrawals.filter(w => {
    if (selectedYear === 'ALL') return true;
    return new Date(w.date).getFullYear().toString() === selectedYear;
  });

  const totalWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalProfitWithdrawn = filteredWithdrawals.filter(w => w.is_profit).reduce((sum, w) => sum + w.amount, 0);
  
  const estimatedDeduction = 160000; 
  const totalAssessableIncome = otherIncome + totalProfitWithdrawn;
  const netTaxableIncome = Math.max(0, totalAssessableIncome - estimatedDeduction);
  const estimatedTax = calculateTax(netTaxableIncome);

  if (isLoading) return null; 
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">

        {notification && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transition-all transform animate-fade-in-down flex items-center gap-3 border backdrop-blur-md ${
          notification.type === 'success' 
            ? 'bg-slate-900/90 border-green-500/50 text-green-400 shadow-green-900/20' 
            : 'bg-slate-900/90 border-red-500/50 text-red-400 shadow-red-900/20'
        }`}>
          <span className="text-2xl">{notification.type === 'success' ? '🎉' : '⚠️'}</span>
          <div>
            <p className="font-bold text-sm">{notification.type === 'success' ? t('title_success') : t('title_error')}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">💸 {t('withdraw_title')}</h1>
            <p className="text-slate-400 text-sm">{t('withdraw_subtitle')} ({user.username})</p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
             <span className="text-slate-400 text-sm pl-2">{t('label_year')}</span>
             <select 
               value={selectedYear}
               onChange={(e) => setSelectedYear(e.target.value)}
               className="bg-slate-950 text-white text-sm py-1 px-3 rounded-lg border border-slate-700 outline-none focus:border-blue-500"
             >
               <option value="ALL">{t('option_all_time')}</option>
               {availableYears.map(year => (
                 <option key={year} value={year}>{year}</option>
               ))}
             </select>
          </div>
        </div>

        {/* 1. Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-slate-400 text-xs mb-1">{t('card_total_withdrawn')} ({selectedYear === 'ALL' ? t('option_all_time') : selectedYear})</p>
                <p className="text-2xl font-bold text-blue-400">฿{totalWithdrawn.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-slate-400 text-xs mb-1">{t('card_profit_only')}</p>
                <p className="text-2xl font-bold text-green-400">฿{totalProfitWithdrawn.toLocaleString()}</p>
            </div>
             <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-slate-400 text-xs mb-1">{t('card_transactions')}</p>
                <p className="text-2xl font-bold text-white">{filteredWithdrawals.length} <span className="text-sm font-normal text-slate-500">{t('unit_times')}</span></p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-8xl">⚖️</span>
                </div>
                <p className="text-slate-300 text-xs mb-1 flex items-center gap-1">
                   {t('card_est_tax')}
                   <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded">Est.</span>
                </p>
                <p className="text-2xl font-bold text-red-400">฿{estimatedTax.toLocaleString()}</p>
            </div>
        </div>

        {/* Warning Disclaimer */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
           <span className="text-xl">⚠️</span>
           <div>
             <h4 className="text-yellow-500 font-bold text-sm">{t('tax_warning_title')}</h4>
             <p className="text-yellow-200/70 text-xs mt-1 leading-relaxed">
               {t('tax_warning_desc')}
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3. Left Column (Tax Settings & Form) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
                
                <div className="bg-slate-900/80 border border-slate-700/50 p-5 rounded-2xl relative overflow-hidden shadow-lg">

                    <div className="flex items-center gap-2 mb-3">
                        <h4 className="text-sm font-bold text-slate-200">{t('tax_settings_title')}</h4>
                    </div>
                    
                    <div className="space-y-2 relative z-10">
                        <label className="block text-xs text-slate-400">
                            {t('label_other_income')} <br/>
                        </label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={otherIncome === 0 ? '' : otherIncome}
                                onChange={(e) => setOtherIncome(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-blue-500 placeholder:text-slate-800"
                                placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">THB</span>
                        </div>
                    </div>
                </div>

                {/* --- กล่อง 2: ฟอร์มบันทึกรายการ (Form Section) --- */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">
                            {isEditMode ? t('form_title_edit') : t('form_title_add')}
                        </h3>
                        {isEditMode && (
                            <button onClick={resetForm} className="text-xs text-slate-400 hover:text-white underline">
                            {t('btn_cancel')}
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t('label_withdraw_date')}</label>
                            <input 
                                type="date" 
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker()}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t('label_amount_withdraw')}</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-blue-500 placeholder:text-slate-800"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">THB</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t('label_bank')}</label>
                            <select 
                                value={bank}
                                onChange={(e) => setBank(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                            >
                                {THAI_BANKS.map(b => (
                                    <option key={b.code} value={b.code}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <input 
                                type="checkbox"
                                checked={isProfit}
                                onChange={(e) => setIsProfit(e.target.checked)}
                                className="w-4 h-4 accent-blue-500"
                                id="isProfit"
                            />
                            <label htmlFor="isProfit" className="text-xs text-slate-300 cursor-pointer">
                                {t('label_is_profit')} <br/>
                                <span className="text-[10px] text-slate-500">{t('label_is_profit_note')}</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">{t('label_notes')}</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('ph_notes_withdraw')}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 h-20 resize-none text-sm"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`w-full font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 text-white
                            ${isEditMode ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}
                            `}
                        >
                            {isSubmitting ? t('btn_saving') : (isEditMode ? t('btn_update_withdraw') : t('btn_save_withdraw'))}
                        </button>
                    </form>
                </div>
            </div>

            {/* 4. Table Section */}
            <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{t('table_title_history')} ({filteredWithdrawals.length})</h3>
                </div>

                {filteredWithdrawals.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        {t('table_no_data')} {selectedYear !== 'ALL' && `${t('label_year')} ${selectedYear}`}
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse min-w-[600px] relative">
                                <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10 shadow-sm border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-medium">{t('th_date')}</th>
                                        <th className="p-4 font-medium">{t('th_bank')}</th>
                                        <th className="p-4 font-medium text-right">{t('th_amount')}</th>
                                        <th className="p-4 font-medium text-center">{t('th_type')}</th>
                                        <th className="p-4 font-medium">{t('th_note')}</th>
                                        <th className="p-4 font-medium text-center">{t('th_manage')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredWithdrawals.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-slate-300 text-sm whitespace-nowrap">
                                                {new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric'})}
                                            </td>
                                            <td className="p-4 text-slate-300 text-sm">
                                                {item.bank}
                                            </td>
                                            <td className="p-4 text-white font-bold text-sm text-right">
                                                ฿{item.amount.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.is_profit ? (
                                                    <span className="inline-block px-2 py-1 text-[10px] font-bold bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                                                        {t('type_profit')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-1 text-[10px] font-bold bg-slate-700 text-slate-300 rounded-full">
                                                        {t('type_capital')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-slate-500 text-xs max-w-[150px] truncate">
                                                {item.notes || '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(item)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                <p className="text-center text-xs text-slate-600 sm:hidden mt-2">
                   {t('msg_mobile_scroll')}
                </p>
            </div>

        </div>
      </main>
    </div>
  );
}