import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// ฟังก์ชันเชื่อมต่อ Google Sheets (สำหรับ google-spreadsheet v5+)
export async function getGoogleSheet() {
  try {
    // สร้าง JWT client สำหรับ Service Account Authentication
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    // สร้าง GoogleSpreadsheet instance
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID!,
      serviceAccountAuth
    );

    // โหลดข้อมูล document
    await doc.loadInfo();
    
    console.log('Connected to Google Sheet:', doc.title);
    
    const sheet = doc.sheetsByTitle['Trades'] || doc.sheetsByIndex[0];
    
    if (!sheet) {
      throw new Error('Sheet "Trades" not found in the Google Spreadsheet');
    }

    return sheet;
  } catch (error) {
    console.error('Error connecting to Google Sheets:', error);
    throw error;
  }
}

// ฟังก์ชันคำนวณ Risk/Reward Ratio
export function calculateRR(
  entry: number,
  sl: number,
  tp: number,
  direction: string
): number {
  try {
    if (direction === 'Buy') {
      const risk = entry - sl;
      const reward = tp - entry;
      return risk > 0 ? reward / risk : 0;
    } else {
      // Sell
      const risk = sl - entry;
      const reward = entry - tp;
      return risk > 0 ? reward / risk : 0;
    }
  } catch (error) {
    console.error('Error calculating R:R:', error);
    return 0;
  }
}

// ฟังก์ชันคำนวณ Holding Time (แสดงเป็น m / h m / d h)
export function calculateHoldingTime(openTime: string, closeTime: string): string {
  try {
    const open = new Date(openTime);
    const close = new Date(closeTime);
    const diffMs = close.getTime() - open.getTime();

    if (isNaN(diffMs) || diffMs <= 0) return '';

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    if (totalHours === 0) {
      return `${totalMinutes}m`;
    }
    if (totalDays === 0) {
      const remainMinutes = totalMinutes % 60;
      return remainMinutes === 0 ? `${totalHours}h` : `${totalHours}h ${remainMinutes}m`;
    }
    const remainHours = totalHours % 24;
    return remainHours === 0 ? `${totalDays}d` : `${totalDays}d ${remainHours}h`;
  } catch (error) {
    console.error('Error calculating holding time:', error);
    return '';
  }
}

// เพิ่มฟังก์ชันคำนวณ P&L % (Price Change %)
export function calculatePnlPct(
  entry: number,
  exit: number,
  direction: string
): string {
  try {
    if (!entry || !exit || entry === 0) return '';

    let pct = 0;
    if (direction === 'Buy') {
      pct = ((exit - entry) / entry) * 100;
    } else if (direction === 'Sell') {
      pct = ((entry - exit) / entry) * 100;
    }

    return pct.toFixed(2);
  } catch (error) {
    console.error('Error calculating P&L %:', error);
    return '';
  }
}

// เพิ่มฟังก์ชันคำนวณ P&L Amount (เงิน)
export function calculatePnl(
  entry: number,
  exit: number,
  positionSize: number,
  direction: string
): string {
  try {
    if (!entry || !exit || !positionSize) return '';

    let pnl = 0;
    if (direction === 'Buy') {
      pnl = (exit - entry) * positionSize;
    } else if (direction === 'Sell') {
      pnl = (entry - exit) * positionSize;
    }

    return pnl.toFixed(2);
  } catch (error) {
    console.error('Error calculating P&L:', error);
    return '';
  }
}
