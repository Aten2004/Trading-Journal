import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getGoogleSheet } from '@/lib/googleSheets';

// ตั้งค่า VAPID
webpush.setVapidDetails(
  `mailto:${process.env.GOOGLE_VAPID_SUBJECT || 'test@test.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.GOOGLE_VAPID_PRIVATE_KEY!
);

// --- 1. คลังข้อความ (Message Vaults) ---

const WEEKEND_MESSAGES = [
  { title: '🏖️ ตลาดปิด พักใจบ้าง', body: 'การพักผ่อนก็คือส่วนหนึ่งของการเทรด ชาร์จแบตให้เต็มที่!', url: '/dashboard' },
  { title: '📚 วันหยุด = วันเรียนรู้', body: 'ว่างๆ ลองทบทวนกราฟสัปดาห์ที่ผ่านมาดูไหม? มีอะไรพลาดไปบ้าง?', url: '/dashboard' },
  { title: '🧘 Mindset Sunday', body: '"อย่าไล่ตามเงิน ให้ไล่ตามความถูกต้อง แล้วเงินจะตามมาเอง"', url: '/dashboard' },
  { title: '🧹 Big Cleaning Day', body: 'เคลียร์สมอง เคลียร์กราฟ เตรียมแผนสำหรับวันจันทร์หรือยัง?', url: '/news' },
  { title: '💡 เกร็ดความรู้', body: 'รู้ไหม? เทรดเดอร์ส่วนใหญ่แพ้ภัยตัวเอง ไม่ใช่แพ้ตลาด', url: '/dashboard' },
  { title: '🥱 วันหยุดเป็นไงบ้าง', body: 'มาเช็คข่าวสารสำหรับเริ่มสัปดาห์ใหม่กัน', url: '/news' },
  { title: '🎬 พักสายตาจากกราฟบ้าง', body: 'หาหนังดีๆ ดูสักเรื่อง หรือออกไปสูดอากาศข้างนอกบ้างนะ', url: '/news' },
];

// เพิ่ม: ข้อความสำหรับ Calculator
const CALCULATOR_MESSAGES = [
  { title: '🧮 คำนวณก่อนเทรด!', body: 'อย่าลืมเช็ค RR และความเสี่ยงในหน้าเครื่องคิดเลขนะครับ', url: '/calculator' },
  { title: '🛡️ ปลอดภัยไว้ก่อน', body: 'ลองคำนวณระยะ SL/TP ให้แม่นยำก่อนกดออเดอร์นะ', url: '/calculator' },
  { title: '💡 วางแผนกำไร', body: 'ใช้เครื่องมือคำนวณเพื่อดูว่าคุ้มเสี่ยงไหมวันนี้', url: '/calculator' },
  { title: '🔢 แม่นยำกว่ากะเอา', body: 'ไปหน้า Calculator เพื่อคำนวณ Lot Size ที่เหมาะสมกันเถอะ', url: '/calculator' },
];

const SESSION_MESSAGES = {
  morning: [ // 07:00 - 10:00 (Asia/Bangkok)
    { title: '☀️ อรุณสวัสดิ์ครับ', body: 'ตลาดเช้าเปิดแล้ว เช็คข่าวและวางแผนเทรดวันนี้หรือยัง?', url: '/' },
    { title: '☕ เช้านี้พร้อมลุยไหม?', body: 'ตรวจสอบตารางข่าวเศรษฐกิจก่อนเริ่มเทรดนะครับ', url: '/news' },
    { title: '📈 ตลาดเอเชียเปิดทำการ', body: 'อย่าลืมบันทึก Trading Plan ของวันนี้ด้วยนะครับ', url: '/' },
  ],
  london: [ // 13:00 - 15:00 (London Open)
    { title: '🇬🇧 London Session Open', body: 'ตลาดลอนดอนเปิดทำการแล้ว เข้าประจำที่ได้เลย', url: '/dashboard' },
    { title: '🕑 ได้เวลาตลาดบ่าย', body: 'เช็คกราฟและแผนการเทรดช่วงบ่ายกันครับ', url: '/' },
    { title: '🔔 ตลาดยุโรปมาแล้ว', body: 'เตรียมตัวสำหรับ Session บ่าย มีข่าวอะไรน่าสนใจไหม?', url: '/news' },
  ],
  newyork: [ // 19:00 - 21:00 (New York Open)
    { title: '🇺🇸 New York Session Open', body: 'ตลาดอเมริกาเปิดแล้ว เช็คข่าวด่วนสำคัญก่อนเทรดนะ', url: '/news' },
    { title: '🌙 ตลาดค่ำเริ่มแล้ว', body: 'เข้าสู่ช่วงตลาด US อย่าลืมเช็คตารางข่าวเศรษฐกิจครับ', url: '/news' },
    { title: '🗽 US Market Open', body: 'พร้อมสำหรับตลาดคืนนี้หรือยัง? ตั้งสติและทำตามแผนนะ', url: '/dashboard' },
  ]
};

const USER_MESSAGES = {
  newbie: [ // < 5 trades
    'ตลาดเปิดแล้ว อย่าลืมหาจังหวะสวยๆ แล้วจดบันทึกนะ',
    'อย่าเพิ่งรีบเข้าออเดอร์ รอให้มั่นใจก่อนค่อยยิง',
    'การรักษาเงินต้น สำคัญกว่ากำไรนะ จำไว้เสมอ',
    'วันนี้มีแผนเทรดหรือยัง? ถ้าไม่มี ห้ามกดนะ!'
  ],
  intermediate: [ // < 50 trades
    'ถ้ามีกำไรอย่าลืมกันทุน ถ้าขาดทุนอย่าลืมดูแผนนะ',
    'อย่า Overtrade นะครับ วินัยคือกุญแจสู่ความสำเร็จ',
    'วันนี้โฟกัสที่ Risk:Reward นะ คุ้มเสี่ยงไหม?',
    'อารมณ์เป็นไงบ้าง? ถ้าหัวร้อนให้ปิดจอนะ'
  ],
  pro: [ // > 50 trades
    'วันนี้ "ทับมือ" หรือเปล่าครับ? รักษาวินัยเยี่ยมมาก!',
    'Sniper Mode: รอจังหวะที่ใช่จริงๆ เท่านั้น',
    'ปล่อยให้กำไรไหล (Let Profit Run) ตัดขาดทุนให้ไว',
    'เป็นไงบ้าง Pro? วันนี้ตลาดเข้าทางไหม?'
  ],
  post_trade: [ // เทรดไปแล้ว
    'บันทึกครบถ้วน วินัยดีแบบนี้ พอร์ตโตแน่นอน',
    'เทรดเสร็จแล้ว พักผ่อนบ้างนะ อย่าเฝ้ากราฟทั้งวัน',
    'เยี่ยมมาก! การจดบันทึกคือจุดเริ่มต้นของการพัฒนา',
    'วันนี้พอใจกับผลลัพธ์ไหม? พรุ่งนี้ลุยใหม่!'
  ]
};

// --- 2. ฟังก์ชันดึงข่าว (Smart News) ---
async function getSmartNews() {
  try {
    const sources = [
      'https://th.investing.com/rss/news_11.rss', // ทองคำ
      'https://th.investing.com/rss/news_1.rss',  // Forex
      'https://th.investing.com/rss/news_25.rss'  // เศรษฐกิจ
    ];

    const responses = await Promise.all(
      sources.map(url => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } }).then(res => res.text()))
    );

    let hotNews = null;
    let maxTimestamp = 0;
    
    // คำสำคัญที่น่าสนใจ (High Impact Keywords)
    const keywords = ['เฟด', 'Fed', 'ดอกเบี้ย', 'เงินเฟ้อ', 'CPI', 'จ้างงาน', 'Non-Farm', 'สงคราม', 'ทองคำพุ่ง', 'ทองคำร่วง', 'GDP'];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;

    responses.forEach(xmlText => {
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        
        if (dateMatch) {
          const timestamp = new Date(dateMatch[1]).getTime();
          // เอาข่าวภายใน 2 ชม. ล่าสุดเท่านั้น เพื่อความสดใหม่
          const isFresh = (Date.now() - timestamp) < (2 * 60 * 60 * 1000); 

          if (isFresh && timestamp > maxTimestamp) {
            const titleMatch = itemContent.match(/<title>(.*?)<\/title>/) || itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            let title = titleMatch ? titleMatch[1].replace('<![CDATA[', '').replace(']]>', '') : '';

            // เช็คว่าเป็นข่าว Hot หรือไม่
            const isHot = keywords.some(kw => title.includes(kw));
            
            if (title && isHot) {
               maxTimestamp = timestamp;
               hotNews = { title, isHot: true };
            } else if (title && !hotNews) {
               // ถ้ายังไม่มีข่าว Hot เอาข่าวล่าสุดทั่วไปไว้ก่อน
               maxTimestamp = timestamp;
               hotNews = { title, isHot: false };
            }
          }
        }
      }
    });
    return hotNews;
  } catch (error) {
    console.error('News Fetch Error:', error);
    return null;
  }
}

// --- Helper สุ่มข้อความ ---
const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

export async function GET(req: Request) {
  try {
    // 1. เตรียมข้อมูล
    const subSheet = await getGoogleSheet('Subscriptions');
    const subRows = await subSheet.getRows();
    const activeSubs = subRows.filter(row => row.get('is_active') === 'TRUE');
    
    const tradeSheet = await getGoogleSheet('Trades');
    const tradeRows = await tradeSheet.getRows();

    const notifications = [];
    const now = new Date();
    // ปรับเวลาเป็นไทย (UTC+7) แบบง่ายๆ
    const thaiHour = (now.getUTCHours() + 7) % 24; 
    const todayStr = now.toISOString().split('T')[0];
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // 2. ดึงข่าว (โอกาส 40% ที่จะเช็คข่าว หรือถ้าเป็นช่วงหัวค่ำให้เช็คบ่อยหน่อย)
    let newsItem: any = null;
    const shouldCheckNews = Math.random() < 0.4 || (thaiHour >= 19 && thaiHour <= 21);
    
    if (!isWeekend && shouldCheckNews) {
        newsItem = await getSmartNews();
    }

    // 3. วนลูปส่งหาแต่ละคน
    for (const subRow of activeSubs) {
      const username = subRow.get('username');
      const subscription = {
        endpoint: subRow.get('endpoint'),
        keys: { auth: subRow.get('keys_auth'), p256dh: subRow.get('keys_p256dh') },
      };

      // กรองประวัติเทรด
      const userTrades = tradeRows.filter(r => r.get('username') === username);
      const hasTradedToday = userTrades.some(r => r.get('open_date') === todayStr);
      const totalTrades = userTrades.length;

      let title = '';
      let body = '';
      let url = '/dashboard';

      // --- LOGIC การเลือกข้อความ ---

      if (isWeekend) {
        // [วันหยุด] -> สุ่มข้อความวันหยุด
        const msg = getRandom(WEEKEND_MESSAGES);
        title = msg.title;
        body = msg.body;
        url = msg.url;
      } 
      else {
        // [วันธรรมดา]

        // A. ถ้ามีข่าวสำคัญ (Hot News) ให้แทรกแซงทันที
        if (newsItem && newsItem.isHot) {
           title = `🔥 ข่าวด่วน! ถึงคุณ ${username}`;
           body = newsItem.title;
           url = '/news';
        }
        // B. ถ้าเป็นช่วงเวลาเปิดตลาด (Session Open)
        else if (thaiHour >= 13 && thaiHour <= 14) { // London Open
           const msg = getRandom(SESSION_MESSAGES.london);
           title = msg.title;
           body = msg.body;
           url = msg.url;
        }
        else if (thaiHour >= 19 && thaiHour <= 20) { // New York Open
           const msg = getRandom(SESSION_MESSAGES.newyork);
           title = msg.title;
           body = msg.body;
           url = msg.url;
        }
        // C. ถ้ายังไม่ได้เทรดวันนี้ (Pre-Trade)
        else if (!hasTradedToday) {
           
           // *** เพิ่ม Logic: สุ่มเตือนให้ไปใช้เครื่องคิดเลข (30% chance) ***
           if (Math.random() < 0.3) {
             const msg = getRandom(CALCULATOR_MESSAGES);
             title = msg.title;
             body = msg.body;
             url = msg.url;
           } 
           // ถ้าไม่เข้าเครื่องคิดเลข ให้ส่งข้อความตามระดับ User
           else if (totalTrades < 5) {
             title = `🔔 มือใหม่ ${username} สู้ๆ!`;
             body = getRandom(USER_MESSAGES.newbie);
             url = '/'; 
           } else if (totalTrades < 50) {
             title = `📉 สวัสดีคุณ ${username}`;
             body = getRandom(USER_MESSAGES.intermediate);
             url = '/dashboard';
           } else {
             title = `👑 Pro Trader ${username}`;
             body = getRandom(USER_MESSAGES.pro);
             url = '/dashboard';
           }
        }
        // D. ถ้าเทรดไปแล้ว (Post-Trade)
        else {
           // ส่งบ้างไม่ส่งบ้าง (30% chance) เพื่อไม่ให้รำคาญ
           if (Math.random() < 0.3) {
             title = `🌟 เยี่ยมมากคุณ ${username}!`;
             body = getRandom(USER_MESSAGES.post_trade);
             url = '/dashboard';
           }
        }
      }

      // ส่ง Notification
      if (title) {
        notifications.push(
          webpush.sendNotification(subscription as any, JSON.stringify({ title, body, url }))
            .catch(async (err) => {
               if (err.statusCode === 410) {
                   console.log(`User ${username} subscription expired.`);
                   subRow.set('is_active', 'FALSE');
                   subRow.set('last_updated', new Date().toISOString());
                   await subRow.save();
               }
            })
        );
      }
    }

    await Promise.all(notifications);
    return NextResponse.json({ success: true, sent: notifications.length });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}