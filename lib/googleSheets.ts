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
    
    // ดึงชีตแรก หรือชีตที่ชื่อ 'Trades'
    const sheet = doc.sheetsByTitle['Trades'] || doc.sheetsByIndex[0];
    
    if (!sheet) {
      throw new Error('Sheet "Trades" not found in the Google Spreadsheet');
    }

    console.log('Using sheet:', sheet.title);

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

    // กรณีไม่ถึง 1 ชั่วโมง
    if (totalHours === 0) {
      return `${totalMinutes}m`;
    }

    // กรณีไม่ถึง 1 วัน
    if (totalDays === 0) {
      const remainMinutes = totalMinutes % 60;
      return remainMinutes === 0
        ? `${totalHours}h`
        : `${totalHours}h ${remainMinutes}m`;
    }

    // กรณีมากกว่า 1 วัน
    const remainHours = totalHours % 24;
    return remainHours === 0
      ? `${totalDays}d`
      : `${totalDays}d ${remainHours}h`;
  } catch (error) {
    console.error('Error calculating holding time:', error);
    return '';
  }
}
