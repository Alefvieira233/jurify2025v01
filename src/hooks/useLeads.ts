
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type CreateLeadData = Database['public']['Tables']['leads']['Insert'];

export const useLeads = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeadsQuery = useCallback(async () => {
    console.log('🔍 Buscando leads...');
    return await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
  }, []);

  const {
    data: leads,
    loading,
    error,
    refetch: fetchLeads,
    isEmpty
  } = useSupabaseQuery<Lead>('leads', fetchLeadsQuery, {
    enabled: !!user,
    staleTime: 10000
  });

  const createLead = useCallback(async (data: CreateLeadData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('🔄 Criando novo lead...');
      const { error } = await supabase
        .from('leads')
        .insert([data]);

      if (error) throw error;

      console.log('✅ Lead criado com sucesso');
      toast({
        title: 'Sucesso',
        description: 'Lead criado com sucesso!',
      });

      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao criar lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchLeads]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 Atualizando lead ${id}...`);
      const { error } = await supabase
        .from('leads')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Lead atualizado com sucesso');
      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso!',
      });

      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchLeads]);

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 Removendo lead ${id}...`);
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Lead removido com sucesso');
      toast({
        title: 'Sucesso',
        description: 'Lead removido com sucesso!',
      });

      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao remover lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o lead.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchLeads]);

  const getLeadsByStatus = useCallback((status: string) => {
    return leads.filter(lead => lead.status === status);
  }, [leads]);

  const getLeadsByArea = useCallback((area: string) => {
    return leads.filter(lead => lead.area_juridica === area);
  }, [leads]);

  return {
    leads,
    loading,
    error,
    isEmpty,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    getLeadsByStatus,
    getLeadsByArea,
  };
};
