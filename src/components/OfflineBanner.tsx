import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-kph-charcoal text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 z-[9999] animate-slide-down shadow-md">
      <WifiOff size={14} className="text-gray-300" />
      <span>You are currently offline. Viewing cached data.</span>
    </div>
  );
};

export default OfflineBanner;
