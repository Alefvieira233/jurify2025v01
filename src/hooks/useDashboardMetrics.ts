
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

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(null);
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

      // Buscar todas as métricas em paralelo
      const [
        leadsResult,
        contratosResult,
        agendamentosResult,
        agentesResult,
        execucoesResult
      ] = await Promise.all([
        // Leads
        supabase.from('leads').select('*'),
        // Contratos
        supabase.from('contratos').select('*'),
        // Agendamentos
        supabase.from('agendamentos').select('*'),
        // Agentes IA
        supabase.from('agentes_ia').select('*'),
        // Execuções de agentes
        supabase.from('logs_execucao_agentes').select('*')
      ]);

      // Verificar erros
      if (leadsResult.error) throw leadsResult.error;
      if (contratosResult.error) throw contratosResult.error;
      if (agendamentosResult.error) throw agendamentosResult.error;
      if (agentesResult.error) throw agentesResult.error;
      if (execucoesResult.error) throw execucoesResult.error;

      const leads = leadsResult.data || [];
      const contratos = contratosResult.data || [];
      const agendamentos = agendamentosResult.data || [];
      const agentes = agentesResult.data || [];
      const execucoes = execucoesResult.data || [];

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
      }));

      // Calcular métricas de contratos
      const contratosAssinados = contratos.filter(contrato => 
        contrato.status_assinatura === 'assinado'
      ).length;

      // Calcular métricas de agendamentos
      const agendamentosHoje = agendamentos.filter(agendamento => {
        const dataAgendamento = new Date(agendamento.data_hora);
        return dataAgendamento >= inicioHoje && 
               dataAgendamento < new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);
      }).length;

      // Calcular métricas de agentes
      const agentesAtivos = agentes.filter(agente => agente.status === 'ativo').length;
      
      const execucoesHoje = execucoes.filter(exec => {
        const dataExecucao = new Date(exec.created_at);
        return dataExecucao >= inicioHoje;
      }).length;

      // Execuções recentes por agente
      const execucoesPorAgente = new Map<string, { total: number; sucesso: number; erro: number }>();
      
      execucoes.forEach(exec => {
        // Buscar nome do agente
        const agente = agentes.find(a => a.id === exec.agente_id);
        const nomeAgente = agente?.nome || 'Agente Desconhecido';
        
        if (!execucoesPorAgente.has(nomeAgente)) {
          execucoesPorAgente.set(nomeAgente, { total: 0, sucesso: 0, erro: 0 });
        }
        
        const stats = execucoesPorAgente.get(nomeAgente)!;
        stats.total++;
        
        if (exec.status === 'success') {
          stats.sucesso++;
        } else if (exec.status === 'error') {
          stats.erro++;
        }
      });

      const execucoesRecentesAgentes = Array.from(execucoesPorAgente.entries())
        .map(([agente_nome, stats]) => ({
          agente_nome,
          total_execucoes: stats.total,
          sucesso: stats.sucesso,
          erro: stats.erro
        }))
        .sort((a, b) => b.total_execucoes - a.total_execucoes)
        .slice(0, 5);

      const dashboardMetrics: DashboardMetrics = {
        totalLeads: leads.length,
        leadsNovoMes,
        contratos: contratos.length,
        contratosAssinados,
        agendamentos: agendamentos.length,
        agendamentosHoje,
        agentesAtivos,
        execucoesAgentesHoje: execucoesHoje,
        leadsPorStatus,
        leadsPorArea,
        execucoesRecentesAgentes
      };

      setMetrics(dashboardMetrics);
      console.log('✅ [useDashboardMetrics] Métricas carregadas com sucesso:', dashboardMetrics);

    } catch (error: any) {
      console.error('❌ [useDashboardMetrics] Erro ao carregar métricas:', error);
      setError(error.message);
      toast({
        title: 'Erro ao carregar métricas',
        description: error.message || 'Não foi possível carregar as métricas do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
    isEmpty: !loading && !error && !metrics
  };
};
