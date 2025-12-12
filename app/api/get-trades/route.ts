import { NextResponse } from 'next/server';
import { getGoogleSheet, calculatePnlPct, calculatePnl } from '@/lib/googleSheets';

export async function GET() {
  try {
    const sheet = await getGoogleSheet();
    const rows = await sheet.getRows();
    
    const trades = rows.map((row) => {
      const entryPrice = parseFloat(row.get('entry_price'));
      const exitPrice = parseFloat(row.get('exit_price'));
      const positionSize = parseFloat(row.get('position_size'));
      const direction = row.get('direction');
      
      let pnlPct = row.get('pnl_pct');
      let pnlAmount = row.get('pnl');

      // ✅ คำนวณค่าถ้ายังไม่มีใน Sheet
      if (!isNaN(entryPrice) && !isNaN(exitPrice) && direction) {
        if (!pnlPct || pnlPct === '') {
            pnlPct = calculatePnlPct(entryPrice, exitPrice, direction);
        }
        if ((!pnlAmount || pnlAmount === '') && !isNaN(positionSize)) {
            pnlAmount = calculatePnl(entryPrice, exitPrice, positionSize, direction);
        }
      }

      return {
        id: row.get('id'),
        open_date: row.get('open_date'),  
        close_date: row.get('close_date'), 
        open_time: row.get('open_time'),
        close_time: row.get('close_time'),
        symbol: row.get('symbol'),
        direction: direction,
        position_size: row.get('position_size'),
        entry_price: row.get('entry_price'),
        sl: row.get('sl'),
        tp: row.get('tp'),
        exit_price: row.get('exit_price'),
        pnl: pnlAmount,
        pnl_pct: pnlPct, 
        strategy: row.get('strategy'),
        risk_reward_ratio: row.get('risk_reward_ratio'),
        holding_time: row.get('holding_time'),
        emotion: row.get('emotion'),
        main_mistake: row.get('main_mistake'),
        followed_plan: row.get('followed_plan'),
        notes: row.get('notes'),
      };
    });
    
    return NextResponse.json({ success: true, trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}