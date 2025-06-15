
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - State:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading 
  });

  if (loading) {
    console.log('ProtectedRoute - Loading, showing spinner');
    return <LoadingSpinner fullScreen text="Verificando autenticação..." />;
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('ProtectedRoute - User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
