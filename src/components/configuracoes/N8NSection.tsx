
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useN8NWorkflows, N8NWorkflow, CreateN8NWorkflowData } from '@/hooks/useN8NWorkflows';
import { Plus, Settings, Trash2, TestTube, Zap, Eye, EyeOff } from 'lucide-react';

const N8NSection = () => {
  const { workflows, loading, createWorkflow, updateWorkflow, toggleWorkflow, deleteWorkflow, testWorkflow } = useN8NWorkflows();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<N8NWorkflow | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState<CreateN8NWorkflowData>({
    nome: '',
    webhook_url: '',
    api_key: '',
    tipo_workflow: 'agente_ia',
    descricao: '',
    ativo: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWorkflow) {
      const success = await updateWorkflow(editingWorkflow.id, formData);
      if (success) {
        setEditingWorkflow(null);
        resetForm();
      }
    } else {
      const success = await createWorkflow(formData);
      if (success) {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      webhook_url: '',
      api_key: '',
      tipo_workflow: 'agente_ia',
      descricao: '',
      ativo: true,
    });
  };

  const handleEdit = (workflow: N8NWorkflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      nome: workflow.nome,
      webhook_url: workflow.webhook_url,
      api_key: workflow.api_key || '',
      tipo_workflow: workflow.tipo_workflow || 'agente_ia',
      descricao: workflow.descricao || '',
      ativo: workflow.ativo,
    });
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.length <= 8) return '*'.repeat(apiKey?.length || 0);
    return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Integrações N8N</h2>
          <p className="text-gray-600">Configure workflows N8N para automação de agentes IA</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingWorkflow ? 'Editar Workflow N8N' : 'Novo Workflow N8N'}
                </DialogTitle>
                <DialogDescription>
                  Configure um novo workflow N8N para automação de agentes IA.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="col-span-3"
                    placeholder="Ex: Workflow Agentes IA"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="webhook_url" className="text-right">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    className="col-span-3"
                    placeholder="https://primary-production-adcb.up.railway.app/webhook-test/..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">Tipo</Label>
                  <Select
                    value={formData.tipo_workflow}
                    onValueChange={(value) => setFormData({ ...formData, tipo_workflow: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agente_ia">Agente IA</SelectItem>
                      <SelectItem value="webhook">Webhook Genérico</SelectItem>
                      <SelectItem value="automation">Automação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="api_key" className="text-right">API Key (Opcional)</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    className="col-span-3"
                    placeholder="Token de autenticação (se necessário)"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="descricao" className="text-right mt-2">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="col-span-3"
                    placeholder="Descrição do workflow..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ativo" className="text-right">Ativo</Label>
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingWorkflow(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingWorkflow ? 'Atualizar' : 'Criar'} Workflow
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum workflow N8N configurado</h3>
              <p className="text-gray-500 text-center max-w-md">
                Configure seu primeiro workflow N8N para automação de agentes IA.
              </p>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">{workflow.nome}</CardTitle>
                    <Badge variant={workflow.ativo ? 'default' : 'secondary'}>
                      {workflow.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">{workflow.tipo_workflow}</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={workflow.ativo}
                      onCheckedChange={() => toggleWorkflow(workflow.id, workflow.ativo)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWorkflow(workflow.id)}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {workflow.descricao || 'Nenhuma descrição disponível'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Webhook URL</Label>
                    <p className="text-sm text-gray-900 mt-1 font-mono break-all">{workflow.webhook_url}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">API Key</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-900 font-mono">
                        {workflow.api_key ? (
                          showApiKeys[workflow.id] ? workflow.api_key : maskApiKey(workflow.api_key)
                        ) : (
                          'Não configurada'
                        )}
                      </p>
                      {workflow.api_key && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleApiKeyVisibility(workflow.id)}
                        >
                          {showApiKeys[workflow.id] ? 
                            <EyeOff className="h-4 w-4" /> : 
                            <Eye className="h-4 w-4" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para edição */}
      <Dialog open={!!editingWorkflow} onOpenChange={(open) => !open && setEditingWorkflow(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Workflow N8N</DialogTitle>
              <DialogDescription>
                Atualize as configurações do workflow N8N.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nome" className="text-right">Nome</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-webhook_url" className="text-right">Webhook URL</Label>
                <Input
                  id="edit-webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tipo" className="text-right">Tipo</Label>
                <Select
                  value={formData.tipo_workflow}
                  onValueChange={(value) => setFormData({ ...formData, tipo_workflow: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agente_ia">Agente IA</SelectItem>
                    <SelectItem value="webhook">Webhook Genérico</SelectItem>
                    <SelectItem value="automation">Automação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-api_key" className="text-right">API Key</Label>
                <Input
                  id="edit-api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-descricao" className="text-right mt-2">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ativo" className="text-right">Ativo</Label>
                <Switch
                  id="edit-ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingWorkflow(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Atualizar Workflow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default N8NSection;
