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

const CALCULATOR_MESSAGES = [
  { title: '🧮 คำนวณก่อนเทรด!', body: 'อย่าลืมเช็ค RR และความเสี่ยงในหน้าเครื่องคิดเลขนะครับ', url: '/calculator' },
  { title: '🛡️ ปลอดภัยไว้ก่อน', body: 'ลองคำนวณระยะ SL/TP ให้แม่นยำก่อนกดออเดอร์นะ', url: '/calculator' },
  { title: '💡 วางแผนกำไร', body: 'ใช้เครื่องมือคำนวณเพื่อดูว่าคุ้มเสี่ยงไหมวันนี้', url: '/calculator' },
  { title: '🔢 แม่นยำกว่ากะเอา', body: 'ไปหน้า Calculator เพื่อคำนวณ Lot Size ที่เหมาะสมกันเถอะ', url: '/calculator' },
];

const SESSION_MESSAGES = {
  sydney: [ // 05:00 - 06:00 (ช่วงเปิดตลาดซิดนีย์)
    { title: '🇦🇺 Sydney Session Open', body: 'ตลาดซิดนีย์เปิดแล้ว! ช่วงนี้สภาพคล่องอาจจะต่ำ เน้นถือยาวนะครับ', url: '/dashboard' },
    { title: '🐨 อรุณสวัสดิ์เทรดเดอร์', body: 'เริ่มวันใหม่กับตลาดออสเตรเลีย เช็คกราฟ Timeframe ใหญ่ก่อนนะ', url: '/' },
    { title: '🌊 คลื่นลูกแรกมาแล้ว', body: 'Sydney Open: ตลาดยังวิ่งเบาๆ อย่าเพิ่งรีบออกไม้หนัก', url: '/news' },
  ],
  tokyo: [ // 06:00 - 14:00 (ช่วงตลาดโตเกียว)
    { title: '🇯🇵 Tokyo Session Open', body: 'ตลาดโตเกียวมาแล้ว! กราฟมักจะนิ่ง เน้นวิเคราะห์พื้นฐานนะครับ', url: '/' },
    { title: '🍣 ได้เวลาตลาดเอเชีย', body: 'ช่วงนี้ราคาอาจไซด์เวย์ รอจังหวะ Breakout สวยๆ นะ', url: '/news' },
    { title: '💹 จับตาดูคู่เงิน JPY', body: 'Tokyo Session: ระวังความผันผวนของค่าเงินเยนด้วยครับ', url: '/dashboard' },
  ],
  london: [ // 14:00 - 19:00 (ช่วงตลาดลอนดอน ก่อน NY มา)
    { title: '🇬🇧 London Session Open', body: 'ตลาดลอนดอนเปิดแล้ว! วอลลุ่มเริ่มเข้า กราฟเริ่มวิ่งแรง', url: '/dashboard' },
    { title: '☕ Afternoon Tea Trade', body: 'ช่วงบ่ายความผันผวนสูง เตรียมแผนรับมือให้ดีนะครับ', url: '/' },
    { title: '⚡ GBP/EUR วิ่งแรง', body: 'London Session: โฟกัสคู่เงินยุโรป หาจังหวะเข้าทำกำไรได้เลย', url: '/news' },
  ],
  newyork: [ // 19:00 - 04:00 (ช่วงตลาดนิวยอร์ก)
    { title: '🇺🇸 New York Session Open', body: 'ตลาดอเมริกาเปิดแล้ว! ระวังข่าว US และความผันผวนระดับสูง', url: '/news' },
    { title: '🗽 High Volatility Alert', body: 'NY Session: กราฟกระชากแรง ตั้ง SL ให้รอบคอบนะครับ', url: '/dashboard' },
    { title: '🍔 คืนนี้ระวังข่าวแดง', body: 'USD กำลังมา! เช็คตารางข่าวเศรษฐกิจก่อนกดออเดอร์เสมอ', url: '/news' },
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

// Define Type สำหรับข่าว
type NewsItem = {
    title: string;
    isHot: boolean;
};

// --- 2. ฟังก์ชันดึงข่าว (Smart News) ---
async function getSmartNews(): Promise<NewsItem | null> {
  try {
    const sources = [
      'https://th.investing.com/rss/news_11.rss', // ทองคำ
      'https://th.investing.com/rss/news_1.rss',  // Forex
      'https://th.investing.com/rss/news_25.rss'  // เศรษฐกิจ
    ];

    const responses = await Promise.all(
      sources.map(url => fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 60 } }).then(res => res.text()))
    );

    let hotNews: NewsItem | null = null;
    let maxTimestamp = 0;
    
    const keywords = ['เฟด', 'Fed', 'ดอกเบี้ย', 'เงินเฟ้อ', 'CPI', 'จ้างงาน', 'Non-Farm', 'สงคราม', 'ทองคำพุ่ง', 'ทองคำร่วง', 'GDP'];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;

    responses.forEach(xmlText => {
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        
        if (dateMatch) {
          const timestamp = new Date(dateMatch[1]).getTime();
          const isFresh = (Date.now() - timestamp) < (2 * 60 * 60 * 1000); 

          if (isFresh && timestamp > maxTimestamp) {
            const titleMatch = itemContent.match(/<title>(.*?)<\/title>/) || itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
            let title = titleMatch ? titleMatch[1].replace('<![CDATA[', '').replace(']]>', '') : '';
            const isHot = keywords.some(kw => title.includes(kw));
            
            if (title && isHot) {
               maxTimestamp = timestamp;
               hotNews = { title, isHot: true };
            } else if (title && !hotNews) {
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

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

export async function GET(req: Request) {
  try {
    // Check Auth
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // -------------------------------------------------------------
    // ✅ FIX TIMEZONE: คำนวณเวลาไทยแบบ Manual (UTC+7) ชัวร์สุด
    // -------------------------------------------------------------
    const now = new Date();
    // UTC Timestamp + 7 Hours
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const thaiTime = new Date(utc + (3600000 * 7));

    const thaiHour = thaiTime.getHours(); 
    // วันที่ไทยสำหรับเช็คว่าเทรดไปหรือยัง (YYYY-MM-DD)
    const todayStr = thaiTime.toISOString().split('T')[0];

    const isWeekend = thaiTime.getDay() === 0 || thaiTime.getDay() === 6;

    // 1. เตรียมข้อมูล
    const subSheet = await getGoogleSheet('Subscriptions');
    const subRows = await subSheet.getRows();
    const activeSubs = subRows.filter(row => row.get('is_active') === 'TRUE');
    
    const tradeSheet = await getGoogleSheet('Trades');
    const tradeRows = await tradeSheet.getRows();

    const notifications = [];

    // 2. ดึงข่าว
    let newsItem: NewsItem | null = null;
    
    const isMorningNews = thaiHour >= 7 && thaiHour <= 9;
    const isEveningNews = thaiHour >= 19 && thaiHour <= 21;
    const shouldCheckNews = Math.random() < 0.4 || isMorningNews || isEveningNews;
    
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

      const userTrades = tradeRows.filter(r => r.get('username') === username);
      const hasTradedToday = userTrades.some(r => r.get('open_date') === todayStr);
      const totalTrades = userTrades.length;

      let title = '';
      let body = '';
      let url = '/dashboard';

      // --- LOGIC ---
      if (isWeekend) {
        const msg = getRandom(WEEKEND_MESSAGES);
        title = msg.title;
        body = msg.body;
        url = msg.url;
      } 
      else {
        // [วันธรรมดา]

        // A. ข่าวสำคัญ
        if (newsItem && newsItem.isHot) {
           title = `🔥 ข่าวด่วน! ถึงคุณ ${username}`;
           body = newsItem.title;
           url = '/news';
        }
        // B. เช็คตามช่วงเวลา (Session)
        // 🇦🇺 Sydney: 05:00 - 06:00
        else if (thaiHour === 5) { 
           const msg = getRandom(SESSION_MESSAGES.sydney);
           title = msg.title;
           body = msg.body;
           url = msg.url;
        }
        // 🇯🇵 Tokyo: 06:00 - 14:00
        else if (thaiHour >= 6 && thaiHour < 14) { 
           const msg = getRandom(SESSION_MESSAGES.tokyo);
           title = msg.title;
           body = msg.body;
           url = msg.url;
        }
        // 🇬🇧 London: 14:00 - 19:00
        else if (thaiHour >= 14 && thaiHour < 19) { 
           const msg = getRandom(SESSION_MESSAGES.london);
           title = msg.title;
           body = msg.body;
           url = msg.url;
        }
        // 🇺🇸 New York: 19:00 - 04:00 (ข้ามวัน)
        else if (thaiHour >= 19 || thaiHour < 4) {
           const msg = getRandom(SESSION_MESSAGES.newyork);
           title = msg.title;
           body = msg.body;
           url = msg.url;
        }
        // C. Pre-Trade (ช่วงเวลาอื่นที่ว่างอยู่)
        else if (!hasTradedToday) {
           if (Math.random() < 0.3) {
             const msg = getRandom(CALCULATOR_MESSAGES);
             title = msg.title;
             body = msg.body;
             url = msg.url;
           } 
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
        // D. Post-Trade
        else {
           if (Math.random() < 0.3) {
             title = `🌟 เยี่ยมมากคุณ ${username}!`;
             body = getRandom(USER_MESSAGES.post_trade);
             url = '/dashboard';
           }
        }
      }

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