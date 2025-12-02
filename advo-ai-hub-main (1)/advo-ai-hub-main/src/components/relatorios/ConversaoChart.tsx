
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ConversaoChartProps {
  periodo: string;
}

const ConversaoChart: React.FC<ConversaoChartProps> = ({ periodo }) => {
  const { data: dadosConversao } = useQuery({
    queryKey: ['dados-conversao', periodo],
    queryFn: async () => {
      // Simular dados de conversão por semana (implementar lógica real conforme necessário)
      const semanas = [];
      for (let i = 4; i >= 0; i--) {
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - (i * 7));
        
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + 6);

        const { data: leads } = await supabase
          .from('leads')
          .select('status')
          .gte('created_at', dataInicio.toISOString())
          .lte('created_at', dataFim.toISOString());

        const { data: contratos } = await supabase
          .from('contratos')
          .select('status')
          .eq('status', 'assinado')
          .gte('created_at', dataInicio.toISOString())
          .lte('created_at', dataFim.toISOString());

        const totalLeads = leads?.length || 0;
        const contratosAssinados = contratos?.length || 0;
        const taxaConversao = totalLeads > 0 ? (contratosAssinados / totalLeads) * 100 : 0;

        semanas.push({
          semana: `Sem ${5 - i}`,
          taxa: Math.round(taxaConversao * 10) / 10
        });
      }

      return semanas;
    }
  });

  if (!dadosConversao || !Array.isArray(dadosConversao)) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Carregando dados...</div>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dadosConversao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="semana" />
          <YAxis 
            label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Taxa de Conversão']}
          />
          <Line 
            type="monotone" 
            dataKey="taxa" 
            stroke="#8B5CF6" 
            strokeWidth={3}
            dot={{ r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversaoChart;
