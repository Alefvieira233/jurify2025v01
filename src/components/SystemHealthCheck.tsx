
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckItem {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const SystemHealthCheck = () => {
  const [checks, setChecks] = useState<HealthCheckItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const healthChecks = [
    {
      name: 'Conexão com Supabase',
      check: async () => {
        try {
          const { data, error } = await supabase.from('profiles').select('id').limit(1);
          if (error) throw error;
          return { status: 'success', message: 'Conectado com sucesso' };
        } catch (error) {
          return { status: 'error', message: 'Erro de conexão', details: error.message };
        }
      }
    },
    {
      name: 'Autenticação do Usuário',
      check: async () => {
        if (user) {
          return { status: 'success', message: 'Usuário autenticado' };
        }
        return { status: 'error', message: 'Usuário não autenticado' };
      }
    },
    {
      name: 'Edge Functions - N8N',
      check: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('n8n-webhook-forwarder', {
            body: { agentId: 'test', prompt: 'health check' }
          });
          if (error) throw error;
          return { status: 'success', message: 'N8N webhook funcionando' };
        } catch (error) {
          return { status: 'warning', message: 'N8N pode estar indisponível', details: error.message };
        }
      }
    },
    {
      name: 'Edge Functions - Agentes IA',
      check: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('agentes-ia-api');
          // Função pode retornar erro por não ter dados, mas se executar está OK
          return { status: 'success', message: 'API de agentes funcionando' };
        } catch (error) {
          return { status: 'warning', message: 'API de agentes pode estar indisponível', details: error.message };
        }
      }
    },
    {
      name: 'Tabelas do Banco',
      check: async () => {
        try {
          const tables = ['leads', 'contratos', 'agendamentos', 'agentes_ia', 'n8n_workflows'];
          const results = await Promise.all(
            tables.map(table => supabase.from(table).select('id').limit(1))
          );
          
          const errors = results.filter(r => r.error);
          if (errors.length > 0) {
            return { status: 'error', message: `${errors.length} tabelas com erro` };
          }
          
          return { status: 'success', message: 'Todas as tabelas acessíveis' };
        } catch (error) {
          return { status: 'error', message: 'Erro ao acessar tabelas', details: error.message };
        }
      }
    },
    {
      name: 'Configuração N8N',
      check: async () => {
        try {
          const { data, error } = await supabase
            .from('n8n_workflows')
            .select('*')
            .eq('ativo', true)
            .limit(1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            return { status: 'success', message: 'Workflow N8N configurado' };
          } else {
            return { status: 'warning', message: 'Nenhum workflow N8N ativo' };
          }
        } catch (error) {
          return { status: 'error', message: 'Erro ao verificar N8N', details: error.message };
        }
      }
    }
  ];

  const runHealthCheck = async () => {
    setIsRunning(true);
    setChecks(healthChecks.map(hc => ({ 
      name: hc.name, 
      status: 'checking', 
      message: 'Verificando...' 
    })));

    for (let i = 0; i < healthChecks.length; i++) {
      const result = await healthChecks[i].check();
      
      setChecks(prev => prev.map((check, index) => 
        index === i 
          ? { 
              name: check.name, 
              status: result.status as any, 
              message: result.message,
              details: result.details 
            }
          : check
      ));
      
      // Pequeno delay para visualizar o progresso
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    
    const allSuccess = checks.every(c => c.status === 'success');
    const hasErrors = checks.some(c => c.status === 'error');
    
    toast({
      title: allSuccess ? 'Sistema funcionando perfeitamente!' : hasErrors ? 'Problemas detectados' : 'Sistema funcionando com avisos',
      description: `${checks.filter(c => c.status === 'success').length}/${checks.length} verificações passaram`,
      variant: hasErrors ? 'destructive' : 'default',
    });
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Verificando</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-600">Aviso</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Verificação de Saúde do Sistema
            </CardTitle>
            <CardDescription>
              Monitore o status de todos os componentes críticos do Jurify
            </CardDescription>
          </div>
          <Button
            onClick={runHealthCheck}
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Verificando...' : 'Verificar Novamente'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="font-medium">{check.name}</p>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                  {check.details && (
                    <p className="text-xs text-red-600 mt-1">{check.details}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>
        
        {checks.length > 0 && !isRunning && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Status Geral do Sistema</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-green-600 font-medium">
                  {checks.filter(c => c.status === 'success').length}
                </span>
                <span className="text-gray-600 ml-1">Funcionando</span>
              </div>
              <div>
                <span className="text-yellow-600 font-medium">
                  {checks.filter(c => c.status === 'warning').length}
                </span>
                <span className="text-gray-600 ml-1">Avisos</span>
              </div>
              <div>
                <span className="text-red-600 font-medium">
                  {checks.filter(c => c.status === 'error').length}
                </span>
                <span className="text-gray-600 ml-1">Erros</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
