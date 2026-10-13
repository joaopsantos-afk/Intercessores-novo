// Client-side Web Push subscription and Service Worker registration

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser.');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
    return reg;
  } catch (err) {
    console.error('[PWA] Service Worker registration failed:', err);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<{ success: boolean; message: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Seu navegador não suporta notificações em segundo plano (Push API).' };
  }

  try {
    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, message: 'Falha ao registrar o Service Worker.' };
    }

    // Wait until SW is ready
    await navigator.serviceWorker.ready;

    // Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Permissão de notificação não foi concedida.' };
    }

    // Get VAPID public key from backend
    const keyResp = await fetch('/api/push/public-key');
    if (!keyResp.ok) {
      throw new Error('Falha ao obter chave pública VAPID.');
    }
    const { publicKey } = await keyResp.json();

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // Send subscription to server
    const saveResp = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    if (!saveResp.ok) {
      throw new Error('Falha ao registrar aparelho no servidor.');
    }

    return {
      success: true,
      message: 'Notificações em segundo plano ativadas! Você receberá alertas mesmo com o app fechado.',
    };
  } catch (err: any) {
    console.error('Error subscribing to push:', err);
    return {
      success: false,
      message: err.message || 'Erro ao registrar notificações em segundo plano.',
    };
  }
}
