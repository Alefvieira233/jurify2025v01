
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type AgenteIA = Database['public']['Tables']['agentes_ia']['Row'];
export type CreateAgenteData = Database['public']['Tables']['agentes_ia']['Insert'];

export const useAgentesIA = () => {
  const [agentes, setAgentes] = useState<AgenteIA[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgentes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgentes(data || []);
    } catch (error) {
      console.error('Erro ao buscar agentes IA:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agentes IA.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgente = async (data: CreateAgenteData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agente IA criado com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error) {
      console.error('Erro ao criar agente IA:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateAgente = async (id: string, data: Partial<AgenteIA>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agente IA atualizado com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agente IA:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteAgente = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agente IA removido com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error) {
      console.error('Erro ao remover agente IA:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const executeAgente = async (agenteId: string, input: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('agentes-ia-api', {
        body: {
          agente_id: agenteId,
          input_usuario: input,
          use_n8n: true
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao executar agente IA:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível executar o agente IA.',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchAgentes();
  }, [user]);

  return {
    agentes,
    loading,
    fetchAgentes,
    createAgente,
    updateAgente,
    deleteAgente,
    executeAgente,
  };
};
