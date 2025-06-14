
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ActivityLog {
  id: string;
  usuario_id: string;
  nome_usuario: string;
  tipo_acao: 'criacao' | 'edicao' | 'exclusao' | 'login' | 'logout' | 'erro' | 'outro';
  modulo: string;
  descricao: string;
  data_hora: string;
  ip_usuario?: string;
  detalhes_adicionais?: any;
  total_count: number;
}

export interface LogFilters {
  usuario_id?: string;
  tipo_acao?: string;
  modulo?: string;
  data_inicio?: string;
  data_fim?: string;
}

export const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLogs = async (
    filters: LogFilters = {},
    page: number = 1,
    limit: number = 50
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase.rpc('buscar_logs_atividades', {
        _limite: limit,
        _offset: offset,
        _usuario_id: filters.usuario_id || null,
        _tipo_acao: filters.tipo_acao || null,
        _modulo: filters.modulo || null,
        _data_inicio: filters.data_inicio || null,
        _data_fim: filters.data_fim || null,
      });

      if (error) throw error;

      setLogs(data || []);
      if (data && data.length > 0) {
        setTotalCount(data[0].total_count);
      } else {
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs de atividades.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (
    tipo_acao: ActivityLog['tipo_acao'],
    modulo: string,
    descricao: string,
    detalhes_adicionais?: any
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('registrar_log_atividade', {
        _usuario_id: user.id,
        _nome_usuario: user.email || 'Usuário',
        _tipo_acao: tipo_acao,
        _modulo: modulo,
        _descricao: descricao,
        _ip_usuario: null, // Pode ser implementado futuramente
        _detalhes_adicionais: detalhes_adicionais ? JSON.stringify(detalhes_adicionais) : null,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  return {
    logs,
    loading,
    totalCount,
    fetchLogs,
    logActivity,
  };
};
