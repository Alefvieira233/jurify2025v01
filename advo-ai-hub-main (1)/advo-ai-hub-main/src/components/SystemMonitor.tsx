
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSystemValidator } from '@/utils/systemValidator';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Database, 
  Key, 
  Link, 
  Zap, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  tests: {
    database: { success: boolean; message: string; details?: any };
    authentication: { success: boolean; message: string; details?: any };
    rls: { success: boolean; message: string; details?: any };
    integrations: { success: boolean; message: string; details?: any };
    performance: { success: boolean; message: string; details?: any };
  };
  timestamp: string;
}

const SystemMonitor = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { runValidation } = useSystemValidator();

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      console.log('🔍 [SystemMonitor] Executando verificação de saúde...');
      const health = await runValidation();
      setSystemHealth(health);
      setLastUpdate(new Date().toLocaleString());
      
      // Também testar o health check endpoint
      try {
        const { data } = await supabase.functions.invoke('health-check');
        console.log('✅ [SystemMonitor] Health check endpoint:', data);
      } catch (error) {
        console.error('❌ [SystemMonitor] Erro no health check:', error);
      }
    } catch (error) {
      console.error('❌ [SystemMonitor] Erro na verificação:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(checkSystemHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (success: boolean) => {
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return <Badge className="bg-green-100 text-green-800">Operacional</Badge>;
    }
    return <Badge variant="destructive">Erro</Badge>;
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!systemHealth) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monitor do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Verificando status do sistema...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Monitor do Sistema
            </CardTitle>
            <Button
              onClick={checkSystemHealth}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Status Geral:</span>
              <span className={`text-lg font-bold capitalize ${getOverallStatusColor(systemHealth.overall)}`}>
                {systemHealth.overall === 'healthy' ? 'Saudável' : 
                 systemHealth.overall === 'degraded' ? 'Degradado' : 'Crítico'}
              </span>
            </div>
            
            {lastUpdate && (
              <p className="text-sm text-gray-500">
                Última verificação: {lastUpdate}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemHealth.tests.database.success)}
                {getStatusBadge(systemHealth.tests.database.success)}
              </div>
              <p className="text-xs text-gray-600">
                {systemHealth.tests.database.message}
              </p>
              {systemHealth.tests.database.details && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <p>Leitura: {systemHealth.tests.database.details.readable ? '✓' : '✗'}</p>
                  <p>Escrita: {systemHealth.tests.database.details.writeable ? '✓' : '✗'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4" />
              Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemHealth.tests.authentication.success)}
                {getStatusBadge(systemHealth.tests.authentication.success)}
              </div>
              <p className="text-xs text-gray-600">
                {systemHealth.tests.authentication.message}
              </p>
              {systemHealth.tests.authentication.details?.email && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <p>Usuário: {systemHealth.tests.authentication.details.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RLS Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Segurança RLS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemHealth.tests.rls.success)}
                {getStatusBadge(systemHealth.tests.rls.success)}
              </div>
              <p className="text-xs text-gray-600">
                {systemHealth.tests.rls.message}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Link className="h-4 w-4" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemHealth.tests.integrations.success)}
                {getStatusBadge(systemHealth.tests.integrations.success)}
              </div>
              <p className="text-xs text-gray-600">
                {systemHealth.tests.integrations.message}
              </p>
              {systemHealth.tests.integrations.details && (
                <div className="text-xs bg-gray-50 p-2 rounded space-y-1">
                  <p>N8N: {systemHealth.tests.integrations.details.n8n ? '✓' : '✗'}</p>
                  <p>OpenAI: {systemHealth.tests.integrations.details.openai ? '✓' : '✗'}</p>
                  <p>Health: {systemHealth.tests.integrations.details.healthCheck ? '✓' : '✗'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemHealth.tests.performance.success)}
                {getStatusBadge(systemHealth.tests.performance.success)}
              </div>
              <p className="text-xs text-gray-600">
                {systemHealth.tests.performance.message}
              </p>
              {systemHealth.tests.performance.details && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <Progress 
                    value={Math.min((systemHealth.tests.performance.details.responseTime / systemHealth.tests.performance.details.threshold) * 100, 100)} 
                    className="h-2 mb-1" 
                  />
                  <p>Limite: {systemHealth.tests.performance.details.threshold}ms</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xs bg-blue-50 p-2 rounded">
                <p><strong>Jurify SaaS</strong></p>
                <p>Versão: 1.0.0</p>
                <p>Ambiente: {process.env.NODE_ENV || 'development'}</p>
                <p>Build: Enterprise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemMonitor;
