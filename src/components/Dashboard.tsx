
import React from 'react';
import { Users, FileText, Calendar, Bot, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

const Dashboard = () => {
  const { metrics, loading, error, refetch, isEmpty } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar dashboard</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={refetch}
                className="bg-red-600 hover:bg-red-700"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEmpty || !metrics) {
    return (
      <div className="p-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-8">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">Dashboard em preparação</h3>
              <p className="text-blue-700 mb-4">Os dados estão sendo carregados. Comece cadastrando alguns leads para ver as métricas.</p>
              <Button 
                onClick={refetch}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Atualizar métricas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu escritório jurídico</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.leadsNovoMes} novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.contratos}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.contratosAssinados} assinados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agendamentos}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.agendamentosHoje} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes IA</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agentesAtivos}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.execucoesAgentesHoje} execuções hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Leads</CardTitle>
            <CardDescription>Distribuição por status no funil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.leadsPorStatus).map(([status, count]) => {
              const statusLabels: Record<string, string> = {
                novo_lead: 'Novos Leads',
                em_qualificacao: 'Em Qualificação',
                proposta_enviada: 'Proposta Enviada',
                contrato_assinado: 'Contrato Assinado',
                em_atendimento: 'Em Atendimento',
                lead_perdido: 'Leads Perdidos'
              };

              const percentage = metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;

              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{statusLabels[status]}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Áreas Jurídicas</CardTitle>
            <CardDescription>Distribuição de leads por especialidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.leadsPorArea.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.area}</span>
                  <Badge variant="secondary">{item.total}</Badge>
                </div>
              ))}
              {metrics.leadsPorArea.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma área cadastrada ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execuções de Agentes IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Atividade dos Agentes IA
          </CardTitle>
          <CardDescription>Performance recente dos agentes inteligentes</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.execucoesRecentesAgentes.length > 0 ? (
            <div className="space-y-4">
              {metrics.execucoesRecentesAgentes.map((agente, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{agente.agente_nome}</div>
                      <div className="text-xs text-gray-500">
                        {agente.total_execucoes} execuções
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agente.sucesso > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {agente.sucesso}
                      </Badge>
                    )}
                    {agente.erro > 0 && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {agente.erro}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                Nenhuma execução de agente IA registrada ainda
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
