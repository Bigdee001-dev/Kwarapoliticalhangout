import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, X } from 'lucide-react';

interface IOSInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ isOpen, onClose }) => {
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
              <h3 className="text-2xl font-bold text-gray-900">Install App on iOS</h3>
              <p className="text-gray-500 mt-2">Get the full experience by adding KPH to your home screen.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <Share className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">1. Tap the Share button</p>
                  <p className="text-sm text-gray-500">It's at the bottom or top of your screen.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <PlusSquare className="text-gray-900" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">2. Select "Add to Home Screen"</p>
                  <p className="text-sm text-gray-500">Scroll down to find this option in the list.</p>
                </div>
              </div>
            </div>
            
            {/* Arrow pointing down to help iOS users */}
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex justify-center mt-8 text-blue-500"
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold mb-2">Tap Share below</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IOSInstallGuide;
