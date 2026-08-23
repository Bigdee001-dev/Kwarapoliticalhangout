self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const baseUrl = self.location.origin;
  const title = data.title || 'KPH News';
  
  const options = {
    body: data.body || 'You have a new notification.',
    icon: data.icon || (baseUrl + '/logo192.png'),
    badge: baseUrl + '/logo192.png',
    data: data.url || '/',
    vibrate: [200, 100, 200]
  };

  if (data.image && typeof data.image === 'string' && data.image.startsWith('http')) {
    options.image = data.image;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  const urlToOpen = event.notification.data;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
