import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sources = [
      'https://th.investing.com/rss/news_11.rss', // ทองคำ
      'https://th.investing.com/rss/news_1.rss',  // Forex
      'https://th.investing.com/rss/news_25.rss'  // เศรษฐกิจ
    ];

    const responses = await Promise.all(
      sources.map(url => 
        fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } })
        .then(res => res.text())
      )
    );

    let allNews: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;

    responses.forEach(xmlText => {
      let match;
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        
        // Title
        const titleMatch = itemContent.match(/<title>(.*?)<\/title>/) || itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
        let title = titleMatch ? titleMatch[1].replace('<![CDATA[', '').replace(']]>', '') : '';

        // Link
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
        const link = linkMatch ? linkMatch[1].trim() : '#';

        // Date & Time (บังคับเวลาไทย)
        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        let displayDateTime = '';
        let timestamp = 0;

        if (dateMatch) {
            const pubDate = new Date(dateMatch[1]);
            timestamp = pubDate.getTime();
            
            const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', {
                timeZone: 'Asia/Bangkok',
                day: 'numeric',
                month: 'short',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            displayDateTime = thaiDateFormatter.format(pubDate).replace(',', ' •');
        }

        let image = null;

        const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]+)"/);
        if (enclosureMatch) image = enclosureMatch[1];
        
        if (!image) {
            const mediaMatch = itemContent.match(/<media:content[^>]*url="([^"]+)"/);
            if (mediaMatch) image = mediaMatch[1];
        }
        
        if (!image) {
            const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
            if (descMatch) {
                const imgTagMatch = descMatch[1].match(/src=["']([^"']+\.(jpg|jpeg|png|webp))["']/i);
                if (imgTagMatch) image = imgTagMatch[1];
            }
        }

        if (title && !allNews.some(n => n.title === title)) {
          allNews.push({
            title,
            link,
            displayDateTime,
            timestamp,
            image
          });
        }
      }
    });

    allNews.sort((a, b) => b.timestamp - a.timestamp);
    return NextResponse.json({ news: allNews.slice(0, 20) });

  } catch (error) {
    return NextResponse.json({ error: 'News fetch failed' }, { status: 500 });
  }
}