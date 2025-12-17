import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheet, calculatePnlPct, calculatePnl } from '@/lib/googleSheets';
import ExcelJS from 'exceljs';

// --- พจนานุกรมแปลข้อมูล (Data Translation) ---
const DATA_TRANSLATIONS: Record<string, string> = {
    // Strategy
    'Reversal': 'แนวเด้ง',
    'High Conviction': 'ไม้รวย',
    'Smart Money': 'ตามเจ้า',
    'Trend Following': 'เทรดตามเทรนด์',
    'Grid': 'วางออเดอร์เป็นชั้น ๆ',
    'Scalping': 'เก็งกำไรสั้น ๆ',
    'Breakout': 'เทรดตอนราคาทะลุ',
    'Range Trading': 'เทรดไซด์เวย์',
    // Pattern
    'Unclear': 'ไม่ชัดเจน',
    'Uptrend': 'เทรนขึ้น',
    'Downtrend': 'เทรนลง',
    'Bottom Zone': 'โซนล่าง',
    'Top Zone': 'โซนบน',
    'Sideways': 'Side way',
    // Mistake
    'No Mistake': 'ตามแผนปกติ',
    'No SL': 'ไม่ตั้ง SL',
    'Oversize': 'ออก Lot ใหญ่เกิน',
    'Overtrade': 'เทรดรัว ๆ',
    'FOMO': 'กลัวตกรถ',
    'Revenge': 'อยากเอาคืน',
    'No Plan': 'ไม่มีแผน',
    // Direction
    'Buy': 'Buy (ซื้อ)',
    'Sell': 'Sell (ขาย)',
};

// --- หัวตาราง (Headers) แยก 2 ภาษาชัดเจน ---
const HEADERS_EN = [
    'No.', 'Date', 'Symbol', 'Time Frame', 'Direction', 'Size (Lots)', 
    'Entry', 'Exit', 'Risk Dist. (SL)', 'Reward Dist. (TP)', 
    'P&L ($)', 'Strategy', 'Chart Pattern', 'Mistake', 'Notes'
];

const HEADERS_TH = [
    'ลำดับ', 'วันที่', 'สินทรัพย์', 'Time Frame', 'ทิศทาง', 'ขนาด (Lots)', 
    'ราคาเข้า', 'ราคาออก', 'ระยะ SL (จุด)', 'ระยะ TP (จุด)', 
    'กำไร/ขาดทุน ($)', 'กลยุทธ์', 'ลักษณะกราฟ', 'ข้อผิดพลาด', 'บันทึก'
];

const calculateDistance = (price1: number, price2: number, symbol: string) => {
    if (!price1 || !price2 || price1 === 0 || price2 === 0) return null;
    const dist = Math.abs(price1 - price2);
    const sym = (symbol || '').toUpperCase();
    let multiplier = 100;
    if (sym.includes('JPY')) multiplier = 1000;
    else if (price1 < 500 && !sym.includes('XAU') && !sym.includes('BTC')) multiplier = 100000;
    else if (sym.includes('BTC') || sym.includes('ETH')) multiplier = 1;
    return Math.round(dist * multiplier);
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    // รับค่าภาษา (Default = en)
    const lang = searchParams.get('lang') || 'en';
    const isThai = lang === 'th';

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Trades');
    const rows = await sheet.getRows();
    const userRows = rows.filter((row) => row.get('username') === username);

    // ฟังก์ชันแปลข้อมูล (ถ้าเป็นไทยให้แปล ถ้าอังกฤษใช้ค่าเดิม)
    const t = (val: string) => (isThai && DATA_TRANSLATIONS[val]) ? DATA_TRANSLATIONS[val] : val;

    const trades = userRows.map((row, index) => {
      const entry = parseFloat(row.get('entry_price') || '0');
      const exit = parseFloat(row.get('exit_price') || '0');
      const sl = parseFloat(row.get('sl') || '0');
      const tp = parseFloat(row.get('tp') || '0');
      const size = parseFloat(row.get('position_size') || '0');
      const dir = row.get('direction');
      const symbol = row.get('symbol') || '';
      
      let pnl = parseFloat(row.get('pnl') || '0');
      if (entry && exit && dir && pnl === 0) {
         const pnlStr = calculatePnl(entry, exit, size, dir);
         pnl = parseFloat(pnlStr);
      }

      const riskDist = calculateDistance(entry, sl, symbol);
      const rewardDist = calculateDistance(entry, tp, symbol);

      const timeFrame = row.get('time_frame') || row.get('timeFrame') || '';
      const chartPatternRaw = row.get('chart_pattern') || row.get('chartPattern') || '';

      return {
        no: index + 1, 
        date: row.get('open_date'),
        symbol: symbol,
        time_frame: timeFrame,
        direction: t(dir),               
        size: size,
        entry: entry,
        exit: exit,
        sl: sl,
        tp: tp,
        risk_dist: riskDist,
        reward_dist: rewardDist,
        pnl: pnl,
        pnl_pct: row.get('pnl_pct') || calculatePnlPct(entry, exit, dir),
        strategy: t(row.get('strategy')),  
        chart_pattern: t(chartPatternRaw),    
        mistake: t(row.get('main_mistake')),   
        notes: row.get('notes'),
      };
    }).reverse();

    // --- Excel Creation ---
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.pnl > 0).length;
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const grossProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? '∞' : '0.00');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trading Journal');

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
             worksheet.getCell(`C${r}`).font = { bold: true, color: { argb: totalPnL >= 0 ? 'FF16A34A' : 'FFDC2626' } };
        }
    });

    const statsWidths = [18, 22, 18, 18]; 
    statsWidths.forEach((w, i) => {
        worksheet.getColumn(i + 2).width = w; 
    });

    ['B3', 'C3', 'D3', 'E3', 'B4', 'C4', 'D4', 'E4'].forEach(cell => {
        worksheet.getCell(cell).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- Table Headers (เลือกตามภาษา) ---
    const tableHeaderRowIdx = 7;
    const headers = isThai ? HEADERS_TH : HEADERS_EN; 
    
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
            trade.no,
            trade.date,
            trade.symbol,
            trade.time_frame,   
            trade.direction,
            trade.size,         
            trade.entry,
            trade.exit,
            trade.risk_dist,  
            trade.reward_dist, 
            trade.pnl,
            trade.strategy,
            trade.chart_pattern,
            trade.mistake,
            trade.notes
        ];
        const row = worksheet.addRow(rowValues);
        const pnlCell = row.getCell(12); 
        pnlCell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';
        pnlCell.font = { bold: true, color: { argb: trade.pnl > 0 ? 'FF16A34A' : (trade.pnl < 0 ? 'FFDC2626' : 'FF000000') } };
        [2, 3, 4, 5, 6, 7, 13, 14, 15].forEach(c => row.getCell(c).alignment = { horizontal: 'center' });
        row.eachCell((cell, colNum) => {
            if (colNum > 1) cell.border = { bottom: { style: 'dotted', color: { argb: 'FFCBD5E1' } } };
        });
    });

    // Set Column Widths
    [2, 15, 15, 15, 15, 12, 15, 12, 12, 15, 15, 18, 20, 18, 18, 30].forEach((w, i) => worksheet.getColumn(i+1).width = w);

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Trading_Journal_${encodeURIComponent(username)}.xlsx"`, 
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to export' }, { status: 500 });
  }
}