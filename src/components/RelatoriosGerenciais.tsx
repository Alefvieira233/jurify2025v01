
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import KPICards from './relatorios/KPICards';
import FiltrosAvancados from './relatorios/FiltrosAvancados';
import FunilVendasSection from './relatorios/FunilVendasSection';
import AreaJuridicaSection from './relatorios/AreaJuridicaSection';
import LeadsPorOrigemChart from './relatorios/LeadsPorOrigemChart';
import TaxaConversaoChart from './relatorios/TaxaConversaoChart';
import RankingAgentesSection from './relatorios/RankingAgentesSection';
import { 
  useKPIs, 
  useFunilData, 
  useAreaJuridicaData, 
  useOrigemData 
} from './relatorios/hooks/useRelatoriosData';

type PeriodoFiltro = 'mes' | 'trimestre' | 'ano' | 'personalizado';

const RelatoriosGerenciais = () => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [areaJuridica, setAreaJuridica] = useState<string>('todas');
  const [origemLead, setOrigemLead] = useState<string>('todas');

  // Hooks para buscar dados
  const { data: kpis, isLoading: loadingKPIs } = useKPIs(periodo, areaJuridica, origemLead);
  const { data: dadosFunil } = useFunilData(periodo, areaJuridica, origemLead);
  const { data: dadosAreaJuridica } = useAreaJuridicaData(periodo, origemLead);
  const { data: dadosOrigem } = useOrigemData(periodo, areaJuridica);

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
      <FiltrosAvancados
        periodo={periodo}
        setPeriodo={setPeriodo}
        areaJuridica={areaJuridica}
        setAreaJuridica={setAreaJuridica}
        origemLead={origemLead}
        setOrigemLead={setOrigemLead}
      />

      {/* KPIs Cards */}
      <KPICards kpis={kpis} isLoading={loadingKPIs} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunilVendasSection data={dadosFunil} />
        <AreaJuridicaSection data={dadosAreaJuridica} />
        <LeadsPorOrigemChart data={dadosOrigem} />
        <TaxaConversaoChart periodo={periodo} />
      </div>

      {/* Ranking de Agentes */}
      <RankingAgentesSection periodo={periodo} />
    </div>
  );
};

export default RelatoriosGerenciais;
