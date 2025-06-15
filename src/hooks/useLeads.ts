
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type CreateLeadData = Database['public']['Tables']['leads']['Insert'];

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = async () => {
    console.log('📡 useLeads - Iniciando busca de leads...');
    
    if (!user) {
      console.log('❌ useLeads - Usuário não autenticado');
      setLoading(false);
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 useLeads - Executando query no Supabase...');
      
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('❌ useLeads - Erro na consulta Supabase:', supabaseError);
        throw supabaseError;
      }
      
      console.log('✅ useLeads - Leads carregados com sucesso:', data?.length || 0);
      setLeads(data || []);
      setError(null);
      
    } catch (error: any) {
      console.error('❌ useLeads - Erro capturado:', error);
      const errorMessage = error.message || 'Erro desconhecido ao carregar leads';
      setError(errorMessage);
      setLeads([]);
      
      toast({
        title: 'Erro ao carregar leads',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      console.log('🏁 useLeads - Finalizando carregamento');
      setLoading(false);
    }
  };

  const createLead = async (data: CreateLeadData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead criado com sucesso!',
      });

      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateLead = async (id: string, data: Partial<Lead>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso!',
      });

      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o lead.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead removido com sucesso!',
      });

      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Erro ao remover lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o lead.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadsByArea = (area: string) => {
    return leads.filter(lead => lead.area_juridica === area);
  };

  useEffect(() => {
    console.log('🔄 useLeads - useEffect disparado, user:', user?.email);
    
    if (user) {
      fetchLeads();
    } else {
      console.log('⏳ useLeads - Aguardando autenticação...');
      setLoading(false);
      setLeads([]);
      setError(null);
    }
  }, [user]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    getLeadsByStatus,
    getLeadsByArea,
  };
};
