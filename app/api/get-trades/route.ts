import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const sheet = await getGoogleSheet();
    const rows = await sheet.getRows();
    
    const trades = rows.map((row) => ({
      id: row.get('id'),
      date: row.get('date'),
      open_time: row.get('open_time'),
      close_time: row.get('close_time'),
      symbol: row.get('symbol'),
      direction: row.get('direction'),
      position_size: row.get('position_size'),
      entry_price: row.get('entry_price'),
      sl: row.get('sl'),
      tp: row.get('tp'),
      exit_price: row.get('exit_price'),
      pnl: row.get('pnl'),
      pnl_pct: row.get('pnl_pct'),
      strategy: row.get('strategy'),
      risk_reward_ratio: row.get('risk_reward_ratio'),
      holding_time: row.get('holding_time'),
      emotion: row.get('emotion'),
      main_mistake: row.get('main_mistake'),
      followed_plan: row.get('followed_plan'),
      notes: row.get('notes'),
    }));
    
    return NextResponse.json({ success: true, trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
