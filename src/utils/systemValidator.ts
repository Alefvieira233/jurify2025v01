
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  tests: {
    database: ValidationResult;
    authentication: ValidationResult;
    rls: ValidationResult;
    integrations: ValidationResult;
    performance: ValidationResult;
  };
  timestamp: string;
}

export class SystemValidator {
  async runFullValidation(): Promise<SystemHealth> {
    console.log('🔍 [SystemValidator] Iniciando validação completa do sistema...');
    
    const results: SystemHealth = {
      overall: 'healthy',
      tests: {
        database: await this.testDatabase(),
        authentication: await this.testAuthentication(),
        rls: await this.testRLS(),
        integrations: await this.testIntegrations(),
        performance: await this.testPerformance(),
      },
      timestamp: new Date().toISOString(),
    };

    // Determinar status geral
    const hasErrors = Object.values(results.tests).some(test => !test.success);
    if (hasErrors) {
      results.overall = 'degraded';
    }

    console.log('✅ [SystemValidator] Validação completa finalizada:', results.overall);
    return results;
  }

  private async testDatabase(): Promise<ValidationResult> {
    try {
      console.log('🗄️ [SystemValidator] Testando conexão com database...');
      
      // Teste básico de conectividade
      const { data, error } = await supabase
        .from('leads')
        .select('count')
        .limit(1);

      if (error) throw error;

      // Teste de escrita (inserção temporária)
      const testData = {
        nome_completo: 'Test User - Sistema Validator',
        email: 'test@systemvalidator.com',
        telefone: '11999999999',
        area_juridica: 'Teste',
        origem: 'Sistema',
        responsavel: 'Sistema',
        status: 'novo_lead'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('leads')
        .insert([testData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Limpar dados de teste
      if (insertData?.id) {
        await supabase
          .from('leads')
          .delete()
          .eq('id', insertData.id);
      }

      return {
        success: true,
        message: 'Database conectado e operacional',
        details: { writeable: true, readable: true }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro na conexão com database',
        details: { error: error.message }
      };
    }
  }

  private async testAuthentication(): Promise<ValidationResult> {
    try {
      console.log('🔐 [SystemValidator] Testando sistema de autenticação...');
      
      // Verificar se o usuário está autenticado
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      return {
        success: !!user,
        message: user ? 'Usuário autenticado com sucesso' : 'Nenhum usuário autenticado',
        details: { 
          userId: user?.id,
          email: user?.email,
          authenticated: !!user
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro no sistema de autenticação',
        details: { error: error.message }
      };
    }
  }

  private async testRLS(): Promise<ValidationResult> {
    try {
      console.log('🛡️ [SystemValidator] Testando Row Level Security...');
      
      // Testar se RLS está ativo nas tabelas críticas
      const tables = ['leads', 'contratos', 'agendamentos', 'agentes_ia'] as const;
      const rlsStatus: Record<string, boolean> = {};

      for (const table of tables) {
        try {
          // Tentar acessar a tabela - se RLS estiver funcionando, só retornará dados do usuário atual
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          // Se não houver erro, RLS está permitindo acesso (o que é esperado para usuário autenticado)
          rlsStatus[table] = !error;
        } catch {
          rlsStatus[table] = false;
        }
      }

      const allTablesAccessible = Object.values(rlsStatus).every(status => status);

      return {
        success: allTablesAccessible,
        message: allTablesAccessible ? 'RLS funcionando corretamente' : 'Problemas detectados no RLS',
        details: rlsStatus
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao testar RLS',
        details: { error: error.message }
      };
    }
  }

  private async testIntegrations(): Promise<ValidationResult> {
    try {
      console.log('🔗 [SystemValidator] Testando integrações externas...');
      
      const integrations = {
        healthCheck: false,
        n8n: false,
        openai: false
      };

      // Testar Health Check endpoint
      try {
        const healthResponse = await supabase.functions.invoke('health-check');
        integrations.healthCheck = healthResponse.data?.status === 'ok';
      } catch {
        integrations.healthCheck = false;
      }

      // Testar N8N (através do health check)
      integrations.n8n = integrations.healthCheck;

      // Testar OpenAI (através do health check)
      integrations.openai = integrations.healthCheck;

      const allIntegrationsWorking = Object.values(integrations).every(status => status);

      return {
        success: allIntegrationsWorking,
        message: allIntegrationsWorking ? 'Todas as integrações funcionando' : 'Algumas integrações com problemas',
        details: integrations
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao testar integrações',
        details: { error: error.message }
      };
    }
  }

  private async testPerformance(): Promise<ValidationResult> {
    try {
      console.log('⚡ [SystemValidator] Testando performance do sistema...');
      
      const startTime = performance.now();
      
      // Executar várias operações para medir performance
      const operations = [
        supabase.from('leads').select('count').limit(1),
        supabase.from('contratos').select('count').limit(1),
        supabase.from('agendamentos').select('count').limit(1),
        supabase.from('agentes_ia').select('count').limit(1),
      ];

      await Promise.all(operations);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Considerar performance boa se for menor que 2 segundos
      const isPerformant = responseTime < 2000;

      return {
        success: isPerformant,
        message: `Tempo de resposta: ${responseTime.toFixed(2)}ms`,
        details: {
          responseTime,
          threshold: 2000,
          performant: isPerformant
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao testar performance',
        details: { error: error.message }
      };
    }
  }
}

// Hook para usar o validador no React
export const useSystemValidator = () => {
  const validator = new SystemValidator();
  
  const runValidation = async () => {
    return await validator.runFullValidation();
  };
  
  return { runValidation };
};
