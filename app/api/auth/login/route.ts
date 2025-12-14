import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. เช็คว่ากรอกข้อมูลครบไหม
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'กรุณากรอก Username และ Password' }, { status: 400 });
    }

    // 2. ดึงข้อมูลจาก Sheet "Users"
    const sheet = await getGoogleSheet('Users');
    const rows = await sheet.getRows();

    // 3. ค้นหา User
    const userRecord = rows.find((row) => row.get('username') === username);

    if (!userRecord) {
      return NextResponse.json({ success: false, error: 'ไม่พบชื่อผู้ใช้นี้' }, { status: 401 });
    }

    // 4. ตรวจสอบรหัสผ่าน (เปรียบเทียบรหัสที่กรอก กับ Hash ใน Sheet)
    const isMatch = await bcrypt.compare(password, userRecord.get('password'));

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // 5. Login สำเร็จ -> ส่งข้อมูลกลับไป
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: userRecord.get('id'),
        username: userRecord.get('username') 
      } 
    });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, error: 'เข้าสู่ระบบล้มเหลว' }, { status: 500 });
  }
}