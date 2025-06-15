
import { useState, useEffect, useCallback } from "react";
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
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Memoize tab validation for performance
  const validTabs = ['dashboard', 'leads', 'pipeline', 'agendamentos', 'contratos', 'relatorios', 'whatsapp', 'agentes', 'usuarios', 'configuracoes', 'notificacoes', 'logs', 'integracoes'];

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && validTabs.includes(tab)) {
      console.log(`🔄 Navegando para aba: ${tab}`);
      setActiveTab(tab);
    }
  }, [searchParams]);

  const initializeSystem = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🚀 Inicializando sistema para usuário:', user.email);
      setInitializationError(null);
      
      // Update last access time
      const { error } = await supabase
        .from('profiles')
        .update({ data_ultimo_acesso: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.warn('⚠️ Aviso ao atualizar último acesso:', error.message);
        // Non-critical error, don't block system initialization
      }

      console.log('✅ Sistema inicializado com sucesso');
      setSystemReady(true);

    } catch (error: any) {
      console.error('❌ Erro crítico na inicialização:', error);
      setInitializationError(error.message || 'Erro desconhecido na inicialização');
      
      toast({
        title: "Erro de inicialização",
        description: "Houve um problema ao inicializar o sistema. Tentando novamente...",
        variant: "destructive",
      });

      // Retry initialization after 2 seconds
      setTimeout(() => {
        initializeSystem();
      }, 2000);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!loading && user) {
      initializeSystem();
    } else if (!loading && !user) {
      console.log('❌ Usuário não autenticado, redirecionando...');
      setSystemReady(false);
    }
  }, [loading, user, initializeSystem]);

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
        console.log(`⚠️ Aba desconhecida: ${activeTab}, renderizando Dashboard`);
        return <Dashboard />;
    }
  }, [activeTab]);

  // System loading state
  if (loading || !systemReady) {
    const loadingText = loading 
      ? "Verificando autenticação..." 
      : initializationError 
      ? "Tentando reconectar..." 
      : "Inicializando sistema...";
    
    return <LoadingSpinner fullScreen text={loadingText} />;
  }

  // User not authenticated
  if (!user) {
    console.log('🔄 Usuário não autenticado, redirecionando...');
    return <LoadingSpinner fullScreen text="Redirecionando para login..." />;
  }

  // System error state
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro de Inicialização</h3>
          <p className="text-gray-600 mb-4">{initializationError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
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
