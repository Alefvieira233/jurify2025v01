
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type CreateLeadData = Database['public']['Tables']['leads']['Insert'];

const ITEMS_PER_PAGE = 25;

export const useLeads = (options?: { enablePagination?: boolean; pageSize?: number }) => {
  const { user, profile } = useAuth();
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

  const normalizeLead = useCallback((lead: any): Lead => {
    return {
      ...lead,
      nome_completo: lead?.nome_completo ?? lead?.nome ?? '',
      responsavel: lead?.responsavel ?? lead?.metadata?.responsavel_nome ?? '',
      observacoes: lead?.observacoes ?? lead?.descricao ?? '',
    };
  }, []);

  const mapLeadInputToDb = useCallback((data: any) => {
    const payload = { ...data };

    if (payload.nome_completo && !payload.nome) {
      payload.nome = payload.nome_completo;
    }
    delete payload.nome_completo;

    if (payload.responsavel) {
      payload.metadata = {
        ...(payload.metadata || {}),
        responsavel_nome: payload.responsavel,
      };
      if (user?.id && !payload.responsavel_id) {
        payload.responsavel_id = user.id;
      }
    }
    delete payload.responsavel;

    if (payload.observacoes && !payload.descricao) {
      payload.descricao = payload.observacoes;
    }
    delete payload.observacoes;

    return payload;
  }, [user?.id]);

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

      if (profile?.tenant_id) {
        query = query.eq('tenant_id', profile.tenant_id);
      }

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

      const normalizedLeads = (data || []).map(normalizeLead);
      setLeads(normalizedLeads);
      setIsEmpty(!normalizedLeads || normalizedLeads.length === 0);

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
  }, [user, profile?.tenant_id, enablePagination, pageSize, normalizeLead]);

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
      const payload = mapLeadInputToDb(data);
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const normalizedLead = normalizeLead(newLead);
      console.log('Lead criado com sucesso:', normalizedLead.id);

      // ✅ CORREÇÃO: Usar setter callback para evitar dependência circular
      setLeads(prev => [normalizedLead, ...prev]);

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
  }, [mapLeadInputToDb, normalizeLead, toast, user]);

  const updateLead = useCallback(async (id: string, updateData: Partial<Lead>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 [useLeads] Atualizando lead ${id}...`);
      const payload = mapLeadInputToDb(updateData);
      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const normalizedLead = normalizeLead(updatedLead);
      console.log('Lead atualizado com sucesso');

      // Atualizar estado normalizado
      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, ...normalizedLead } : lead
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
  }, [mapLeadInputToDb, normalizeLead, toast, user]);

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

      // ✅ CORREÇÃO: Usar setter callback para evitar dependência circular
      setLeads(prev => prev.filter(lead => lead.id !== id));

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
  }, [user, toast]);

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
