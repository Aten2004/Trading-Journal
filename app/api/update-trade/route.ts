import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculatePnl, calculatePnlPct, calculateHoldingTime } from '@/lib/googleSheets';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, field, value, username } = body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!id || !field || value === undefined || !username) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Trades');
    const rows = await sheet.getRows();

    // 2. ค้นหาแถวที่ต้องการแก้ไขจาก ID
    const row = rows.find((r) => r.get('id') === id);

    if (!row) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
    }

    // 3. 🛡️ ระบบ Auto-Claim: ถ้าไม่มีเจ้าของ ให้ยึดเป็นของเราทันที
    const currentOwner = row.get('username');
    if (!currentOwner) {
        row.set('username', username); // ใส่ชื่อเราลงไป
    } else if (currentOwner !== username) {
        // ถ้ามีเจ้าของแล้ว และไม่ใช่เรา -> ห้ามแก้
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // 4. อัปเดตค่าที่ส่งมา
    row.set(field, value);

    // 5. 🔄 คำนวณค่าต่างๆ ใหม่ (ใช้ค่าเดิมผสมค่าใหม่ เพื่อกันข้อมูลหาย)
    if (['entry_price', 'exit_price', 'position_size', 'sl', 'tp', 'open_date', 'close_date', 'open_time', 'close_time', 'direction'].includes(field)) {
        
        // ดึงค่าปัจจุบันจาก Row (ถ้า field ไหนถูกแก้ มันจะใช้ค่าใหม่ที่เพิ่ง set ไปข้างบน)
        const entry = parseFloat(row.get('entry_price')) || 0;
        const exit = parseFloat(row.get('exit_price')) || 0;
        const size = parseFloat(row.get('position_size')) || 0;
        const sl = parseFloat(row.get('sl')) || 0;
        const tp = parseFloat(row.get('tp')) || 0;
        const dir = row.get('direction');

        // คำนวณ RR
        if (entry && sl && tp && dir) {
            const rr = calculateRR(entry, sl, tp, dir);
            row.set('risk_reward_ratio', isFinite(rr) ? rr.toFixed(2) : '');
        }

        // คำนวณ PnL
        if (entry && exit && size && dir) {
            const pnl = calculatePnl(entry, exit, size, dir);
            const pct = calculatePnlPct(entry, exit, dir);
            row.set('pnl', pnl);
            row.set('pnl_pct', pct);
        }

        // คำนวณเวลาที่ถือ
        const oDate = row.get('open_date');
        const oTime = row.get('open_time');
        const cDate = row.get('close_date') || oDate; 
        const cTime = row.get('close_time');

        if (oDate && oTime && cTime) {
            const timeStr = calculateHoldingTime(`${oDate}T${oTime}`, `${cDate}T${cTime}`);
            row.set('holding_time', timeStr);
        }
    }

    // 6. บันทึกลง Google Sheet
    await row.save();

    return NextResponse.json({ success: true, message: 'Trade updated successfully' });

  } catch (error: any) {
    console.error('Error updating trade:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}