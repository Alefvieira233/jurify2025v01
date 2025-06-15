
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Server, Key, Clock, Mail, Activity, Plus, Trash } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SistemaSection = () => {
  const { getSettingsByCategory, updateSetting, isUpdating, getSettingValue } = useSystemSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  const sistemaSettings = getSettingsByCategory('sistema');
  const emailSettings = getSettingsByCategory('email');

  // Buscar API Keys
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Buscar Rate Limits
  const { data: rateLimits = [] } = useQuery({
    queryKey: ['rate-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_rate_limits')
        .select(`
          *,
          api_keys(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Buscar logs recentes
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_execucao_agentes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  // Criar nova API Key
  const createApiKeyMutation = useMutation({
    mutationFn: async (nome: string) => {
      const keyValue = `jrf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { error } = await supabase
        .from('api_keys')
        .insert({
          nome,
          key_value: keyValue,
          criado_por: user?.id
        });

      if (error) throw error;
      return keyValue;
    },
    onSuccess: (keyValue) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys-list'] });
      toast({
        title: "API Key criada",
        description: `Chave criada: ${keyValue}`,
      });
      setIsApiKeyDialogOpen(false);
      setNewApiKeyName('');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar API Key.",
        variant: "destructive",
      });
      console.error('Erro ao criar API Key:', error);
    }
  });

  // Revogar API Key
  const revokeApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys-list'] });
      toast({
        title: "API Key revogada",
        description: "A API Key foi revogada com sucesso.",
      });
    }
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = formData[key] !== undefined ? formData[key] : getSettingValue(key);
    updateSetting({ key, value });
  };

  const toggleSensitive = (key: string) => {
    setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSettingField = (setting: any) => {
    const currentValue = formData[setting.key] !== undefined ? formData[setting.key] : getSettingValue(setting.key);
    const isVisible = showSensitive[setting.key];

    return (
      <div key={setting.key} className="space-y-2">
        <Label htmlFor={setting.key}>{setting.description}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={setting.key}
              type={setting.is_sensitive && !isVisible ? 'password' : 'text'}
              value={currentValue}
              onChange={(e) => handleInputChange(setting.key, e.target.value)}
              placeholder={setting.is_sensitive ? '••••••••••••' : ''}
            />
            {setting.is_sensitive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => toggleSensitive(setting.key)}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <Button
            onClick={() => handleSave(setting.key)}
            disabled={isUpdating}
            size="sm"
          >
            Salvar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configurações de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>
            Configurações técnicas e administrativas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sistemaSettings.map(renderSettingField)}
        </CardContent>
      </Card>

      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações SMTP
          </CardTitle>
          <CardDescription>
            Configure o servidor SMTP para envio de emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSettings.map(renderSettingField)}
        </CardContent>
      </Card>

      {/* Gerenciamento de API Keys */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Gerencie as chaves de API para integração com o sistema
              </CardDescription>
            </div>
            <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key-name">Nome da API Key</Label>
                    <Input
                      id="api-key-name"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="Ex: Integração WhatsApp"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsApiKeyDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => createApiKeyMutation.mutate(newApiKeyName)}
                      disabled={!newApiKeyName || createApiKeyMutation.isPending}
                    >
                      Criar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.nome}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {key.key_value.substring(0, 20)}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.ativo ? 'default' : 'destructive'}>
                      {key.ativo ? 'Ativo' : 'Revogado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(key.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {key.ativo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeApiKeyMutation.mutate(key.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Logs do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Logs Recentes do Sistema
          </CardTitle>
          <CardDescription>
            Últimas execuções de agentes IA e atividades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.input_recebido}
                  </TableCell>
                  <TableCell>
                    {log.tempo_execucao ? `${log.tempo_execucao}ms` : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SistemaSection;
