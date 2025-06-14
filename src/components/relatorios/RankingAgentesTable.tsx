
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RankingAgentesTableProps {
  periodo: string;
}

interface AgenteStats {
  nome: string;
  tipo: 'ia' | 'humano';
  leadsAtendidos: number;
  taxaFechamento: number;
  tempoMedioResposta: number;
  valorGerado: number;
}

const RankingAgentesTable: React.FC<RankingAgentesTableProps> = ({ periodo }) => {
  const { data: rankingAgentes } = useQuery({
    queryKey: ['ranking-agentes', periodo],
    queryFn: async () => {
      // Buscar dados dos agentes IA
      const { data: agentesIA } = await supabase
        .from('agentes_ia')
        .select('*');

      // Buscar leads por área jurídica para correlacionar com agentes IA
      const { data: leads } = await supabase
        .from('leads')
        .select('area_juridica, responsavel, valor_causa, status');

      // Buscar contratos para calcular taxa de fechamento
      const { data: contratos } = await supabase
        .from('contratos')
        .select('responsavel, valor_causa, status');

      const agentesStats: AgenteStats[] = [];

      // Processar agentes IA
      if (agentesIA && agentesIA.length > 0) {
        agentesIA.forEach(agente => {
          const leadsDoAgente = leads?.filter(lead => lead.area_juridica === agente.area_juridica) || [];
          const contratosDoAgente = contratos?.filter(contrato => 
            contrato.responsavel === 'IA Jurídica' && contrato.status === 'assinado'
          ) || [];

          agentesStats.push({
            nome: agente.nome,
            tipo: 'ia',
            leadsAtendidos: leadsDoAgente.length,
            taxaFechamento: leadsDoAgente.length > 0 ? (contratosDoAgente.length / leadsDoAgente.length) * 100 : 0,
            tempoMedioResposta: agente.delay_resposta || 3,
            valorGerado: contratosDoAgente.reduce((sum, c) => sum + (c.valor_causa || 0), 0)
          });
        });
      }

      // Processar agentes humanos
      const responsaveisHumanos = [...new Set(leads?.map(lead => lead.responsavel).filter(resp => resp !== 'IA Jurídica'))] || [];
      
      responsaveisHumanos.forEach(responsavel => {
        if (responsavel) {
          const leadsDoResponsavel = leads?.filter(lead => lead.responsavel === responsavel) || [];
          const contratosDoResponsavel = contratos?.filter(contrato => 
            contrato.responsavel === responsavel && contrato.status === 'assinado'
          ) || [];

          agentesStats.push({
            nome: responsavel,
            tipo: 'humano',
            leadsAtendidos: leadsDoResponsavel.length,
            taxaFechamento: leadsDoResponsavel.length > 0 ? (contratosDoResponsavel.length / leadsDoResponsavel.length) * 100 : 0,
            tempoMedioResposta: Math.floor(Math.random() * 60) + 30, // Simular tempo de resposta humano
            valorGerado: contratosDoResponsavel.reduce((sum, c) => sum + (c.valor_causa || 0), 0)
          });
        }
      });

      // Ordenar por leads atendidos
      return agentesStats.sort((a, b) => b.leadsAtendidos - a.leadsAtendidos);
    }
  });

  if (!rankingAgentes) {
    return <div className="text-center py-8 text-gray-500">Carregando ranking...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-center">Leads Atendidos</TableHead>
            <TableHead className="text-center">Taxa de Fechamento</TableHead>
            <TableHead className="text-center">Tempo Médio</TableHead>
            <TableHead className="text-right">Valor Gerado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankingAgentes.map((agente, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className={agente.tipo === 'ia' ? 'bg-blue-100' : 'bg-green-100'}>
                      {agente.tipo === 'ia' ? (
                        <Bot className="h-4 w-4 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 text-green-600" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{agente.nome}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={agente.tipo === 'ia' ? 'default' : 'secondary'}>
                  {agente.tipo === 'ia' ? 'IA' : 'Humano'}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-medium">
                {agente.leadsAtendidos}
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-medium ${
                  agente.taxaFechamento >= 20 ? 'text-green-600' : 
                  agente.taxaFechamento >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {agente.taxaFechamento.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-center">
                {agente.tempoMedioResposta < 60 ? 
                  `${agente.tempoMedioResposta}s` : 
                  `${Math.floor(agente.tempoMedioResposta / 60)}min`
                }
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {(agente.valorGerado / 1000).toFixed(0)}k
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rankingAgentes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum dado encontrado para o período selecionado
        </div>
      )}
    </div>
  );
};

export default RankingAgentesTable;
