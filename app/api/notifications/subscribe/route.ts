import { NextResponse } from 'next/server';
import { getGoogleSheet } from '@/lib/googleSheets';
import webpush from 'web-push';

webpush.setVapidDetails(
  `mailto:${process.env.GOOGLE_VAPID_SUBJECT || 'test@test.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.GOOGLE_VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { subscription, username, userId } = await req.json();
    
    if (!subscription || !subscription.endpoint || !username) {
        return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Subscriptions');
    const rows = await sheet.getRows();
    const timestamp = new Date().toISOString();

    const existingRow = rows.find(row => 
      row.get('endpoint')?.trim() === subscription.endpoint?.trim()
    );

    // ✅ สร้างตัวแปรเช็คว่าเป็นสมาชิกใหม่หรือไม่
    let isNewSubscriber = false;

    if (existingRow) {
       // ถ้ามีอยู่แล้ว แค่อัปเดตข้อมูล (ไม่ต้องส่ง Noti)
       existingRow.assign({
           user_id: userId,        
           username: username, 
           keys_auth: subscription.keys.auth,
           keys_p256dh: subscription.keys.p256dh,
           is_active: 'TRUE', 
           last_updated: timestamp
       });
       await existingRow.save();
       console.log(`Updated ownership of endpoint to ${username}`);

    } else {
       // ถ้ายังไม่มี เพิ่มใหม่ และตั้งค่า isNewSubscriber = true
       await sheet.addRow({
            user_id: userId,
            username: username,
            endpoint: subscription.endpoint,
            keys_auth: subscription.keys.auth,
            keys_p256dh: subscription.keys.p256dh,
            is_active: 'TRUE',
            last_updated: timestamp
        });
       isNewSubscriber = true; // <--- ระบุว่าเป็นคนใหม่
       console.log(`Registered new endpoint for ${username}`);
    }

    // ✅ ส่งแจ้งเตือนเฉพาะเมื่อเป็นคนใหม่เท่านั้น (isNewSubscriber === true)
    if (isNewSubscriber) {
        try {
            const payload = JSON.stringify({
                title: `🔔 ยินดีต้อนรับคุณ ${username}!`,
                body: 'ระบบแจ้งเตือนเชื่อมต่อสำเร็จแล้ว พร้อมรับข่าวสารและสรุปการเทรดครับ',
                url: '/dashboard'
            });

            await webpush.sendNotification(subscription, payload);
            console.log('Welcome notification sent.');
            
        } catch (err) {
            console.error('Failed to send welcome notification:', err);
        }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe Error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}