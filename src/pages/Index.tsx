
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
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Debug logs
  console.log('📊 Index - Estado completo:', { 
    user: user?.email, 
    profile: profile?.nome_completo, 
    authLoading: loading,
    hasUser: !!user,
    hasProfile: !!profile,
    initializationComplete
  });

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && ['dashboard', 'leads', 'pipeline', 'agendamentos', 'contratos', 'relatorios', 'whatsapp', 'agentes', 'usuarios', 'configuracoes', 'notificacoes', 'logs', 'integracoes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    // Quando a autenticação estiver completa, inicializar
    if (!loading && user) {
      console.log('🎯 Index - Usuário carregado, inicializando sistema...');
      
      // Timeout para garantir que não trave indefinidamente
      const timeout = setTimeout(() => {
        console.log('⏰ Index - Timeout de inicialização, continuando sem perfil');
        setInitializationComplete(true);
      }, 5000);

      // Se perfil carregar antes do timeout, continuar imediatamente
      if (profile) {
        console.log('✅ Index - Perfil disponível, sistema pronto');
        clearTimeout(timeout);
        setInitializationComplete(true);
      }

      return () => clearTimeout(timeout);
    } else if (!loading && !user) {
      // Se não tiver usuário e não estiver carregando, é redirecionamento
      console.log('🚫 Index - Sem usuário, será redirecionado');
      setInitializationComplete(false);
    }
  }, [loading, user, profile]);

  useEffect(() => {
    // Atualizar último acesso apenas quando tudo estiver pronto
    if (user && profile && initializationComplete) {
      console.log('📝 Index - Atualizando último acesso para:', user.email);
      supabase
        .from('profiles')
        .update({ data_ultimo_acesso: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('❌ Erro ao atualizar último acesso:', error);
          } else {
            console.log('✅ Último acesso atualizado');
          }
        });
    }
  }, [user, profile, initializationComplete]);

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
    // PERMISSÕES LIBERADAS: Qualquer usuário autenticado pode acessar qualquer seção
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

  // Se ainda estiver carregando autenticação
  if (loading) {
    console.log('🔄 Index - Auth ainda carregando');
    return <LoadingSpinner fullScreen text="Carregando sistema..." />;
  }

  // Se não tiver usuário, o ProtectedRoute deve interceptar
  if (!user) {
    console.log('🚫 Index - Usuário não encontrado');
    return <LoadingSpinner fullScreen text="Redirecionando..." />;
  }

  // Se tiver usuário mas ainda não completou inicialização
  if (!initializationComplete) {
    console.log('🔄 Index - Finalizando inicialização...');
    return <LoadingSpinner fullScreen text="Finalizando carregamento..." />;
  }

  // Renderizar interface principal
  console.log('✅ Index - Renderizando interface principal');
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
