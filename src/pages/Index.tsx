
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LeadsPanel from '@/components/LeadsPanel';
import WhatsAppIA from '@/components/WhatsAppIA';
import PipelineJuridico from '@/components/PipelineJuridico';
import ContratosManager from '@/components/ContratosManager';
import AgendamentosManager from '@/components/AgendamentosManager';
import AgentesIAManager from '@/components/AgentesIAManager';
import RelatoriosGerenciais from '@/components/RelatoriosGerenciais';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <LeadsPanel />;
      case 'pipeline':
        return <PipelineJuridico />;
      case 'whatsapp':
        return <WhatsAppIA />;
      case 'contratos':
        return <ContratosManager />;
      case 'agendamentos':
        return <AgendamentosManager />;
      case 'agentes':
        return <AgentesIAManager />;
      case 'relatorios':
        return <RelatoriosGerenciais />;
      case 'configuracoes':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-2">Configurações do sistema e integrações - Em desenvolvimento</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
