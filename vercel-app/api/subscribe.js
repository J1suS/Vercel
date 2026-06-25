// /api/subscribe
// El navegador llama aquí justo después de pushManager.subscribe().
// Nosotros no guardamos nada localmente (las funciones de Vercel no
// persisten datos entre invocaciones) — reenviamos la suscripción a
// Apps Script, que la guarda en la pestaña "Suscripciones" del Sheet.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const subscription = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL no está configurada en Vercel' });
  }

  try {
    const r = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
