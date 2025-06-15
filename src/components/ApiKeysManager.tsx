
import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Power, 
  PowerOff, 
  Trash2, 
  Copy,
  Shield
} from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ApiKeysManager = () => {
  const { apiKeys, loading, criarApiKey, toggleApiKey, deletarApiKey } = useApiKeys();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [nomeNovaKey, setNomeNovaKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleCriarApiKey = async () => {
    if (!nomeNovaKey.trim()) return;
    
    setCreating(true);
    try {
      await criarApiKey(nomeNovaKey);
      setNomeNovaKey('');
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "API key copiada para a área de transferência",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const formatKeyValue = (keyValue: string, keyId: string) => {
    if (visibleKeys.has(keyId)) {
      return keyValue;
    }
    return keyValue.substring(0, 8) + '••••••••••••••••';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Key className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Carregando API keys...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar API Keys</h2>
          <p className="text-gray-600">Controle o acesso às APIs dos Agentes IA</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Crie uma nova chave de API para acessar os endpoints dos Agentes IA.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome" className="text-right">
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={nomeNovaKey}
                  onChange={(e) => setNomeNovaKey(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: N8N Production"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCriarApiKey}
                disabled={creating || !nomeNovaKey.trim()}
              >
                {creating ? 'Criando...' : 'Criar API Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Keys</p>
              <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
            </div>
            <Key className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativas</p>
              <p className="text-2xl font-bold text-green-600">
                {apiKeys.filter(key => key.ativo).length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inativas</p>
              <p className="text-2xl font-bold text-red-600">
                {apiKeys.filter(key => !key.ativo).length}
              </p>
            </div>
            <PowerOff className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Key className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{apiKey.nome}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                      {formatKeyValue(apiKey.key_value, apiKey.id)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key_value)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={apiKey.ativo ? 'default' : 'secondary'}
                    className={apiKey.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                  >
                    {apiKey.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(apiKey.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleApiKey(apiKey.id, apiKey.ativo)}
                      className={apiKey.ativo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {apiKey.ativo ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletarApiKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {apiKeys.length === 0 && (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma API key criada ainda</p>
            <p className="text-gray-400 text-sm">Crie sua primeira API key para começar</p>
          </div>
        )}
      </div>

      {/* Documentação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Como usar as API Keys</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Endpoint base:</strong> <code>https://yfxgncbopvnsltjqetxw.supabase.co/functions/v1/agentes-ia-api</code></p>
          <p><strong>Autenticação:</strong> Adicione o header <code>x-api-key: sua_api_key</code></p>
          <p><strong>Endpoints disponíveis:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>POST /agentes/executar</code> - Executa um agente IA</li>
            <li><code>GET /agentes/listar</code> - Lista agentes disponíveis</li>
            <li><code>POST /webhook/n8n</code> - Webhook especial para N8N</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysManager;
