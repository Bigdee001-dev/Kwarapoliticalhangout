import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X } from 'lucide-react';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem('kph_cookie_consent');
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('kph_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('kph_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:max-w-[420px] z-[150]"
        >
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 p-6 rounded-2xl shadow-2xl relative overflow-hidden ring-1 ring-black/5">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-kph-red/15 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

            <button 
              onClick={handleDecline} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2.5 rounded-xl shrink-0 mt-1 border border-white/5">
                <Cookie className="text-white" size={20} />
              </div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-white font-bold text-lg font-serif tracking-tight">We value your privacy</h3>
                <p className="text-zinc-400 text-xs leading-relaxed pr-2">
                  We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
              <button 
                onClick={handleAccept}
                className="flex-1 bg-kph-red hover:bg-white hover:text-kph-red text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Accept All
              </button>
              <button 
                onClick={handleDecline}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/50 text-[10px] font-bold uppercase tracking-widest py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Essential Only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
