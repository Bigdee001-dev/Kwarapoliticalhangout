import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MobileHome from './pages/MobileHome';
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
import WriterStudio from './pages/WriterStudio';
import AdminApp from '../apps/admin/src/App';
import CookieBanner from './components/CookieBanner';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import { useInstallPrompt } from './hooks/useInstallPrompt';

// ScrollToTop component to reset scroll on route change
const ScrollToTopWrapper = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Wrapper to hide Header/Footer for Dashboard and Studio
const LayoutWrapper: React.FC<{ children: React.ReactNode, isStandalone: boolean }> = ({ children, isStandalone }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/writer-studio');
  const isArticleDetail = location.pathname.startsWith('/article/');
  const isMobileHome = isStandalone && location.pathname === '/';

  return (
    <div className={`flex flex-col min-h-screen font-sans text-kph-charcoal ${!isDashboard ? 'pb-16 lg:pb-0' : ''}`}>
      <OfflineBanner />
      <InstallPrompt />
      {!isDashboard && !isArticleDetail && !isMobileHome && <Header />}
      <main className={`flex-grow relative ${!isDashboard && !isArticleDetail && !isMobileHome ? 'pt-[80px] lg:pt-[100px]' : ''}`}>
        {children}
      </main>
      {!isDashboard && !isArticleDetail && !isMobileHome && <Footer />}
      {!isDashboard && !isArticleDetail && <BottomNav />}
    </div>
  );
};

const AppContent = () => {
  const { isStandalone } = useInstallPrompt();
  
  return (
    <Router>
      <ScrollToTopWrapper />
      <LayoutWrapper isStandalone={isStandalone}>
        <Routes>
          <Route path="/" element={isStandalone ? <MobileHome /> : <Home />} />
          <Route path="/people" element={<People />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
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
          <Route path="/sports/article/:id" element={<SportsArticleDetail />} />
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
