
import React from 'react';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const metrics = [
    {
      title: 'Leads Ativos',
      value: '247',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Conversas WhatsApp',
      value: '89',
      change: '+8%',
      trend: 'up',
      icon: MessageSquare,
      color: 'bg-green-500'
    },
    {
      title: 'Contratos Pendentes',
      value: '34',
      change: '-5%',
      trend: 'down',
      icon: FileText,
      color: 'bg-amber-500'
    },
    {
      title: 'Taxa de Conversão',
      value: '23.4%',
      change: '+3.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  const pipelineStages = [
    { name: 'Novos Leads', count: 45, color: 'bg-blue-100 text-blue-800' },
    { name: 'Em Qualificação', count: 32, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Proposta Enviada', count: 18, color: 'bg-purple-100 text-purple-800' },
    { name: 'Contrato Assinado', count: 12, color: 'bg-green-100 text-green-800' },
    { name: 'Em Atendimento', count: 25, color: 'bg-indigo-100 text-indigo-800' },
  ];

  const recentActivities = [
    {
      type: 'lead',
      message: 'Novo lead: Maria Silva - Direito Trabalhista',
      time: '5 min atrás',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      type: 'contract',
      message: 'Contrato assinado: João Santos - R$ 15.000',
      time: '12 min atrás',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      type: 'chat',
      message: 'IA respondeu lead sobre Direito de Família',
      time: '18 min atrás',
      icon: MessageSquare,
      color: 'text-purple-500'
    },
    {
      type: 'alert',
      message: 'Lead perdido: Ana Costa - Sem resposta há 3 dias',
      time: '1 hora atrás',
      icon: AlertTriangle,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Comercial</h1>
        <p className="text-gray-600">Visão geral do seu escritório jurídico</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <p className={`text-sm mt-1 ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change} vs último mês
                  </p>
                </div>
                <div className={`${metric.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Jurídico</h3>
          <div className="space-y-4">
            {pipelineStages.map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stage.color}`}>
                    {stage.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Cadastrar Lead Manual</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <FileText className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-green-900">Novo Contrato</span>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Configurar IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
