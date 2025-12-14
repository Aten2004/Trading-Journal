import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getGoogleSheet(sheetTitle: string = 'Trades') {
  // ✅ 1. เช็คก่อนว่าตั้งค่า .env ครบไหม (ป้องกัน Error 500 แบบงงๆ)
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_ID) {
    throw new Error('❌ Missing Google Sheets Environment Variables. Please check .env.local');
  }

  try {
    // ✅ 2. เตรียมการเชื่อมต่อ (แก้ปัญหา \n ใน Private Key)
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEETS_ID,
      serviceAccountAuth
    );

    // ✅ 3. โหลดข้อมูล Sheet
    await doc.loadInfo();
    
    // ลองดึง Sheet ตามชื่อ
    let sheet = doc.sheetsByTitle[sheetTitle];
    
    // 🔥 4. ระบบแก้ปัญหาอัตโนมัติ: ถ้าหา Tab "Users" ไม่เจอ -> สร้างให้เลย!
    if (!sheet && sheetTitle === 'Users') {
      console.log('⚠️ ไม่พบ Tab "Users" - กำลังสร้างให้ใหม่...');
      try {
        sheet = await doc.addSheet({ 
            title: 'Users', 
            headerValues: ['id', 'username', 'password', 'created_at'] 
        });
        console.log('✅ สร้าง Tab "Users" เรียบร้อยแล้ว!');
      } catch (e) {
        console.error('Failed to create Users sheet:', e);
      }
    }

    // 🔥 5. Fallback: ถ้าหา Tab "Trades" ไม่เจอ ให้ใช้อันแรกสุดแก้ขัดไปก่อน
    if (!sheet) {
      if (sheetTitle === 'Trades' && doc.sheetsByIndex[0]) {
          console.log('⚠️ ไม่พบ Tab "Trades" โดยตรง - ระบบจะใช้ Tab แรกสุดแทน');
          return doc.sheetsByIndex[0];
      }
      // Debug: ปริ้นชื่อ Tab ทั้งหมดที่มีออกมาดู
      console.log('Tabs ที่มีอยู่จริง:', doc.sheetsByIndex.map(s => s.title));
      throw new Error(`Sheet "${sheetTitle}" not found. Available sheets: ${doc.sheetsByIndex.map(s => s.title).join(', ')}`);
    }

    return sheet;

  } catch (error) {
    console.error('❌ Error connecting to Google Sheets:', error);
    throw error; // ส่ง Error ต่อไปให้ API รู้เรื่อง
  }
}

// --- ฟังก์ชันคำนวณ (Helper Functions) ---

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

export function calculateHoldingTime(openTime: string, closeTime: string): string {
  try {
    // แปลง string เป็น Date Object เพื่อคำนวณ
    const open = new Date(openTime); // รองรับทั้ง "2023-01-01" และ "2023-01-01T10:00:00"
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
    // ไม่ต้อง error log ถี่เกินไปกรณีคำนวณไม่ได้ (เช่น วันที่ยังไม่ครบ)
    return '';
  }
}

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