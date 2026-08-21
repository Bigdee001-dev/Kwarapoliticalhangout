import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BellRing, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const NotificationPrompt: React.FC = () => {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if push is supported, user isn't subscribed, and hasn't dismissed the prompt recently
    if (!isSupported || isSubscribed) return;

    const hasDismissed = localStorage.getItem('kph_dismissed_notification_prompt');
    if (hasDismissed) {
      const dismissedTime = parseInt(hasDismissed, 10);
      // Wait 7 days before showing again if dismissed
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Show after 5 seconds of browsing
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('kph_dismissed_notification_prompt', Date.now().toString());
  };

  const handleSubscribe = () => {
    setIsVisible(false);
    subscribe();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 z-50 lg:max-w-sm bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 overflow-hidden"
        >
          <div className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-red-50 text-kph-red rounded-full flex items-center justify-center flex-shrink-0">
              <BellRing size={24} className="animate-[wiggle_1s_ease-in-out_infinite]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-zinc-900 mb-1">Never Miss a Story</h3>
              <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
                Get instant alerts for breaking news and major political updates in Kwara.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubscribe}
                  className="flex-1 bg-kph-red text-white py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                >
                  Turn On Alerts
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-zinc-500 text-sm font-semibold hover:text-zinc-800 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
