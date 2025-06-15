
import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, Clock, Code, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLogActivity } from '@/hooks/useLogActivity';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

const TesteN8NProducao = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const { toast } = useToast();
  const { logN8NTest, logError } = useLogActivity();

  const PRODUCTION_URL = 'https://primary-production-adcb.up.railway.app/webhook/Agente%20Jurify';

  const addLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level,
      message
    };
    setExecutionLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setExecutionLogs([]);
    setResult(null);
    setExecutionTime(0);
  };

  const executeTest = async () => {
    setIsExecuting(true);
    setResult(null);
    clearLogs();
    
    const startTime = Date.now();
    
    const payload = {
      agentId: "test-agent-" + Date.now(),
      prompt: "Exemplo de pergunta para o agente IA: 'Como elaborar um contrato de prestação de serviços?'",
      parameters: {
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      metadata: {
        test_mode: false,
        source: "Jurify_Production_Test",
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      }
    };

    addLog('info', '🚀 Iniciando teste REAL de produção N8N...');
    addLog('info', `📍 URL de destino: ${PRODUCTION_URL}`);
    addLog('info', `📦 Payload preparado com agentId: ${payload.agentId}`);

    try {
      addLog('info', '⏳ Enviando requisição POST para o webhook N8N...');
      
      const response = await fetch(PRODUCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Jurify-Production-Test/1.0',
          'X-Test-Source': 'Jurify-Dashboard'
        },
        body: JSON.stringify(payload)
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      setExecutionTime(duration);

      addLog('info', `⏱️ Tempo de resposta: ${duration}ms`);
      addLog('info', `📊 Status HTTP: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Tentar fazer parse da resposta JSON
      let responseData;
      const contentType = response.headers.get('content-type');
      addLog('info', `📄 Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        addLog('success', '✅ Resposta JSON recebida com sucesso!');
      } else {
        const textResponse = await response.text();
        addLog('warning', '⚠️ Resposta não é JSON, recebido como texto');
        responseData = { raw_response: textResponse };
      }

      setResult({
        success: true,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        executionTime: duration,
        timestamp: new Date().toISOString()
      });

      addLog('success', '🎉 Teste de produção N8N concluído com SUCESSO!');
      
      // Log da atividade
      logN8NTest(true, PRODUCTION_URL, {
        status: response.status,
        executionTime: duration,
        agentId: payload.agentId
      });

      toast({
        title: "✅ Teste Bem-sucedido!",
        description: `Conexão com N8N estabelecida em ${duration}ms`,
      });

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      setExecutionTime(duration);

      addLog('error', `❌ ERRO: ${error.message}`);
      
      setResult({
        success: false,
        error: error.message,
        executionTime: duration,
        timestamp: new Date().toISOString()
      });

      // Log do erro
      logN8NTest(false, PRODUCTION_URL, {
        error: error.message,
        executionTime: duration
      });

      logError('N8N Integration', 'Falha no teste de produção', {
        url: PRODUCTION_URL,
        error: error.message,
        executionTime: duration
      });

      toast({
        title: "❌ Erro no Teste",
        description: `Falha na conexão: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Send className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-orange-900">Teste Real N8N - Produção</CardTitle>
                <CardDescription className="text-orange-700">
                  Execução real do webhook de produção com payload completo
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={clearLogs}
                variant="outline"
                size="sm"
                disabled={isExecuting}
              >
                Limpar Logs
              </Button>
              <Button
                onClick={executeTest}
                disabled={isExecuting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isExecuting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    🚀 EXECUTAR TESTE REAL DE PRODUÇÃO
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">🎯 Configuração do Teste:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">URL de Produção:</span>
                <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1 break-all">
                  {PRODUCTION_URL}
                </div>
              </div>
              <div>
                <span className="font-medium">Método:</span>
                <Badge variant="outline" className="ml-2">POST</Badge>
              </div>
              <div>
                <span className="font-medium">Modo:</span>
                <Badge className="ml-2 bg-red-100 text-red-800">🔴 PRODUÇÃO REAL</Badge>
              </div>
              <div>
                <span className="font-medium">Content-Type:</span>
                <code className="ml-2 text-xs">application/json</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Execução */}
      {executionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Logs de Execução em Tempo Real</span>
              {executionTime > 0 && (
                <Badge variant="outline">{executionTime}ms</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
              {executionLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 mb-1">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className={getLogColor(log.level)}>
                    {getLogIcon(log.level)} {log.message}
                  </span>
                </div>
              ))}
              {isExecuting && (
                <div className="flex items-center space-x-2 animate-pulse">
                  <span className="text-gray-500">[{new Date().toLocaleTimeString('pt-BR')}]</span>
                  <span className="text-yellow-400">⏳ Aguardando resposta do N8N...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {result && (
        <Card className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Resultado da Execução</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.success ? 'Sucesso' : 'Falhou'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.executionTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Tempo de Resposta</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {result.status || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Status HTTP</div>
                </div>
              </div>

              {/* Response Data */}
              <div>
                <h4 className="font-semibold mb-2">📋 Resposta Completa do N8N:</h4>
                <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações de Debug */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>• Este teste realiza uma requisição REAL para o seu webhook N8N de produção</p>
          <p>• O payload inclui dados simulados mas o processamento é real</p>
          <p>• Verifique os logs do N8N para confirmar o recebimento e processamento</p>
          <p>• Tempo de resposta normal: 2-10 segundos dependendo da complexidade do workflow</p>
          <p>• Em caso de erro, verifique se a URL está correta e o N8N está online</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteN8NProducao;
