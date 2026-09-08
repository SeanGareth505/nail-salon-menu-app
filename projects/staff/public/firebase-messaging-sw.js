importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD7oAK5uqxY6xueecZbp4AZiupp3ZT9-3w',
  authDomain: 'salonix-66a6c.firebaseapp.com',
  projectId: 'salonix-66a6c',
  storageBucket: 'salonix-66a6c.firebasestorage.app',
  messagingSenderId: '220871461623',
  appId: '1:220871461623:web:3d0f01b038b3ba0b1ca1f2',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'SalonFlow';
  const options = {
    body: payload.notification?.body ?? '',
    icon: '/icons/icon-192x192.png',
    data: payload.data ?? {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  if (!link) return;
  event.waitUntil(clients.openWindow(link));
});
