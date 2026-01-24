/**
 * 🚀 ENTERPRISE MULTIAGENT DASHBOARD - PRODUCTION READY
 * 
 * Dashboard enterprise completo com métricas reais, monitoramento em tempo real
 * e interface profissional para sistema multiagentes de produção.
 */

import React, { useState } from 'react';
import { useEnterpriseMultiAgent } from '@/hooks/useEnterpriseMultiAgent';
import { Priority } from '@/lib/multiagents/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Shield,
  Target,
  TestTube,
  TrendingUp,
  Users,
  Zap,
  XCircle
} from 'lucide-react';

export const EnterpriseDashboard: React.FC = () => {
  const {
    isInitialized,
    isProcessing,
    metrics,
    systemHealth,
    recentActivity,
    processLead,
    runSystemTest,
    loadRealTimeMetrics,
    validateLeadData,
    systemStats
  } = useEnterpriseMultiAgent();

  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    legal_area: '',
    urgency: Priority.MEDIUM,
    source: 'chat' as 'whatsapp' | 'email' | 'chat' | 'form'
  });

  // 🎯 Submete novo lead
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateLeadData(newLead);
    if (!validation.isValid) {
      return;
    }

    const success = await processLead(newLead);
    if (success) {
      setNewLead({
        name: '',
        email: '',
        phone: '',
        message: '',
        legal_area: '',
        urgency: Priority.MEDIUM,
        source: 'chat'
      });
    }
  };

  // 🎨 Helpers para UI
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'idle': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'coordenador': return <Brain className="h-5 w-5" />;
      case 'qualificador': return <Target className="h-5 w-5" />;
      case 'juridico': return <Shield className="h-5 w-5" />;
      case 'comercial': return <TrendingUp className="h-5 w-5" />;
      case 'comunicador': return <MessageSquare className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Inicializando Sistema Enterprise...</p>
          <p className="text-sm text-gray-600">Carregando agentes multiagentes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 🎯 HEADER ENTERPRISE */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              Sistema Multiagentes Enterprise
            </h1>
            <p className="text-gray-600 mt-2">
              Automação jurídica inteligente com {systemStats?.total_agents || 0} agentes especializados
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status do Sistema */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth?.overall_status === 'healthy' ? 'bg-green-500' : 
                systemHealth?.overall_status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <Badge className={getHealthColor(systemHealth?.overall_status || 'unknown')}>
                {systemHealth?.overall_status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>

            <Button
              onClick={runSystemTest}
              disabled={isProcessing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Teste Enterprise
            </Button>

            <Button
              onClick={loadRealTimeMetrics}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* 📊 MÉTRICAS ENTERPRISE EM TEMPO REAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Leads Hoje</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {metrics?.leads_processed_today || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Processados automaticamente
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Conversão 7d</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {metrics?.conversion_rate_7d.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-green-600 mt-1">
              Taxa de conversão
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Tempo Resposta</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {metrics?.avg_response_time.toFixed(1) || 0}min
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Tempo médio
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {systemHealth?.performance_score.toFixed(0) || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Score do sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🤖 TABS ENTERPRISE */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Processar
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Atividade
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Saúde
          </TabsTrigger>
        </TabsList>

        {/* 🤖 ABA DOS AGENTES ENTERPRISE */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics?.agent_performance.map((agent, index) => (
              <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        {getAgentIcon(agent.id)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="text-sm">
                          ID: {agent.id}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAgentStatusIcon(agent.current_status)}
                      <Badge variant="outline" className="text-xs">
                        {agent.current_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Mensagens</p>
                      <p className="font-semibold text-lg">{agent.messages_processed}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Fila</p>
                      <p className="font-semibold text-lg">{agent.queue_size}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tempo Resp.</p>
                      <p className="font-semibold">{agent.avg_response_time}s</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Atividade</p>
                      <p className="font-semibold text-xs">
                        {agent.last_activity.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Sucesso</span>
                      <span className="font-semibold">{agent.success_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={agent.success_rate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 📝 ABA PROCESSAR LEAD ENTERPRISE */}
        <TabsContent value="process" className="space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Processar Lead Enterprise
              </CardTitle>
              <CardDescription>
                Envie um lead para processamento automático pelos agentes especializados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitLead} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={newLead.name}
                      onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                      placeholder="João Silva"
                      required
                      className="border-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newLead.email}
                      onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                      placeholder="joao@email.com"
                      className="border-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      placeholder="+55 11 99999-9999"
                      className="border-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="legal_area">Área Jurídica</Label>
                    <Select
                      value={newLead.legal_area}
                      onValueChange={(value) => setNewLead({...newLead, legal_area: value})}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Selecione a área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="familia">Família</SelectItem>
                        <SelectItem value="previdenciario">Previdenciário</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="empresarial">Empresarial</SelectItem>
                        <SelectItem value="tributario">Tributário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgência</Label>
                    <Select
                      value={newLead.urgency}
                      onValueChange={(value: any) => setNewLead({...newLead, urgency: value})}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="source">Canal de Origem</Label>
                    <Select
                      value={newLead.source}
                      onValueChange={(value: any) => setNewLead({...newLead, source: value})}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            WhatsApp
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-600" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="chat">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-600" />
                            Chat Online
                          </div>
                        </SelectItem>
                        <SelectItem value="form">Formulário Web</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Descrição do Caso *</Label>
                  <Textarea
                    id="message"
                    value={newLead.message}
                    onChange={(e) => setNewLead({...newLead, message: e.target.value})}
                    placeholder="Descreva detalhadamente o problema jurídico ou necessidade do cliente..."
                    rows={4}
                    required
                    className="border-gray-300"
                  />
                  <p className="text-xs text-gray-500">
                    Mínimo 10 caracteres. Seja específico para melhor qualificação.
                  </p>
                </div>
                
                <Button
                  type="submit"
                  disabled={isProcessing || !newLead.name || !newLead.message}
                  className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5" />
                      Processar com Multiagentes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📊 ABA ATIVIDADE */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Atividade em Tempo Real
              </CardTitle>
              <CardDescription>
                Últimas interações dos agentes com leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentActivity?.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                        {getAgentIcon(activity.agent_id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{activity.message}</p>
                          <Badge variant="outline" className="text-xs">
                            {activity.agent_id}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.response}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(activity.created_at).toLocaleString()}</span>
                          {activity.leads?.name && (
                            <span>Cliente: {activity.leads.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma atividade recente</p>
                    <p className="text-sm">As interações dos agentes aparecerão aqui</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🏥 ABA SAÚDE DO SISTEMA */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status Geral</span>
                  <Badge className={getHealthColor(systemHealth?.overall_status || 'unknown')}>
                    {systemHealth?.overall_status?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uptime</span>
                    <span className="font-semibold">{systemHealth?.uptime_percentage || 0}%</span>
                  </div>
                  <Progress value={systemHealth?.uptime_percentage || 0} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance Score</span>
                    <span className="font-semibold">{systemHealth?.performance_score.toFixed(0) || 0}/100</span>
                  </div>
                  <Progress value={systemHealth?.performance_score || 0} className="h-2" />
                </div>
                
                <div className="pt-4 border-t text-sm text-gray-600">
                  <p>Última verificação: {systemHealth?.last_check.toLocaleString()}</p>
                  <p>Taxa de erro: {systemHealth?.error_rate.toFixed(2) || 0}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Estatísticas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Agentes Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{systemStats?.total_agents || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mensagens</p>
                    <p className="text-2xl font-bold text-blue-600">{systemStats?.messages_processed || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversas Ativas</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics?.active_conversations || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Taxa Conversão</p>
                    <p className="text-2xl font-bold text-orange-600">{metrics?.conversion_rate_7d.toFixed(1) || 0}%</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Agentes Enterprise:</p>
                  <div className="flex flex-wrap gap-2">
                    {systemStats?.active_agents?.map((agent: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {agent}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
