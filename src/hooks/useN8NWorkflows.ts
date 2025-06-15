
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type N8NWorkflow = Database['public']['Tables']['n8n_workflows']['Row'];
export type CreateN8NWorkflowData = Database['public']['Tables']['n8n_workflows']['Insert'];

export const useN8NWorkflows = () => {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWorkflows = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('n8n_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Erro ao buscar workflows N8N:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os workflows N8N.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (data: CreateN8NWorkflowData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('n8n_workflows')
        .insert([{ ...data, created_by: user.id }]);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Workflow N8N criado com sucesso!',
      });

      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Erro ao criar workflow N8N:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o workflow N8N.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateWorkflow = async (id: string, data: Partial<N8NWorkflow>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('n8n_workflows')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Workflow N8N atualizado com sucesso!',
      });

      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar workflow N8N:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o workflow N8N.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleWorkflow = async (id: string, currentStatus: boolean) => {
    return await updateWorkflow(id, { ativo: !currentStatus });
  };

  const deleteWorkflow = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('n8n_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Workflow N8N removido com sucesso!',
      });

      await fetchWorkflows();
      return true;
    } catch (error) {
      console.error('Erro ao remover workflow N8N:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o workflow N8N.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const testWorkflow = async (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) return false;

    try {
      const testPayload = {
        agente_id: 'test-agent-' + Date.now(),
        nome_agente: 'Agente de Teste',
        input_usuario: 'Teste de conectividade com N8N',
        prompt_base: 'Este é um teste de comunicação entre Jurify e N8N.',
        area_juridica: 'Teste',
        tipo_agente: 'test'
      };

      const { data, error } = await supabase.functions.invoke('n8n-webhook-forwarder', {
        body: testPayload
      });

      if (error) throw error;

      toast({
        title: 'Teste realizado',
        description: data.success 
          ? 'Comunicação com N8N bem-sucedida!' 
          : 'Falha na comunicação: ' + data.error,
        variant: data.success ? 'default' : 'destructive',
      });

      return data.success;
    } catch (error) {
      console.error('Erro ao testar workflow:', error);
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível testar a comunicação com N8N.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [user]);

  return {
    workflows,
    loading,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    toggleWorkflow,
    deleteWorkflow,
    testWorkflow,
  };
};
