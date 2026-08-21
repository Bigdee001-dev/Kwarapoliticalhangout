import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Download, X } from 'lucide-react';

interface AndroidInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const AndroidInstallGuide: React.FC<AndroidInstallGuideProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[90] p-6 pb-10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6 mt-4">
              <h3 className="text-2xl font-bold text-gray-900">Install App on Android</h3>
              <p className="text-gray-500 mt-2">Get the full experience by adding KPH to your home screen.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <MoreVertical className="text-gray-900" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">1. Tap the Menu button</p>
                  <p className="text-sm text-gray-500">Tap the 3 dots in the top right of Chrome.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Download className="text-kph-red" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">2. Select "Install App" or "Add to Home Screen"</p>
                  <p className="text-sm text-gray-500">Scroll down to find this option in the list.</p>
                </div>
              </div>
            </div>
            
            {/* Arrow pointing up to help Android users */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex justify-center mt-8 text-gray-900"
            >
              <div className="flex flex-col items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
                <span className="text-sm font-bold">Tap Menu at the top right</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AndroidInstallGuide;
