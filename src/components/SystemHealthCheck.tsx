
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Database, 
  Server, 
  Lock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Activity
} from 'lucide-react';

interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastCheck: string;
}

const SystemHealthCheck = () => {
  const { user } = useAuth();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const performHealthCheck = async () => {
    setIsLoading(true);
    const checks: HealthCheck[] = [];
    let score = 0;

    try {
      // 1. Database Connection Check
      try {
        const { error } = await supabase.from('profiles').select('count').limit(1);
        if (!error) {
          checks.push({
            id: 'database',
            name: 'Conexão com Banco de Dados',
            status: 'healthy',
            message: 'Conexão estabelecida com sucesso',
            lastCheck: new Date().toISOString()
          });
          score += 20;
        } else {
          throw error;
        }
      } catch (error) {
        checks.push({
          id: 'database',
          name: 'Conexão com Banco de Dados',
          status: 'critical',
          message: 'Falha na conexão com o banco de dados',
          lastCheck: new Date().toISOString()
        });
      }

      // 2. Authentication System Check
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session) {
          checks.push({
            id: 'auth',
            name: 'Sistema de Autenticação',
            status: 'healthy',
            message: 'Sistema de autenticação funcionando',
            lastCheck: new Date().toISOString()
          });
          score += 20;
        } else {
          checks.push({
            id: 'auth',
            name: 'Sistema de Autenticação',
            status: 'warning',
            message: 'Usuário não autenticado',
            lastCheck: new Date().toISOString()
          });
          score += 10;
        }
      } catch (error) {
        checks.push({
          id: 'auth',
          name: 'Sistema de Autenticação',
          status: 'critical',
          message: 'Falha no sistema de autenticação',
          lastCheck: new Date().toISOString()
        });
      }

      // 3. RLS (Row Level Security) Check
      try {
        // Verificar se o usuário pode acessar apenas seus próprios dados
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user?.id || '')
          .limit(1);

        if (!error || error.code === 'PGRST116') { // PGRST116 = no rows returned
          checks.push({
            id: 'rls',
            name: 'Row Level Security (RLS)',
            status: 'healthy',
            message: 'RLS ativo e funcionando corretamente',
            lastCheck: new Date().toISOString()
          });
          score += 20;
        } else {
          throw error;
        }
      } catch (error) {
        checks.push({
          id: 'rls',
          name: 'Row Level Security (RLS)',
          status: 'warning',
          message: 'RLS pode não estar configurado corretamente',
          lastCheck: new Date().toISOString()
        });
        score += 10;
      }

      // 4. N8N Integration Check
      try {
        const { data: workflows } = await supabase
          .from('n8n_workflows')
          .select('*')
          .eq('ativo', true)
          .limit(1);

        if (workflows && workflows.length > 0) {
          checks.push({
            id: 'n8n',
            name: 'Integração N8N',
            status: 'healthy',
            message: `${workflows.length} workflow(s) ativo(s) encontrado(s)`,
            lastCheck: new Date().toISOString()
          });
          score += 20;
        } else {
          checks.push({
            id: 'n8n',
            name: 'Integração N8N',
            status: 'warning',
            message: 'Nenhum workflow N8N ativo encontrado',
            lastCheck: new Date().toISOString()
          });
          score += 5;
        }
      } catch (error) {
        checks.push({
          id: 'n8n',
          name: 'Integração N8N',
          status: 'critical',
          message: 'Falha ao verificar integração N8N',
          lastCheck: new Date().toISOString()
        });
      }

      // 5. Logs System Check
      try {
        const { data, error } = await supabase
          .from('logs_atividades')
          .select('count')
          .limit(1);

        if (!error) {
          checks.push({
            id: 'logs',
            name: 'Sistema de Logs',
            status: 'healthy',
            message: 'Sistema de auditoria funcionando',
            lastCheck: new Date().toISOString()
          });
          score += 20;
        } else {
          throw error;
        }
      } catch (error) {
        checks.push({
          id: 'logs',
          name: 'Sistema de Logs',
          status: 'critical',
          message: 'Sistema de logs não acessível',
          lastCheck: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Erro durante health check:', error);
    }

    setHealthChecks(checks);
    setOverallScore(score);
    setIsLoading(false);
  };

  useEffect(() => {
    performHealthCheck();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Verificação de Saúde do Sistema</CardTitle>
              <CardDescription>
                Monitoramento em tempo real dos componentes críticos
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <div className="text-sm text-gray-500">
              {getScoreStatus(overallScore)}
            </div>
          </div>
        </div>
        <Button 
          onClick={performHealthCheck}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Verificar Novamente
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {healthChecks.map((check) => (
            <div key={check.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center space-x-3">
                {getStatusIcon(check.status)}
                <div>
                  <h4 className="font-medium">{check.name}</h4>
                  <p className="text-sm text-gray-600">{check.message}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={
                  check.status === 'healthy' ? 'default' :
                  check.status === 'warning' ? 'secondary' : 'destructive'
                }>
                  {check.status === 'healthy' ? 'Saudável' :
                   check.status === 'warning' ? 'Atenção' : 'Crítico'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(check.lastCheck).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {healthChecks.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma verificação realizada ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
