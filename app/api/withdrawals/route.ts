import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  try {
    // รับ username จาก Query Params
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Withdrawals');
    const rows = await sheet.getRows();

    // กรองเฉพาะแถวที่เป็นของ username นี้
    const userRows = rows.filter((row) => row.get('username') === username);

    const withdrawals = userRows.map((row) => ({
      id: row.get('id'),
      date: row.get('date'),
      amount: parseFloat(row.get('amount') || '0'),
      bank: row.get('bank'),
      is_profit: row.get('is_profit') === 'TRUE',
      notes: row.get('notes'),
    }));

    // เรียงจากใหม่ไปเก่า
    withdrawals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // รับ username เข้ามาด้วย
    const { date, amount, bank, is_profit, notes, username } = body;

    if (!username) {
       return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Withdrawals');
    
    await sheet.addRow({
      id: uuidv4(),
      username, 
      date,
      amount: amount.toString(),
      bank,
      is_profit: is_profit ? 'TRUE' : 'FALSE',
      notes,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding withdrawal:', error);
    return NextResponse.json({ error: 'Failed to add data' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, date, amount, bank, is_profit, notes, username } = body;

    const sheet = await getGoogleSheet('Withdrawals');
    const rows = await sheet.getRows();
    
    // หา id และต้องตรงกับ username ด้วย
    const row = rows.find((r) => r.get('id') === id);

    if (row) {
      if (row.get('username') !== username) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      row.assign({
        date,
        amount: amount.toString(),
        bank,
        is_profit: is_profit ? 'TRUE' : 'FALSE',
        notes,
      });
      await row.save();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username'); // รับ username มาเช็คด้วย

    if (!id || !username) return NextResponse.json({ error: 'Missing ID or Username' }, { status: 400 });

    const sheet = await getGoogleSheet('Withdrawals');
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);

    if (row) {
      // เช็คความเป็นเจ้าของ
      if (row.get('username') !== username) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      await row.delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}