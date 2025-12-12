import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculateHoldingTime, calculatePnlPct, calculatePnl } from '@/lib/googleSheets'; // ✅ เพิ่ม calculatePnl

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const sheet = await getGoogleSheet();
    const rows = await sheet.getRows();
    const rowToUpdate = rows.find((row) => row.get('id') === id);

    if (!rowToUpdate) {
      return NextResponse.json({ success: false, error: 'Trade not found' }, { status: 404 });
    }

    const entryPrice = parseFloat(updateData.entry_price);
    const exitPrice = parseFloat(updateData.exit_price);
    const positionSize = parseFloat(updateData.position_size);
    const sl = parseFloat(updateData.sl);
    const tp = parseFloat(updateData.tp);

    // คำนวณ R:R
    let rr = updateData.risk_reward_ratio || '';
    if (!isNaN(entryPrice) && !isNaN(sl) && !isNaN(tp) && updateData.direction) {
      try {
        const rrValue = calculateRR(entryPrice, sl, tp, updateData.direction);
        if (!isNaN(rrValue) && isFinite(rrValue)) rr = rrValue.toFixed(2);
      } catch (e) { console.error(e); }
    }

    // คำนวณ P&L Amount และ % ใหม่
    let pnlAmount = updateData.pnl || '';
    let pnlPct = updateData.pnl_pct || '';
    
    if (!isNaN(entryPrice) && !isNaN(exitPrice) && updateData.direction) {
        pnlPct = calculatePnlPct(entryPrice, exitPrice, updateData.direction);
        
        if (!isNaN(positionSize)) {
            pnlAmount = calculatePnl(entryPrice, exitPrice, positionSize, updateData.direction);
        }
    }

    // คำนวณ Holding Time
    let holdingTime = updateData.holding_time || '';
    if (updateData.open_date && updateData.open_time && updateData.close_time) {
        const closeDate = updateData.close_date || updateData.open_date;
        holdingTime = calculateHoldingTime(
          `${updateData.open_date}T${updateData.open_time}`,
          `${closeDate}T${updateData.close_time}`
        );
    }

    // อัพเดทข้อมูลลง Sheet
    rowToUpdate.set('open_date', updateData.open_date || '');
    rowToUpdate.set('close_date', updateData.close_date || '');
    rowToUpdate.set('open_time', updateData.open_time || '');
    rowToUpdate.set('close_time', updateData.close_time || '');
    rowToUpdate.set('symbol', updateData.symbol || '');
    rowToUpdate.set('direction', updateData.direction || '');
    rowToUpdate.set('position_size', updateData.position_size || '');
    rowToUpdate.set('entry_price', updateData.entry_price || '');
    rowToUpdate.set('sl', updateData.sl || '');
    rowToUpdate.set('tp', updateData.tp || '');
    rowToUpdate.set('exit_price', updateData.exit_price || '');
    rowToUpdate.set('pnl', pnlAmount);
    rowToUpdate.set('pnl_pct', pnlPct);
    rowToUpdate.set('strategy', updateData.strategy || '');
    rowToUpdate.set('risk_reward_ratio', rr);
    rowToUpdate.set('holding_time', holdingTime);
    rowToUpdate.set('emotion', updateData.emotion || '');
    rowToUpdate.set('main_mistake', updateData.main_mistake || '');
    rowToUpdate.set('followed_plan', updateData.followed_plan || 'false');
    rowToUpdate.set('notes', updateData.notes || '');

    await rowToUpdate.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Trade updated successfully',
      trade: {
        id,
        ...updateData,
        pnl: pnlAmount,
        pnl_pct: pnlPct,
        risk_reward_ratio: rr,
        holding_time: holdingTime,
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}