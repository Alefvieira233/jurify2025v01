
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Contrato = Database['public']['Tables']['contratos']['Row'];
export type CreateContratoData = Database['public']['Tables']['contratos']['Insert'];

export const useContratos = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContratos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContratos(data || []);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os contratos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createContrato = async (data: CreateContratoData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contratos')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contrato criado com sucesso!',
      });

      await fetchContratos();
      return true;
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o contrato.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateContrato = async (id: string, data: Partial<Contrato>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contratos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contrato atualizado com sucesso!',
      });

      await fetchContratos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o contrato.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteContrato = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contrato removido com sucesso!',
      });

      await fetchContratos();
      return true;
    } catch (error) {
      console.error('Erro ao remover contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o contrato.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const enviarParaAssinatura = async (contratoId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('zapsign-integration', {
        body: {
          contrato_id: contratoId,
          action: 'create_document'
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Contrato enviado para assinatura!',
      });

      await fetchContratos();
      return true;
    } catch (error) {
      console.error('Erro ao enviar contrato:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o contrato para assinatura.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchContratos();
  }, [user]);

  return {
    contratos,
    loading,
    fetchContratos,
    createContrato,
    updateContrato,
    deleteContrato,
    enviarParaAssinatura,
  };
};
