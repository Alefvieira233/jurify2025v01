
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type CreateLeadData = Database['public']['Tables']['leads']['Insert'];

const ITEMS_PER_PAGE = 25;

export const useLeads = (options?: { enablePagination?: boolean; pageSize?: number }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const enablePagination = options?.enablePagination ?? false;
  const pageSize = options?.pageSize ?? ITEMS_PER_PAGE;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLeads = useCallback(async (page: number = 1) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 [useLeads] Buscando leads (página ${page})...`);

      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar paginação se habilitada
      if (enablePagination) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('❌ [useLeads] Erro ao buscar leads:', fetchError);
        throw fetchError;
      }

      setLeads(data || []);
      setIsEmpty(!data || data.length === 0);

      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / pageSize));
      }

      console.log(`✅ [useLeads] ${data?.length || 0} leads encontrados (total: ${count})`);

    } catch (error: any) {
      console.error('❌ [useLeads] Erro na consulta:', error);
      setError(error.message || 'Erro ao carregar leads');
      setLeads([]);
      setIsEmpty(true);
    } finally {
      setLoading(false);
    }
  }, [user, enablePagination, pageSize]);

  // Carregar leads na montagem
  useEffect(() => {
    if (user) {
      fetchLeads(currentPage);
    }
  }, [user, currentPage, fetchLeads]);

  // Funções de paginação
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const refreshLeads = useCallback(() => {
    fetchLeads(currentPage);
  }, [fetchLeads, currentPage]);

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

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🗑️ [useLeads] Deletando lead ${id}...`);
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [useLeads] Lead deletado com sucesso');

      setLeads(leads.filter(lead => lead.id !== id));

      toast({
        title: 'Sucesso',
        description: 'Lead removido com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useLeads] Erro ao deletar lead:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o lead.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, leads, setLeads]);

  return {
    // Dados
    leads,
    loading,
    error,
    isEmpty,

    // Operações CRUD
    fetchLeads: refreshLeads,
    createLead,
    updateLead,
    deleteLead,

    // Paginação
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
