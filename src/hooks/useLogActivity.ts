
import { useCallback } from 'react';
import { useActivityLogs } from './useActivityLogs';
import { useAuth } from '@/contexts/AuthContext';

export const useLogActivity = () => {
  const { logActivity } = useActivityLogs();
  const { user, profile } = useAuth();

  const log = useCallback(async (
    tipo_acao: 'criacao' | 'edicao' | 'exclusao' | 'login' | 'logout' | 'erro' | 'outro',
    modulo: string,
    descricao: string,
    detalhes_adicionais?: any
  ) => {
    if (!user) return;

    try {
      await logActivity(tipo_acao, modulo, descricao, detalhes_adicionais);
      console.log(`Log registrado: ${tipo_acao} em ${modulo} - ${descricao}`);
    } catch (error) {
      console.error('Erro ao registrar log de atividade:', error);
    }
  }, [logActivity, user]);

  // Logs específicos para ações comuns
  const logLogin = useCallback(() => {
    log('login', 'Autenticação', `Usuário ${profile?.nome_completo || user?.email} fez login`);
  }, [log, profile, user]);

  const logLogout = useCallback(() => {
    log('logout', 'Autenticação', `Usuário ${profile?.nome_completo || user?.email} fez logout`);
  }, [log, profile, user]);

  const logLeadCreated = useCallback((leadName: string) => {
    log('criacao', 'Leads', `Novo lead criado: ${leadName}`);
  }, [log]);

  const logLeadUpdated = useCallback((leadName: string) => {
    log('edicao', 'Leads', `Lead atualizado: ${leadName}`);
  }, [log]);

  const logLeadDeleted = useCallback((leadName: string) => {
    log('exclusao', 'Leads', `Lead excluído: ${leadName}`);
  }, [log]);

  const logContractCreated = useCallback((contractId: string, clientName: string) => {
    log('criacao', 'Contratos', `Novo contrato criado para ${clientName}`, { contractId });
  }, [log]);

  const logContractUpdated = useCallback((contractId: string, clientName: string) => {
    log('edicao', 'Contratos', `Contrato atualizado para ${clientName}`, { contractId });
  }, [log]);

  const logAppointmentCreated = useCallback((appointmentData: any) => {
    log('criacao', 'Agendamentos', `Novo agendamento criado para ${appointmentData.data_hora}`, appointmentData);
  }, [log]);

  const logError = useCallback((modulo: string, erro: string, detalhes?: any) => {
    log('erro', modulo, `Erro: ${erro}`, detalhes);
  }, [log]);

  return {
    log,
    logLogin,
    logLogout,
    logLeadCreated,
    logLeadUpdated,
    logLeadDeleted,
    logContractCreated,
    logContractUpdated,
    logAppointmentCreated,
    logError,
  };
};
