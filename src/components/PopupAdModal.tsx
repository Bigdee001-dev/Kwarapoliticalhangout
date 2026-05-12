import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { AdUnit, getAbsoluteUrl, AdminService } from '../services/adminService';

interface PopupAdModalProps {
  ad: AdUnit | undefined;
  onClose: () => void;
  onClick: () => void;
}

const PopupAdModal: React.FC<PopupAdModalProps> = ({ ad, onClose, onClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ad?.enabled && ad?.imageUrl) {
      const LAST_SHOWN_KEY = 'kph_popup_ad_last_shown';
      const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown
      const lastShown = localStorage.getItem(LAST_SHOWN_KEY);
      const now = Date.now();

      // Only show if it hasn't been shown in the last hour
      if (!lastShown || now - parseInt(lastShown, 10) > COOLDOWN_MS) {
        const timer = setTimeout(() => {
          setVisible(true);
          localStorage.setItem(LAST_SHOWN_KEY, now.toString());
          AdminService.recordAdImpression('popupAd');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [ad]);

  if (!visible || !ad?.enabled || !ad?.imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in pt-24 sm:pt-32">
      <div className="relative max-w-md md:max-w-xl w-full bg-white rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-white/20 animate-slide-up transform transition-all">
        <button 
          onClick={(e) => { e.preventDefault(); onClose(); }}
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-full z-10 transition-colors shadow-lg"
        >
          <X size={20} />
        </button>
        <a 
          href={getAbsoluteUrl(ad.linkUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { onClick(); onClose(); }}
          className="block relative group cursor-pointer"
        >
          <div className="relative w-full h-auto max-h-[60vh] overflow-hidden bg-zinc-100 flex items-center justify-center">
             <img 
               src={ad.imageUrl} 
               alt={ad.altText || 'Advertisement'} 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
             />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-16">
             <div className="flex items-center gap-3 mb-2">
               <span className="text-[10px] bg-kph-red text-white px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-lg">Sponsored Content</span>
             </div>
             <div className="flex items-end justify-between gap-4">
               {ad.title && <h3 className="text-white font-serif font-bold text-xl md:text-2xl drop-shadow-md leading-tight">{ad.title}</h3>}
               <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white group-hover:bg-kph-red transition-colors shrink-0">
                 <ExternalLink size={18} />
               </div>
             </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default PopupAdModal;
