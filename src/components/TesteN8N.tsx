
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const TesteN8N = () => {
  const [isTestingN8N, setIsTestingN8N] = useState(false);
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [agentTestResult, setAgentTestResult] = useState<any>(null);
  const [testInput, setTestInput] = useState('Preciso de ajuda com um contrato de trabalho');
  const { toast } = useToast();

  const testN8NConnection = async () => {
    setIsTestingN8N(true);
    setTestResult(null);

    try {
      const testPayload = {
        agentId: 'test-agent-' + Date.now(),
        prompt: 'Este é um teste de conectividade com o webhook N8N do Jurify',
        parameters: {
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }
      };

      console.log('🔗 Testando N8N webhook com payload:', testPayload);

      const { data, error } = await supabase.functions.invoke('n8n-webhook-forwarder', {
        body: testPayload
      });

      if (error) throw error;

      setTestResult(data);
      
      toast({
        title: data.success ? 'Teste bem-sucedido!' : 'Teste falhou',
        description: data.success 
          ? 'A comunicação com o N8N está funcionando corretamente' 
          : `Erro: ${data.error}`,
        variant: data.success ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error('❌ Erro no teste N8N:', error);
      const errorResult = { success: false, error: error.message };
      setTestResult(errorResult);
      
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível conectar com o webhook N8N',
        variant: 'destructive',
      });
    } finally {
      setIsTestingN8N(false);
    }
  };

  const testAgentExecution = async () => {
    setIsTestingAgent(true);
    setAgentTestResult(null);

    try {
      // Buscar primeiro agente ativo para teste
      const { data: agentes, error: agentesError } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('status', 'ativo')
        .limit(1);

      if (agentesError || !agentes || agentes.length === 0) {
        throw new Error('Nenhum agente ativo encontrado para teste');
      }

      const agente = agentes[0];
      console.log('🤖 Testando execução do agente:', agente.nome);

      const { data, error } = await supabase.functions.invoke('agentes-ia-api', {
        body: {
          agente_id: agente.id,
          input_usuario: testInput,
          use_n8n: true
        }
      });

      if (error) throw error;

      setAgentTestResult(data);
      
      toast({
        title: data.success ? 'Agente executado com sucesso!' : 'Falha na execução',
        description: data.success 
          ? `Resposta recebida via ${data.source === 'n8n' ? 'N8N' : 'OpenAI local'}` 
          : `Erro: ${data.error}`,
        variant: data.success ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error('❌ Erro no teste do agente:', error);
      const errorResult = { success: false, error: error.message };
      setAgentTestResult(errorResult);
      
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível executar o agente IA',
        variant: 'destructive',
      });
    } finally {
      setIsTestingAgent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Teste de Integração N8N</h2>
        <p className="text-gray-600">
          Teste a conectividade e funcionamento da integração com o webhook N8N
        </p>
      </div>

      {/* Teste de Conectividade N8N */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Conectividade N8N
          </CardTitle>
          <CardDescription>
            Testa a comunicação direta com o webhook N8N configurado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testN8NConnection}
            disabled={isTestingN8N}
            className="w-full"
          >
            {isTestingN8N ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando N8N...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Testar Webhook N8N
              </>
            )}
          </Button>

          {testResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>
              
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Resposta:</strong>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teste de Execução de Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Execução de Agente IA
          </CardTitle>
          <CardDescription>
            Testa a execução completa de um agente IA através do N8N
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-input">Input para teste</Label>
            <Textarea
              id="test-input"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Digite uma pergunta para testar o agente..."
              rows={3}
            />
          </div>

          <Button 
            onClick={testAgentExecution}
            disabled={isTestingAgent || !testInput.trim()}
            className="w-full"
          >
            {isTestingAgent ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando Agente...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Testar Execução de Agente
              </>
            )}
          </Button>

          {agentTestResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {agentTestResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={agentTestResult.success ? 'default' : 'destructive'}>
                  {agentTestResult.success ? 'Sucesso' : 'Falha'}
                </Badge>
                {agentTestResult.source && (
                  <Badge variant="outline">
                    {agentTestResult.source === 'n8n' ? 'Via N8N' : 'Via OpenAI Local'}
                  </Badge>
                )}
              </div>
              
              {agentTestResult.success && agentTestResult.response && (
                <div className="bg-blue-50 p-3 rounded text-sm mb-3">
                  <strong>Resposta da IA:</strong>
                  <p className="mt-2">{agentTestResult.response}</p>
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Dados técnicos:</strong>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {JSON.stringify(agentTestResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Informações do Teste</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• O primeiro teste verifica a conectividade direta com o webhook N8N</li>
          <li>• O segundo teste executa um agente IA completo via N8N</li>
          <li>• Se o N8N falhar, o sistema usa OpenAI como fallback automaticamente</li>
          <li>• Todos os testes são registrados nos logs de execução</li>
        </ul>
      </div>
    </div>
  );
};

export default TesteN8N;
