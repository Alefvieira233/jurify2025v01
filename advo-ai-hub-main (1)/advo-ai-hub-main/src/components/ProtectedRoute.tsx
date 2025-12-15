
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ ProtectedRoute - Timeout de autenticação (3s). Redirecionando.');
        setIsTimeout(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  console.log('🛡️ ProtectedRoute - Estado:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading,
    isTimeout
  });

  // Show loading while checking auth, unless timeout hit
  if (loading && !isTimeout) {
    console.log('🔄 ProtectedRoute - Ainda carregando, mostrando spinner');
    return <LoadingSpinner fullScreen text="Verificando autenticação..." />;
  }

  // If no user authenticated OR timeout hit, redirect to login
  if (!user || (loading && isTimeout)) {
    console.log('🚫 ProtectedRoute - Usuário não autenticado ou timeout, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ ProtectedRoute - Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
};

export default ProtectedRoute;
