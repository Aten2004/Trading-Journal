// ไฟล์: app/api/get-trades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculatePnlPct, calculatePnl, calculateHoldingTime } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentUser = searchParams.get('user');
    
    // รับค่า page และ limit จากหน้าเว็บ (ถ้าไม่ส่งมา ให้ใช้ค่าเริ่มต้น)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20'); // โหลดทีละ 20 รายการ

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized: User not specified' }, { status: 401 });
    }

    const sheet = await getGoogleSheet('Trades');
    const rows = await sheet.getRows();
    
    // กรองและกลับด้านข้อมูล (เอาล่าสุดขึ้นก่อน)
    const allUserRows = rows.filter((row) => row.get('username') === currentUser).reverse();

    // --- ส่วนการตัดแบ่งข้อมูล (Pagination Logic) ---
    const totalTrades = allUserRows.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRows = allUserRows.slice(startIndex, endIndex); // ตัดเอาเฉพาะช่วงที่ต้องการ

    const trades = paginatedRows.map((row) => {
      // ... (โค้ดส่วน map ข้อมูลเหมือนเดิมทุกอย่าง) ...
      const entryPrice = parseFloat(row.get('entry_price'));
      const exitPrice = parseFloat(row.get('exit_price'));
      const positionSize = parseFloat(row.get('position_size'));
      const direction = row.get('direction');
      
      let pnlPct = row.get('pnl_pct');
      let pnlAmount = row.get('pnl');
      let holdingTime = row.get('holding_time'); 

      if (!isNaN(entryPrice) && !isNaN(exitPrice) && direction) {
        if (!pnlPct || pnlPct === '') pnlPct = calculatePnlPct(entryPrice, exitPrice, direction);
        if ((!pnlAmount || pnlAmount === '') && !isNaN(positionSize)) pnlAmount = calculatePnl(entryPrice, exitPrice, positionSize, direction);
      }

      if ((!holdingTime || holdingTime === '') && row.get('open_date') && row.get('open_time') && row.get('close_time')) {
          const openDate = row.get('open_date');
          const closeDate = row.get('close_date') || openDate;
          const openTime = row.get('open_time');
          const closeTime = row.get('close_time');
          holdingTime = calculateHoldingTime(`${openDate}T${openTime}`, `${closeDate}T${closeTime}`);
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
        holding_time: holdingTime, 
        emotion: row.get('emotion'),
        main_mistake: row.get('main_mistake'),
        followed_plan: row.get('followed_plan'),
        notes: row.get('notes'),
      };
    });
    
    // ส่งข้อมูลกลับ พร้อมบอกว่ามีหน้าถัดไปไหม
    return NextResponse.json({ 
        success: true, 
        trades, 
        total: totalTrades,
        hasMore: endIndex < totalTrades // ถ้ายังมีข้อมูลเหลือ ให้เป็น true
    });

  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
} 