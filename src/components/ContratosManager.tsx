
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, Send, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { NovoContratoForm } from './NovoContratoForm';
import { DetalhesContrato } from './DetalhesContrato';
import { toast } from 'sonner';

interface Contrato {
  id: string;
  nome_cliente: string;
  area_juridica: string;
  valor_causa: number;
  status: string;
  responsavel: string;
  created_at: string;
  data_envio?: string;
  data_assinatura?: string;
  lead_id?: string;
  texto_contrato: string;
  clausulas_customizadas?: string;
  observacoes?: string;
  updated_at: string;
}

const ContratosManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [areaFilter, setAreaFilter] = useState('todas');
  const [responsavelFilter, setResponsavelFilter] = useState('todos');
  const [isNovoContratoOpen, setIsNovoContratoOpen] = useState(false);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch contratos
  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contrato[];
    }
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, data_envio }: { id: string; status: string; data_envio?: string }) => {
      const updateData: any = { status };
      if (data_envio) updateData.data_envio = data_envio;
      
      const { error } = await supabase
        .from('contratos')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Status do contrato atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do contrato');
    }
  });

  // Filtrar contratos
  const contratosFiltrados = contratos.filter(contrato => {
    const matchesSearch = contrato.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.area_juridica.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || contrato.status === statusFilter;
    const matchesArea = areaFilter === 'todas' || contrato.area_juridica === areaFilter;
    const matchesResponsavel = responsavelFilter === 'todos' || contrato.responsavel === responsavelFilter;
    
    return matchesSearch && matchesStatus && matchesArea && matchesResponsavel;
  });

  // Obter valores únicos para filtros
  const areasUnicas = [...new Set(contratos.map(c => c.area_juridica))];
  const responsaveisUnicos = [...new Set(contratos.map(c => c.responsavel))];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
      enviado: { label: 'Enviado', className: 'bg-blue-100 text-blue-800' },
      assinado: { label: 'Assinado', className: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.rascunho;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleEnviarAssinatura = (contrato: Contrato) => {
    updateStatusMutation.mutate({
      id: contrato.id,
      status: 'enviado',
      data_envio: new Date().toISOString()
    });
  };

  const handleGerarPDF = (contrato: Contrato) => {
    toast.info('Funcionalidade de PDF será implementada em breve');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h1>
          <p className="text-gray-600">Gerencie contratos jurídicos do escritório</p>
        </div>
        <Dialog open={isNovoContratoOpen} onOpenChange={setIsNovoContratoOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Contrato</DialogTitle>
            </DialogHeader>
            <NovoContratoForm onClose={() => setIsNovoContratoOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente ou área..."
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
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="assinado">Assinado</SelectItem>
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

        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('todos');
            setAreaFilter('todas');
            setResponsavelFilter('todos');
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela de Contratos */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Área Jurídica</TableHead>
              <TableHead>Valor da Causa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Carregando contratos...
                </TableCell>
              </TableRow>
            ) : contratosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum contrato encontrado
                </TableCell>
              </TableRow>
            ) : (
              contratosFiltrados.map((contrato) => (
                <TableRow key={contrato.id}>
                  <TableCell className="font-medium">{contrato.nome_cliente}</TableCell>
                  <TableCell>{contrato.area_juridica}</TableCell>
                  <TableCell>{formatCurrency(contrato.valor_causa)}</TableCell>
                  <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                  <TableCell>{contrato.responsavel}</TableCell>
                  <TableCell>{formatDate(contrato.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setContratoSelecionado(contrato);
                          setIsDetalhesOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGerarPDF(contrato)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {contrato.status === 'rascunho' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnviarAssinatura(contrato)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Detalhes do Contrato */}
      <Dialog open={isDetalhesOpen} onOpenChange={setIsDetalhesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {contratoSelecionado && (
            <DetalhesContrato 
              contrato={contratoSelecionado} 
              onClose={() => setIsDetalhesOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContratosManager;
