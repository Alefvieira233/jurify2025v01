
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
    console.log('🔍 [useLeads] Buscando leads...');
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [useLeads] Erro ao buscar leads:', error);
        throw error;
      }

      console.log(`✅ [useLeads] ${data?.length || 0} leads encontrados`);
      return { data, error: null };
    } catch (error) {
      console.error('❌ [useLeads] Erro na consulta:', error);
      return { data: null, error };
    }
  }, []);

  const {
    data: leads,
    loading,
    error,
    refetch: fetchLeads,
    mutate: setLeads,
    isEmpty
  } = useSupabaseQuery<Lead>('leads', fetchLeadsQuery, {
    enabled: !!user,
    staleTime: 15000
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
      console.log('🔄 [useLeads] Criando novo lead...');
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useLeads] Lead criado com sucesso:', newLead.id);
      
      setLeads([newLead, ...leads]);
      
      toast({
        title: 'Sucesso',
        description: 'Lead criado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useLeads] Erro ao criar lead:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, setLeads, leads]);

  const updateLead = useCallback(async (id: string, updateData: Partial<Lead>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 [useLeads] Atualizando lead ${id}...`);
      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useLeads] Lead atualizado com sucesso');
      
      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, ...updatedLead } : lead
      ));

      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useLeads] Erro ao atualizar lead:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, leads, setLeads]);

  return {
    leads,
    loading,
    error,
    isEmpty,
    fetchLeads,
    createLead,
    updateLead,
  };
};
