
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import LeadsPanel from "@/components/LeadsPanel";
import AgendamentosManager from "@/components/AgendamentosManager";
import ContratosManager from "@/components/ContratosManager";
import RelatoriosGerenciais from "@/components/RelatoriosGerenciais";
import WhatsAppIA from "@/components/WhatsAppIA";
import UsuariosManager from "@/components/UsuariosManager";
import ConfiguracoesGerais from "@/components/ConfiguracoesGerais";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useSearchParams } from "react-router-dom";

type ActiveTab = 'dashboard' | 'leads' | 'agendamentos' | 'contratos' | 'relatorios' | 'whatsapp' | 'usuarios' | 'configuracoes' | 'notificacoes';

const Index = () => {
  const { user, profile, signOut, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && ['dashboard', 'leads', 'agendamentos', 'contratos', 'relatorios', 'whatsapp', 'usuarios', 'configuracoes', 'notificacoes'].includes(tab)) {
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
        return hasPermission('leads', 'read') ? <LeadsPanel /> : <div>Sem permissão</div>;
      case 'agendamentos':
        return hasPermission('agendamentos', 'read') ? <AgendamentosManager /> : <div>Sem permissão</div>;
      case 'contratos':
        return hasPermission('contratos', 'read') ? <ContratosManager /> : <div>Sem permissão</div>;
      case 'relatorios':
        return hasPermission('relatorios', 'read') ? <RelatoriosGerenciais /> : <div>Sem permissão</div>;
      case 'whatsapp':
        return hasPermission('whatsapp_ia', 'read') ? <WhatsAppIA /> : <div>Sem permissão</div>;
      case 'usuarios':
        return hasPermission('usuarios', 'read') ? <UsuariosManager /> : <div>Sem permissão</div>;
      case 'configuracoes':
        return <ConfiguracoesGerais />;
      case 'notificacoes':
        return <NotificationsPanel />;
      default:
        return <Dashboard />;
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
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
