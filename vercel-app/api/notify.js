// /api/notify
// Apps Script llama a este endpoint INMEDIATAMENTE después de escribir
// un FALLA_INICIO o FALLA_FIN en el Sheet (ver notificarVercel() en el
// Apps Script). Aquí es donde realmente se firma y envía el push con
// las VAPID keys — esto es lo único que hace posible que la notificación
// llegue aunque el celular esté bloqueado y la app no esté abierta.

import webpush from 'web-push';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Seguridad mínima: solo Apps Script (que conoce el secreto) puede disparar pushes
  const secretoRecibido = req.headers['x-webhook-secret'];
  if (!secretoRecibido || secretoRecibido !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, GOOGLE_SCRIPT_URL } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !GOOGLE_SCRIPT_URL) {
    return res.status(500).json({ error: 'Faltan variables de entorno VAPID o GOOGLE_SCRIPT_URL' });
  }

  webpush.setVapidDetails(
    'mailto:contacto@ejemplo.com', // puedes cambiar este correo de contacto
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  const { titulo, cuerpo, tipo } = req.body || {};

  if (!titulo || !cuerpo) {
    return res.status(400).json({ error: 'Falta titulo o cuerpo en el payload' });
  }

  try {
    // Pedimos a Apps Script la lista actual de suscriptores
    const r = await fetch(`${GOOGLE_SCRIPT_URL}?accion=obtenerSuscripciones`);
    const data = await r.json();
    const suscripciones = data.suscripciones || [];

    if (suscripciones.length === 0) {
      return res.status(200).json({ enviados: 0, mensaje: 'No hay suscriptores aún' });
    }

    const payload = JSON.stringify({ titulo, cuerpo, tipo });

    const resultados = await Promise.allSettled(
      suscripciones.map((sub) => webpush.sendNotification(sub, payload))
    );

    const exitosos = resultados.filter((r) => r.status === 'fulfilled').length;
    const fallidos = resultados.length - exitosos;

    return res.status(200).json({ enviados: exitosos, fallidos });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
