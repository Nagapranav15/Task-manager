// Service Worker for Task Tracker Browser Notifications
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('/manager/chat');
            }
        })
    );
});

self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Task Tracker', message: event.data.text() };
        }
    }
    const title = data.title || 'Task Tracker Alert';
    const options = {
        body: data.message || data.body || '',
        icon: data.icon || 'https://framerusercontent.com/images/i2onAsJauZNBrRsZ8HunTa80Pk.png',
        badge: 'https://framerusercontent.com/images/kWhHgwwLeKUZk2ISCUfW7vXW6Uw.svg',
        vibrate: [200, 100, 200],
        data: data,
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
