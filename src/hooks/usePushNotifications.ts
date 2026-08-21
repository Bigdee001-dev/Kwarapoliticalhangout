import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

// Helper function to convert VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking push subscription status:', error);
      }
      setIsLoading(false);
    };

    checkSubscription();
  }, []);

  const subscribe = async () => {
    try {
      setIsLoading(true);
      const registration = await navigator.serviceWorker.ready;
      
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error('VAPID public key not found in environment');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subJSON = subscription.toJSON();
      
      // Get current user if logged in
      const { data: { session } } = await supabase.auth.getSession();

      // Save to Supabase
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: session?.user?.id || null,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth
      });

      if (error && error.code !== '23505') { // Ignore unique constraint violation if already saved
        throw error;
      }

      setIsSubscribed(true);
      toast.success('Successfully subscribed to Breaking News notifications!');
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      if (Notification.permission === 'denied') {
        toast.error('Notification permission was denied. Please enable them in your browser settings.');
      } else {
        toast.error('Failed to subscribe to notifications.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setIsLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Delete from Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
          
        if (error) throw error;
        
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success('Unsubscribed from notifications.');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe
  };
};
