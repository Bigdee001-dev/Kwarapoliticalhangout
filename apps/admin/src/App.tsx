import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import { Skeleton } from '@/components/ui/skeleton';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Articles = lazy(() => import('./pages/articles/Articles'));
const ArticleReview = lazy(() => import('./pages/articles/ArticleReview'));
const ArticleEditor = lazy(() => import('./pages/articles/ArticleEditor'));
const People = lazy(() => import('./pages/people/People'));
const PersonForm = lazy(() => import('./pages/people/PersonForm'));
const Writers = lazy(() => import('./pages/writers/Writers'));
const WriterStats = lazy(() => import('./pages/writers/WriterStats'));
const Categories = lazy(() => import('./pages/Categories'));
const Newsletter = lazy(() => import('./pages/newsletter/Newsletter'));
const DigestComposer = lazy(() => import('./pages/newsletter/DigestComposer'));
const ErrorMonitoring = lazy(() => import('./pages/monitoring/ErrorMonitoring'));
const Tips = lazy(() => import('./pages/Tips'));
const Ads = lazy(() => import('./pages/Ads'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="p-8 space-y-4">
    <Skeleton className="h-8 w-1/4" />
    <Skeleton className="h-64 w-full" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const AdminApp: React.FC = () => {
  // Initialize auth listener and session management
  useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="font-sans antialiased">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              } />
              
              <Route path="articles" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Articles />
                </Suspense>
              } />
              <Route path="articles/new" element={
                <Suspense fallback={<LoadingFallback />}>
                  <ArticleEditor />
                </Suspense>
              } />
              <Route path="articles/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <ArticleReview />
                </Suspense>
              } />
              <Route path="articles/:id/edit" element={
                <Suspense fallback={<LoadingFallback />}>
                  <ArticleEditor />
                </Suspense>
              } />

              <Route path="people" element={
                <Suspense fallback={<LoadingFallback />}>
                  <People />
                </Suspense>
              } />
              <Route path="people/new" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PersonForm />
                </Suspense>
              } />
              <Route path="people/:id/edit" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PersonForm />
                </Suspense>
              } />

              <Route path="writers" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Writers />
                </Suspense>
              } />
              <Route path="writers/:uid" element={
                <Suspense fallback={<LoadingFallback />}>
                  <WriterStats />
                </Suspense>
              } />

              <Route path="categories" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Categories />
                </Suspense>
              } />

              <Route path="newsletter" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Newsletter />
                </Suspense>
              } />
              <Route path="newsletter/compose" element={
                <Suspense fallback={<LoadingFallback />}>
                  <DigestComposer />
                </Suspense>
              } />

              <Route path="errors" element={
                <Suspense fallback={<LoadingFallback />}>
                  <ErrorMonitoring />
                </Suspense>
              } />

              <Route path="tips" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Tips />
                </Suspense>
              } />

              <Route path="ads" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Ads />
                </Suspense>
              } />

              <Route path="settings" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Settings />
                </Suspense>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster position="top-right" closeButton richColors />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default AdminApp;
