
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Timeout de 8 segundos para detectar travamento
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ ProtectedRoute - Timeout de carregamento atingido');
        setTimeoutReached(true);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [loading]);

  console.log('🛡️ ProtectedRoute - Estado:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading,
    timeoutReached
  });

  // Se atingiu timeout, forçar redirecionamento
  if (timeoutReached && loading) {
    console.log('⏰ Timeout atingido, redirecionando para auth');
    return <Navigate to="/auth" replace />;
  }

  // Mostrar loading por no máximo 8 segundos
  if (loading && !timeoutReached) {
    console.log('🔄 ProtectedRoute - Ainda carregando, mostrando spinner');
    return <LoadingSpinner fullScreen text="Verificando autenticação..." />;
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    console.log('🚫 ProtectedRoute - Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ ProtectedRoute - Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
};

export default ProtectedRoute;
