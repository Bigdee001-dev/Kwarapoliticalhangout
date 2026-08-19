import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Newspaper, Trophy, Bookmark } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isStandalone } = useInstallPrompt();

  const navItems = [
    { label: 'Home', path: '/', icon: <Home size={22} /> },
    { label: 'News', path: '/news', icon: <Newspaper size={22} /> },
    ...(isStandalone ? [{ label: 'Sports', path: '/sports', icon: <Trophy size={22} /> }] : []),
    { label: 'Saved', path: '/saved', icon: <Bookmark size={22} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent pointer-events-none select-none">
      <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl pointer-events-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? 'text-kph-red' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-kph-red' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
