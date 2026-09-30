// La clave pública VAPID la da el servidor (se deriva de su clave privada): así nunca queda
// desparejada de la que firma los avisos, aunque se rote.
async function fetchPublicKey(apiUrl) {
  const res = await fetch(`${apiUrl}/api/notifications/vapid-public-key`);
  if (!res.ok) return null; // servidor sin notificaciones push configuradas
  return (await res.json()).public_key || null;
}

// ¿La suscripción existente se creó con esta clave? Tras rotar la clave hay que rehacerla.
function sameKey(subscription, keyBytes) {
  const current = subscription?.options?.applicationServerKey;
  if (!current) return false;
  const a = new Uint8Array(current);
  return a.length === keyBytes.length && a.every((b, i) => b === keyBytes[i]);
}

export async function subscribeToPush(apiUrl, token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  try {
    const publicKey = await fetchPublicKey(apiUrl);
    if (!publicKey) return false;
    const keyBytes = urlBase64ToUint8Array(publicKey);

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription && !sameKey(subscription, keyBytes)) {
      await subscription.unsubscribe();
      subscription = null;
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes
      });
    }

    const res = await fetch(`${apiUrl}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });
    // Sin confirmación del servidor no se envía ningún aviso: no darlo por activado
    return res.ok;
  } catch (err) {
    console.error('Failed to subscribe to push', err);
    return false;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
