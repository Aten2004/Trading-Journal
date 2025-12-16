import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getGoogleSheet, calculateRR, calculateHoldingTime, calculatePnlPct, calculatePnl } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.username) {
        return NextResponse.json({ success: false, error: 'Missing username' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Trades');

    // ตั้งค่า Default วัน/เวลาปัจจุบัน ถ้าไม่ได้ส่งมา
    const now = new Date();
    // ดึงวันที่ปัจจุบัน (YYYY-MM-DD)
    const defaultDate = now.toISOString().split('T')[0]; 
    // ดึงเวลาปัจจุบัน (HH:MM)
    const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5); 

    // ใช้ค่าที่ส่งมา หรือถ้าไม่มีให้ใช้ค่าปัจจุบัน
    const openDate = data.open_date || defaultDate;
    const openTime = data.open_time || defaultTime;

    let rr = '';
    let pnlPct = '';
    let pnlAmount = '';

    const entryPrice = parseFloat(data.entry_price);
    const exitPrice = parseFloat(data.exit_price);
    const positionSize = parseFloat(data.position_size); 
    const sl = parseFloat(data.sl);
    const tp = parseFloat(data.tp);

    if (!isNaN(entryPrice) && !isNaN(sl) && !isNaN(tp) && data.direction) {
      try {
        const rrValue = calculateRR(entryPrice, sl, tp, data.direction);
        if (!isNaN(rrValue) && isFinite(rrValue)) rr = rrValue.toFixed(2);
      } catch (error) { console.error('Error RR', error); }
    }

    if (!isNaN(entryPrice) && !isNaN(exitPrice) && data.direction) {
       pnlPct = calculatePnlPct(entryPrice, exitPrice, data.direction);
       if (!isNaN(positionSize)) pnlAmount = calculatePnl(entryPrice, exitPrice, positionSize, data.direction);
    }

    let holdingTime = '';
    // ใช้ openDate/openTime ที่มีค่าแน่นอนแล้ว มาคำนวณ
    if (openDate && openTime && data.close_time) {
      try {
        const closeDate = data.close_date || openDate; // ถ้าไม่ใส่วันปิด ให้ใช้วันเดียวกับวันเปิด
        holdingTime = calculateHoldingTime(`${openDate}T${openTime}`, `${closeDate}T${data.close_time}`);
      } catch (error) { console.error('Error holding time', error); }
    }

    // เตรียมข้อมูลบันทึก
    const rowData = {
      id: uuidv4(),
      username: data.username, 
      open_date: openDate,   
      open_time: openTime,    
      close_date: data.close_date || '',
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
      time_frame: data.time_frame || '',     
      chart_pattern: data.chart_pattern || '',
      risk_reward_ratio: rr,
      holding_time: holdingTime,
      emotion: data.emotion || '',
      main_mistake: data.main_mistake || '',
      followed_plan: data.followed_plan || 'Yes',
      notes: data.notes || '',
    };

    await sheet.addRow(rowData);

    return NextResponse.json({ success: true, message: 'Trade added successfully' });

  } catch (error) {
    console.error('Error adding trade:', error);
    return NextResponse.json({ success: false, error: 'Failed to add trade' }, { status: 500 });
  }
}
