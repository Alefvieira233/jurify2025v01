
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Calendar, Eye, Edit, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { NovoAgendamentoForm } from './NovoAgendamentoForm';
import { DetalhesAgendamento } from './DetalhesAgendamento';
import { toast } from 'sonner';

interface Agendamento {
  id: string;
  lead_id: string;
  area_juridica: string;
  data_hora: string;
  responsavel: string;
  status: string;
  observacoes?: string;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
  lead?: {
    nome_completo: string;
    telefone?: string;
    email?: string;
  };
}

const AgendamentosManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [areaFilter, setAreaFilter] = useState('todas');
  const [responsavelFilter, setResponsavelFilter] = useState('todos');
  const [dataFilter, setDataFilter] = useState('todas');
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch agendamentos com dados do lead
  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          lead:leads(nome_completo, telefone, email)
        `)
        .order('data_hora', { ascending: true });
      
      if (error) throw error;
      return data as Agendamento[];
    }
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Status do agendamento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do agendamento');
    }
  });

  // Filtrar agendamentos
  const agendamentosFiltrados = agendamentos.filter(agendamento => {
    const nomeCliente = agendamento.lead?.nome_completo || '';
    const matchesSearch = nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.area_juridica.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || agendamento.status === statusFilter;
    const matchesArea = areaFilter === 'todas' || agendamento.area_juridica === areaFilter;
    const matchesResponsavel = responsavelFilter === 'todos' || agendamento.responsavel === responsavelFilter;
    
    let matchesData = true;
    if (dataFilter !== 'todas') {
      const hoje = new Date();
      const dataAgendamento = new Date(agendamento.data_hora);
      
      switch (dataFilter) {
        case 'hoje':
          matchesData = dataAgendamento.toDateString() === hoje.toDateString();
          break;
        case 'semana':
          const proximaSemana = new Date();
          proximaSemana.setDate(hoje.getDate() + 7);
          matchesData = dataAgendamento >= hoje && dataAgendamento <= proximaSemana;
          break;
        case 'mes':
          matchesData = dataAgendamento.getMonth() === hoje.getMonth() && 
                       dataAgendamento.getFullYear() === hoje.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesArea && matchesResponsavel && matchesData;
  });

  // Obter valores únicos para filtros
  const areasUnicas = [...new Set(agendamentos.map(a => a.area_juridica))];
  const responsaveisUnicos = [...new Set(agendamentos.map(a => a.responsavel))];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      agendado: { label: 'Agendado', className: 'bg-blue-100 text-blue-800', icon: Clock },
      confirmado: { label: 'Confirmado', className: 'bg-yellow-100 text-yellow-800', icon: Check },
      realizado: { label: 'Realizado', className: 'bg-green-100 text-green-800', icon: Check },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: X }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.agendado;
    const Icon = config.icon;
    
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleUpdateStatus = (agendamento: Agendamento, novoStatus: string) => {
    updateStatusMutation.mutate({
      id: agendamento.id,
      status: novoStatus
    });
  };

  const handleEnviarGoogleCalendar = (agendamento: Agendamento) => {
    toast.info('Integração com Google Calendar será implementada em breve');
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos de Reuniões</h1>
          <p className="text-gray-600">Gerencie reuniões jurídicas do escritório</p>
        </div>
        <Dialog open={isNovoAgendamentoOpen} onOpenChange={setIsNovoAgendamentoOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nova Reunião</DialogTitle>
            </DialogHeader>
            <NovoAgendamentoForm onClose={() => setIsNovoAgendamentoOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-white rounded-lg border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, área ou responsável..."
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
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="realizado">Realizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Área Jurídica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Áreas</SelectItem>
            {areasUnicas.map(area => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Responsáveis</SelectItem>
            {responsaveisUnicos.map(responsavel => (
              <SelectItem key={responsavel} value={responsavel}>{responsavel}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dataFilter} onValueChange={setDataFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Datas</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Próxima Semana</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('todos');
            setAreaFilter('todas');
            setResponsavelFilter('todos');
            setDataFilter('todas');
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Tabela de Agendamentos */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Área Jurídica</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Carregando agendamentos...
                </TableCell>
              </TableRow>
            ) : agendamentosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum agendamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              agendamentosFiltrados.map((agendamento) => {
                const dateTime = formatDateTime(agendamento.data_hora);
                return (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {agendamento.lead?.nome_completo || 'Cliente não encontrado'}
                    </TableCell>
                    <TableCell>{agendamento.area_juridica}</TableCell>
                    <TableCell>{dateTime.date}</TableCell>
                    <TableCell>{dateTime.time}</TableCell>
                    <TableCell>{agendamento.responsavel}</TableCell>
                    <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAgendamentoSelecionado(agendamento);
                            setIsDetalhesOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        {agendamento.status === 'agendado' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(agendamento, 'confirmado')}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {agendamento.status === 'confirmado' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(agendamento, 'realizado')}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {(agendamento.status === 'agendado' || agendamento.status === 'confirmado') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(agendamento, 'cancelado')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnviarGoogleCalendar(agendamento)}
                        >
                          <Calendar className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Detalhes do Agendamento */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {agendamentoSelecionado && (
            <DetalhesAgendamento 
              agendamento={agendamentoSelecionado} 
              onClose={() => setIsDetalhesOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendamentosManager;
