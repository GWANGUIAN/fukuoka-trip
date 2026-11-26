/* 푸시 알림 수신 · 클릭 처리 — workbox 서비스워커가 importScripts로 불러온다 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '후쿠오카 여행', body: event.data ? event.data.text() : '' };
  }
  const base = self.registration.scope;
  event.waitUntil(
    self.registration.showNotification(data.title || '후쿠오카 여행', {
      body: data.body || '',
      icon: base + 'pwa-192.png',
      badge: base + 'favicon-32.png',
      tag: data.tag,
      data: { url: data.url || base },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    (async () => {
      const inApp = url.startsWith(self.registration.scope);
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (inApp) {
        for (const w of wins) {
          if (w.url.startsWith(self.registration.scope)) {
            await w.focus();
            return w.navigate(url);
          }
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
