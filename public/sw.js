// public/sw.js

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    // รับ URL จาก Server ถ้าไม่มีให้ Default ไปหน้าแรก ('/')
    const targetUrl = data.url || '/';

    const options = {
      body: data.body,
      icon: '/icon.png', 
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
        url: targetUrl 
      },
    };
    
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // ปิด Pop-up เมื่อคลิก

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // ถ้าเปิดหน้าเว็บนั้นค้างไว้อยู่แล้ว ให้ Focus หน้านั้น
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // ถ้ายังไม่เปิด ให้เปิดหน้าต่างใหม่ตาม URL ที่ส่งมา
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});