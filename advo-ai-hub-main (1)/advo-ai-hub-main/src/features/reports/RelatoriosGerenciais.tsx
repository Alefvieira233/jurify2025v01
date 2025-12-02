
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, FileText, Calendar, DollarSign } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

const RelatoriosGerenciais = () => {
  const { metrics, loading, error } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Relatórios Gerenciais</CardTitle>
            <p className="text-gray-600">Análises e insights do seu escritório jurídico</p>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-96">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Relatórios Gerenciais</CardTitle>
            <p className="text-gray-600">Análises e insights do seu escritório jurídico</p>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-8">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Relatórios em preparação</h3>
              <p className="text-blue-700 mb-6">
                Os relatórios serão gerados assim que houver dados suficientes no sistema.
              </p>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Download className="h-4 w-4 mr-2" />
                Gerar Relatório Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar dados para os gráficos
  const statusData = Object.entries(metrics.leadsPorStatus).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count
  }));

  const areaData = metrics.leadsPorArea.slice(0, 6).map(item => ({
    name: item.area,
    leads: item.total
  }));

  const agentesData = metrics.execucoesRecentesAgentes.map(agente => ({
    name: agente.agente_nome,
    execucoes: agente.total_execucoes,
    sucesso: agente.sucesso,
    erro: agente.erro
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Relatórios Gerenciais</CardTitle>
              <p className="text-gray-600">Análises e insights do seu escritório jurídico</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatórios
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalLeads}</p>
                <p className="text-sm text-green-600">+{metrics.leadsNovoMes} este mês</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.contratos}</p>
                <p className="text-sm text-green-600">{metrics.contratosAssinados} assinados</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendamentos</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.agendamentos}</p>
                <p className="text-sm text-blue-600">{metrics.agendamentosHoje} hoje</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agentes IA</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.agentesAtivos}</p>
                <p className="text-sm text-purple-600">{metrics.execucoesAgentesHoje} execuções hoje</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline de Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads por Área Jurídica */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Área Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance dos Agentes IA */}
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Agentes IA</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sucesso" stackId="a" fill="#00C49F" name="Sucesso" />
                <Bar dataKey="erro" stackId="a" fill="#FF8042" name="Erro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resumo Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Taxa de Conversão</span>
                <Badge variant="secondary">
                  {metrics.totalLeads > 0 
                    ? `${((metrics.contratosAssinados / metrics.totalLeads) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Leads Ativos</span>
                <Badge variant="secondary">
                  {metrics.leadsPorStatus.em_qualificacao + metrics.leadsPorStatus.proposta_enviada}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium">Agendamentos Pendentes</span>
                <Badge variant="secondary">{metrics.agendamentos}</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium">Execuções de IA</span>
                <Badge variant="secondary">
                  {metrics.execucoesRecentesAgentes.reduce((acc, curr) => acc + curr.total_execucoes, 0)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatoriosGerenciais;
