
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  totalLeads: number;
  leadsNovoMes: number;
  contratos: number;
  contratosAssinados: number;
  agendamentos: number;
  agendamentosHoje: number;
  agentesAtivos: number;
  execucoesAgentesHoje: number;
  leadsPorStatus: {
    novo_lead: number;
    em_qualificacao: number;
    proposta_enviada: number;
    contrato_assinado: number;
    em_atendimento: number;
    lead_perdido: number;
  };
  leadsPorArea: Array<{
    area: string;
    total: number;
  }>;
  execucoesRecentesAgentes: Array<{
    agente_nome: string;
    total_execucoes: number;
    sucesso: number;
    erro: number;
  }>;
}

const DEFAULT_METRICS: DashboardMetrics = {
  totalLeads: 0,
  leadsNovoMes: 0,
  contratos: 0,
  contratosAssinados: 0,
  agendamentos: 0,
  agendamentosHoje: 0,
  agentesAtivos: 0,
  execucoesAgentesHoje: 0,
  leadsPorStatus: {
    novo_lead: 0,
    em_qualificacao: 0,
    proposta_enviada: 0,
    contrato_assinado: 0,
    em_atendimento: 0,
    lead_perdido: 0,
  },
  leadsPorArea: [],
  execucoesRecentesAgentes: [],
};

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(DEFAULT_METRICS);
      setLoading(false);
      return;
    }

    try {
      console.log('📊 [useDashboardMetrics] Carregando métricas do dashboard...');
      setLoading(true);
      setError(null);

      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

      // Buscar todas as métricas em paralelo com timeouts
      const [
        leadsResult,
        contratosResult,
        agendamentosResult,
        agentesResult,
        execucoesResult
      ] = await Promise.allSettled([
        Promise.race([
          supabase.from('leads').select('*'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          supabase.from('contratos').select('*'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          supabase.from('agendamentos').select('*'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          supabase.from('agentes_ia').select('*'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
        Promise.race([
          supabase.from('logs_execucao_agentes').select('*, agentes_ia(nome)'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]),
      ]);

      // Processar resultados com fallbacks
      const leads = leadsResult.status === 'fulfilled' && leadsResult.value?.data ? leadsResult.value.data : [];
      const contratos = contratosResult.status === 'fulfilled' && contratosResult.value?.data ? contratosResult.value.data : [];
      const agendamentos = agendamentosResult.status === 'fulfilled' && agendamentosResult.value?.data ? agendamentosResult.value.data : [];
      const agentes = agentesResult.status === 'fulfilled' && agentesResult.value?.data ? agentesResult.value.data : [];
      const execucoes = execucoesResult.status === 'fulfilled' && execucoesResult.value?.data ? execucoesResult.value.data : [];

      // Calcular métricas de leads
      const leadsNovoMes = leads.filter(lead => 
        new Date(lead.created_at) >= inicioMes
      ).length;

      // Calcular leads por status
      const leadsPorStatus = {
        novo_lead: leads.filter(l => l.status === 'novo_lead').length,
        em_qualificacao: leads.filter(l => l.status === 'em_qualificacao').length,
        proposta_enviada: leads.filter(l => l.status === 'proposta_enviada').length,
        contrato_assinado: leads.filter(l => l.status === 'contrato_assinado').length,
        em_atendimento: leads.filter(l => l.status === 'em_atendimento').length,
        lead_perdido: leads.filter(l => l.status === 'lead_perdido').length,
      };

      // Calcular leads por área
      const areasMap = new Map<string, number>();
      leads.forEach(lead => {
        const area = lead.area_juridica || 'Não informado';
        areasMap.set(area, (areasMap.get(area) || 0) + 1);
      });
      const leadsPorArea = Array.from(areasMap.entries()).map(([area, total]) => ({
        area,
        total
      })).slice(0, 10); // Limitar a 10 áreas

      // Calcular métricas de contratos
      const contratosAssinados = contratos.filter(contrato => 
        contrato.status_assinatura === 'assinado'
      ).length;

      // Calcular agendamentos
      const agendamentosHoje = agendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_hora);
        return dataAgendamento >= inicioHoje && dataAgendamento < new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);
      }).length;

      // Calcular agentes ativos
      const agentesAtivos = agentes.filter(agente => agente.status === 'ativo').length;

      // Calcular execuções de hoje
      const execucoesAgentesHoje = execucoes.filter(execucao => {
        const dataExecucao = new Date(execucao.created_at);
        return dataExecucao >= inicioHoje;
      }).length;

      // Calcular execuções recentes por agente
      const execucoesPorAgente = new Map<string, { nome: string; total: number; sucesso: number; erro: number }>();
      
      execucoes.forEach(execucao => {
        const nomeAgente = execucao.agentes_ia?.nome || 'Agente Desconhecido';
        const current = execucoesPorAgente.get(nomeAgente) || { nome: nomeAgente, total: 0, sucesso: 0, erro: 0 };
        
        current.total++;
        if (execucao.status === 'success') current.sucesso++;
        if (execucao.status === 'error') current.erro++;
        
        execucoesPorAgente.set(nomeAgente, current);
      });

      const execucoesRecentesAgentes = Array.from(execucoesPorAgente.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const finalMetrics: DashboardMetrics = {
        totalLeads: leads.length,
        leadsNovoMes,
        contratos: contratos.length,
        contratosAssinados,
        agendamentos: agendamentos.length,
        agendamentosHoje,
        agentesAtivos,
        execucoesAgentesHoje,
        leadsPorStatus,
        leadsPorArea,
        execucoesRecentesAgentes,
      };

      setMetrics(finalMetrics);
      console.log(`✅ [useDashboardMetrics] Métricas carregadas:`, finalMetrics);

    } catch (error: any) {
      console.error('❌ [useDashboardMetrics] Erro ao carregar métricas:', error);
      setError(error.message || 'Erro ao carregar métricas');
      setMetrics(DEFAULT_METRICS);
      
      toast({
        title: 'Erro ao carregar métricas',
        description: 'Algumas métricas podem não estar atualizadas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const refetch = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
    
    // Atualizar métricas a cada 5 minutos
    const interval = setInterval(fetchMetrics, 300000);
    
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch,
    isStale: false, // Para futura implementação de cache
  };
};
