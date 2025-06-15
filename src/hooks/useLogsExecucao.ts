
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LogExecucao {
  id: string;
  agente_id: string;
  input_recebido: string;
  resposta_ia: string | null;
  status: 'success' | 'error' | 'processing';
  tempo_execucao: number | null;
  erro_detalhes: string | null;
  api_key_usado: string | null;
  created_at: string;
  agentes_ia?: {
    nome: string;
    tipo_agente: string;
  };
}

export const useLogsExecucao = () => {
  const [logs, setLogs] = useState<LogExecucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sucessos: 0,
    erros: 0,
    tempoMedio: 0,
  });
  const { toast } = useToast();

  const fetchLogs = async (limite = 50) => {
    try {
      const { data, error } = await supabase
        .from('logs_execucao_agentes')
        .select(`
          *,
          agentes_ia:agente_id (
            nome,
            tipo_agente
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;
      setLogs(data || []);

      // Calcular estatísticas
      const total = data?.length || 0;
      const sucessos = data?.filter(log => log.status === 'success').length || 0;
      const erros = data?.filter(log => log.status === 'error').length || 0;
      const temposValidos = data?.filter(log => log.tempo_execucao).map(log => log.tempo_execucao) || [];
      const tempoMedio = temposValidos.length > 0 
        ? temposValidos.reduce((acc, tempo) => acc + tempo, 0) / temposValidos.length 
        : 0;

      setStats({ total, sucessos, erros, tempoMedio });
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de execução",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarLogsPorAgente = async (agenteId: string) => {
    try {
      const { data, error } = await supabase
        .from('logs_execucao_agentes')
        .select(`
          *,
          agentes_ia:agente_id (
            nome,
            tipo_agente
          )
        `)
        .eq('agente_id', agenteId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs por agente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs do agente",
        variant: "destructive",
      });
      return [];
    }
  };

  const limparLogs = async () => {
    try {
      const { error } = await supabase
        .from('logs_execucao_agentes')
        .delete()
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Logs mais antigos que 30 dias

      if (error) throw error;

      await fetchLogs();
      toast({
        title: "Sucesso",
        description: "Logs antigos removidos com sucesso",
      });
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar os logs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    stats,
    fetchLogs,
    buscarLogsPorAgente,
    limparLogs,
    refetch: fetchLogs,
  };
};
