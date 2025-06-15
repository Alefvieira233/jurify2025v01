
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLogActivity } from '@/hooks/useLogActivity';
import { useSupabaseQuery } from './useSupabaseQuery';
import type { Database } from '@/integrations/supabase/types';

export type AgenteIA = Database['public']['Tables']['agentes_ia']['Row'];
export type CreateAgenteData = Database['public']['Tables']['agentes_ia']['Insert'];

export const useAgentesIA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logAgenteCreated, logAgenteUpdated, logAgenteExecution, logError } = useLogActivity();

  const fetchAgentesQuery = useCallback(async () => {
    console.log('🔍 Buscando agentes IA...');
    return await supabase
      .from('agentes_ia')
      .select('*')
      .order('created_at', { ascending: false });
  }, []);

  const {
    data: agentes,
    loading,
    error,
    refetch: fetchAgentes,
    isEmpty
  } = useSupabaseQuery<AgenteIA>('agentes_ia', fetchAgentesQuery, {
    enabled: !!user,
    staleTime: 15000
  });

  const createAgente = useCallback(async (data: CreateAgenteData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Erro de autenticação',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('🔄 Criando novo agente IA...');
      const { error } = await supabase
        .from('agentes_ia')
        .insert([data]);

      if (error) throw error;

      console.log('✅ Agente IA criado com sucesso');
      logAgenteCreated(data.nome);
      toast({
        title: 'Sucesso',
        description: 'Agente IA criado com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao criar agente IA:', error);
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
  }, [user, toast, logAgenteCreated, logError, fetchAgentes]);

  const updateAgente = useCallback(async (id: string, data: Partial<AgenteIA>): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log(`🔄 Atualizando agente IA ${id}...`);
      const { error } = await supabase
        .from('agentes_ia')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      const agente = agentes.find(a => a.id === id);
      if (agente) {
        logAgenteUpdated(agente.nome);
      }

      console.log('✅ Agente IA atualizado com sucesso');
      toast({
        title: 'Sucesso',
        description: 'Agente IA atualizado com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar agente IA:', error);
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
  }, [user, toast, agentes, logAgenteUpdated, logError, fetchAgentes]);

  const deleteAgente = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const agente = agentes.find(a => a.id === id);
      
      console.log(`🔄 Removendo agente IA ${id}...`);
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (agente) {
        logAgenteUpdated(`${agente.nome} (removido)`);
      }

      console.log('✅ Agente IA removido com sucesso');
      toast({
        title: 'Sucesso',
        description: 'Agente IA removido com sucesso!',
      });

      await fetchAgentes();
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao remover agente IA:', error);
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
  }, [user, toast, agentes, logAgenteUpdated, logError, fetchAgentes]);

  const executeAgente = useCallback(async (agenteId: string, input: string) => {
    if (!user) return null;

    const startTime = Date.now();
    const agente = agentes.find(a => a.id === agenteId);

    try {
      console.log(`🔄 Executando agente IA ${agenteId}...`);
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

      console.log(`✅ Agente IA executado com sucesso em ${executionTime}ms`);
      return data;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Erro ao executar agente IA:', error);
      
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
  }, [user, agentes, logAgenteExecution, logError, toast]);

  const testAgenteConnection = useCallback(async (agenteId: string): Promise<boolean> => {
    if (!user) return false;

    const agente = agentes.find(a => a.id === agenteId);
    if (!agente) return false;

    try {
      console.log(`🔄 Testando conexão do agente ${agente.nome}...`);
      const testInput = "Teste de conectividade do agente IA";
      const result = await executeAgente(agenteId, testInput);
      
      if (result?.success) {
        console.log(`✅ Teste de conexão bem-sucedido para ${agente.nome}`);
        toast({
          title: 'Sucesso',
          description: `Agente ${agente.nome} está funcionando corretamente!`,
        });
        return true;
      } else {
        console.log(`⚠️ Teste de conexão com problemas para ${agente.nome}`);
        toast({
          title: 'Aviso',
          description: `Agente ${agente.nome} respondeu mas pode haver problemas.`,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Erro no teste de conexão para ${agente.nome}:`, error);
      toast({
        title: 'Erro',
        description: `Falha ao testar o agente ${agente.nome}.`,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, agentes, executeAgente, toast]);

  return {
    agentes,
    loading,
    error,
    isEmpty,
    fetchAgentes,
    createAgente,
    updateAgente,
    deleteAgente,
    executeAgente,
    testAgenteConnection,
  };
};
