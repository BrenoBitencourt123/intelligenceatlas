import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);

    // Check if already subscribed
    if (user && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      });
    }
  }, [isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;
    setLoading(true);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== 'granted') {
        setLoading(false);
        return false;
      }

      // Register push service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      if (vapidError || !vapidData?.publicKey) {
        console.error('Failed to get VAPID key:', vapidError);
        setLoading(false);
        return false;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
      }, { onConflict: 'user_id,endpoint' });

      if (error) {
        console.error('Failed to save subscription:', error);
        setLoading(false);
        return false;
      }

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      setLoading(false);
      return false;
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isSupported, user]);

  return { permission, isSubscribed, isSupported, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
