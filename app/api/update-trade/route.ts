import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculateRR, calculateHoldingTime } from '@/lib/googleSheets';

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    const sheet = await getGoogleSheet();
    const rows = await sheet.getRows();

    const rowToUpdate = rows.find((row) => row.get('id') === id);

    if (!rowToUpdate) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    // คำนวณ Risk/Reward Ratio ใหม่
    let rr = updateData.risk_reward_ratio || '';
    if (updateData.entry_price && updateData.sl && updateData.tp && updateData.direction) {
      try {
        const entryPrice = parseFloat(updateData.entry_price);
        const sl = parseFloat(updateData.sl);
        const tp = parseFloat(updateData.tp);
        
        if (!isNaN(entryPrice) && !isNaN(sl) && !isNaN(tp)) {
          const rrValue = calculateRR(entryPrice, sl, tp, updateData.direction);
          if (!isNaN(rrValue) && isFinite(rrValue)) {
            rr = rrValue.toFixed(2);
          }
        }
      } catch (error) {
        console.error('Error calculating R:R:', error);
      }
    }

    // คำนวณ Holding Time ใหม่
    let holdingTime = updateData.holding_time || '';
    if (updateData.open_date && updateData.open_time && updateData.close_time) {
      try {
        // ใช้ close_date ที่ส่งมา หรือถ้าไม่มีให้ใช้ open_date
        const closeDate = updateData.close_date || updateData.open_date;

        holdingTime = calculateHoldingTime(
          `${updateData.open_date}T${updateData.open_time}`,
          `${closeDate}T${updateData.close_time}`
        );
      } catch (error) {
        console.error('Error calculating holding time:', error);
      }
    }

    // อัพเดทข้อมูลในแต่ละคอลัมน์ (ให้ตรงกับชื่อคอลัมน์ใหม่)
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
    rowToUpdate.set('pnl', updateData.pnl || '');
    rowToUpdate.set('pnl_pct', updateData.pnl_pct || '');
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
        risk_reward_ratio: rr,
        holding_time: holdingTime,
      }
    });

  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}