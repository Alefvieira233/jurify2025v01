
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  nome: string;
  key_value: string;
  ativo: boolean;
  criado_por: string;
  created_at: string;
  updated_at: string;
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Erro ao buscar API keys:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const criarApiKey = async (nome: string) => {
    try {
      // Gerar uma API key aleatória
      const keyValue = 'jf_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          nome,
          key_value: keyValue,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      await fetchApiKeys();
      toast({
        title: "Sucesso",
        description: "API key criada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar API key:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a API key",
        variant: "destructive",
      });
      throw error;
    }
  };

  const toggleApiKey = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ ativo: !ativo })
        .eq('id', id);

      if (error) throw error;

      await fetchApiKeys();
      toast({
        title: "Sucesso",
        description: `API key ${!ativo ? 'ativada' : 'desativada'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status da API key:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da API key",
        variant: "destructive",
      });
    }
  };

  const deletarApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchApiKeys();
      toast({
        title: "Sucesso",
        description: "API key excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir API key:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a API key",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    criarApiKey,
    toggleApiKey,
    deletarApiKey,
    refetch: fetchApiKeys,
  };
};
