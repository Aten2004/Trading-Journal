import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculateHoldingTime } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log ข้อมูลที่ได้รับเพื่อ debug
    console.log('Received data:', data);
    
    const sheet = await getGoogleSheet();

    // คำนวณ Risk/Reward Ratio (เฉพาะถ้ามีข้อมูลครบและเป็นตัวเลข)
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
        // ไม่ทำอะไร - ปล่อยให้ rr เป็นค่าว่าง
      }
    }

    // คำนวณ Holding Time (เฉพาะถ้ามีข้อมูลครบ)
    let holdingTime = '';
    if (data.date && data.open_time && data.close_time) {
      try {
        holdingTime = calculateHoldingTime(
          `${data.date}T${data.open_time}`,
          `${data.date}T${data.close_time}`
        );
      } catch (error) {
        console.error('Error calculating holding time:', error);
        // ไม่ทำอะไร - ปล่อยให้ holdingTime เป็นค่าว่าง
      }
    }

    // เตรียมข้อมูลสำหรับบันทึก
    const rowData = {
      id: Date.now().toString(),
      date: data.date || '',
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

    // เพิ่มแถวใหม่ใน Google Sheet
    await sheet.addRow(rowData);

    console.log('Trade saved successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Trade added successfully' 
    });

  } catch (error) {
    console.error('Error adding trade:', error);
    
    // ส่งข้อมูล error ที่ละเอียดขึ้น
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
