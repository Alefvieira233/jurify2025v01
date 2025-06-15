
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Agendamento = Database['public']['Tables']['agendamentos']['Row'];
export type CreateAgendamentoData = Database['public']['Tables']['agendamentos']['Insert'];

export const useAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgendamentos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_hora', { ascending: true });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgendamento = async (data: CreateAgendamentoData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agendamentos')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento criado com sucesso!',
      });

      await fetchAgendamentos();
      return true;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o agendamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateAgendamento = async (id: string, data: Partial<Agendamento>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento atualizado com sucesso!',
      });

      await fetchAgendamentos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o agendamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteAgendamento = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento removido com sucesso!',
      });

      await fetchAgendamentos();
      return true;
    } catch (error) {
      console.error('Erro ao remover agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o agendamento.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [user]);

  return {
    agendamentos,
    loading,
    fetchAgendamentos,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
  };
};
