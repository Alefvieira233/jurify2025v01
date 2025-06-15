
import React, { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Edit, 
  Power, 
  PowerOff, 
  Eye,
  Users,
  MessageSquare,
  Settings,
  Filter,
  Search,
  Code,
  BarChart,
  Zap,
  Key,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentesIA } from '@/hooks/useAgentesIA';
import NovoAgenteForm from './NovoAgenteForm';
import DetalhesAgente from './DetalhesAgente';
import ApiKeysManager from './ApiKeysManager';
import LogsMonitoramento from './LogsMonitoramento';

interface AgenteIA {
  id: string;
  nome: string;
  area_juridica: string;
  objetivo: string;
  script_saudacao: string;
  perguntas_qualificacao: string[];
  keywords_acao: string[];
  delay_resposta: number;
  status: string;
  created_at: string;
  updated_at: string;
  descricao_funcao: string;
  prompt_base: string;
  tipo_agente: string;
  parametros_avancados: any;
}

const AgentesIAManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [areaFilter, setAreaFilter] = useState<string>('todas');
  const [showNovoAgente, setShowNovoAgente] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<AgenteIA | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const { toast } = useToast();
  
  const { agentes, loading, error, updateAgente } = useAgentesIA();

  const areas = [
    'Direito Trabalhista',
    'Direito de Família', 
    'Direito Civil',
    'Direito Previdenciário',
    'Direito Criminal',
    'Direito Empresarial'
  ];

  const tiposAgente = [
    { value: 'chat_interno', label: 'Chat Interno', icon: Bot },
    { value: 'analise_dados', label: 'Análise de Dados', icon: BarChart },
    { value: 'api_externa', label: 'API Externa', icon: Zap }
  ];

  const toggleStatus = async (agente: AgenteIA) => {
    const novoStatus = agente.status === 'ativo' ? 'inativo' : 'ativo';
    const success = await updateAgente(agente.id, { status: novoStatus });
    
    if (success) {
      toast({
        title: "Status Atualizado",
        description: `Agente ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
      });
    }
  };

  const filteredAgentes = agentes?.filter(agente => {
    const matchesSearch = agente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agente.area_juridica.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agente.descricao_funcao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || agente.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || agente.tipo_agente === tipoFilter;
    const matchesArea = areaFilter === 'todas' || agente.area_juridica === areaFilter;
    
    return matchesSearch && matchesStatus && matchesTipo && matchesArea;
  }) || [];

  const getTipoAgenteInfo = (tipo: string) => {
    return tiposAgente.find(t => t.value === tipo) || tiposAgente[0];
  };

  const handleEdit = (agente: AgenteIA) => {
    setSelectedAgente(agente);
    setShowNovoAgente(true);
  };

  const handleViewDetails = (agente: AgenteIA) => {
    setSelectedAgente(agente);
    setShowDetalhes(true);
  };

  const handleCloseModal = () => {
    setShowNovoAgente(false);
    setShowDetalhes(false);
    setSelectedAgente(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agentes IA Jurídicos</h1>
            <p className="text-gray-600">Configure e monitore agentes IA especializados por área jurídica</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </div>

        <Tabs defaultValue="agentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agentes">Agentes IA</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="logs">Monitoramento</TabsTrigger>
          </TabsList>

          <TabsContent value="agentes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agentes IA Jurídicos</h1>
            <p className="text-gray-600">Configure e monitore agentes IA especializados por área jurídica</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar agentes IA</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!agentes || agentes.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agentes IA Jurídicos</h1>
            <p className="text-gray-600">Configure e monitore agentes IA especializados por área jurídica</p>
          </div>
          <Button
            onClick={() => setShowNovoAgente(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Bot className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agente IA cadastrado ainda</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro agente IA especializado.</p>
            <Button
              onClick={() => setShowNovoAgente(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Criar primeiro agente
            </Button>
          </div>
        </div>

        {showNovoAgente && (
          <NovoAgenteForm
            agente={selectedAgente}
            onClose={handleCloseModal}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes IA Jurídicos</h1>
          <p className="text-gray-600">Configure e monitore agentes IA especializados por área jurídica</p>
        </div>
        <Button
          onClick={() => setShowNovoAgente(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="agentes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agentes" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Agentes IA
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agentes" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Agentes</p>
                  <p className="text-2xl font-bold text-gray-900">{agentes.length}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agentes Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {agentes.filter(a => a.status === 'ativo').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leads Capturados</p>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Última Execução</p>
                  <p className="text-sm font-bold text-gray-900">Há poucos minutos</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar agentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {tiposAgente.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Área Jurídica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Áreas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Agentes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Área Jurídica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leads (mês)</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgentes.map((agente) => {
                  const tipoInfo = getTipoAgenteInfo(agente.tipo_agente);
                  const TipoIcon = tipoInfo.icon;
                  
                  return (
                    <TableRow key={agente.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${agente.status === 'ativo' ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Bot className={`h-4 w-4 ${agente.status === 'ativo' ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{agente.nome}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {agente.descricao_funcao}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TipoIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{tipoInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {agente.area_juridica}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={agente.status === 'ativo' ? 'default' : 'secondary'}
                          className={agente.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                        >
                          {agente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="text-lg font-semibold text-blue-600">0</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(agente.updated_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(agente)}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(agente)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(agente)}
                            className={agente.status === 'ativo' ? 'hover:bg-red-50' : 'hover:bg-green-50'}
                          >
                            {agente.status === 'ativo' ? (
                              <PowerOff className="h-4 w-4 text-red-600" />
                            ) : (
                              <Power className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="logs">
          <LogsMonitoramento />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {showNovoAgente && (
        <NovoAgenteForm
          agente={selectedAgente}
          onClose={handleCloseModal}
        />
      )}

      {showDetalhes && selectedAgente && (
        <DetalhesAgente
          agente={selectedAgente}
          onClose={handleCloseModal}
          onEdit={() => {
            setShowDetalhes(false);
            setShowNovoAgente(true);
          }}
        />
      )}
    </div>
  );
};

export default AgentesIAManager;
