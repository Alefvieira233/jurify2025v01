
import React, { useState, useEffect } from 'react';
import { X, Bot, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgenteIA {
  id: string;
  nome: string;
  area_juridica: string;
  objetivo: string;
  script_saudacao: string;
  perguntas_qualificacao: string[];
  keywords_acao: string[];
  delay_resposta: number;
  status: string; // Mudado para string
}

interface NovoAgenteFormProps {
  agente?: AgenteIA | null;
  onClose: () => void;
}

const NovoAgenteForm: React.FC<NovoAgenteFormProps> = ({ agente, onClose }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    area_juridica: '',
    objetivo: '',
    script_saudacao: '',
    perguntas_qualificacao: [''],
    keywords_acao: [''],
    delay_resposta: 3,
    status: 'ativo' as string // Mudado para string
  });

  const areas = [
    'Direito Trabalhista',
    'Direito de Família',
    'Direito Civil',
    'Direito Previdenciário',
    'Direito Criminal',
    'Direito Empresarial'
  ];

  useEffect(() => {
    if (agente) {
      setFormData({
        nome: agente.nome,
        area_juridica: agente.area_juridica,
        objetivo: agente.objetivo,
        script_saudacao: agente.script_saudacao,
        perguntas_qualificacao: agente.perguntas_qualificacao.length > 0 ? agente.perguntas_qualificacao : [''],
        keywords_acao: agente.keywords_acao.length > 0 ? agente.keywords_acao : [''],
        delay_resposta: agente.delay_resposta,
        status: agente.status
      });
    }
  }, [agente]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: 'perguntas_qualificacao' | 'keywords_acao', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'perguntas_qualificacao' | 'keywords_acao') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'perguntas_qualificacao' | 'keywords_acao', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filtrar arrays vazios
      const perguntas_qualificacao = formData.perguntas_qualificacao.filter(p => p.trim() !== '');
      const keywords_acao = formData.keywords_acao.filter(k => k.trim() !== '');

      const dadosParaSalvar = {
        ...formData,
        perguntas_qualificacao,
        keywords_acao
      };

      if (agente) {
        // Atualizar agente existente
        const { error } = await supabase
          .from('agentes_ia')
          .update(dadosParaSalvar)
          .eq('id', agente.id);

        if (error) throw error;

        toast({
          title: "Agente Atualizado",
          description: "As configurações do agente foram atualizadas com sucesso",
        });
      } else {
        // Criar novo agente
        const { error } = await supabase
          .from('agentes_ia')
          .insert([dadosParaSalvar]);

        if (error) throw error;

        toast({
          title: "Agente Criado",
          description: "Novo agente IA foi criado com sucesso",
        });
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o agente. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {agente ? 'Editar Agente IA' : 'Novo Agente IA'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Agente */}
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome do Agente</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Ex: Sofia - Especialista Trabalhista"
                required
              />
            </div>

            {/* Área Jurídica */}
            <div>
              <Label htmlFor="area_juridica">Área Jurídica</Label>
              <Select value={formData.area_juridica} onValueChange={(value) => handleInputChange('area_juridica', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: string) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Objetivo */}
            <div className="md:col-span-2">
              <Label htmlFor="objetivo">Objetivo do Agente</Label>
              <Input
                id="objetivo"
                value={formData.objetivo}
                onChange={(e) => handleInputChange('objetivo', e.target.value)}
                placeholder="Ex: Captar leads e qualificar casos trabalhistas"
                required
              />
            </div>

            {/* Delay de Resposta */}
            <div>
              <Label htmlFor="delay_resposta">Delay de Resposta (segundos)</Label>
              <Input
                id="delay_resposta"
                type="number"
                min="1"
                max="30"
                value={formData.delay_resposta}
                onChange={(e) => handleInputChange('delay_resposta', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Script de Saudação */}
          <div>
            <Label htmlFor="script_saudacao">Script de Saudação</Label>
            <Textarea
              id="script_saudacao"
              value={formData.script_saudacao}
              onChange={(e) => handleInputChange('script_saudacao', e.target.value)}
              placeholder="Escreva a mensagem inicial que o agente enviará..."
              rows={4}
              required
            />
          </div>

          {/* Perguntas de Qualificação */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Perguntas de Qualificação</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('perguntas_qualificacao')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {formData.perguntas_qualificacao.map((pergunta, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={pergunta}
                    onChange={(e) => handleArrayChange('perguntas_qualificacao', index, e.target.value)}
                    placeholder={`Pergunta ${index + 1}`}
                  />
                  {formData.perguntas_qualificacao.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('perguntas_qualificacao', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Keywords de Ação */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Keywords de Ação</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('keywords_acao')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {formData.keywords_acao.map((keyword, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={keyword}
                    onChange={(e) => handleArrayChange('keywords_acao', index, e.target.value)}
                    placeholder={`Keyword ${index + 1}`}
                  />
                  {formData.keywords_acao.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeArrayItem('keywords_acao', index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : agente ? 'Atualizar Agente' : 'Criar Agente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoAgenteForm;
