
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
      {/* Header Premium */}
      <div className="relative fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1
              className="text-5xl md:text-6xl font-bold text-[hsl(var(--primary))] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.03em' }}
            >
              Relatórios
            </h1>

            {/* Live Badge */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent)_/_0.3)] via-[hsl(var(--accent)_/_0.2)] to-transparent rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative px-4 py-2 bg-gradient-to-r from-[hsl(var(--accent)_/_0.15)] via-[hsl(var(--accent)_/_0.1)] to-transparent rounded-full border border-[hsl(var(--accent)_/_0.3)] backdrop-blur-sm">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Export Button Premium */}
            <Button
              className="relative group/btn overflow-hidden bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(43_96%_56%)] to-[hsl(43_96%_48%)] hover:shadow-lg transition-all duration-500 border-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(43_96%_62%)] to-[hsl(var(--accent))] opacity-0 group-hover/btn:opacity-100 blur-xl transition-opacity duration-500" style={{ filter: 'blur(20px)' }} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <Download className="relative h-4 w-4 mr-2" strokeWidth={2.5} />
              <span className="relative" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>Exportar Relatórios</span>
            </Button>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[hsl(var(--muted-foreground))] mt-3 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
          Análises e insights do seu escritório jurídico
        </p>
      </div>

      {/* KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads Card */}
        <Card className="relative group card-hover rounded-3xl border-[hsl(var(--border))] overflow-hidden fade-in">
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Total de Leads
                </p>
                <p className="text-4xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {metrics.totalLeads}
                </p>
                <p className="text-sm text-green-600 font-semibold">+{metrics.leadsNovoMes} este mês</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-3.5 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-transparent rounded-2xl backdrop-blur-sm">
                  <Users className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contratos Card */}
        <Card className="relative group card-hover rounded-3xl border-[hsl(var(--border))] overflow-hidden fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -inset-1 bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Contratos
                </p>
                <p className="text-4xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {metrics.contratos}
                </p>
                <p className="text-sm text-green-600 font-semibold">{metrics.contratosAssinados} assinados</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-3.5 bg-gradient-to-br from-green-500/20 via-green-400/10 to-transparent rounded-2xl backdrop-blur-sm">
                  <FileText className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos Card */}
        <Card className="relative group card-hover rounded-3xl border-[hsl(var(--border))] overflow-hidden fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Agendamentos
                </p>
                <p className="text-4xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {metrics.agendamentos}
                </p>
                <p className="text-sm text-purple-600 font-semibold">{metrics.agendamentosHoje} hoje</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-3.5 bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent rounded-2xl backdrop-blur-sm">
                  <Calendar className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agentes IA Card */}
        <Card className="relative group card-hover rounded-3xl border-[hsl(var(--border))] overflow-hidden fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute -inset-1 bg-gradient-to-br from-[hsl(var(--accent)_/_0.2)] via-[hsl(var(--accent)_/_0.1)] to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Agentes IA
                </p>
                <p className="text-4xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {metrics.agentesAtivos}
                </p>
                <p className="text-sm text-[hsl(var(--accent))] font-semibold">{metrics.execucoesAgentesHoje} execuções hoje</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent)_/_0.2)] via-[hsl(var(--accent)_/_0.1)] to-transparent rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-3.5 bg-gradient-to-br from-[hsl(var(--accent)_/_0.2)] via-[hsl(var(--accent)_/_0.1)] to-transparent rounded-2xl backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6 text-[hsl(var(--accent))] group-hover:scale-110 transition-transform duration-500" strokeWidth={2.5} />
                </div>
              </div>
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
