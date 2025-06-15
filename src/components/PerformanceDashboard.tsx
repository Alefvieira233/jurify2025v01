
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Bot, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PerformanceDashboard = () => {
  // KPIs principais
  const { data: kpis = {}, isLoading: loadingKPIs } = useQuery({
    queryKey: ['performance-kpis'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [leads, contratos, execucoes, errors] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('contratos').select('*', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('logs_execucao_agentes').select('*', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('logs_atividades').select('*', { count: 'exact' })
          .eq('tipo_acao', 'erro')
          .gte('data_hora', thirtyDaysAgo.toISOString())
      ]);

      const totalExecucoes = execucoes.count || 0;
      const sucessos = await supabase.from('logs_execucao_agentes')
        .select('*', { count: 'exact' })
        .eq('status', 'success')
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        totalLeads30d: leads.count || 0,
        totalContratos30d: contratos.count || 0,
        totalExecucoes30d: totalExecucoes,
        sucessRate: totalExecucoes > 0 ? ((sucessos.count || 0) / totalExecucoes * 100) : 0,
        totalErrors30d: errors.count || 0
      };
    }
  });

  // Dados de leads por dia (últimos 30 dias)
  const { data: leadsChart = [] } = useQuery({
    queryKey: ['leads-chart-30d'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      const groupedByDay = (data || []).reduce((acc, lead) => {
        const day = lead.created_at.split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(groupedByDay).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: count
      }));
    }
  });

  // Performance dos agentes IA
  const { data: agentesPerformance = [] } = useQuery({
    queryKey: ['agentes-performance'],
    queryFn: async () => {
      const { data } = await supabase
        .from('logs_execucao_agentes')
        .select(`
          agente_id,
          status,
          tempo_execucao,
          agentes_ia:agente_id(nome)
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const grouped = (data || []).reduce((acc, log: any) => {
        const agenteNome = log.agentes_ia?.nome || 'Agente Desconhecido';
        if (!acc[agenteNome]) {
          acc[agenteNome] = { 
            nome: agenteNome, 
            total: 0, 
            sucessos: 0, 
            tempoMedio: 0,
            tempos: []
          };
        }
        acc[agenteNome].total++;
        if (log.status === 'success') {
          acc[agenteNome].sucessos++;
          if (log.tempo_execucao) {
            acc[agenteNome].tempos.push(log.tempo_execucao);
          }
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped).map((agente: any) => ({
        ...agente,
        taxaSucesso: agente.total > 0 ? (agente.sucessos / agente.total * 100) : 0,
        tempoMedio: agente.tempos.length > 0 
          ? agente.tempos.reduce((a: number, b: number) => a + b, 0) / agente.tempos.length 
          : 0
      }));
    }
  });

  // Taxa de conversão por mês
  const { data: conversaoChart = [] } = useQuery({
    queryKey: ['conversao-chart'],
    queryFn: async () => {
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const [leads, contratos] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact' })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString()),
          supabase.from('contratos').select('*', { count: 'exact' })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString())
        ]);

        const totalLeads = leads.count || 0;
        const totalContratos = contratos.count || 0;
        const taxaConversao = totalLeads > 0 ? (totalContratos / totalLeads * 100) : 0;

        meses.push({
          mes: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          leads: totalLeads,
          contratos: totalContratos,
          conversao: Number(taxaConversao.toFixed(1))
        });
      }
      return meses;
    }
  });

  // Status dos serviços
  const statusData = [
    { name: 'API Agentes IA', status: 'online', uptime: '99.9%' },
    { name: 'WhatsApp Integration', status: 'online', uptime: '98.5%' },
    { name: 'ZapSign API', status: 'online', uptime: '99.2%' },
    { name: 'Google Calendar', status: 'warning', uptime: '97.8%' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loadingKPIs) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Performance</h1>
        <p className="text-gray-600">Métricas avançadas e monitoramento do sistema</p>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leads (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalLeads30d}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalContratos30d}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Execuções IA</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalExecucoes30d}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa Sucesso IA</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.sucessRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erros (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalErrors30d}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metricas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="agentes">Agentes IA</TabsTrigger>
          <TabsTrigger value="servicos">Status Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads por Dia */}
            <Card>
              <CardHeader>
                <CardTitle>Leads por Dia (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leadsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Taxa de Conversão */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversaoChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversao" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agentes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Agentes IA (7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentesPerformance.map((agente, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{agente.nome}</h4>
                      <Badge variant={agente.taxaSucesso > 90 ? "default" : "secondary"}>
                        {agente.taxaSucesso.toFixed(1)}% sucesso
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Execuções:</span>
                        <span className="ml-2 font-medium">{agente.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sucessos:</span>
                        <span className="ml-2 font-medium">{agente.sucessos}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tempo Médio:</span>
                        <span className="ml-2 font-medium">{agente.tempoMedio.toFixed(0)}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statusData.map((servico, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">{servico.name}</h3>
                    <div className="flex items-center space-x-2">
                      {servico.status === 'online' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <Badge variant={servico.status === 'online' ? "default" : "secondary"}>
                        {servico.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Uptime:</span>
                      <span className="font-medium">{servico.uptime}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: servico.uptime }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
