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
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-bold ${
        isSubscribed 
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 shadow-sm' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
      aria-label={isSubscribed ? "Disable Push Notifications" : "Enable Push Notifications"}
    >
      {isLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isSubscribed ? (
        <Bell size={18} className="animate-[wiggle_1s_ease-in-out_infinite]" />
      ) : (
        <BellOff size={18} />
      )}
      <span className="text-sm">
        {isSubscribed ? 'Alerts On' : 'Get Alerts'}
      </span>
      {/* We need to define wiggle keyframes if not defined in tailwind, but tw-animate-css might have ring or wiggle */}
    </button>
  );
};
