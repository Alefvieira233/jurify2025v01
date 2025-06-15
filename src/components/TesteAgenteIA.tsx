
import React, { useState } from 'react';
import { Play, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TesteAgenteIAProps {
  agenteId: string;
  agenteName: string;
}

const TesteAgenteIA: React.FC<TesteAgenteIAProps> = ({ agenteId, agenteName }) => {
  const [input, setInput] = useState('');
  const [resposta, setResposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const executarTeste = async () => {
    if (!input.trim() || !apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o input e a API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agentes-ia-api/agentes/executar', {
        body: {
          agente_id: agenteId,
          input: input
        },
        headers: {
          'x-api-key': apiKey
        }
      });

      if (error) throw error;

      setResposta(data.resposta || 'Resposta vazia');
      toast({
        title: "Sucesso",
        description: `Execução concluída em ${data.tempo_execucao}ms`,
      });
    } catch (error) {
      console.error('Erro ao executar teste:', error);
      setResposta(`Erro: ${error.message}`);
      toast({
        title: "Erro",
        description: "Falha na execução do teste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copiarResposta = () => {
    navigator.clipboard.writeText(resposta);
    toast({
      title: "Copiado!",
      description: "Resposta copiada para a área de transferência",
    });
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Teste Rápido - {agenteName}</h3>
        <Button
          onClick={executarTeste}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Executar
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Insira sua API key aqui..."
          />
        </div>

        <div>
          <Label htmlFor="input">Input de Teste</Label>
          <Textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite aqui o texto de entrada para o agente..."
            rows={3}
          />
        </div>

        {resposta && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Resposta da IA</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copiarResposta}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
              {resposta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TesteAgenteIA;
