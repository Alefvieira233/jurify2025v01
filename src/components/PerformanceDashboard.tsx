
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FileText, Calendar, Activity, AlertTriangle } from 'lucide-react';

const PerformanceDashboard = () => {
  // Buscar estatísticas de leads
  const { data: leadsStats } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Buscar estatísticas de contratos
  const { data: contratosStats } = useQuery({
    queryKey: ['contratos-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Buscar logs de execução de agentes
  const { data: agentExecutions } = useQuery({
    queryKey: ['agent-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_execucao_agentes')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Buscar logs de erro
  const { data: errorLogs } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_atividades')
        .select('*')
        .eq('tipo_acao', 'erro')
        .gte('data_hora', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10);
      
      if (error) throw error;
      return Array.isArray(data) ? data.length : 0;
    }
  });

  // Dados para gráfico de conversão
  const conversionData = [
    { name: 'Leads', value: leadsStats || 0 },
    { name: 'Contratos', value: contratosStats || 0 }
  ];

  const conversionRate = leadsStats && leadsStats > 0 ? 
    ((contratosStats || 0) / leadsStats * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Performance</h2>
        <p className="text-gray-600">Métricas e indicadores de uso do sistema</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads (30 dias)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsStats || 0}</div>
            <p className="text-xs text-muted-foreground">
              Novos leads cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos (30 dias)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contratosStats || 0}</div>
            <p className="text-xs text-muted-foreground">
              Contratos gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções IA (7 dias)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentExecutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Agentes executados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Leads → Contratos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alertas de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Sistema Operacional</p>
                <p className="text-sm text-green-700">Todos os serviços funcionando normalmente</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            
            {errorLogs !== undefined && errorLogs > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">{errorLogs} Erros (24h)</p>
                  <p className="text-sm text-yellow-700">Verifique os logs para mais detalhes</p>
                </div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
