
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

const TesteN8N = () => {
  const [testData, setTestData] = useState({
    agente_id: '',
    input_usuario: 'Olá, preciso de uma consulta sobre direito trabalhista. Fui demitido sem justa causa e não recebi todas as verbas rescisórias.',
    use_n8n: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!testData.agente_id) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o ID do agente para teste.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 Iniciando teste N8N:', testData);

      const { data, error } = await supabase.functions.invoke('agentes-ia-api', {
        body: testData
      });

      if (error) {
        throw error;
      }

      setTestResult(data);
      
      toast({
        title: 'Teste concluído',
        description: data.success 
          ? `Resposta recebida via ${data.source === 'n8n' ? 'N8N' : 'OpenAI local'}` 
          : 'Falha no teste',
        variant: data.success ? 'default' : 'destructive',
      });

    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult({
        success: false,
        error: error.message,
        source: 'error'
      });
      
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível executar o teste.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
    if (!testResult) return <TestTube className="h-5 w-5 text-gray-400" />;
    if (testResult.success) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getSourceBadge = () => {
    if (!testResult) return null;
    
    const variants: Record<string, any> = {
      'n8n': { variant: 'default', color: 'bg-purple-100 text-purple-800' },
      'local_openai': { variant: 'secondary', color: 'bg-blue-100 text-blue-800' },
      'error': { variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };

    const config = variants[testResult.source] || variants.error;

    return (
      <Badge className={config.color}>
        {testResult.source === 'n8n' && '⚡ N8N'}
        {testResult.source === 'local_openai' && '🤖 OpenAI Local'}
        {testResult.source === 'error' && '❌ Erro'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Teste de Integração N8N
          </CardTitle>
          <CardDescription>
            Teste a comunicação entre Jurify e N8N enviando um payload de exemplo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="agente_id">ID do Agente (UUID)</Label>
              <Input
                id="agente_id"
                value={testData.agente_id}
                onChange={(e) => setTestData({ ...testData, agente_id: e.target.value })}
                placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode encontrar o ID na tabela de agentes IA
              </p>
            </div>

            <div>
              <Label htmlFor="input_usuario">Input do Usuário (Teste)</Label>
              <Textarea
                id="input_usuario"
                value={testData.input_usuario}
                onChange={(e) => setTestData({ ...testData, input_usuario: e.target.value })}
                rows={3}
                placeholder="Digite uma mensagem de teste para o agente..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use_n8n"
                checked={testData.use_n8n}
                onChange={(e) => setTestData({ ...testData, use_n8n: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="use_n8n">Usar N8N (se desmarcado, irá direto para OpenAI)</Label>
            </div>

            <Button 
              onClick={handleTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Executar Teste
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultado do Teste</span>
              {getSourceBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className={`text-sm mt-1 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.success ? '✅ Sucesso' : '❌ Falha'}
                </p>
              </div>

              {testResult.agente_nome && (
                <div>
                  <Label className="text-sm font-medium">Agente Utilizado</Label>
                  <p className="text-sm text-gray-900 mt-1">{testResult.agente_nome}</p>
                </div>
              )}

              {testResult.response && (
                <div>
                  <Label className="text-sm font-medium">Resposta da IA</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{testResult.response}</p>
                  </div>
                </div>
              )}

              {testResult.execution_time && (
                <div>
                  <Label className="text-sm font-medium">Tempo de Execução</Label>
                  <p className="text-sm text-gray-900 mt-1">{testResult.execution_time}ms</p>
                </div>
              )}

              {testResult.log_id && (
                <div>
                  <Label className="text-sm font-medium">Log ID</Label>
                  <p className="text-sm text-gray-500 mt-1 font-mono">{testResult.log_id}</p>
                </div>
              )}

              {testResult.error && (
                <div>
                  <Label className="text-sm font-medium">Erro</Label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-900">{testResult.error}</p>
                    {testResult.details && (
                      <p className="text-xs text-red-700 mt-1">{testResult.details}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Fluxo:</strong> {testResult.source === 'n8n' 
                    ? 'Jurify → N8N → Resposta' 
                    : 'Jurify → OpenAI Local (Fallback)'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TesteN8N;
