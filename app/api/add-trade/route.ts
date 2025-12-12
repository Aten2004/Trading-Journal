import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculateHoldingTime } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const sheet = await getGoogleSheet();

    // คำนวณ Risk/Reward Ratio
    let rr = '';
    if (data.entry_price && data.sl && data.tp && data.direction) {
      try {
        const entryPrice = parseFloat(data.entry_price);
        const sl = parseFloat(data.sl);
        const tp = parseFloat(data.tp);
        
        if (!isNaN(entryPrice) && !isNaN(sl) && !isNaN(tp)) {
          const rrValue = calculateRR(entryPrice, sl, tp, data.direction);
          if (!isNaN(rrValue) && isFinite(rrValue)) {
            rr = rrValue.toFixed(2);
          }
        }
      } catch (error) {
        console.error('Error calculating R:R:', error);
      }
    }

    // คำนวณ Holding Time (รองรับกรณีไม่เลือกวันปิด)
    let holdingTime = '';
    // เช็คว่ามี open_date และเวลาทั้งเปิด/ปิด ครบไหม
    if (data.open_date && data.open_time && data.close_time) {
      try {
        // ถ้า user ไม่กรอก close_date ให้ถือว่าปิดวันเดียวกับ open_date
        const closeDate = data.close_date || data.open_date;

        holdingTime = calculateHoldingTime(
          `${data.open_date}T${data.open_time}`,
          `${closeDate}T${data.close_time}`
        );
      } catch (error) {
        console.error('Error calculating holding time:', error);
      }
    }

    // เตรียมข้อมูลสำหรับบันทึก (ให้ตรงกับชื่อคอลัมน์ใน Google Sheet เป๊ะๆ)
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
      pnl: data.pnl || '',
      pnl_pct: data.pnl_pct || '',
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

    return NextResponse.json({ 
      success: true, 
      message: 'Trade added successfully' 
    });

  } catch (error) {
    console.error('Error adding trade:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}