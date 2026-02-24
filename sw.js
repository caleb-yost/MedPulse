const CACHE_NAME = 'medpulse-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});

// Handle push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'MedPulse Reminder', body: 'Time to take your medication!' };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'medpulse-reminder',
    requireInteraction: true,
    actions: [
      { action: 'taken', title: '✅ Mark Taken' },
      { action: 'snooze', title: '⏰ Snooze 10min' }
    ]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'taken') {
    // Post message to client to mark dose taken
    self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage({ action: 'taken' })));
  }
  e.waitUntil(self.clients.openWindow('/'));
});
