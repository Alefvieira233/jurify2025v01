
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type PeriodoFiltro = 'mes' | 'trimestre' | 'ano' | 'personalizado';

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

export const useKPIs = (periodo: PeriodoFiltro, areaJuridica: string, origemLead: string) => {
  return useQuery({
    queryKey: ['kpis-gerais', periodo, areaJuridica, origemLead],
    queryFn: async () => {
      console.log('🔍 [useKPIs] Buscando KPIs...');
      
      try {
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

        console.log(`✅ [useKPIs] KPIs calculados: ${totalLeads} leads, ${contratosAssinados} contratos`);

        return {
          totalLeads,
          contratosAssinados,
          valorTotalContratos,
          taxaConversao
        };
      } catch (error) {
        console.error('❌ [useKPIs] Erro:', error);
        throw error;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export const useFunilData = (periodo: PeriodoFiltro, areaJuridica: string, origemLead: string) => {
  return useQuery({
    queryKey: ['dados-funil', periodo, areaJuridica, origemLead],
    queryFn: async () => {
      console.log('🔍 [useFunilData] Buscando dados do funil...');
      
      try {
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

        console.log(`✅ [useFunilData] Dados do funil calculados`);
        return contadores;
      } catch (error) {
        console.error('❌ [useFunilData] Erro:', error);
        throw error;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export const useAreaJuridicaData = (periodo: PeriodoFiltro, origemLead: string) => {
  return useQuery({
    queryKey: ['dados-area-juridica', periodo, origemLead],
    queryFn: async () => {
      console.log('🔍 [useAreaJuridicaData] Buscando dados por área jurídica...');
      
      try {
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

        console.log(`✅ [useAreaJuridicaData] Dados por área calculados`);
        return contadores;
      } catch (error) {
        console.error('❌ [useAreaJuridicaData] Erro:', error);
        throw error;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export const useOrigemData = (periodo: PeriodoFiltro, areaJuridica: string) => {
  return useQuery({
    queryKey: ['dados-origem', periodo, areaJuridica],
    queryFn: async () => {
      console.log('🔍 [useOrigemData] Buscando dados por origem...');
      
      try {
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

        console.log(`✅ [useOrigemData] Dados por origem calculados`);
        return contadores;
      } catch (error) {
        console.error('❌ [useOrigemData] Erro:', error);
        throw error;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};
