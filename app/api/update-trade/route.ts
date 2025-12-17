import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculatePnl, calculatePnlPct, calculateHoldingTime } from '@/lib/googleSheets';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, field, value, username } = body;

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!id || !field || value === undefined || !username) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Trades');
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);

    if (!row) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
    }

    // ตรวจสอบความเป็นเจ้าของ
    const currentOwner = row.get('username');
    if (!currentOwner) {
        row.set('username', username);
    } else if (currentOwner !== username) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    row.set(field, value);

    // คำนวณค่าต่างๆ ใหม่ หากมีการแก้ไขตัวเลขที่เกี่ยวข้อง
    if (['entry_price', 'exit_price', 'position_size', 'sl', 'tp', 'open_date', 'close_date', 'open_time', 'close_time', 'direction'].includes(field)) {
        
        const entry = parseFloat(row.get('entry_price')) || 0;
        const exit = parseFloat(row.get('exit_price')) || 0;
        const size = parseFloat(row.get('position_size')) || 0;
        const sl = parseFloat(row.get('sl')) || 0;
        const tp = parseFloat(row.get('tp')) || 0;
        const dir = row.get('direction');

        // คำนวณ Risk:Reward
        if (entry && sl && tp && dir) {
            const rr = calculateRR(entry, sl, tp, dir);
            row.set('risk_reward_ratio', isFinite(rr) ? rr.toFixed(2) : '');
        }

        // คำนวณ PnL
        if (entry && exit && size && dir) {
            const pnl = calculatePnl(entry, exit, size, dir);
            row.set('pnl', pnl);
            row.set('pnl_pct', calculatePnlPct(entry, exit, dir));
        } else {
            // หากข้อมูลไม่ครบ ให้ล้างค่าที่เคยคำนวณไว้ (ป้องกันค่าเก่าค้าง)
            row.set('pnl', '');
            row.set('pnl_pct', '');
        }

        // คำนวณเวลาที่ถือออเดอร์
        const oDate = row.get('open_date');
        const oTime = row.get('open_time');
        const cDate = row.get('close_date') || oDate; 
        const cTime = row.get('close_time');

        if (oDate && oTime && cTime) {
            const timeStr = calculateHoldingTime(`${oDate}T${oTime}`, `${cDate}T${cTime}`);
            row.set('holding_time', timeStr);
        }
    }

    await row.save();
    return NextResponse.json({ success: true, message: 'Trade updated successfully' });

  } catch (error: any) {
    console.error('Error updating trade:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}