
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLogActivity } from '@/hooks/useLogActivity';
import type { Database } from '@/integrations/supabase/types';

export type AgenteIA = Database['public']['Tables']['agentes_ia']['Row'];
export type CreateAgenteData = Database['public']['Tables']['agentes_ia']['Insert'];

export const useAgentesIA = () => {
  const [agentes, setAgentes] = useState<AgenteIA[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAgenteCreated, logAgenteUpdated, logAgenteExecution, logError } = useLogActivity();

  const fetchAgentes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgentes(data || []);
    } catch (error) {
      console.error('Erro ao buscar agentes IA:', error);
      logError('Agentes IA', 'Falha ao buscar agentes', { error: error.message });
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agentes IA.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgente = async (data: CreateAgenteData) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .insert([data]);

      if (error) throw error;

      logAgenteCreated(data.nome);
      toast({
        title: 'Sucesso',
        description: 'Agente IA criado com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error) {
      console.error('Erro ao criar agente IA:', error);
      logError('Agentes IA', 'Falha ao criar agente', { 
        error: error.message, 
        agenteName: data.nome 
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateAgente = async (id: string, data: Partial<AgenteIA>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      const agente = agentes.find(a => a.id === id);
      if (agente) {
        logAgenteUpdated(agente.nome);
      }

      toast({
        title: 'Sucesso',
        description: 'Agente IA atualizado com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agente IA:', error);
      logError('Agentes IA', 'Falha ao atualizar agente', { 
        error: error.message, 
        agenteId: id 
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteAgente = async (id: string) => {
    if (!user) return false;

    try {
      const agente = agentes.find(a => a.id === id);
      
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (agente) {
        logAgenteUpdated(`${agente.nome} (removido)`);
      }

      toast({
        title: 'Sucesso',
        description: 'Agente IA removido com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error) {
      console.error('Erro ao remover agente IA:', error);
      logError('Agentes IA', 'Falha ao remover agente', { 
        error: error.message, 
        agenteId: id 
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o agente IA.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const executeAgente = async (agenteId: string, input: string) => {
    if (!user) return null;

    const startTime = Date.now();
    const agente = agentes.find(a => a.id === agenteId);

    try {
      const { data, error } = await supabase.functions.invoke('agentes-ia-api', {
        body: {
          agente_id: agenteId,
          input_usuario: input,
          use_n8n: true
        }
      });

      const executionTime = Date.now() - startTime;

      if (error) throw error;

      if (agente) {
        logAgenteExecution(agente.nome, 'sucesso', executionTime);
      }

      return data;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Erro ao executar agente IA:', error);
      
      if (agente) {
        logAgenteExecution(agente.nome, 'erro', executionTime);
      }
      
      logError('Agentes IA', 'Falha na execução', { 
        error: error.message, 
        agenteId,
        input: input.substring(0, 100) + '...',
        executionTime
      });

      toast({
        title: 'Erro',
        description: 'Não foi possível executar o agente IA.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const testAgenteConnection = async (agenteId: string) => {
    if (!user) return false;

    const agente = agentes.find(a => a.id === agenteId);
    if (!agente) return false;

    try {
      const testInput = "Teste de conectividade do agente IA";
      const result = await executeAgente(agenteId, testInput);
      
      if (result?.success) {
        toast({
          title: 'Sucesso',
          description: `Agente ${agente.nome} está funcionando corretamente!`,
        });
        return true;
      } else {
        toast({
          title: 'Aviso',
          description: `Agente ${agente.nome} respondeu mas pode haver problemas.`,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      toast({
        title: 'Erro',
        description: `Falha ao testar o agente ${agente.nome}.`,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAgentes();
  }, [user]);

  return {
    agentes,
    loading,
    fetchAgentes,
    createAgente,
    updateAgente,
    deleteAgente,
    executeAgente,
    testAgenteConnection,
  };
};
