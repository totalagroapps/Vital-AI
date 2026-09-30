const publicVapidKey = 'BJ4-THjkTIFJGiymaysNSKLmBntTEpPBDLqyXaepYR3OCNaL9gEPpe_L24w-sWFfcR8b-B2xv50rmoUt7e6oJH4';

export async function subscribeToPush(apiUrl, token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }
    
    await fetch(`${apiUrl}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });
    
    return true;
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
