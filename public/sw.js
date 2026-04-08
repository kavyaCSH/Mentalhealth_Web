/* eslint-disable no-restricted-globals */

// This service worker handles background push notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {
        title: 'New Update',
        body: 'You have a new clinical notification.',
        icon: '/vite.svg',
        tag: 'general-alert'
    };

    const options = {
        body: data.body || data.message,
        icon: data.icon || '/vite.svg',
        badge: '/vite.svg',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/notifications',
            id: data.id || Date.now()
        },
        tag: data.tag || 'clinical-alert',
        renotify: true,
        actions: [
            { action: 'open', title: 'View Report' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MindBalance', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    // Open the app or a specific URL
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const urlToOpen = event.notification.data.url;
            
            // If the app is already open, focus it
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Otherwise, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
