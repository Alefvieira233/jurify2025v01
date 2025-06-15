
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Timeout de 10 segundos para detectar travamento
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ ProtectedRoute - Timeout de carregamento atingido');
        setTimeoutReached(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  console.log('🛡️ ProtectedRoute - Estado:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading,
    timeoutReached
  });

  // Se atingiu timeout, mostrar opções de recuperação
  if (timeoutReached && loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Falha na Validação de Sessão
            </h3>
            <p className="text-gray-600 mb-6">
              O sistema está demorando para validar sua sessão. Isso pode ser um problema temporário.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar loading enquanto verifica autenticação (com timeout)
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
