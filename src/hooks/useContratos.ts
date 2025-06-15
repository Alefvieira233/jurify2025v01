
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { Database } from '@/integrations/supabase/types';

export type Contrato = Database['public']['Tables']['contratos']['Row'];
export type CreateContratoData = Database['public']['Tables']['contratos']['Insert'];

export const useContratos = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContratosQuery = useCallback(async () => {
    console.log('🔍 [useContratos] Buscando contratos...');
    
    const { data, error } = await supabase
      .from('contratos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [useContratos] Erro ao buscar contratos:', error);
    } else {
      console.log(`✅ [useContratos] ${data?.length || 0} contratos encontrados`);
    }

    return { data, error };
  }, []);

  const {
    data: contratos,
    loading,
    error,
    refetch: fetchContratos,
    mutate: setContratos,
    isEmpty,
    isStale
  } = useSupabaseQuery<Contrato>('contratos', fetchContratosQuery, {
    enabled: !!user,
    staleTime: 15000,
    retryCount: 2,
    retryDelay: 1000
  });

  const createContrato = useCallback(async (data: CreateContratoData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('🔄 [useContratos] Criando novo contrato...');
      const { data: newContrato, error } = await supabase
        .from('contratos')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useContratos] Contrato criado com sucesso:', newContrato.id);
      
      setContratos([newContrato, ...contratos]);
      
      toast({
        title: 'Sucesso',
        description: 'Contrato criado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useContratos] Erro ao criar contrato:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o contrato.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, setContratos, contratos]);

  const updateContrato = useCallback(async (id: string, updateData: Partial<Contrato>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 [useContratos] Atualizando contrato ${id}...`);
      const { data: updatedContrato, error } = await supabase
        .from('contratos')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useContratos] Contrato atualizado com sucesso');
      
      setContratos(contratos.map(contrato => 
        contrato.id === id ? { ...contrato, ...updatedContrato } : contrato
      ));

      toast({
        title: 'Sucesso',
        description: 'Contrato atualizado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useContratos] Erro ao atualizar contrato:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o contrato.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, contratos, setContratos]);

  return {
    contratos,
    loading,
    error,
    isEmpty,
    isStale,
    fetchContratos,
    createContrato,
    updateContrato,
  };
};
