
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
  Search
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
import NovoAgenteForm from './NovoAgenteForm';
import DetalhesAgente from './DetalhesAgente';

interface AgenteIA {
  id: string;
  nome: string;
  area_juridica: string;
  objetivo: string;
  script_saudacao: string;
  perguntas_qualificacao: string[];
  keywords_acao: string[];
  delay_resposta: number;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

interface StatsAgente {
  agente_id: string;
  agente_nome: string;
  total_leads_mes: number;
}

const AgentesIAManager = () => {
  const [agentes, setAgentes] = useState<AgenteIA[]>([]);
  const [statsAgentes, setStatsAgentes] = useState<StatsAgente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [areaFilter, setAreaFilter] = useState<string>('todas');
  const [showNovoAgente, setShowNovoAgente] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState<AgenteIA | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const { toast } = useToast();

  const areas = [
    'Direito Trabalhista',
    'Direito de Família', 
    'Direito Civil',
    'Direito Previdenciário',
    'Direito Criminal',
    'Direito Empresarial'
  ];

  useEffect(() => {
    fetchAgentes();
    fetchStatsAgentes();
  }, []);

  const fetchAgentes = async () => {
    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgentes(data || []);
    } catch (error) {
      console.error('Erro ao buscar agentes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agentes IA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsAgentes = async () => {
    try {
      const { data, error } = await supabase
        .from('stats_agentes_leads')
        .select('*');

      if (error) throw error;
      setStatsAgentes(data || []);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const toggleStatus = async (agente: AgenteIA) => {
    try {
      const novoStatus = agente.status === 'ativo' ? 'inativo' : 'ativo';
      
      const { error } = await supabase
        .from('agentes_ia')
        .update({ status: novoStatus })
        .eq('id', agente.id);

      if (error) throw error;

      await fetchAgentes();
      toast({
        title: "Status Atualizado",
        description: `Agente ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do agente",
        variant: "destructive",
      });
    }
  };

  const filteredAgentes = agentes.filter(agente => {
    const matchesSearch = agente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agente.area_juridica.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || agente.status === statusFilter;
    const matchesArea = areaFilter === 'todas' || agente.area_juridica === areaFilter;
    
    return matchesSearch && matchesStatus && matchesArea;
  });

  const getLeadsCount = (agenteId: string) => {
    const stats = statsAgentes.find(s => s.agente_id === agenteId);
    return stats?.total_leads_mes || 0;
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
    fetchAgentes();
    fetchStatsAgentes();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Bot className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Carregando agentes IA...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Agentes IA Jurídicos</h1>
          <p className="text-gray-600">Configure SDRs virtuais especializados por área jurídica</p>
        </div>
        <Button
          onClick={() => setShowNovoAgente(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

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
            <Power className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leads do Mês</p>
              <p className="text-2xl font-bold text-amber-600">
                {statsAgentes.reduce((total, stats) => total + stats.total_leads_mes, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Áreas Cobertas</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(agentes.map(a => a.area_juridica)).size}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Área Jurídica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Áreas</SelectItem>
              {areas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Agente</TableHead>
              <TableHead>Área Jurídica</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Leads/Mês</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgentes.map((agente) => (
              <TableRow key={agente.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${agente.status === 'ativo' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Bot className={`h-4 w-4 ${agente.status === 'ativo' ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agente.nome}</p>
                      <p className="text-sm text-gray-500">
                        Delay: {agente.delay_resposta}s
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {agente.area_juridica}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 max-w-xs truncate">
                    {agente.objetivo}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{getLeadsCount(agente.id)}</span>
                  </div>
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
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(agente)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(agente)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(agente)}
                      className={agente.status === 'ativo' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {agente.status === 'ativo' ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredAgentes.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum agente encontrado</p>
          </div>
        )}
      </div>

      {/* Modals */}
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
