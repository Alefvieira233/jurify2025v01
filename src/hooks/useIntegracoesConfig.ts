
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Use os tipos do Supabase para IntegracaoConfig
export type IntegracaoConfig = Database['public']['Tables']['configuracoes_integracoes']['Row'];
export type CreateIntegracaoData = Database['public']['Tables']['configuracoes_integracoes']['Insert'];

export const useIntegracoesConfig = () => {
  const [integracoes, setIntegracoes] = useState<IntegracaoConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchIntegracoes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes_integracoes')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setIntegracoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar integrações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações de integrações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createIntegracao = async (data: CreateIntegracaoData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('configuracoes_integracoes')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Integração criada com sucesso!',
      });

      await fetchIntegracoes();
      return true;
    } catch (error) {
      console.error('Erro ao criar integração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a integração.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateIntegracao = async (id: string, data: Partial<IntegracaoConfig>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('configuracoes_integracoes')
        .update({ ...data, atualizado_em: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Integração atualizada com sucesso!',
      });

      await fetchIntegracoes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar integração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a integração.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleStatus = async (id: string, currentStatus: IntegracaoConfig['status']) => {
    const newStatus = currentStatus === 'ativa' ? 'inativa' : 'ativa';
    return await updateIntegracao(id, { status: newStatus });
  };

  const updateSincronizacao = async (id: string) => {
    return await updateIntegracao(id, { 
      data_ultima_sincronizacao: new Date().toISOString() 
    });
  };

  const deleteIntegracao = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('configuracoes_integracoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Integração removida com sucesso!',
      });

      await fetchIntegracoes();
      return true;
    } catch (error) {
      console.error('Erro ao remover integração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a integração.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchIntegracoes();
  }, [user]);

  return {
    integracoes,
    loading,
    fetchIntegracoes,
    createIntegracao,
    updateIntegracao,
    toggleStatus,
    updateSincronizacao,
    deleteIntegracao,
  };
};
