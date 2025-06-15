
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type CreateLeadData = Database['public']['Tables']['leads']['Insert'];

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!user) {
      setLeads([]);
      setLoading(false);
      setError(null);
      setInitialized(true);
      return;
    }

    try {
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }
      
      setLeads(data || []);
      
    } catch (error: any) {
      console.error('Erro ao carregar leads:', error);
      setError(error.message || 'Erro ao carregar leads');
      setLeads([]);
      
      toast({
        title: 'Erro ao carregar leads',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setInitialized(true);
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
    if (!initialized) {
      fetchLeads();
    }
  }, [user, initialized]);

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
