import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Facebook, Twitter, Instagram, Linkedin, UserCircle, ArrowRight, Home, Newspaper, Trophy, Users, Info, Mail } from 'lucide-react';
import { NAV_ITEMS } from '../data';
import Logo from './Logo';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const Header: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(window.scrollY);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { isStandalone } = useInstallPrompt();

  const navItems = NAV_ITEMS.filter(item => isStandalone || item.label !== 'Sports');

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      // Immersive mode: hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current + 10 && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10 || currentScrollY < 10) {
        setIsHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  // Close search on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getIconForLabel = (label: string) => {
    switch(label) {
      case 'Home': return <Home size={20} />;
      case 'News': return <Newspaper size={20} />;
      case 'Sports': return <Trophy size={20} />;
      case 'People': return <Users size={20} />;
      case 'About': return <Info size={20} />;
      case 'Contact': return <Mail size={20} />;
      default: return <ArrowRight size={20} />;
    }
  };

  return (
    <>
      <header className={`flex flex-col w-full z-50 fixed top-0 left-0 right-0 transition-transform duration-300 select-none ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        {/* Top Thin Bar - Hidden on Mobile */}
        <div className="bg-kph-charcoal text-white h-[40px] hidden lg:flex items-center justify-between px-4 lg:px-8 transition-colors duration-300">
          <div className="flex items-center space-x-4 text-xs font-medium text-gray-400">
             <Link to="/login" className="hover:text-white flex items-center gap-1 transition-colors">
                <UserCircle size={14} /> Writer Login
             </Link>
             <span>|</span>
             <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="flex space-x-5 text-gray-400">
            <a href="#" className="hover:text-white hover:scale-110 transition duration-300"><Twitter size={14} /></a>
            <a href="https://www.instagram.com/kwarapoliticalhangout?igsh=aG10ejRrM213bDZu" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition duration-300"><Instagram size={14} /></a>
            <a href="#" className="hover:text-white hover:scale-110 transition duration-300"><Linkedin size={14} /></a>
            <a href="https://www.facebook.com/share/16WfzEJG78/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition duration-300"><Facebook size={14} /></a>
          </div>
        </div>

        {/* Main Header - Sticky */}
        <div className={`border-b border-gray-100 transition-all duration-300 w-full ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-white py-3 lg:py-4'}`}>
          <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center group relative z-50">
               <Logo />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative py-2 text-[15px] font-bold tracking-wide transition-colors duration-300 group ${
                    location.pathname === item.path
                      ? 'text-kph-red'
                      : 'text-kph-charcoal hover:text-kph-red'
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-kph-red transition-all duration-300 group-hover:w-full ${location.pathname === item.path ? 'w-full' : ''}`}></span>
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
               <button 
                onClick={() => setIsSearchOpen(true)}
                className="text-kph-charcoal cursor-pointer hover:text-kph-red hover:scale-110 transition-transform duration-200"
               >
                  <Search size={20} strokeWidth={2.5} />
               </button>
               <button className="bg-kph-red text-white text-xs font-bold px-4 py-2 rounded shadow hover:bg-red-900 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                  SUBSCRIBE
               </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden relative z-50">
              <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="text-kph-charcoal cursor-pointer hover:text-kph-red p-2"
                >
                  <Search size={24} strokeWidth={2.5} />
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-kph-charcoal hover:text-kph-red p-2 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`lg:hidden fixed inset-0 top-[60px] bg-white z-40 transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } overflow-y-auto`}
        >
          <div className="flex flex-col p-4 space-y-2 pb-24">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-4 p-4 rounded-xl font-bold text-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-red-50 text-kph-red'
                    : 'text-kph-charcoal hover:bg-gray-50'
                }`}
              >
                <div className={`${location.pathname === item.path ? 'text-kph-red' : 'text-gray-400'}`}>
                  {getIconForLabel(item.label)}
                </div>
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col space-y-4">
              <Link 
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-4 p-4 text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <UserCircle size={24} className="text-gray-400" />
                <span className="font-bold">Writer Login</span>
              </Link>

              <div className="flex justify-center space-x-6 pt-6">
                <a href="#" className="text-gray-400 hover:text-kph-red transition-colors"><Twitter size={24} /></a>
                <a href="https://www.instagram.com/kwarapoliticalhangout" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-kph-red transition-colors"><Instagram size={24} /></a>
                <a href="#" className="text-gray-400 hover:text-kph-red transition-colors"><Linkedin size={24} /></a>
                <a href="https://www.facebook.com/share/16WfzEJG78/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-kph-red transition-colors"><Facebook size={24} /></a>
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Full Screen Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-lg animate-fade-in flex flex-col">
           {/* Close Button */}
           <div className="container mx-auto px-4 py-4 lg:py-6 flex justify-end">
              <button 
                onClick={closeSearch}
                className="p-2 rounded-full hover:bg-gray-100 text-kph-charcoal transition-colors group"
              >
                <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
           </div>

           {/* Search Input Area */}
           <div className="flex-1 flex flex-col items-center pt-10 lg:pt-20 px-4">
              <div className="w-full max-w-3xl">
                 <form onSubmit={handleSearchSubmit} className="relative group">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type to search..."
                      className="w-full text-2xl sm:text-3xl md:text-5xl font-bold bg-transparent border-b-2 border-gray-200 py-4 focus:outline-none focus:border-kph-red placeholder-gray-300 transition-colors"
                    />
                    <button 
                      type="submit"
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-kph-red hover:text-kph-red transition-colors"
                    >
                      <ArrowRight size={32} />
                    </button>
                 </form>

                 {/* Quick Suggestions */}
                 <div className="mt-8 lg:mt-12 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Trending Searches</p>
                    <div className="flex flex-wrap gap-2 lg:gap-3">
                       {['Governor AbdulRazaq', 'Ilorin Bridge', 'Kwara Budget', 'Offa Robbery Trial', 'Education Reform'].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => {
                               setIsSearchOpen(false);
                               navigate(`/search?q=${encodeURIComponent(tag)}`);
                            }}
                            className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-gray-100 text-sm lg:text-base text-gray-600 font-medium hover:bg-kph-red hover:text-white transition-all duration-300"
                          >
                             {tag}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Header;