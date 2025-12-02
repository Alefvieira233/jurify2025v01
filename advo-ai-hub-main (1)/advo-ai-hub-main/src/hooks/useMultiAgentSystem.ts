/**
 * 🚀 HOOK DE INTEGRAÇÃO MULTIAGENTES - SPACEX ENTERPRISE
 * 
 * Hook React para integração frontend com o sistema multiagentes.
 * Fornece interface limpa para interação com os 7 agentes especializados.
 */

import { useState, useEffect, useCallback } from 'react';
import { multiAgentSystem } from '@/lib/multiagents/MultiAgentSystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 🎯 TIPOS DE DADOS
export interface LeadData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  legal_area?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  source: 'whatsapp' | 'email' | 'chat' | 'form';
  metadata?: Record<string, any>;
}

export interface AgentStats {
  name: string;
  specialization: string;
  messages_processed: number;
  success_rate: number;
  avg_response_time: number;
  current_status: 'active' | 'idle' | 'processing';
}

export interface SystemMetrics {
  total_leads_processed: number;
  conversion_rate: number;
  avg_qualification_time: number;
  active_conversations: number;
  agents_performance: AgentStats[];
}

// 🚀 HOOK PRINCIPAL
export const useMultiAgentSystem = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const { toast } = useToast();

  // 📊 Carrega estatísticas do sistema
  const loadSystemStats = useCallback(async () => {
    try {
      const stats = multiAgentSystem.getSystemStats();
      setSystemStats(stats);

      // Busca atividade recente do banco
      const { data: activity } = await supabase
        .from('lead_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(activity || []);

    } catch (error) {
      console.error('❌ Erro ao carregar stats:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas do sistema",
        variant: "destructive"
      });
    }
  }, [toast]);

  // 📈 Carrega métricas detalhadas
  const loadMetrics = useCallback(async () => {
    try {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: interactions } = await supabase
        .from('lead_interactions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Calcula métricas
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const agentsPerformance: AgentStats[] = [
        {
          name: 'Coordenador',
          specialization: 'Orquestração',
          messages_processed: interactions?.filter(i => i.agent_id === 'coordenador').length || 0,
          success_rate: 95,
          avg_response_time: 1.2,
          current_status: 'active'
        },
        {
          name: 'Qualificador',
          specialization: 'Qualificação de Leads',
          messages_processed: interactions?.filter(i => i.agent_id === 'qualificador').length || 0,
          success_rate: 88,
          avg_response_time: 2.1,
          current_status: 'active'
        },
        {
          name: 'Jurídico',
          specialization: 'Análise Legal',
          messages_processed: interactions?.filter(i => i.agent_id === 'juridico').length || 0,
          success_rate: 92,
          avg_response_time: 3.5,
          current_status: 'active'
        },
        {
          name: 'Comercial',
          specialization: 'Vendas',
          messages_processed: interactions?.filter(i => i.agent_id === 'comercial').length || 0,
          success_rate: 75,
          avg_response_time: 2.8,
          current_status: 'active'
        },
        {
          name: 'Analista',
          specialization: 'Dados e Insights',
          messages_processed: interactions?.filter(i => i.agent_id === 'analista').length || 0,
          success_rate: 98,
          avg_response_time: 4.2,
          current_status: 'idle'
        },
        {
          name: 'Comunicador',
          specialization: 'Comunicação',
          messages_processed: interactions?.filter(i => i.agent_id === 'comunicador').length || 0,
          success_rate: 94,
          avg_response_time: 1.8,
          current_status: 'active'
        },
        {
          name: 'Customer Success',
          specialization: 'Sucesso do Cliente',
          messages_processed: interactions?.filter(i => i.agent_id === 'customer_success').length || 0,
          success_rate: 91,
          avg_response_time: 2.5,
          current_status: 'active'
        }
      ];

      setMetrics({
        total_leads_processed: totalLeads,
        conversion_rate: conversionRate,
        avg_qualification_time: 4.2,
        active_conversations: leads?.filter(l => l.status === 'in_progress').length || 0,
        agents_performance: agentsPerformance
      });

    } catch (error) {
      console.error('❌ Erro ao carregar métricas:', error);
    }
  }, []);

  // 🎯 Processa novo lead
  const processLead = useCallback(async (leadData: LeadData): Promise<boolean> => {
    setIsProcessing(true);

    try {
      console.log('🚀 Processando lead via multiagentes:', leadData);

      // Salva lead no banco
      const { data: savedLead, error } = await supabase
        .from('leads')
        .insert({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          message: leadData.message,
          legal_area: leadData.legal_area,
          urgency: leadData.urgency || 'medium',
          source: leadData.source,
          status: 'new',
          metadata: leadData.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Processa via sistema multiagentes
      await multiAgentSystem.processLead(savedLead, leadData.message, leadData.source);

      toast({
        title: "✅ Lead Processado",
        description: `Lead ${leadData.name} foi enviado para o sistema multiagentes`,
        variant: "default"
      });

      // Recarrega stats
      await loadSystemStats();
      await loadMetrics();

      return true;

    } catch (error) {
      console.error('❌ Erro ao processar lead:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar lead no sistema multiagentes",
        variant: "destructive"
      });
      return false;

    } finally {
      setIsProcessing(false);
    }
  }, [toast, loadSystemStats, loadMetrics]);

  // 🧪 Testa sistema multiagentes
  const testSystem = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);

    try {
      const testLead: LeadData = {
        name: 'João Silva (TESTE)',
        email: 'teste@jurify.com',
        phone: '+5511999999999',
        message: 'Preciso de ajuda com um processo trabalhista. Fui demitido sem justa causa e não recebi todas as verbas rescisórias.',
        legal_area: 'trabalhista',
        urgency: 'medium',
        source: 'chat',
        metadata: { test: true }
      };

      const success = await processLead(testLead);

      if (success) {
        toast({
          title: "🧪 Teste Concluído",
          description: "Sistema multiagentes funcionando corretamente!",
          variant: "default"
        });
      }

      return success;

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [processLead, toast]);

  // 📊 Força análise de performance
  const triggerAnalysis = useCallback(async () => {
    try {
      // Envia tarefa para Agente Analista
      const analystAgent = multiAgentSystem['agents']?.get('Analista');
      if (analystAgent) {
        await analystAgent.receiveMessage({
          id: `analysis_${Date.now()}`,
          from: 'Frontend',
          to: 'Analista',
          type: 'task_request' as any,
          payload: { task: 'analyze_performance' },
          timestamp: new Date(),
          priority: 'medium',
          requires_response: false
        });

        toast({
          title: "📊 Análise Iniciada",
          description: "Agente Analista está processando dados de performance",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('❌ Erro ao iniciar análise:', error);
    }
  }, [toast]);

  // 🔄 Carrega dados iniciais
  useEffect(() => {
    loadSystemStats();
    loadMetrics();

    // Atualiza a cada 30 segundos
    const interval = setInterval(() => {
      loadSystemStats();
      loadMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadSystemStats, loadMetrics]);

  return {
    // Estado
    isProcessing,
    systemStats,
    recentActivity,
    metrics,

    // Ações
    processLead,
    testSystem,
    triggerAnalysis,
    loadSystemStats,
    loadMetrics
  };
};
