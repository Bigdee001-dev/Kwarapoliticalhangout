import React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const PushNotificationToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return null; // Don't show anything if push is not supported
  }

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center justify-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 font-bold ${
        isSubscribed 
          ? 'bg-red-50 text-kph-red hover:bg-red-100 shadow-sm border border-red-100' 
          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
      } ${className}`}
      aria-label={isSubscribed ? "Disable Push Notifications" : "Enable Push Notifications"}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : isSubscribed ? (
        <Bell size={20} className="animate-[wiggle_1s_ease-in-out_infinite]" />
      ) : (
        <BellOff size={20} />
      )}
      <span className="text-sm md:text-base whitespace-nowrap">
        {isSubscribed ? 'Alerts On' : 'Get Alerts'}
      </span>
    </button>
  );
};
