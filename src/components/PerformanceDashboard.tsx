
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  totalLeads30d: number;
  totalContratos30d: number;
  totalExecucoes30d: number;
  sucessRate: number;
  totalErrors30d: number;
  conversionRate: number;
}

interface ChartData {
  name: string;
  leads: number;
  contratos: number;
  execucoes: number;
}

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalLeads30d: 0,
    totalContratos30d: 0,
    totalExecucoes30d: 0,
    sucessRate: 0,
    totalErrors30d: 0,
    conversionRate: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (hasPermission('relatorios', 'read')) {
      loadMetrics();
    }
  }, [period]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - parseInt(period));

      // Buscar métricas em paralelo
      const [
        { count: leadsCount },
        { count: contratosCount },
        { count: execucoesCount },
        { data: execucoesData },
        { data: logsErrors }
      ] = await Promise.all([
        // Total de leads nos últimos X dias
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateLimit.toISOString()),
        
        // Total de contratos nos últimos X dias
        supabase
          .from('contratos')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateLimit.toISOString()),
        
        // Total de execuções de agentes nos últimos X dias
        supabase
          .from('logs_execucao_agentes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateLimit.toISOString()),
        
        // Dados para taxa de sucesso
        supabase
          .from('logs_execucao_agentes')
          .select('status')
          .gte('created_at', dateLimit.toISOString()),
        
        // Logs de erro
        supabase
          .from('logs_atividades')
          .select('*', { count: 'exact', head: true })
          .eq('tipo_acao', 'erro')
          .gte('data_hora', dateLimit.toISOString())
      ]);

      // Calcular taxa de sucesso
      const totalExecucoes = execucoesData?.length || 0;
      const sucessos = execucoesData?.filter(ex => ex.status === 'success')?.length || 0;
      const sucessRate = totalExecucoes > 0 ? (sucessos / totalExecucoes) * 100 : 0;

      // Calcular taxa de conversão
      const conversionRate = leadsCount && contratosCount ? (contratosCount / leadsCount) * 100 : 0;

      setMetrics({
        totalLeads30d: leadsCount || 0,
        totalContratos30d: contratosCount || 0,
        totalExecucoes30d: execucoesCount || 0,
        sucessRate: Math.round(sucessRate),
        totalErrors30d: logsErrors || 0,
        conversionRate: Math.round(conversionRate)
      });

      // Gerar dados do gráfico (últimos 7 dias)
      await generateChartData();

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: "Erro ao carregar métricas",
        description: "Falha ao buscar dados de performance.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const chartPromises = last7Days.map(async (date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const [
          { count: leadsCount },
          { count: contratosCount },
          { count: execucoesCount }
        ] = await Promise.all([
          supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString()),
          
          supabase
            .from('contratos')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString()),
          
          supabase
            .from('logs_execucao_agentes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString())
        ]);

        return {
          name: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
          leads: leadsCount || 0,
          contratos: contratosCount || 0,
          execucoes: execucoesCount || 0
        };
      });

      const chartResults = await Promise.all(chartPromises);
      setChartData(chartResults);

    } catch (error) {
      console.error('Erro ao gerar dados do gráfico:', error);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    suffix = '' 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    trend?: 'up' | 'down'; 
    suffix?: string; 
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">
              {value.toLocaleString()}{suffix}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trend && (
              trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )
            )}
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!hasPermission('relatorios', 'read')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">
              Você não tem permissão para visualizar métricas de performance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Leads Cadastrados"
          value={metrics.totalLeads30d}
          icon={Users}
          trend="up"
        />
        
        <MetricCard
          title="Contratos Gerados"
          value={metrics.totalContratos30d}
          icon={FileText}
          trend="up"
        />
        
        <MetricCard
          title="Execuções de IA"
          value={metrics.totalExecucoes30d}
          icon={Bot}
          trend="up"
        />
        
        <MetricCard
          title="Taxa de Sucesso"
          value={metrics.sucessRate}
          icon={TrendingUp}
          suffix="%"
        />
        
        <MetricCard
          title="Erros Sistema"
          value={metrics.totalErrors30d}
          icon={AlertCircle}
          trend="down"
        />
      </div>

      {/* Gráfico de Atividade */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
              <Bar dataKey="contratos" fill="#10b981" name="Contratos" />
              <Bar dataKey="execucoes" fill="#f59e0b" name="Execuções IA" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métricas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {metrics.conversionRate}%
              </div>
              <p className="text-gray-600">
                Leads convertidos em contratos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Agentes IA</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Integrações</span>
                <span className="text-green-600 font-medium">Funcionando</span>
              </div>
              <div className="flex justify-between">
                <span>Base de Dados</span>
                <span className="text-green-600 font-medium">Estável</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
