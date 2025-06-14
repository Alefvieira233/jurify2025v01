
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LeadsPanel from '@/components/LeadsPanel';
import WhatsAppIA from '@/components/WhatsAppIA';
import PipelineJuridico from '@/components/PipelineJuridico';
import ContratosManager from '@/components/ContratosManager';

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
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-gray-600 mt-2">Sistema de agendamento inteligente - Em desenvolvimento</p>
          </div>
        );
      case 'agentes':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Agentes IA</h1>
            <p className="text-gray-600 mt-2">Configuração de SDR virtuais jurídicos - Em desenvolvimento</p>
          </div>
        );
      case 'relatorios':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h1>
            <p className="text-gray-600 mt-2">Business Intelligence jurídico - Em desenvolvimento</p>
          </div>
        );
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
