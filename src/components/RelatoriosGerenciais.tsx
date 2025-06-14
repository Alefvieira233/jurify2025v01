
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, Users, Target, DollarSign, Clock, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FunilVendasChart from './relatorios/FunilVendasChart';
import AreaJuridicaChart from './relatorios/AreaJuridicaChart';
import OrigemLeadsChart from './relatorios/OrigemLeadsChart';
import ConversaoChart from './relatorios/ConversaoChart';
import RankingAgentesTable from './relatorios/RankingAgentesTable';

type PeriodoFiltro = 'mes' | 'trimestre' | 'ano' | 'personalizado';

interface KPI {
  titulo: string;
  valor: string | number;
  mudanca?: number;
  icon: React.ComponentType<any>;
  cor: string;
}

const RelatoriosGerenciais = () => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [areaJuridica, setAreaJuridica] = useState<string>('todas');
  const [origemLead, setOrigemLead] = useState<string>('todas');

  // Consulta para KPIs principais
  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['kpis-gerais', periodo, areaJuridica, origemLead],
    queryFn: async () => {
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', getDataInicio(periodo));

      const { data: contratos } = await supabase
        .from('contratos')
        .select('*')
        .gte('created_at', getDataInicio(periodo));

      const totalLeads = leads?.length || 0;
      const contratosAssinados = contratos?.filter(c => c?.status === 'assinado').length || 0;
      const valorTotalContratos = contratos?.reduce((sum, c) => sum + (c?.valor_causa || 0), 0) || 0;
      const taxaConversao = totalLeads > 0 ? (contratosAssinados / totalLeads * 100) : 0;

      return {
        totalLeads,
        contratosAssinados,
        valorTotalContratos,
        taxaConversao
      };
    }
  });

  // Consulta para dados do funil
  const { data: dadosFunil } = useQuery({
    queryKey: ['dados-funil', periodo, areaJuridica, origemLead],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('status')
        .gte('created_at', getDataInicio(periodo));

      if (areaJuridica !== 'todas') {
        query = query.eq('area_juridica', areaJuridica);
      }

      if (origemLead !== 'todas') {
        query = query.eq('origem', origemLead);
      }

      const { data } = await query;

      const contadores = {
        'novo_lead': 0,
        'em_qualificacao': 0,
        'proposta_enviada': 0,
        'contrato_assinado': 0,
        'em_atendimento': 0,
        'lead_perdido': 0
      };

      if (data && Array.isArray(data)) {
        data.forEach(lead => {
          if (lead?.status && contadores.hasOwnProperty(lead.status)) {
            contadores[lead.status as keyof typeof contadores]++;
          }
        });
      }

      return contadores;
    }
  });

  // Consulta para dados por área jurídica
  const { data: dadosAreaJuridica } = useQuery({
    queryKey: ['dados-area-juridica', periodo, origemLead],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('area_juridica')
        .gte('created_at', getDataInicio(periodo));

      if (origemLead !== 'todas') {
        query = query.eq('origem', origemLead);
      }

      const { data } = await query;

      const contadores: Record<string, number> = {};
      if (data && Array.isArray(data)) {
        data.forEach(lead => {
          if (lead?.area_juridica) {
            contadores[lead.area_juridica] = (contadores[lead.area_juridica] || 0) + 1;
          }
        });
      }

      return contadores;
    }
  });

  // Consulta para dados por origem
  const { data: dadosOrigem } = useQuery({
    queryKey: ['dados-origem', periodo, areaJuridica],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('origem')
        .gte('created_at', getDataInicio(periodo));

      if (areaJuridica !== 'todas') {
        query = query.eq('area_juridica', areaJuridica);
      }

      const { data } = await query;

      const contadores: Record<string, number> = {};
      if (data && Array.isArray(data)) {
        data.forEach(lead => {
          if (lead?.origem) {
            contadores[lead.origem] = (contadores[lead.origem] || 0) + 1;
          }
        });
      }

      return contadores;
    }
  });

  function getDataInicio(periodo: PeriodoFiltro): string {
    const agora = new Date();
    switch (periodo) {
      case 'mes':
        return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      case 'trimestre':
        const mesAtual = agora.getMonth();
        const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
        return new Date(agora.getFullYear(), inicioTrimestre, 1).toISOString();
      case 'ano':
        return new Date(agora.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
    }
  }

  const kpisCards: KPI[] = [
    {
      titulo: 'Total de Leads',
      valor: kpis?.totalLeads || 0,
      mudanca: 12,
      icon: Users,
      cor: 'text-blue-600'
    },
    {
      titulo: 'Contratos Assinados',
      valor: kpis?.contratosAssinados || 0,
      mudanca: 8,
      icon: Target,
      cor: 'text-green-600'
    },
    {
      titulo: 'Valor Total',
      valor: `R$ ${((kpis?.valorTotalContratos || 0) / 1000).toFixed(0)}k`,
      mudanca: 15,
      icon: DollarSign,
      cor: 'text-purple-600'
    },
    {
      titulo: 'Taxa de Conversão',
      valor: `${(kpis?.taxaConversao || 0).toFixed(1)}%`,
      mudanca: -2,
      icon: TrendingUp,
      cor: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Gerenciais</h1>
          <p className="text-gray-600 mt-1">Business Intelligence Jurídico</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros Avançados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
              <Select value={periodo} onValueChange={(value: PeriodoFiltro) => setPeriodo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="trimestre">Este Trimestre</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Área Jurídica</label>
              <Select value={areaJuridica} onValueChange={setAreaJuridica}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Áreas</SelectItem>
                  <SelectItem value="Direito Trabalhista">Direito Trabalhista</SelectItem>
                  <SelectItem value="Direito de Família">Direito de Família</SelectItem>
                  <SelectItem value="Direito Previdenciário">Direito Previdenciário</SelectItem>
                  <SelectItem value="Direito Civil">Direito Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Origem dos Leads</label>
              <Select value={origemLead} onValueChange={setOrigemLead}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Origens</SelectItem>
                  <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                  <SelectItem value="Google Ads">Google Ads</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Site">Site Orgânico</SelectItem>
                  <SelectItem value="Indicações">Indicações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisCards.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.titulo}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.valor}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${kpi.cor}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
              {kpi.mudanca && (
                <div className="flex items-center mt-3">
                  {kpi.mudanca > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${kpi.mudanca > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(kpi.mudanca)}% vs mês anterior
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas Jurídico</CardTitle>
            <CardDescription>Distribuição de leads por etapa do processo</CardDescription>
          </CardHeader>
          <CardContent>
            <FunilVendasChart data={dadosFunil} />
          </CardContent>
        </Card>

        {/* Leads por Área Jurídica */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Área Jurídica</CardTitle>
            <CardDescription>Volume de leads por especialização</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaJuridicaChart data={dadosAreaJuridica} />
          </CardContent>
        </Card>

        {/* Origem dos Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Leads</CardTitle>
            <CardDescription>Canais de aquisição de leads</CardDescription>
          </CardHeader>
          <CardContent>
            <OrigemLeadsChart data={dadosOrigem} />
          </CardContent>
        </Card>

        {/* Relatório de Conversão */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conversão</CardTitle>
            <CardDescription>Evolução da conversão ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ConversaoChart periodo={periodo} />
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Agentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Agentes (IA e Humanos)</CardTitle>
          <CardDescription>Performance dos agentes por leads atendidos e taxa de fechamento</CardDescription>
        </CardHeader>
        <CardContent>
          <RankingAgentesTable periodo={periodo} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosGerenciais;
