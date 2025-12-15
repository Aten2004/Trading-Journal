import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculatePnlPct, calculatePnl } from '@/lib/googleSheets';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    // รับค่า Username จาก URL
    const username = request.nextUrl.searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    // ต้องระบุชื่อ Sheet ว่า 'Trades' เพื่อให้ดึงข้อมูลถูก Tab
    const sheet = await getGoogleSheet('Trades');
    const rows = await sheet.getRows();

    // กรองข้อมูล: เอาเฉพาะแถวที่เป็นของ Username นี้
    const userRows = rows.filter((row) => row.get('username') === username);

    // เตรียมข้อมูลสำหรับลง Excel
    const trades = userRows.map((row) => {
      const entry = parseFloat(row.get('entry_price') || '0');
      const exit = parseFloat(row.get('exit_price') || '0');
      const size = parseFloat(row.get('position_size') || '0');
      const dir = row.get('direction');
      
      let pnl = parseFloat(row.get('pnl') || '0');
      
      // คำนวณ PnL เผื่อใน Sheet ยังไม่ได้บันทึกค่านี้
      if (entry && exit && dir && pnl === 0) {
         const pnlStr = calculatePnl(entry, exit, size, dir);
         pnl = parseFloat(pnlStr);
      }

      return {
        date: row.get('open_date'),
        symbol: row.get('symbol'),
        direction: dir,
        entry: entry,
        exit: exit,
        size: size,
        pnl: pnl,
        pnl_pct: row.get('pnl_pct') || calculatePnlPct(entry, exit, dir),
        strategy: row.get('strategy'),
        mistake: row.get('main_mistake'),
        notes: row.get('notes'),
      };
    }).reverse(); // เรียงจากใหม่ไปเก่า

    // --- ส่วนการสร้างไฟล์ Excel (เหมือนเดิม) ---
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.pnl > 0).length;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '∞' : '0.00');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trading Journal');

    // Header Summary
    worksheet.mergeCells('B2:E2');
    const titleCell = worksheet.getCell('B2');
    titleCell.value = `📊 Trading Performance: ${username}`;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; 
    titleCell.alignment = { horizontal: 'center' };

    const stats = [
      ['Total Trades', totalTrades, 'Win Rate', `${winRate.toFixed(1)}%`],
      ['Total P&L', `${totalPnL.toFixed(2)} USD`, 'Profit Factor', profitFactor]
    ];

    stats.forEach((stat, index) => {
        const r = index + 3;
        worksheet.getCell(`B${r}`).value = stat[0];
        worksheet.getCell(`C${r}`).value = stat[1];
        worksheet.getCell(`D${r}`).value = stat[2];
        worksheet.getCell(`E${r}`).value = stat[3];
        
        [`B${r}`, `D${r}`].forEach(c => {
            worksheet.getCell(c).font = { bold: true, color: { argb: 'FF475569' } };
            worksheet.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        });
        
        if (stat[0] === 'Total P&L') {
             worksheet.getCell(`C${r}`).font = { 
                 bold: true, 
                 color: { argb: totalPnL >= 0 ? 'FF16A34A' : 'FFDC2626' } 
             };
        }
    });

    ['B3', 'C3', 'D3', 'E3', 'B4', 'C4', 'D4', 'E4'].forEach(cell => {
        worksheet.getCell(cell).border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    });

    const tableHeaderRowIdx = 7;
    const headers = ['Date', 'Symbol', 'Direction', 'Entry', 'Exit', 'Size', 'P&L ($)', 'Strategy', 'Mistake', 'Notes'];
    
    worksheet.getRow(tableHeaderRowIdx).values = [null, ...headers];
    
    const headerRow = worksheet.getRow(tableHeaderRowIdx);
    headerRow.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = { bottom: { style: 'medium' } };
        }
    });

    trades.forEach((trade) => {
        const rowValues = [
            null,
            trade.date,
            trade.symbol,
            trade.direction,
            trade.entry,
            trade.exit,
            trade.size,
            trade.pnl,
            trade.strategy,
            trade.mistake,
            trade.notes
        ];
        const row = worksheet.addRow(rowValues);

        const pnlCell = row.getCell(8);
        pnlCell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';
        pnlCell.font = { 
            bold: true, 
            color: { argb: trade.pnl > 0 ? 'FF16A34A' : (trade.pnl < 0 ? 'FFDC2626' : 'FF000000') } 
        };

        [2, 3, 4, 9, 10].forEach(c => row.getCell(c).alignment = { horizontal: 'center' });
        
        row.eachCell((cell, colNum) => {
            if (colNum > 1) {
                cell.border = { bottom: { style: 'dotted', color: { argb: 'FFCBD5E1' } } };
            }
        });
    });

    worksheet.getColumn(1).width = 2;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 12;
    worksheet.getColumn(4).width = 8;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 12;
    worksheet.getColumn(7).width = 10;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 18;
    worksheet.getColumn(10).width = 15;
    worksheet.getColumn(11).width = 30;

    const buffer = await workbook.xlsx.writeBuffer();

    // ส่งไฟล์กลับ
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // ใช้ encodeURIComponent เพื่อรองรับชื่อที่มีเว้นวรรคหรือภาษาไทย
        'Content-Disposition': `attachment; filename="Trading_Journal_${encodeURIComponent(username)}.xlsx"`, 
      },
    });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to export' }, { status: 500 });
  }
} 