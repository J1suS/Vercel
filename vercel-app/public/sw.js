// /public/sw.js
// Este archivo corre en segundo plano, fuera de la pestaña del navegador.
// El evento 'push' se dispara cuando llega un mensaje push real desde
// nuestro servidor (api/notify.js), incluso con la app cerrada y el
// celular bloqueado — a diferencia de Notification.requestPermission()
// + new Notification(), que solo funciona con la pestaña abierta.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let datos = { titulo: 'DFL — Alerta', cuerpo: 'Hay una actualización', tipo: 'info' };

  try {
    if (event.data) datos = event.data.json();
  } catch (e) {
    // si el payload no es JSON válido, usamos los valores por defecto
  }

  const opciones = {
    body: datos.cuerpo,
    icon: '/icon.png',
    badge: '/badge.png',
    tag: datos.tipo || 'dfl',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(datos.titulo, opciones));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(url));
});
