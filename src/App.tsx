
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import People from './pages/People';
import ArticleDetail from './pages/ArticleDetail';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewsCategory from './pages/NewsCategory';
import About from './pages/About';
import SearchResults from './pages/SearchResults';
import WriterStudio from './pages/WriterStudio';
import AdminApp from '../apps/admin/src/App';
import CookieBanner from './components/CookieBanner';

// ScrollToTop component to reset scroll on route change
const ScrollToTopWrapper = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Wrapper to hide Header/Footer for Dashboard and Studio
const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/writer-studio');
  const isArticleDetail = location.pathname.startsWith('/article/');

  return (
    <div className="flex flex-col min-h-screen font-sans text-kph-charcoal">
      {!isDashboard && !isArticleDetail && <Header />}
      <main className="flex-grow relative">
        {children}
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTopWrapper />
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/people" element={<People />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/writer-studio" element={<WriterStudio />} />

          <Route
            path="/politics"
            element={
              <NewsCategory
                title="Kwara Politics"
                topic="Politics"
                description="In-depth analysis of government policies, elections, legislative activities, and party dynamics within the state."
              />
            }
          />
          <Route
            path="/media"
            element={
              <NewsCategory
                title="Media & Press"
                topic="Media"
                description="Updates on the state of journalism, broadcasting, freedom of speech, and information dissemination across Kwara."
              />
            }
          />
          <Route
            path="/news"
            element={
              <NewsCategory
                title="General News"
                topic="General"
                description="Breaking stories, community updates, and significant events happening across Ilorin and the 16 LGAs."
              />
            }
          />
          <Route path="/about" element={<About />} />
        </Routes>
      </LayoutWrapper>
      <CookieBanner />
    </Router>
  );
};

export default App;
