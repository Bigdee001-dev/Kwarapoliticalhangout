import React, { useState } from 'react';
import { Bell, BellOff, Loader2, Info, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const PushNotificationToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

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
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center justify-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 font-bold ${
          isSubscribed 
            ? 'bg-red-50 text-kph-red hover:bg-red-100 shadow-sm border border-red-100' 
            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
        }`}
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

      {isSubscribed && (
        <>
          <button onClick={() => setShowTroubleshoot(true)} className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-kph-red transition-colors ml-2 font-medium">
            <Info size={12} /> Not seeing pop-ups?
          </button>
          
          {showTroubleshoot && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowTroubleshoot(false)}>
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowTroubleshoot(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 text-zinc-500 rounded-full hover:bg-zinc-200 transition-colors">
                  <X size={16} />
                </button>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-5">
                  <Info size={24} />
                </div>
                <h3 className="text-xl font-black text-zinc-900 mb-2">Missing Notifications?</h3>
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                  If you hear a sound but don't see a pop-up when your screen is on, your phone might be suppressing it to avoid interrupting you.
                </p>
                <div className="space-y-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-900 mb-2">Android Users</h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Go to your phone's <strong>Settings</strong> {'>'} <strong>Apps</strong> {'>'} <strong>Chrome (or your browser)</strong> {'>'} <strong>Notifications</strong>. Tap on "Kwara Political Hangout" and enable <strong>Pop on screen</strong>.
                    </p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-900 mb-2">iOS Users</h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Ensure you have added KPH to your <strong>Home Screen</strong>, and allowed notifications in your iPhone Settings.
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowTroubleshoot(false)} className="w-full mt-6 bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors">
                  Got it
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
