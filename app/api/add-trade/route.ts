import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculateHoldingTime, calculatePnlPct, calculatePnl } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const sheet = await getGoogleSheet();

    // ตัวแปรสำหรับเก็บค่าที่คำนวณ
    let rr = '';
    let pnlPct = '';
    let pnlAmount = '';

    const entryPrice = parseFloat(data.entry_price);
    const exitPrice = parseFloat(data.exit_price);
    const positionSize = parseFloat(data.position_size); 
    const sl = parseFloat(data.sl);
    const tp = parseFloat(data.tp);

    // คำนวณ Risk/Reward Ratio
    if (!isNaN(entryPrice) && !isNaN(sl) && !isNaN(tp) && data.direction) {
      try {
        const rrValue = calculateRR(entryPrice, sl, tp, data.direction);
        if (!isNaN(rrValue) && isFinite(rrValue)) {
          rr = rrValue.toFixed(2);
        }
      } catch (error) {
        console.error('Error calculating R:R:', error);
      }
    }

    // คำนวณ P&L % และ P&L Amount อัตโนมัติ
    if (!isNaN(entryPrice) && !isNaN(exitPrice) && data.direction) {
       pnlPct = calculatePnlPct(entryPrice, exitPrice, data.direction);
       
       if (!isNaN(positionSize)) {
         pnlAmount = calculatePnl(entryPrice, exitPrice, positionSize, data.direction);
       }
    }

    // คำนวณ Holding Time
    let holdingTime = '';
    if (data.open_date && data.open_time && data.close_time) {
      try {
        const closeDate = data.close_date || data.open_date;
        holdingTime = calculateHoldingTime(
          `${data.open_date}T${data.open_time}`,
          `${closeDate}T${data.close_time}`
        );
      } catch (error) {
        console.error('Error calculating holding time:', error);
      }
    }

    // เตรียมข้อมูลสำหรับบันทึก
    const rowData = {
      id: Date.now().toString(),
      open_date: data.open_date || '',
      close_date: data.close_date || '',
      open_time: data.open_time || '',
      close_time: data.close_time || '',
      symbol: data.symbol || '',
      direction: data.direction || '',
      position_size: data.position_size || '',
      entry_price: data.entry_price || '',
      sl: data.sl || '',
      tp: data.tp || '',
      exit_price: data.exit_price || '',
      pnl: pnlAmount, 
      pnl_pct: pnlPct,
      strategy: data.strategy || '',
      risk_reward_ratio: rr,
      holding_time: holdingTime,
      emotion: data.emotion || '',
      main_mistake: data.main_mistake || '',
      followed_plan: data.followed_plan || 'false',
      notes: data.notes || '',
    };

    console.log('Data to be saved:', rowData);
    await sheet.addRow(rowData);

    return NextResponse.json({ success: true, message: 'Trade added successfully' });

  } catch (error) {
    console.error('Error adding trade:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add trade', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}