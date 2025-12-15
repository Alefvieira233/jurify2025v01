
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useToast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NovoLeadForm from '@/components/forms/NovoLeadForm';

interface Lead {
  id: string;
  nome_completo: string;
  telefone: string;
  email: string;
  area_juridica: string;
  origem: string;
  valor_causa: number;
  responsavel: string;
  status: string;
  created_at: string;
}

const PipelineJuridico = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterResponsavel, setFilterResponsavel] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const { toast } = useToast();

  const { leads, loading, error, isEmpty, updateLead, fetchLeads } = useLeads();

  // Debounce search term para melhor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const stages = [
    { id: 'novo_lead', title: 'Novos Leads', color: 'bg-blue-100 border-blue-300' },
    { id: 'em_qualificacao', title: 'Em Qualificação', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-purple-100 border-purple-300' },
    { id: 'contrato_assinado', title: 'Contrato Assinado', color: 'bg-green-100 border-green-300' },
    { id: 'em_atendimento', title: 'Em Atendimento', color: 'bg-indigo-100 border-indigo-300' },
    { id: 'lead_perdido', title: 'Leads Perdidos', color: 'bg-red-100 border-red-300' }
  ];

  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    return leads.filter(lead => {
      const matchesSearch = lead.nome_completo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false;
      const matchesArea = filterArea === '' || lead.area_juridica === filterArea;
      const matchesResponsavel = filterResponsavel === '' || lead.responsavel === filterResponsavel;

      return matchesSearch && matchesArea && matchesResponsavel;
    });
  }, [leads, debouncedSearchTerm, filterArea, filterResponsavel]);

  const groupedLeads = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = filteredLeads.filter(lead => lead.status === stage.id);
      return acc;
    }, {} as Record<string, Lead[]>);
  }, [filteredLeads, stages]);

  const areasJuridicas = useMemo(() => {
    return [...new Set(leads?.map(lead => lead.area_juridica).filter(Boolean) || [])];
  }, [leads]);

  const responsaveis = useMemo(() => {
    return [...new Set(leads?.map(lead => lead.responsavel).filter(Boolean) || [])];
  }, [leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    console.log(`🔄 Movendo lead ${draggableId} para ${destination.droppableId}`);
    
    const success = await updateLead(draggableId, { status: destination.droppableId });
    
    if (success) {
      toast({
        title: "Lead atualizado",
        description: "Status do lead foi atualizado com sucesso.",
      });
    }
  };

  const handleRetry = () => {
    console.log('🔄 Tentando recarregar pipeline...');
    fetchLeads();
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    fetchLeads();
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Pipeline Jurídico</CardTitle>
                <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
        </Card>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map(stage => (
            <Card key={stage.id} className={`${stage.color} min-h-96`}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Pipeline Jurídico</CardTitle>
                <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => setShowFormModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar pipeline</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleRetry}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Recarregar página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Pipeline Jurídico</CardTitle>
                <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
              </div>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => setShowFormModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-blue-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Pipeline vazio</h3>
              <p className="text-blue-700 mb-6">Nenhum lead cadastrado ainda. Comece criando seu primeiro lead para visualizar o pipeline.</p>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => setShowFormModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro lead
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Content
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Pipeline Jurídico</CardTitle>
              <p className="text-gray-600">
                Gestão visual do funil de vendas jurídico • {leads.length} leads no total
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                aria-label="Atualizar pipeline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600" aria-label="Adicionar novo lead ao pipeline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome do lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Todas as Áreas</option>
              {areasJuridicas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Todos os Responsáveis</option>
              {responsaveis.map(responsavel => (
                <option key={responsavel} value={responsavel}>{responsavel}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
          {stages.map(stage => (
            <Card key={stage.id} className={`${stage.color} min-h-96`}>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                <span className="text-sm text-gray-500">
                  {groupedLeads[stage.id]?.length || 0} leads
                </span>
              </CardHeader>
              
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-80 ${snapshot.isDraggingOver ? 'bg-opacity-50' : ''}`}
                  >
                    {groupedLeads[stage.id]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 rounded-lg border shadow-sm cursor-move hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {lead.nome_completo}
                              </h4>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div>📞 {lead.telefone || 'N/A'}</div>
                                <div>⚖️ {lead.area_juridica}</div>
                                <div>👤 {lead.responsavel}</div>
                                {lead.valor_causa && (
                                  <div>💰 R$ {Number(lead.valor_causa).toLocaleString('pt-BR')}</div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          ))}
        </div>
      </DragDropContext>

      {/* Modal Novo Lead */}
      <NovoLeadForm
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default PipelineJuridico;
