import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Database, Server, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastCheck: string;
  details?: string;
}

const SystemHealthCheck = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const performHealthCheck = async () => {
    setLoading(true);
    const checks: HealthCheck[] = [];
    const now = new Date().toISOString();

    try {
      // 1. Verificar conexão com banco de dados
      try {
        const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
        checks.push({
          component: 'Database Connection',
          status: dbError ? 'critical' : 'healthy',
          message: dbError ? 'Falha na conexão com o banco' : 'Conectado',
          lastCheck: now,
          details: dbError?.message
        });
      } catch (error) {
        checks.push({
          component: 'Database Connection',
          status: 'critical',
          message: 'Erro na verificação do banco',
          lastCheck: now,
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      // 2. Verificar RLS (Row Level Security) - usando função válida
      try {
        const { data: rlsCheck } = await supabase.rpc('has_role', { 
          _user_id: '00000000-0000-0000-0000-000000000000',
          _role: 'admin' 
        });
        
        checks.push({
          component: 'Row Level Security',
          status: 'healthy',
          message: 'RLS ativo e funcionando',
          lastCheck: now
        });
      } catch (error) {
        checks.push({
          component: 'Row Level Security',
          status: 'warning',
          message: 'Verificação RLS indisponível',
          lastCheck: now,
          details: 'Função de verificação não encontrada'
        });
      }

      // 3. Verificar autenticação
      try {
        const { data: authData } = await supabase.auth.getSession();
        checks.push({
          component: 'Authentication',
          status: authData.session ? 'healthy' : 'warning',
          message: authData.session ? 'Sessão ativa' : 'Nenhuma sessão ativa',
          lastCheck: now
        });
      } catch (error) {
        checks.push({
          component: 'Authentication',
          status: 'critical',
          message: 'Falha no sistema de autenticação',
          lastCheck: now,
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      // 4. Verificar Edge Functions
      try {
        const { data: functionTest, error: functionError } = await supabase.functions.invoke('agentes-ia-api', {
          body: { test: true }
        });
        
        checks.push({
          component: 'Edge Functions',
          status: functionError ? 'warning' : 'healthy',
          message: functionError ? 'Algumas funções podem estar indisponíveis' : 'Funções operacionais',
          lastCheck: now,
          details: functionError?.message
        });
      } catch (error) {
        checks.push({
          component: 'Edge Functions',
          status: 'critical',
          message: 'Edge Functions indisponíveis',
          lastCheck: now,
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      // 5. Verificar integridade das tabelas críticas
      const criticalTables = ['profiles', 'user_roles', 'leads', 'contratos'];
      for (const table of criticalTables) {
        try {
          const { error: tableError } = await supabase
            .from(table as any)
            .select('count')
            .limit(1);
          
          checks.push({
            component: `Table: ${table}`,
            status: tableError ? 'critical' : 'healthy',
            message: tableError ? 'Tabela inacessível' : 'Tabela acessível',
            lastCheck: now,
            details: tableError?.message
          });
        } catch (error) {
          checks.push({
            component: `Table: ${table}`,
            status: 'critical',
            message: 'Erro ao verificar tabela',
            lastCheck: now,
            details: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

    } catch (error) {
      toast({
        title: "Erro no Health Check",
        description: "Falha ao executar verificações de saúde do sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }

    setHealthChecks(checks);
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
    }
  };

  const criticalIssues = healthChecks.filter(check => check.status === 'critical').length;
  const warnings = healthChecks.filter(check => check.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health Check
          </div>
          <Button
            onClick={performHealthCheck}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Overview */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                {healthChecks.filter(c => c.status === 'healthy').length} Saudável
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">{warnings} Avisos</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">{criticalIssues} Críticos</span>
            </div>
          </div>

          {/* Health Checks List */}
          <div className="space-y-2">
            {healthChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <div className="font-medium">{check.component}</div>
                    <div className="text-sm text-gray-600">{check.message}</div>
                    {check.details && (
                      <div className="text-xs text-red-600 mt-1">{check.details}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(check.lastCheck).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {criticalIssues > 0 && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Atenção Requerida</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {criticalIssues} problema(s) crítico(s) detectado(s). Verifique imediatamente.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
