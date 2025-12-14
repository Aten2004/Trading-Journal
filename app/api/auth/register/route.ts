import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';  

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. ตรวจสอบข้อมูลเบื้องต้น
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอก Username และ Password' },
        { status: 400 }
      );
    }

    // 2. เชื่อมต่อ Google Sheet เลือก Tab "Users"
    const sheet = await getGoogleSheet('Users');
    const rows = await sheet.getRows();

    // 3. เช็คว่ามี Username นี้อยู่แล้วหรือยัง
    const existingUser = rows.find((row) => row.get('username') === username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username นี้ถูกใช้งานแล้ว' },
        { status: 409 } // 409 Conflict
      );
    }

    // 4. เข้ารหัส Password (เพื่อความปลอดภัย ไม่เก็บเป็น Text ธรรมดา)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. บันทึกข้อมูลลง Sheet
    await sheet.addRow({
      id: uuidv4(),
      username: username,
      password: hashedPassword,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'สมัครสมาชิกสำเร็จ' 
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    );
  }
}