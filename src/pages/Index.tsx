
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
import OnboardingFlow from "@/components/OnboardingFlow";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useSearchParams } from "react-router-dom";

type ActiveTab = 'dashboard' | 'leads' | 'pipeline' | 'agendamentos' | 'contratos' | 'relatorios' | 'whatsapp' | 'agentes' | 'usuarios' | 'configuracoes' | 'notificacoes' | 'logs' | 'integracoes';

const Index = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [systemReady, setSystemReady] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && ['dashboard', 'leads', 'pipeline', 'agendamentos', 'contratos', 'relatorios', 'whatsapp', 'agentes', 'usuarios', 'configuracoes', 'notificacoes', 'logs', 'integracoes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      console.log('✅ Sistema inicializado - Usuário:', user.email);
      setSystemReady(true);
      
      // Atualizar último acesso
      supabase
        .from('profiles')
        .update({ data_ultimo_acesso: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao atualizar último acesso:', error);
          }
        });
    }
  }, [loading, user]);

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
        return <LeadsPanel />;
      case 'pipeline':
        return <PipelineJuridico />;
      case 'agendamentos':
        return <AgendamentosManager />;
      case 'contratos':
        return <ContratosManager />;
      case 'relatorios':
        return <RelatoriosGerenciais />;
      case 'whatsapp':
        return <WhatsAppIA />;
      case 'agentes':
        return <AgentesIAManager />;
      case 'usuarios':
        return <UsuariosManager />;
      case 'logs':
        return <LogsPanel />;
      case 'integracoes':
        return <IntegracoesConfig />;
      case 'configuracoes':
        return <ConfiguracoesGerais />;
      case 'notificacoes':
        return <NotificationsPanel />;
      default:
        return <Dashboard />;
    }
  };

  if (loading || !systemReady) {
    return <LoadingSpinner fullScreen text="Inicializando sistema..." />;
  }

  if (!user) {
    return <LoadingSpinner fullScreen text="Redirecionando..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <OnboardingFlow />
      
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
