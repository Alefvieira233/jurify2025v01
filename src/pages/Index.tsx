
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import LeadsPanel from "@/components/LeadsPanel";
import PipelineJuridico from "@/components/PipelineJuridico";
import AgendamentosManager from "@/components/AgendamentosManager";
import ContratosManager from "@/components/ContratosManager";
import RelatoriosGerenciais from "@/components/RelatoriosGerenciais";
import WhatsAppIA from "@/components/WhatsAppIA";
import AgentesIAManager from "@/components/AgentesIAManager";
import UsuariosManager from "@/components/UsuariosManager";
import ConfiguracoesGerais from "@/components/ConfiguracoesGerais";
import NotificationsPanel from "@/components/NotificationsPanel";
import LogsPanel from "@/components/LogsPanel";
import IntegracoesConfig from "@/components/IntegracoesConfig";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSearchParams } from "react-router-dom";

type ActiveTab = 'dashboard' | 'leads' | 'pipeline' | 'agendamentos' | 'contratos' | 'relatorios' | 'whatsapp' | 'agentes' | 'usuarios' | 'configuracoes' | 'notificacoes' | 'logs' | 'integracoes';

const Index = () => {
  const { user, profile, signOut, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && ['dashboard', 'leads', 'pipeline', 'agendamentos', 'contratos', 'relatorios', 'whatsapp', 'agentes', 'usuarios', 'configuracoes', 'notificacoes', 'logs', 'integracoes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      supabase
        .from('profiles')
        .update({ data_ultimo_acesso: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => {
          console.log('Last access updated');
        });
    }
  }, [user, profile]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
    setSearchParams({ tab });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return hasPermission('leads', 'read') ? <LeadsPanel /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'pipeline':
        return hasPermission('leads', 'read') ? <PipelineJuridico /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'agendamentos':
        return hasPermission('agendamentos', 'read') ? <AgendamentosManager /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'contratos':
        return hasPermission('contratos', 'read') ? <ContratosManager /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'relatorios':
        return hasPermission('relatorios', 'read') ? <RelatoriosGerenciais /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'whatsapp':
        return hasPermission('whatsapp_ia', 'read') ? <WhatsAppIA /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'agentes':
        return hasPermission('whatsapp_ia', 'read') ? <AgentesIAManager /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'usuarios':
        return hasPermission('usuarios', 'read') ? <UsuariosManager /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'logs':
        return hasPermission('usuarios', 'read') ? <LogsPanel /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'integracoes':
        return hasPermission('usuarios', 'read') ? <IntegracoesConfig /> : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
            </div>
          </div>
        );
      case 'configuracoes':
        return <ConfiguracoesGerais />;
      case 'notificacoes':
        return <NotificationsPanel />;
      default:
        return <Dashboard />;
    }
  };

  if (!user || !profile) {
    return <LoadingSpinner fullScreen text="Carregando sistema..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar 
        activeSection={activeTab}
        onSectionChange={handleTabChange}
      />
      
      <main className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
