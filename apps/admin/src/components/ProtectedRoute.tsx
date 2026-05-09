import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userRole, isLoading } = useAuthStore();
  const location = useLocation();

  console.log('ProtectedRoute processing. Path:', location.pathname, 'Loading:', isLoading, 'User:', user?.email, 'Role:', userRole);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole !== 'editor' && userRole !== 'admin') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="font-serif text-4xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-4 text-muted-foreground">You do not have permission to access the Admin Portal.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-8 text-primary underline"
        >
          Return to Public Site
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
