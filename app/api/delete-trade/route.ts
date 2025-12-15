import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Trade ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting trade:', id);

    const sheet = await getGoogleSheet();
    const rows = await sheet.getRows();

    // หาแถวที่ต้องการลบ
    const rowToDelete = rows.find((row) => row.get('id') === id);

    if (!rowToDelete) {
      return NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      );
    }

    // ลบแถว
    await rowToDelete.delete();

    console.log('✅ Trade deleted successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Trade deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}