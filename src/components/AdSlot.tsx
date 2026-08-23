import React from 'react';

type AdSlotProps = {
  format?: 'banner' | 'rectangle' | 'native';
  className?: string;
};

const AdSlot: React.FC<AdSlotProps> = ({ format = 'banner', className = '' }) => {
  const minHeight = format === 'banner' ? '90px' : format === 'rectangle' ? '250px' : 'auto';
  
  return (
    <div className={d-container my-6 mx-auto bg-gray-50 flex flex-col items-center justify-center border border-gray-100 rounded-sm overflow-hidden } style={{ minHeight, width: '100%', maxWidth: '100%' }}>
      <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Advertisement</span>
      {/* 
        The actual ad tags (div + script) will go here once generated from Hilltop Ads.
        For now, this serves as a structural placeholder to prevent CLS.
      */}
      <div className="w-full flex items-center justify-center text-gray-300 text-sm italic py-4">
        [ Ad Space ]
      </div>
    </div>
  );
};

export default AdSlot;
