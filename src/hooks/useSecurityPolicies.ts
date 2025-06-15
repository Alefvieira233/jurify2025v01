
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'database' | 'api' | 'network' | 'permissions';
}

interface SecurityMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  securityScore: number;
  lastScan: string;
}

export const useSecurityPolicies = () => {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    warningChecks: 0,
    securityScore: 0,
    lastScan: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runSecurityScan = async () => {
    if (!user) return;

    setLoading(true);
    const scanResults: SecurityCheck[] = [];

    try {
      // 1. Verificar autenticação
      try {
        const { data: session } = await supabase.auth.getSession();
        scanResults.push({
          id: 'auth-session',
          name: 'Sessão de Autenticação',
          status: session ? 'pass' : 'fail',
          message: session ? 'Usuário autenticado corretamente' : 'Sessão inválida ou expirada',
          severity: session ? 'low' : 'critical',
          category: 'authentication'
        });
      } catch (error) {
        scanResults.push({
          id: 'auth-error',
          name: 'Sistema de Autenticação',
          status: 'fail',
          message: 'Erro ao verificar sistema de autenticação',
          severity: 'critical',
          category: 'authentication'
        });
      }

      // 2. Verificar RLS nas tabelas críticas
      const criticalTables: ('profiles' | 'agentes_ia' | 'api_keys' | 'logs_atividades')[] = ['profiles', 'agentes_ia', 'api_keys', 'logs_atividades'];
      for (const table of criticalTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

          scanResults.push({
            id: `rls-${table}`,
            name: `RLS da tabela ${table}`,
            status: error && error.code === 'PGRST301' ? 'pass' : 'warning',
            message: error && error.code === 'PGRST301' 
              ? 'RLS ativo e funcionando' 
              : 'RLS pode não estar configurado adequadamente',
            severity: 'medium',
            category: 'database'
          });
        } catch (error) {
          scanResults.push({
            id: `rls-error-${table}`,
            name: `RLS da tabela ${table}`,
            status: 'fail',
            message: 'Erro ao verificar RLS',
            severity: 'high',
            category: 'database'
          });
        }
      }

      // 3. Verificar API Keys ativas
      try {
        const { data: apiKeys, error } = await supabase
          .from('api_keys')
          .select('id, ativo')
          .eq('ativo', true);

        if (!error) {
          const activeCount = apiKeys?.length || 0;
          scanResults.push({
            id: 'api-keys',
            name: 'API Keys Ativas',
            status: activeCount > 0 ? 'pass' : 'warning',
            message: `${activeCount} API key(s) ativa(s) encontrada(s)`,
            severity: activeCount > 0 ? 'low' : 'medium',
            category: 'api'
          });
        }
      } catch (error) {
        scanResults.push({
          id: 'api-keys-error',
          name: 'Verificação de API Keys',
          status: 'fail',
          message: 'Erro ao verificar API keys',
          severity: 'medium',
          category: 'api'
        });
      }

      // 4. Verificar logs de atividade
      try {
        const { data: recentLogs, error } = await supabase
          .from('logs_atividades')
          .select('id')
          .gte('data_hora', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!error) {
          scanResults.push({
            id: 'activity-logs',
            name: 'Sistema de Auditoria',
            status: 'pass',
            message: 'Sistema de logs funcionando corretamente',
            severity: 'low',
            category: 'permissions'
          });
        }
      } catch (error) {
        scanResults.push({
          id: 'logs-error',
          name: 'Sistema de Auditoria',
          status: 'fail',
          message: 'Erro no sistema de logs de auditoria',
          severity: 'high',
          category: 'permissions'
        });
      }

      // 5. Verificar conectividade N8N
      try {
        const { data: workflows, error } = await supabase
          .from('n8n_workflows')
          .select('id, ativo')
          .eq('ativo', true)
          .limit(1);

        if (!error) {
          const activeWorkflows = workflows?.length || 0;
          scanResults.push({
            id: 'n8n-connectivity',
            name: 'Conectividade N8N',
            status: activeWorkflows > 0 ? 'pass' : 'warning',
            message: `${activeWorkflows} workflow(s) N8N ativo(s)`,
            severity: 'medium',
            category: 'network'
          });
        }
      } catch (error) {
        scanResults.push({
          id: 'n8n-error',
          name: 'Conectividade N8N',
          status: 'fail',
          message: 'Erro ao verificar workflows N8N',
          severity: 'medium',
          category: 'network'
        });
      }

      // Calcular métricas
      const totalChecks = scanResults.length;
      const passedChecks = scanResults.filter(c => c.status === 'pass').length;
      const failedChecks = scanResults.filter(c => c.status === 'fail').length;
      const warningChecks = scanResults.filter(c => c.status === 'warning').length;
      const securityScore = Math.round((passedChecks / totalChecks) * 100);

      setChecks(scanResults);
      setMetrics({
        totalChecks,
        passedChecks,
        failedChecks,
        warningChecks,
        securityScore,
        lastScan: new Date().toISOString()
      });

      console.log(`🔒 [Security] Scan completo: ${securityScore}% (${passedChecks}/${totalChecks})`);

    } catch (error) {
      console.error('❌ [Security] Erro no scan de segurança:', error);
      toast({
        title: 'Erro no scan de segurança',
        description: 'Não foi possível completar a verificação de segurança',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runSecurityScan();
    }
  }, [user]);

  return {
    checks,
    metrics,
    loading,
    runSecurityScan,
    isSecure: metrics.securityScore >= 80,
    hasWarnings: metrics.warningChecks > 0,
    hasCritical: checks.some(c => c.severity === 'critical' && c.status === 'fail')
  };
};
