
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { Database } from '@/integrations/supabase/types';

export type AgenteIA = Database['public']['Tables']['agentes_ia']['Row'];
export type CreateAgenteData = Database['public']['Tables']['agentes_ia']['Insert'];

export const useAgentesIA = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgentesQuery = useCallback(async () => {
    console.log('🔍 [useAgentesIA] Buscando agentes IA...');
    
    const { data, error } = await supabase
      .from('agentes_ia')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [useAgentesIA] Erro ao buscar agentes:', error);
    } else {
      console.log(`✅ [useAgentesIA] ${data?.length || 0} agentes encontrados`);
    }

    return { data, error };
  }, []);

  const {
    data: agentes,
    loading,
    error,
    refetch: fetchAgentes,
    mutate: setAgentes,
    isEmpty,
    isStale
  } = useSupabaseQuery<AgenteIA>('agentes_ia', fetchAgentesQuery, {
    enabled: !!user,
    staleTime: 15000
  });

  const createAgente = useCallback(async (data: CreateAgenteData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('🔄 [useAgentesIA] Criando novo agente IA...');
      const { data: newAgente, error } = await supabase
        .from('agentes_ia')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useAgentesIA] Agente IA criado com sucesso:', newAgente.id);
      
      setAgentes([newAgente, ...agentes]);
      
      toast({
        title: 'Sucesso',
        description: 'Agente IA criado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useAgentesIA] Erro ao criar agente IA:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, setAgentes, agentes]);

  const updateAgente = useCallback(async (id: string, updateData: Partial<AgenteIA>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 [useAgentesIA] Atualizando agente IA ${id}...`);
      const { data: updatedAgente, error } = await supabase
        .from('agentes_ia')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useAgentesIA] Agente IA atualizado com sucesso');
      
      setAgentes(agentes.map(agente => 
        agente.id === id ? { ...agente, ...updatedAgente } : agente
      ));

      toast({
        title: 'Sucesso',
        description: 'Agente IA atualizado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useAgentesIA] Erro ao atualizar agente IA:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, agentes, setAgentes]);

  const deleteAgente = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 [useAgentesIA] Removendo agente IA ${id}...`);
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [useAgentesIA] Agente IA removido com sucesso');
      
      setAgentes(agentes.filter(agente => agente.id !== id));

      toast({
        title: 'Sucesso',
        description: 'Agente IA removido com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useAgentesIA] Erro ao remover agente IA:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, agentes, setAgentes]);

  const executeAgente = useCallback(async (agenteId: string, input: string) => {
    if (!user) return null;

    const startTime = Date.now();

    try {
      console.log(`🔄 [useAgentesIA] Executando agente IA ${agenteId}...`);
      const { data, error } = await supabase.functions.invoke('agentes-ia-api', {
        body: {
          agente_id: agenteId,
          input_usuario: input,
          use_n8n: true
        }
      });

      const executionTime = Date.now() - startTime;

      if (error) throw error;

      console.log(`✅ [useAgentesIA] Agente IA executado com sucesso em ${executionTime}ms`);
      return data;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error('❌ [useAgentesIA] Erro ao executar agente IA:', error);
      
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível executar o agente IA.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  return {
    agentes,
    loading,
    error,
    isEmpty,
    isStale,
    fetchAgentes,
    createAgente,
    updateAgente,
    deleteAgente,
    executeAgente,
  };
};
