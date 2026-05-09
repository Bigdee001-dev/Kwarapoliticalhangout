import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark' | 'mono' | 'gold';
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  const LOGO_URL = "https://res.cloudinary.com/dohuj4mx9/image/upload/v1778018185/hd_restoration_result_image_6_xejnhg.png";

  return (
    <div className={`flex items-center select-none ${className}`}>
      <div className="relative group overflow-hidden rounded-lg">
        <img
          src={LOGO_URL}
          alt="KPH Logo"
          className="w-16 h-16 lg:w-20 lg:h-20 object-contain transition-transform duration-300 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default Logo;