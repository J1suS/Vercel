// /public/sw.js — v2: además de mostrar la notificación, avisa a la página
// abierta (si la hay) para que actualice el estado al instante, sin esperar
// el próximo ciclo de 60 segundos.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let datos = { titulo: 'ADRA — Alerta', cuerpo: 'Hay una actualización', tipo: 'info' };

  try {
    if (event.data) datos = event.data.json();
  } catch (e) {}

  const opciones = {
    body:     datos.cuerpo,
    icon:     '/icon-192.png',
    badge:    '/badge.png',
    tag:      datos.tipo || 'adra',
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: '/' }
  };

  // 1) Mostrar la notificación en el sistema.
  // 2) Avisar a todas las pestañas/apps abiertas del sitio para que
  //    actualicen la UI al instante sin esperar los 60 segundos.
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(datos.titulo, opciones),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ tipo: 'PUSH_RECIBIDO', datos });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const abierta = clients.find((c) => c.url.includes(self.location.origin));
      if (abierta) {
        abierta.focus();
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
