
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, Send, CheckCircle, XCircle, Loader2, AlertCircle, Clock } from 'lucide-react';

const TesteN8NProducao = () => {
  const [isTestingProduction, setIsTestingProduction] = useState(false);
  const [productionTestResult, setProductionTestResult] = useState<any>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setTestLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TESTE N8N PRODUÇÃO] ${message}`);
  };

  const testProductionN8N = async () => {
    setIsTestingProduction(true);
    setProductionTestResult(null);
    setTestLogs([]);

    const productionURL = 'https://primary-production-adcb.up.railway.app/webhook/Agente%20Jurify';
    
    const productionPayload = {
      agentId: "12345",
      prompt: "Exemplo de pergunta para o agente IA: 'Como elaborar um contrato de prestação de serviços?'",
      parameters: {
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      }
    };

    addLog('🚀 Iniciando teste REAL de produção do N8N');
    addLog(`📡 URL de destino: ${productionURL}`);
    addLog(`📦 Payload: ${JSON.stringify(productionPayload, null, 2)}`);

    try {
      addLog('⏱️ Enviando requisição para N8N (Produção)...');
      
      const startTime = Date.now();
      
      // Usar a Edge Function para fazer o teste via produção
      const { data, error } = await supabase.functions.invoke('n8n-webhook-forwarder', {
        body: productionPayload
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      addLog(`⏱️ Tempo de resposta: ${responseTime}ms`);

      if (error) {
        addLog(`❌ Erro na Edge Function: ${error.message}`);
        throw error;
      }

      addLog('📥 Resposta recebida da Edge Function');
      addLog(`📊 Status: ${data.success ? 'SUCESSO' : 'FALHA'}`);

      if (data.success) {
        addLog('✅ Comunicação com N8N de PRODUÇÃO bem-sucedida!');
        addLog(`🔗 Workflow usado: ${data.workflow_used || 'N/A'}`);
        addLog(`📋 Log ID: ${data.log_id || 'N/A'}`);
        
        if (data.response) {
          addLog('📄 Resposta do N8N:');
          addLog(JSON.stringify(data.response, null, 2));
        }
      } else {
        addLog(`❌ Falha na comunicação: ${data.error}`);
        addLog(`🔗 URL tentada: ${data.webhook_url || productionURL}`);
      }

      setProductionTestResult({
        ...data,
        responseTime,
        timestamp: new Date().toISOString(),
        url: productionURL,
        payload: productionPayload
      });
      
      toast({
        title: data.success ? 'Teste de Produção: SUCESSO!' : 'Teste de Produção: FALHA',
        description: data.success 
          ? `N8N de produção respondeu em ${responseTime}ms` 
          : `Erro: ${data.error}`,
        variant: data.success ? 'default' : 'destructive',
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`💥 ERRO CRÍTICO: ${errorMessage}`);
      
      const errorResult = { 
        success: false, 
        error: errorMessage,
        details: error,
        timestamp: new Date().toISOString(),
        url: productionURL,
        payload: productionPayload
      };
      
      setProductionTestResult(errorResult);
      
      toast({
        title: 'Erro no Teste de Produção',
        description: 'Falha crítica na comunicação com N8N de produção',
        variant: 'destructive',
      });
    } finally {
      setIsTestingProduction(false);
      addLog('🏁 Teste de produção finalizado');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <TestTube className="h-5 w-5" />
            Teste REAL de Produção N8N
          </CardTitle>
          <CardDescription className="text-orange-800">
            Execução real do webhook de produção do N8N com payload completo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-orange-900 mb-2">🎯 URL de Produção</h4>
              <p className="text-sm font-mono text-gray-800 break-all">
                https://primary-production-adcb.up.railway.app/webhook/Agente%20Jurify
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-orange-900 mb-2">📦 Payload de Teste</h4>
              <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "agentId": "12345",
  "prompt": "Exemplo de pergunta para o agente IA: 'Como elaborar um contrato de prestação de serviços?'",
  "parameters": {
    "temperature": 0.7,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
  }
}`}
              </pre>
            </div>

            <Button 
              onClick={testProductionN8N}
              disabled={isTestingProduction}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              {isTestingProduction ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Executando Teste Real...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  🚀 EXECUTAR TESTE REAL DE PRODUÇÃO
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs em Tempo Real */}
      {testLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Logs do Teste em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-4 rounded-lg max-h-64 overflow-y-auto">
              {testLogs.map((log, index) => (
                <div key={index} className="text-green-400 text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado do Teste */}
      {productionTestResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {productionTestResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado do Teste de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={productionTestResult.success ? 'default' : 'destructive'} className="text-lg py-1 px-3">
                  {productionTestResult.success ? '✅ SUCESSO' : '❌ FALHA'}
                </Badge>
                {productionTestResult.responseTime && (
                  <Badge variant="outline">
                    {productionTestResult.responseTime}ms
                  </Badge>
                )}
                <Badge variant="outline">
                  {new Date(productionTestResult.timestamp).toLocaleString('pt-BR')}
                </Badge>
              </div>

              {productionTestResult.success && productionTestResult.response && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">🎉 Resposta do N8N de Produção:</h4>
                  <pre className="text-sm text-green-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(productionTestResult.response, null, 2)}
                  </pre>
                </div>
              )}

              {!productionTestResult.success && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">💥 Erro:</h4>
                  <p className="text-red-800 mb-2">{productionTestResult.error}</p>
                  {productionTestResult.webhook_url && (
                    <p className="text-sm text-red-700">URL tentada: {productionTestResult.webhook_url}</p>
                  )}
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📋 Dados Técnicos Completos:</h4>
                <pre className="text-xs text-gray-700 overflow-x-auto max-h-48">
                  {JSON.stringify(productionTestResult, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          ℹ️ Informações do Teste Real
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Este teste faz uma requisição REAL para o webhook N8N de produção</li>
          <li>• A URL utilizada é: https://primary-production-adcb.up.railway.app/webhook/Agente%20Jurify</li>
          <li>• O payload simula uma execução real de agente IA com pergunta sobre contratos</li>
          <li>• Todos os logs e resultados são registrados no sistema</li>
          <li>• Tempo de resposta e dados técnicos são capturados</li>
          <li>• ⚠️ Este NÃO é um teste mockado - é uma execução real</li>
        </ul>
      </div>
    </div>
  );
};

export default TesteN8NProducao;
