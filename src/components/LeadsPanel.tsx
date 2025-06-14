
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  MessageSquare, 
  Mail,
  Calendar,
  MoreVertical,
  Eye
} from 'lucide-react';

const LeadsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  const leads = [
    {
      id: 1,
      nome: 'Maria Silva',
      telefone: '(11) 99999-1234',
      email: 'maria.silva@email.com',
      areaJuridica: 'Direito Trabalhista',
      origem: 'Facebook Ads',
      status: 'novo',
      valorCausa: 'R$ 25.000',
      ultimaInteracao: '5 min atrás',
      responsavel: 'IA Jurídica'
    },
    {
      id: 2,
      nome: 'João Santos',
      telefone: '(11) 99999-5678',
      email: 'joao.santos@email.com',
      areaJuridica: 'Direito de Família',
      origem: 'Google Ads',
      status: 'qualificacao',
      valorCausa: 'R$ 15.000',
      ultimaInteracao: '2 horas atrás',
      responsavel: 'Dr. Silva'
    },
    {
      id: 3,
      nome: 'Ana Costa',
      telefone: '(11) 99999-9012',
      email: 'ana.costa@email.com',
      areaJuridica: 'Direito Previdenciário',
      origem: 'Instagram',
      status: 'proposta',
      valorCausa: 'R$ 40.000',
      ultimaInteracao: '1 dia atrás',
      responsavel: 'Dra. Oliveira'
    },
    {
      id: 4,
      nome: 'Carlos Mendes',
      telefone: '(11) 99999-3456',
      email: 'carlos.mendes@email.com',
      areaJuridica: 'Direito Civil',
      origem: 'Site',
      status: 'contrato',
      valorCausa: 'R$ 60.000',
      ultimaInteracao: '3 horas atrás',
      responsavel: 'Dr. Silva'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      novo: 'bg-blue-100 text-blue-800',
      qualificacao: 'bg-yellow-100 text-yellow-800',
      proposta: 'bg-purple-100 text-purple-800',
      contrato: 'bg-green-100 text-green-800',
      perdido: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      novo: 'Novo Lead',
      qualificacao: 'Em Qualificação',
      proposta: 'Proposta Enviada',
      contrato: 'Contrato Assinado',
      perdido: 'Lead Perdido'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-gray-600">Controle total dos seus leads jurídicos</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Novo Lead</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="todos">Todos os Status</option>
              <option value="novo">Novos Leads</option>
              <option value="qualificacao">Em Qualificação</option>
              <option value="proposta">Proposta Enviada</option>
              <option value="contrato">Contrato Assinado</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Área Jurídica
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor da Causa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.nome}</div>
                      <div className="text-sm text-gray-500">{lead.telefone}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{lead.areaJuridica}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{lead.origem}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.valorCausa}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.responsavel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsPanel;
