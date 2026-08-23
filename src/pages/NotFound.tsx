import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center bg-white relative overflow-hidden">
      <SEO 
        title="404 - Page Not Found | KPH News" 
        description="The page you are looking for does not exist or has been moved." 
      />
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-kph-red rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-zinc-900 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-red-50 text-kph-red rounded-full flex items-center justify-center mb-8 border border-red-100 shadow-sm">
          <AlertTriangle size={48} />
        </div>
        
        <h1 className="font-serif text-6xl md:text-8xl font-black text-zinc-900 mb-4 tracking-tight">404</h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 mb-4">Page Not Found</h2>
        
        <p className="text-zinc-500 mb-8 max-w-md mx-auto text-base md:text-lg">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
        
        <Link 
          to="/" 
          className="group flex items-center gap-2 bg-zinc-900 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-kph-red transition-all shadow-lg active:scale-95"
        >
          <Home size={16} className="group-hover:-translate-y-0.5 transition-transform" />
          Return to Homepage
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
