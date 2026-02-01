import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();
    
    const sheet = await getGoogleSheet('Subscriptions');
    const rows = await sheet.getRows();

    // หาแถวที่มี endpoint ตรงกัน
    const rowToUpdate = rows.find(row => row.get('endpoint') === endpoint);
    
    if (rowToUpdate) {
        // ปิดสถานะ
        rowToUpdate.set('is_active', 'FALSE'); 
        rowToUpdate.set('last_updated', new Date().toISOString());
        await rowToUpdate.save();
        
        return NextResponse.json({ success: true, message: 'Unsubscribed (Status updated)' });
    }

    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}