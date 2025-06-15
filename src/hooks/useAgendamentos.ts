import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { Database } from '@/integrations/supabase/types';

export type Agendamento = Database['public']['Tables']['agendamentos']['Row'];
export type CreateAgendamentoData = Database['public']['Tables']['agendamentos']['Insert'];

export const useAgendamentos = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgendamentosQuery = useCallback(async () => {
    console.log('🔍 [useAgendamentos] Buscando agendamentos...');
    
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_hora', { ascending: true });

      if (error) {
        console.error('❌ [useAgendamentos] Erro ao buscar agendamentos:', error);
        throw error;
      }

      console.log(`✅ [useAgendamentos] ${data?.length || 0} agendamentos encontrados`);
      return { data, error: null };
    } catch (error) {
      console.error('❌ [useAgendamentos] Erro na consulta:', error);
      return { data: null, error };
    }
  }, []);

  const {
    data: agendamentos,
    loading,
    error,
    refetch: fetchAgendamentos,
    mutate: setAgendamentos,
    isEmpty
  } = useSupabaseQuery<Agendamento>('agendamentos', fetchAgendamentosQuery, {
    enabled: !!user,
    staleTime: 15000
  });

  const createAgendamento = useCallback(async (data: CreateAgendamentoData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('🔄 [useAgendamentos] Criando novo agendamento...');
      const { data: newAgendamento, error } = await supabase
        .from('agendamentos')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useAgendamentos] Agendamento criado com sucesso:', newAgendamento.id);
      
      setAgendamentos([...agendamentos, newAgendamento].sort((a, b) => 
        new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Agendamento criado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useAgendamentos] Erro ao criar agendamento:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o agendamento.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, setAgendamentos, agendamentos]);

  const updateAgendamento = useCallback(async (id: string, updateData: Partial<Agendamento>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 [useAgendamentos] Atualizando agendamento ${id}...`);
      const { data: updatedAgendamento, error } = await supabase
        .from('agendamentos')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useAgendamentos] Agendamento atualizado com sucesso');
      
      setAgendamentos(agendamentos.map(agendamento => 
        agendamento.id === id ? { ...agendamento, ...updatedAgendamento } : agendamento
      ).sort((a, b) => 
        new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      ));

      toast({
        title: 'Sucesso',
        description: 'Agendamento atualizado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useAgendamentos] Erro ao atualizar agendamento:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o agendamento.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, agendamentos, setAgendamentos]);

  return {
    agendamentos,
    loading,
    error,
    isEmpty,
    fetchAgendamentos,
    createAgendamento,
    updateAgendamento,
  };
};
