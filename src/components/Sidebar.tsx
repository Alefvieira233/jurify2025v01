
import React from 'react';
import { 
  Scale, 
  MessageSquare, 
  FileText, 
  Calendar, 
  BarChart3, 
  Settings, 
  Users, 
  Bot,
  Phone,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'pipeline', label: 'Pipeline Jurídico', icon: TrendingUp },
    { id: 'whatsapp', label: 'WhatsApp IA', icon: MessageSquare },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'agendamentos', label: 'Agendamentos', icon: Calendar },
    { id: 'agentes', label: 'Agentes IA', icon: Bot },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Jurify</h1>
            <p className="text-xs text-slate-400">Automação Jurídica</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">DR</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Dr. Silva</p>
            <p className="text-xs text-slate-400">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
