import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { motion, AnimatePresence } from 'motion/react';
import IOSInstallGuide from './IOSInstallGuide';

const InstallPrompt: React.FC = () => {
  const { promptable, isStandalone, isIOS } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isStandalone || isDismissed) {
    return null;
  }

  if (!promptable && !isIOS) {
    return null;
  }

  const handleInstall = () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (promptable) {
      promptable.prompt();
      promptable.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setIsDismissed(true);
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        {!showIOSGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[70] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 select-none"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                   <Download className="text-kph-red" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Install KPH News</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    Add to your home screen for a faster, app-like experience and offline access.
                  </p>
                  <button 
                    onClick={handleInstall}
                    className="mt-3 bg-kph-charcoal text-white px-5 py-2 rounded-lg text-sm font-bold w-full active:scale-95 transition-transform"
                  >
                    Install Now
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsDismissed(true)}
                className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
};

export default InstallPrompt;
