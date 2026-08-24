import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

import Home from './pages/Home';
import MobileHome from './pages/MobileHome';
import { Toaster } from 'sonner';
import People from './pages/People';
import ArticleDetail from './pages/ArticleDetail';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewsCategory from './pages/NewsCategory';
import SportsPage from './pages/SportsPage';
import SportsArticleDetail from './pages/SportsArticleDetail';
import About from './pages/About';
import SearchResults from './pages/SearchResults';
import SavedPage from './pages/SavedPage';
import WriterStudio from './pages/WriterStudio';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import AdminApp from '../apps/admin/src/App';
import CookieBanner from './components/CookieBanner';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import NotificationPrompt from './components/NotificationPrompt';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false);
  
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
};

// ScrollToTop component to reset scroll on route change
const ScrollToTopWrapper = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const LayoutWrapper: React.FC<{ children: React.ReactNode, isMobilePWA: boolean, isStandalone: boolean }> = ({ children, isMobilePWA, isStandalone }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/writer-studio');
  const isArticleDetail = location.pathname.startsWith('/article/');
  const isSavedPage = location.pathname.startsWith('/saved');
  const isProfile = location.pathname === '/profile';
  const isMobileHome = isMobilePWA && location.pathname === '/';

  const hideHeader = isDashboard || isArticleDetail || isMobileHome || isProfile;
  const hideFooter = isDashboard || isArticleDetail || isMobileHome || isSavedPage || isProfile;

  return (
    <div className={`flex flex-col min-h-screen font-sans text-kph-charcoal ${!isDashboard ? 'pb-16 lg:pb-0' : ''}`}>
      <OfflineBanner />
      <InstallPrompt />
      {!hideHeader && <Header />}
      <main className={`flex-grow relative ${!hideHeader ? 'pt-[80px] lg:pt-[100px]' : ''}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!isDashboard && !isArticleDetail && !isProfile && isStandalone && <BottomNav />}
      <NotificationPrompt />
    </div>
  );
};

const AppContent = () => {
  const { isStandalone } = useInstallPrompt();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  
  // Listen for push notifications routed to the foreground
  React.useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_RECEIVED') {
        const payload = event.data.payload;
        toast(payload.title || 'KPH News', {
          description: payload.body || 'A new article has been published.',
          duration: 10000,
          action: payload.data ? {
            label: 'View',
            onClick: () => {
              window.location.href = payload.data;
            }
          } : undefined
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  // Only serve the mobile-optimized PWA layout if it's both standalone AND a mobile screen
  const isMobilePWA = isStandalone && isMobile;
  
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <ScrollToTopWrapper />
      <LayoutWrapper isMobilePWA={isMobilePWA} isStandalone={isStandalone}>
        <Routes>
          <Route path="/" element={isMobilePWA ? <MobileHome /> : <Home />} />
          <Route path="/people" element={<People />} />
          <Route path="/article/:slugAndId" element={<ArticleDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/about" element={<About />} />
          <Route path="/writer-studio/*" element={<WriterStudio />} />
          <Route path="/news" element={<NewsCategory title="All News" topic="General" description="The latest breaking news and updates." />} />
          <Route path="/politics" element={<NewsCategory title="Politics" topic="Politics" description="Latest political updates and analysis." />} />
          <Route path="/sports" element={<SportsPage />} />
          <Route path="/sports/article/:slugAndId" element={<SportsArticleDetail />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LayoutWrapper>
      <CookieBanner />
    </Router>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
