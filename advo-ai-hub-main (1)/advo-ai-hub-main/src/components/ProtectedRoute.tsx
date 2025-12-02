
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - Estado:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading
  });

  // Show loading while checking auth
  if (loading) {
    console.log('🔄 ProtectedRoute - Ainda carregando, mostrando spinner');
    return <LoadingSpinner fullScreen text="Verificando autenticação..." />;
  }

  // If no user authenticated, redirect to login
  if (!user) {
    console.log('🚫 ProtectedRoute - Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ ProtectedRoute - Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
};

export default ProtectedRoute;
