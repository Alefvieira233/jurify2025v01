
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface StatsAgente {
  agente_id: string;
  agente_nome: string;
  total_leads_mes: number;
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
  const queryClient = useQueryClient();

  console.log('🤖 AgentesIAManager - Componente montado');

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

  // Buscar agentes com tratamento de erro melhorado
  const { data: agentes, isLoading: agentesLoading, error: agentesError, isError: agentesIsError } = useQuery({
    queryKey: ['agentes_ia'],
    queryFn: async () => {
      console.log('📡 AgentesIAManager - Iniciando busca de agentes...');
      
      try {
        const { data, error } = await supabase
          .from('agentes_ia')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ AgentesIAManager - Erro na consulta de agentes:', error);
          throw error;
        }
        
        const transformedData = (data || []).map(agente => ({
          ...agente,
          parametros_avancados: agente.parametros_avancados || {
            temperatura: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0
          }
        }));
        
        console.log('✅ AgentesIAManager - Agentes carregados:', transformedData.length);
        return transformedData as AgenteIA[];
      } catch (err) {
        console.error('❌ AgentesIAManager - Erro no fetch de agentes:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Buscar estatísticas com tratamento de erro
  const { data: statsAgentes } = useQuery({
    queryKey: ['stats_agentes_leads'],
    queryFn: async () => {
      console.log('📊 AgentesIAManager - Buscando estatísticas...');
      
      try {
        const { data, error } = await supabase
          .from('stats_agentes_leads')
          .select('*');

        if (error) {
          console.error('⚠️ AgentesIAManager - Erro nas estatísticas (não crítico):', error);
          return [];
        }
        
        console.log('✅ AgentesIAManager - Estatísticas carregadas:', data?.length || 0);
        return data as StatsAgente[] || [];
      } catch (err) {
        console.error('⚠️ AgentesIAManager - Erro no fetch de estatísticas:', err);
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Exibir erro no toast se houver
  useEffect(() => {
    if (agentesIsError && agentesError) {
      console.error('❌ AgentesIAManager - Erro detectado:', agentesError);
      toast({
        title: "Erro ao carregar agentes IA",
        description: "Não foi possível carregar os dados dos agentes. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [agentesIsError, agentesError, toast]);

  // Mutação para alternar status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: string }) => {
      console.log('🔄 AgentesIAManager - Alterando status do agente:', id, 'para:', novoStatus);
      
      const { error } = await supabase
        .from('agentes_ia')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) {
        console.error('❌ AgentesIAManager - Erro ao alterar status:', error);
        throw error;
      }
      
      console.log('✅ AgentesIAManager - Status alterado com sucesso');
    },
    onSuccess: (_, { novoStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['agentes_ia'] });
      toast({
        title: "Status Atualizado",
        description: `Agente ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
      });
    },
    onError: (error) => {
      console.error('❌ AgentesIAManager - Erro na mutação de status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do agente",
        variant: "destructive",
      });
    }
  });

  const toggleStatus = (agente: AgenteIA) => {
    const novoStatus = agente.status === 'ativo' ? 'inativo' : 'ativo';
    toggleStatusMutation.mutate({ id: agente.id, novoStatus });
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

  const getLeadsCount = (agenteId: string) => {
    const stats = statsAgentes?.find(s => s.agente_id === agenteId);
    return stats?.total_leads_mes || 0;
  };

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
    queryClient.invalidateQueries({ queryKey: ['agentes_ia'] });
  };

  // Estado de loading
  if (agentesLoading) {
    console.log('🔄 AgentesIAManager - Exibindo loading...');
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando agentes IA...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (agentesIsError) {
    console.log('❌ AgentesIAManager - Exibindo erro...');
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar agentes IA</h3>
            <p className="text-gray-600 mb-4">Não foi possível carregar os dados dos agentes.</p>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['agentes_ia'] })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado sem dados
  if (!agentes || agentes.length === 0) {
    console.log('🤖 AgentesIAManager - Nenhum agente encontrado');
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

        {/* Modal de novo agente */}
        {showNovoAgente && (
          <NovoAgenteForm
            agente={selectedAgente}
            onClose={handleCloseModal}
          />
        )}
      </div>
    );
  }

  console.log('✅ AgentesIAManager - Renderizando interface principal com', agentes.length, 'agentes');

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
                  <p className="text-2xl font-bold text-blue-600">
                    {statsAgentes?.reduce((acc, stats) => acc + stats.total_leads_mes, 0) || 0}
                  </p>
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
                          <span className="text-lg font-semibold text-blue-600">
                            {getLeadsCount(agente.id)}
                          </span>
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
                            disabled={toggleStatusMutation.isPending}
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
