import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculatePnlPct, calculatePnl, calculateHoldingTime } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentUser = searchParams.get('user');
    
    // รับค่า page และ limit จากหน้าเว็บ
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized: User not specified' }, { status: 401 });
    }

    const sheet = await getGoogleSheet('Trades');
    const rows = await sheet.getRows();
    
    // กรองและกลับด้านข้อมูล (เอาล่าสุดขึ้นก่อน)
    const allUserRows = rows.filter((row) => row.get('username') === currentUser).reverse();

    // --- Pagination Logic ---
    const totalTrades = allUserRows.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRows = allUserRows.slice(startIndex, endIndex);

    const trades = paginatedRows.map((row) => {
      const direction = row.get('direction');
      const symbol = row.get('symbol') || '';
      const entryPrice = parseFloat(row.get('entry_price'));
      const exitPrice = parseFloat(row.get('exit_price'));
      const positionSize = parseFloat(row.get('position_size'));

      // คำนวณค่าต่างๆ 
      let pnlPct = row.get('pnl_pct');
      let pnlAmount = row.get('pnl');

      if ((!pnlPct || !pnlAmount) && !isNaN(entryPrice) && !isNaN(exitPrice)) {
          pnlPct = calculatePnlPct(entryPrice, exitPrice, direction);
          pnlAmount = calculatePnl(entryPrice, exitPrice, positionSize, direction, symbol);
      }
      
      let holdingTime = row.get('holding_time');
      if (!holdingTime || holdingTime === '') {
          const openDate = row.get('open_date');
          const closeDate = row.get('close_date') || openDate;
          const openTime = row.get('open_time');
          const closeTime = row.get('close_time');
          // ต้องมีครบถึงจะคำนวณได้
          if (openDate && openTime && closeTime) {
             holdingTime = calculateHoldingTime(`${openDate}T${openTime}`, `${closeDate}T${closeTime}`);
          }
      }

      // ดึงค่าจาก Sheet (รองรับทั้งชื่อเก่าและชื่อใหม่ เผื่อหัวตารางไม่ตรงกัน)
      const timeFrame = row.get('timeFrame') || row.get('time_frame') || ''; 
      const chartPattern = row.get('chartPattern') || row.get('chart_pattern') || '';

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
        
        // ค่าที่คำนวณหรือดึงมา
        pnl: pnlAmount,
        pnl_pct: pnlPct, 
        risk_reward_ratio: row.get('risk_reward_ratio'),
        holding_time: holdingTime, 
        
        time_frame: timeFrame,
        chart_pattern: chartPattern,
        strategy: row.get('strategy'), 
        emotion: row.get('emotion'),
        main_mistake: row.get('main_mistake'),
        followed_plan: row.get('followed_plan'),
        notes: row.get('notes'),
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      trades,
      total: totalTrades,
      page,
      totalPages: Math.ceil(totalTrades / limit),
      hasMore: endIndex < totalTrades
    });

  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch trades' }, { status: 500 });
  }
}