
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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

  const validTabs = ['dashboard', 'leads', 'pipeline', 'agendamentos', 'contratos', 'relatorios', 'whatsapp', 'agentes', 'usuarios', 'configuracoes', 'notificacoes', 'logs', 'integracoes'];

  // Simplified tab management
  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && validTabs.includes(tab)) {
      console.log(`🔄 Navegando para aba: ${tab}`);
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Simplified system initialization
  useEffect(() => {
    if (!loading && user) {
      console.log('🚀 Sistema inicializado para usuário:', user.email);
      setSystemReady(true);
    }
  }, [loading, user]);

  const handleTabChange = useCallback((tab: string) => {
    console.log(`🔄 Mudando para aba: ${tab}`);
    setActiveTab(tab as ActiveTab);
    setSearchParams({ tab });
  }, [setSearchParams]);

  const handleLogout = useCallback(async () => {
    try {
      console.log('🔄 Fazendo logout...');
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      console.error('❌ Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive",
      });
    }
  }, [signOut, toast]);

  const renderContent = useCallback(() => {
    console.log(`📄 Renderizando conteúdo da aba: ${activeTab}`);
    
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
  }, [activeTab]);

  // Show loading
  if (loading || !systemReady) {
    return <LoadingSpinner fullScreen text="Carregando aplicação..." />;
  }

  // User not authenticated
  if (!user) {
    console.log('🔄 Usuário não autenticado, redirecionando...');
    return <LoadingSpinner fullScreen text="Redirecionando para login..." />;
  }

  // Main application
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
