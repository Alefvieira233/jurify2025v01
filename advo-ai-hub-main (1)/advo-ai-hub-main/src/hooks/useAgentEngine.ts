/**
 * 🚀 JURIFY AGENT ENGINE HOOK - SPACEX GRADE
 * 
 * Hook React que conecta o frontend com o motor de agentes,
 * fornecendo interface para criar, gerenciar e monitorar agentes IA.
 * 
 * @author SpaceX Dev Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { agentEngine, AgentType, AgentConfig } from '@/lib/agents/AgentEngine';
import { workflowProcessor, WorkflowType } from '@/lib/agents/WorkflowProcessor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// 📊 ESTATÍSTICAS DO AGENTE
export interface AgentStats {
  totalInteractions: number;
  successfulConversions: number;
  averageResponseTime: number;
  satisfactionScore: number;
  activeConversations: number;
  leadsProcessed: number;
}

// 🎯 CONFIGURAÇÃO DE CRIAÇÃO DE AGENTE
export interface CreateAgentRequest {
  name: string;
  type: AgentType;
  area_juridica: string;
  prompt_base: string;
  personality: string;
  specialization: string[];
  escalation_keywords: string[];
  max_interactions: number;
}

// 📈 MÉTRICAS DE PERFORMANCE
export interface AgentPerformance {
  agentId: string;
  agentName: string;
  conversionsToday: number;
  conversionsWeek: number;
  conversionsMonth: number;
  averageQualificationTime: number;
  leadsInPipeline: number;
  successRate: number;
}

export const useAgentEngine = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [agentStats, setAgentStats] = useState<Map<string, AgentStats>>(new Map());
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  /**
   * 🔄 Carrega agentes do usuário
   */
  const loadAgents = useCallback(async () => {
    if (!user || !profile?.tenant_id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const agentConfigs = data.map(agent => ({
        id: agent.id,
        name: agent.nome,
        type: agent.tipo_agente as AgentType,
        area_juridica: agent.area_juridica,
        prompt_base: agent.prompt_base || '',
        personality: agent.parametros_avancados?.personality || 'Profissional e acessível',
        specialization: agent.parametros_avancados?.specialization || ['geral'],
        max_interactions: agent.parametros_avancados?.max_interactions || 50,
        escalation_rules: agent.parametros_avancados?.escalation_rules || [],
        active: agent.ativo
      }));

      setAgents(agentConfigs);

      // Carrega estatísticas para cada agente
      await loadAgentStats(agentConfigs.map(a => a.id));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar agentes';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile?.tenant_id, toast]);

  /**
   * 📊 Carrega estatísticas dos agentes
   */
  const loadAgentStats = async (agentIds: string[]) => {
    const statsMap = new Map<string, AgentStats>();

    for (const agentId of agentIds) {
      try {
        // Busca interações do agente
        const { data: interactions } = await supabase
          .from('lead_interactions')
          .select('*')
          .eq('agent_id', agentId);

        // Busca leads processados
        const { data: leadsProcessed } = await supabase
          .from('leads')
          .select('id, status')
          .eq('responsavel_agente_id', agentId);

        // Calcula estatísticas
        const stats: AgentStats = {
          totalInteractions: interactions?.length || 0,
          successfulConversions: leadsProcessed?.filter(l => 
            ['contrato_assinado', 'em_atendimento'].includes(l.status)
          ).length || 0,
          averageResponseTime: 2.5, // Mock - implementar cálculo real
          satisfactionScore: 4.2, // Mock - implementar pesquisa de satisfação
          activeConversations: leadsProcessed?.filter(l => 
            ['em_qualificacao', 'proposta_enviada'].includes(l.status)
          ).length || 0,
          leadsProcessed: leadsProcessed?.length || 0
        };

        statsMap.set(agentId, stats);

      } catch (error) {
        console.error(`Erro ao carregar stats do agente ${agentId}:`, error);
      }
    }

    setAgentStats(statsMap);
  };

  /**
   * 🤖 Cria novo agente
   */
  const createAgent = async (agentData: CreateAgentRequest): Promise<boolean> => {
    if (!user || !profile?.tenant_id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    try {
      // Valida dados
      if (!agentData.name || !agentData.type || !agentData.area_juridica) {
        throw new Error('Dados obrigatórios não preenchidos');
      }

      // Cria regras de escalação baseadas no tipo
      const escalationRules = generateEscalationRules(agentData.type, agentData.escalation_keywords);

      // Insere no banco
      const { data, error: insertError } = await supabase
        .from('agentes_ia')
        .insert({
          nome: agentData.name,
          tipo_agente: agentData.type,
          area_juridica: agentData.area_juridica,
          prompt_base: agentData.prompt_base,
          descricao_funcao: getAgentDescription(agentData.type),
          parametros_avancados: {
            personality: agentData.personality,
            specialization: agentData.specialization,
            max_interactions: agentData.max_interactions,
            escalation_rules: escalationRules
          },
          ativo: true,
          tenant_id: profile.tenant_id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Recarrega lista
      await loadAgents();

      toast({
        title: "Sucesso",
        description: `Agente ${agentData.name} criado com sucesso!`,
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar agente';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✏️ Atualiza agente existente
   */
  const updateAgent = async (agentId: string, updates: Partial<CreateAgentRequest>): Promise<boolean> => {
    setLoading(true);

    try {
      const updateData: any = {};

      if (updates.name) updateData.nome = updates.name;
      if (updates.area_juridica) updateData.area_juridica = updates.area_juridica;
      if (updates.prompt_base) updateData.prompt_base = updates.prompt_base;

      if (updates.personality || updates.specialization || updates.max_interactions) {
        // Busca configuração atual
        const { data: currentAgent } = await supabase
          .from('agentes_ia')
          .select('parametros_avancados')
          .eq('id', agentId)
          .single();

        const currentParams = currentAgent?.parametros_avancados || {};

        updateData.parametros_avancados = {
          ...currentParams,
          ...(updates.personality && { personality: updates.personality }),
          ...(updates.specialization && { specialization: updates.specialization }),
          ...(updates.max_interactions && { max_interactions: updates.max_interactions })
        };
      }

      const { error: updateError } = await supabase
        .from('agentes_ia')
        .update(updateData)
        .eq('id', agentId);

      if (updateError) throw updateError;

      await loadAgents();

      toast({
        title: "Sucesso",
        description: "Agente atualizado com sucesso!",
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar agente';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 Alterna status do agente
   */
  const toggleAgentStatus = async (agentId: string): Promise<boolean> => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) throw new Error('Agente não encontrado');

      const newStatus = !agent.active;

      const { error } = await supabase
        .from('agentes_ia')
        .update({ ativo: newStatus })
        .eq('id', agentId);

      if (error) throw error;

      await loadAgents();

      toast({
        title: "Sucesso",
        description: `Agente ${newStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * 🗑️ Remove agente
   */
  const deleteAgent = async (agentId: string): Promise<boolean> => {
    try {
      // Verifica se agente tem conversas ativas
      const { data: activeConversations } = await supabase
        .from('lead_interactions')
        .select('id')
        .eq('agent_id', agentId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (activeConversations && activeConversations.length > 0) {
        throw new Error('Não é possível remover agente com conversas ativas nas últimas 24h');
      }

      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      await loadAgents();

      toast({
        title: "Sucesso",
        description: "Agente removido com sucesso!",
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover agente';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * 🧪 Testa agente com mensagem
   */
  const testAgent = async (agentId: string, testMessage: string): Promise<string> => {
    try {
      // Cria lead de teste temporário
      const testLeadId = `test_${Date.now()}`;
      
      // Processa mensagem usando o motor
      const response = await agentEngine.processLeadMessage(testLeadId, testMessage);

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao testar agente';
      toast({
        title: "Erro no Teste",
        description: errorMessage,
        variant: "destructive",
      });
      return 'Erro ao processar teste';
    }
  };

  /**
   * 📈 Carrega performance dos agentes
   */
  const loadPerformance = async () => {
    if (!profile?.tenant_id) return;

    try {
      // Busca métricas de performance (implementar query otimizada)
      const { data: agentMetrics } = await supabase
        .rpc('get_agent_performance', {
          tenant_id: profile.tenant_id
        });

      if (agentMetrics) {
        setPerformance(agentMetrics);
      }

    } catch (error) {
      console.error('Erro ao carregar performance:', error);
    }
  };

  // 🛠️ FUNÇÕES AUXILIARES

  const generateEscalationRules = (agentType: AgentType, keywords: string[]) => {
    const baseRules = [];

    switch (agentType) {
      case AgentType.SDR:
        baseRules.push({
          condition: 'lead_qualified',
          next_agent_type: AgentType.CLOSER,
          trigger_keywords: ['interessado', 'orçamento', 'proposta', 'contratar', ...keywords],
          confidence_threshold: 0.7
        });
        break;

      case AgentType.CLOSER:
        baseRules.push({
          condition: 'contract_signed',
          next_agent_type: AgentType.CS,
          trigger_keywords: ['assinado', 'contrato', 'aceito', 'fechado', ...keywords],
          confidence_threshold: 0.8
        });
        break;

      case AgentType.CS:
        // CS não escala por padrão
        break;
    }

    return baseRules;
  };

  const getAgentDescription = (type: AgentType): string => {
    switch (type) {
      case AgentType.SDR:
        return 'Especialista em qualificação de leads e identificação de oportunidades';
      case AgentType.CLOSER:
        return 'Especialista em fechamento de negócios e apresentação de propostas';
      case AgentType.CS:
        return 'Especialista em sucesso do cliente e acompanhamento de casos';
      default:
        return 'Assistente jurídico inteligente';
    }
  };

  // 🔄 EFEITOS

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (agents.length > 0) {
      loadPerformance();
    }
  }, [agents]);

  return {
    // Estado
    agents,
    agentStats,
    performance,
    loading,
    error,

    // Ações
    createAgent,
    updateAgent,
    toggleAgentStatus,
    deleteAgent,
    testAgent,
    loadAgents,
    loadPerformance,

    // Utilitários
    getAgentStats: (agentId: string) => agentStats.get(agentId),
    getActiveAgents: () => agents.filter(a => a.active),
    getAgentsByType: (type: AgentType) => agents.filter(a => a.type === type),
    getAgentsByArea: (area: string) => agents.filter(a => a.area_juridica === area)
  };
};
