
import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, Clock, Brain, Send, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLogActivity } from '@/hooks/useLogActivity';
import { useAgentesIA } from '@/hooks/useAgentesIA';

interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

interface ExecutionResult {
  success: boolean;
  response?: any;
  error?: string;
  executionTime: number;
  source: 'n8n' | 'local_openai';
  log_id?: string;
  agente_nome?: string;
}

const TesteRealAgenteIA = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [userInput, setUserInput] = useState('');
  const { toast } = useToast();
  const { logAgenteExecution, logError } = useLogActivity();
  const { agentes, executeAgente } = useAgentesIA();

  const addLog = (level: ExecutionLog['level'], message: string) => {
    const newLog: ExecutionLog = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level,
      message
    };
    setExecutionLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setExecutionLogs([]);
    setResult(null);
  };

  const executeRealTest = async () => {
    if (!selectedAgentId || !userInput.trim()) {
      toast({
        title: "❌ Dados Incompletos",
        description: "Selecione um agente e insira um prompt para testar.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    setResult(null);
    clearLogs();
    
    const startTime = Date.now();
    const selectedAgent = agentes.find(a => a.id === selectedAgentId);
    
    addLog('info', '🤖 Iniciando execução REAL do Agente IA...');
    addLog('info', `🎯 Agente selecionado: ${selectedAgent?.nome}`);
    addLog('info', `📝 Input do usuário: "${userInput.substring(0, 100)}${userInput.length > 100 ? '...' : ''}"`);
    addLog('info', '🔗 Tentando execução via N8N primeiro...');

    try {
      const response = await executeAgente(selectedAgentId, userInput);
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response) {
        addLog('success', `✅ Execução concluída com SUCESSO em ${duration}ms!`);
        addLog('info', `📊 Fonte da resposta: ${response.source || 'N8N'}`);
        
        if (response.log_id) {
          addLog('info', `📋 ID do log de execução: ${response.log_id}`);
        }

        setResult({
          success: true,
          response: response.response || response,
          executionTime: duration,
          source: response.source || 'n8n',
          log_id: response.log_id,
          agente_nome: selectedAgent?.nome
        });

        toast({
          title: "✅ Agente Executado!",
          description: `Resposta gerada em ${duration}ms via ${response.source === 'n8n' ? 'N8N' : 'OpenAI Local'}`,
        });

      } else {
        throw new Error('Resposta nula ou vazia do agente');
      }

    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      addLog('error', `❌ ERRO na execução: ${error.message}`);
      
      setResult({
        success: false,
        error: error.message,
        executionTime: duration,
        source: 'n8n',
        agente_nome: selectedAgent?.nome
      });

      logError('Agentes IA', 'Falha na execução do teste real', {
        agenteId: selectedAgentId,
        agenteName: selectedAgent?.nome,
        error: error.message,
        input: userInput.substring(0, 100),
        executionTime: duration
      });

      toast({
        title: "❌ Erro na Execução",
        description: `Falha: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getLogIcon = (level: ExecutionLog['level']) => {
    switch (level) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (level: ExecutionLog['level']) => {
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
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-purple-900">Teste Real de Execução - Agente IA</CardTitle>
                <CardDescription className="text-purple-700">
                  Execução completa com N8N + OpenAI em ambiente de produção
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
                Limpar
              </Button>
              <Button
                onClick={executeRealTest}
                disabled={isExecuting || !selectedAgentId || !userInput.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isExecuting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    🚀 EXECUTAR AGENTE REAL
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Seleção do Agente */}
            <div>
              <label className="block text-sm font-medium mb-2">Selecionar Agente IA:</label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um agente para testar..." />
                </SelectTrigger>
                <SelectContent>
                  {agentes.map((agente) => (
                    <SelectItem key={agente.id} value={agente.id}>
                      <div className="flex items-center space-x-2">
                        <Badge className={agente.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {agente.status}
                        </Badge>
                        <span>{agente.nome}</span>
                        <span className="text-xs text-gray-500">({agente.area_juridica})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Informações do Agente Selecionado */}
            {selectedAgentId && (
              <div className="bg-white p-4 rounded border">
                {(() => {
                  const agente = agentes.find(a => a.id === selectedAgentId);
                  return agente ? (
                    <div>
                      <h4 className="font-semibold text-purple-900 mb-2">📋 Detalhes do Agente:</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Nome:</strong> {agente.nome}</div>
                        <div><strong>Área:</strong> {agente.area_juridica}</div>
                        <div><strong>Função:</strong> {agente.descricao_funcao}</div>
                        <div><strong>Status:</strong> 
                          <Badge className={agente.status === 'ativo' ? 'bg-green-100 text-green-800 ml-1' : 'bg-gray-100 text-gray-800 ml-1'}>
                            {agente.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Input do Usuário */}
          <div>
            <label className="block text-sm font-medium mb-2">Prompt para o Agente:</label>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Digite sua pergunta ou solicitação para o agente IA... 
Exemplo: 'Como elaborar um contrato de prestação de serviços advocatícios?'"
              rows={4}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {userInput.length}/1000 caracteres
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Execução */}
      {executionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Logs de Execução em Tempo Real</span>
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
                  <span className="text-yellow-400">⏳ Processando resposta do agente...</span>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="text-sm text-gray-600">Tempo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {result.source === 'n8n' ? 'N8N' : 'Local'}
                  </div>
                  <div className="text-sm text-gray-600">Fonte</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {result.agente_nome?.substring(0, 10) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Agente</div>
                </div>
              </div>

              {/* Response from AI */}
              {result.success && result.response && (
                <div>
                  <h4 className="font-semibold mb-2 text-green-900">🤖 Resposta do Agente IA:</h4>
                  <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                    <div className="prose max-w-none">
                      {typeof result.response === 'string' ? (
                        <p className="whitespace-pre-wrap">{result.response}</p>
                      ) : (
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {!result.success && result.error && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-900">❌ Detalhes do Erro:</h4>
                  <div className="bg-red-100 p-4 rounded border border-red-200">
                    <p className="text-red-800">{result.error}</p>
                  </div>
                </div>
              )}

              {/* Additional Data */}
              {result.log_id && (
                <div className="text-xs text-gray-500">
                  ID do Log de Execução: {result.log_id}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Importantes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Como Funciona o Teste Real</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>• <strong>Execução Real:</strong> Este teste executa o agente IA em ambiente de produção real</p>
          <p>• <strong>Fluxo N8N:</strong> Primeiro tenta via N8N (webhook produção), depois OpenAI local como fallback</p>
          <p>• <strong>Prompt Completo:</strong> Combina o prompt base do agente + contexto + sua pergunta</p>
          <p>• <strong>Logs Detalhados:</strong> Todos os passos são registrados na tabela logs_execucao_agentes</p>
          <p>• <strong>Resposta Real:</strong> A resposta exibida é a mesma que seria entregue ao usuário final</p>
          <p>• <strong>Monitoramento:</strong> Tempo de execução, fonte da resposta e possíveis erros são capturados</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteRealAgenteIA;
