
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Lead {
  id: string;
  nome_completo: string;
  area_juridica: string;
  valor_causa?: number;
}

interface NovoContratoFormProps {
  onClose: () => void;
}

export const NovoContratoForm = ({ onClose }: NovoContratoFormProps) => {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [areaJuridica, setAreaJuridica] = useState('');
  const [valorCausa, setValorCausa] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [textoContrato, setTextoContrato] = useState(`CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS

CONTRATANTE: {nome_cliente}
ÁREA JURÍDICA: {area_juridica}
VALOR DA CAUSA: R$ {valor_causa}

PRESTADOR DE SERVIÇOS: {responsavel}

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços advocatícios especializados em {area_juridica}, conforme descrito neste instrumento.

CLÁUSULA 2ª - DOS HONORÁRIOS
Pelos serviços objeto deste contrato, o CONTRATANTE pagará ao PRESTADOR DE SERVIÇOS o valor correspondente a 30% do valor da causa, ou seja, R$ {valor_honorarios}.

CLÁUSULA 3ª - DAS OBRIGAÇÕES
O PRESTADOR DE SERVIÇOS obriga-se a:
- Prestar os serviços com diligência e competência técnica;
- Manter o CONTRATANTE informado sobre o andamento do processo;
- Zelar pelos interesses do CONTRATANTE dentro dos limites legais e éticos.

CLÁUSULA 4ª - DO PRAZO
Este contrato terá vigência até a conclusão dos serviços contratados.

CLÁUSULA 5ª - DO FORO
Fica eleito o foro da comarca local para dirimir quaisquer controvérsias oriundas deste contrato.

Por estarem de acordo, as partes assinam o presente contrato em duas vias de igual teor.

Data: ___/___/______

_____________________          _____________________
   CONTRATANTE                    PRESTADOR DE SERVIÇOS`);
  const [clausulasCustomizadas, setClausulasCustomizadas] = useState('');

  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome_completo, area_juridica, valor_causa')
        .order('nome_completo');
      
      if (error) throw error;
      return data as Lead[];
    }
  });

  // Mutation para criar contrato
  const createContratoMutation = useMutation({
    mutationFn: async (contratoData: any) => {
      const { error } = await supabase
        .from('contratos')
        .insert([contratoData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato criado com sucesso!');
      onClose();
    },
    onError: () => {
      toast.error('Erro ao criar contrato');
    }
  });

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setNomeCliente(lead.nome_completo);
      setAreaJuridica(lead.area_juridica);
      setValorCausa(lead.valor_causa?.toString() || '');
    }
  };

  const gerarTextoFinal = () => {
    const valorCausaNum = parseFloat(valorCausa) || 0;
    const valorHonorarios = valorCausaNum * 0.3;
    
    return textoContrato
      .replace(/{nome_cliente}/g, nomeCliente)
      .replace(/{area_juridica}/g, areaJuridica)
      .replace(/{valor_causa}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCausaNum))
      .replace(/{valor_honorarios}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorHonorarios))
      .replace(/{responsavel}/g, responsavel);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomeCliente || !areaJuridica || !valorCausa || !responsavel) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const contratoData = {
      lead_id: selectedLeadId || null,
      nome_cliente: nomeCliente,
      area_juridica: areaJuridica,
      valor_causa: parseFloat(valorCausa),
      texto_contrato: gerarTextoFinal(),
      clausulas_customizadas: clausulasCustomizadas || null,
      responsavel: responsavel,
      status: 'rascunho'
    };

    createContratoMutation.mutate(contratoData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seleção de Lead */}
      <div className="space-y-2">
        <Label>Lead Existente (Opcional)</Label>
        <Select value={selectedLeadId} onValueChange={handleLeadSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um lead existente ou preencha manualmente" />
          </SelectTrigger>
          <SelectContent>
            {leads.map(lead => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.nome_completo} - {lead.area_juridica}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dados do Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome-cliente">Nome Completo do Cliente *</Label>
          <Input
            id="nome-cliente"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Digite o nome completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area-juridica">Área Jurídica *</Label>
          <Select value={areaJuridica} onValueChange={setAreaJuridica}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área jurídica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Direito Trabalhista">Direito Trabalhista</SelectItem>
              <SelectItem value="Direito de Família">Direito de Família</SelectItem>
              <SelectItem value="Direito Previdenciário">Direito Previdenciário</SelectItem>
              <SelectItem value="Direito Civil">Direito Civil</SelectItem>
              <SelectItem value="Direito Criminal">Direito Criminal</SelectItem>
              <SelectItem value="Direito Empresarial">Direito Empresarial</SelectItem>
              <SelectItem value="Direito Imobiliário">Direito Imobiliário</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor-causa">Valor da Causa (R$) *</Label>
          <Input
            id="valor-causa"
            type="number"
            step="0.01"
            value={valorCausa}
            onChange={(e) => setValorCausa(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavel">Responsável *</Label>
          <Select value={responsavel} onValueChange={setResponsavel}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dr. Silva">Dr. Silva</SelectItem>
              <SelectItem value="Dra. Oliveira">Dra. Oliveira</SelectItem>
              <SelectItem value="Dr. Santos">Dr. Santos</SelectItem>
              <SelectItem value="Dra. Costa">Dra. Costa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Texto do Contrato */}
      <div className="space-y-2">
        <Label htmlFor="texto-contrato">Texto Base do Contrato</Label>
        <Textarea
          id="texto-contrato"
          value={textoContrato}
          onChange={(e) => setTextoContrato(e.target.value)}
          rows={15}
          className="font-mono text-sm"
          placeholder="Digite o texto base do contrato..."
        />
        <p className="text-sm text-gray-600">
          Use os placeholders: {'{nome_cliente}'}, {'{area_juridica}'}, {'{valor_causa}'}, {'{valor_honorarios}'}, {'{responsavel}'}
        </p>
      </div>

      {/* Cláusulas Customizadas */}
      <div className="space-y-2">
        <Label htmlFor="clausulas-customizadas">Cláusulas Customizadas (Opcional)</Label>
        <Textarea
          id="clausulas-customizadas"
          value={clausulasCustomizadas}
          onChange={(e) => setClausulasCustomizadas(e.target.value)}
          rows={4}
          placeholder="Digite cláusulas adicionais específicas para este contrato..."
        />
      </div>

      {/* Preview do Contrato */}
      <div className="space-y-2">
        <Label>Preview do Contrato Gerado</Label>
        <div className="border rounded-lg p-4 bg-gray-50 max-h-40 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{gerarTextoFinal()}</pre>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-amber-500 hover:bg-amber-600"
          disabled={createContratoMutation.isPending}
        >
          {createContratoMutation.isPending ? 'Criando...' : 'Criar Contrato'}
        </Button>
      </div>
    </form>
  );
};
