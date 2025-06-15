
import React, { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useToast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { toast } = useToast();
  const { leads, loading, error, updateLead } = useLeads();

  console.log('🔄 PipelineJuridico - Estado atual:', { 
    leadsCount: leads?.length || 0, 
    loading, 
    error,
    hasLeads: !!leads 
  });

  // Configuração das etapas do pipeline
  const stages = [
    { id: 'novo_lead', title: 'Novos Leads', color: 'bg-blue-100 border-blue-300' },
    { id: 'em_qualificacao', title: 'Em Qualificação', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'proposta_enviada', title: 'Proposta Enviada', color: 'bg-purple-100 border-purple-300' },
    { id: 'contrato_assinado', title: 'Contrato Assinado', color: 'bg-green-100 border-green-300' },
    { id: 'em_atendimento', title: 'Em Atendimento', color: 'bg-indigo-100 border-indigo-300' },
    { id: 'lead_perdido', title: 'Leads Perdidos', color: 'bg-red-100 border-red-300' }
  ];

  // Filtrar leads
  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesArea = filterArea === '' || lead.area_juridica === filterArea;
    const matchesResponsavel = filterResponsavel === '' || lead.responsavel === filterResponsavel;
    
    return matchesSearch && matchesArea && matchesResponsavel;
  }) || [];

  // Agrupar leads por status
  const groupedLeads = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter(lead => lead.status === stage.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Função de drag and drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    console.log('🎯 PipelineJuridico - Atualizando status do lead:', draggableId, 'para:', destination.droppableId);

    const success = await updateLead(draggableId, { status: destination.droppableId });
    
    if (success) {
      toast({
        title: "Lead atualizado",
        description: "Status do lead foi atualizado com sucesso.",
      });
    }
  };

  // Obter áreas jurídicas únicas para filtro
  const areasJuridicas = [...new Set(leads?.map(lead => lead.area_juridica).filter(Boolean) || [])];
  const responsaveis = [...new Set(leads?.map(lead => lead.responsavel).filter(Boolean) || [])];

  // Estado de loading
  if (loading) {
    console.log('🔄 PipelineJuridico - Exibindo loading...');
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Jurídico</h1>
            <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
          </div>
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Novo Lead</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map(stage => (
            <div key={stage.id} className={`rounded-lg border-2 ${stage.color} min-h-96 p-4`}>
              <div className="mb-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    console.log('❌ PipelineJuridico - Exibindo erro:', error);
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Jurídico</h1>
            <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
          </div>
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Novo Lead</span>
          </button>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar pipeline</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado sem dados
  if (!leads || leads.length === 0) {
    console.log('📭 PipelineJuridico - Nenhum lead encontrado');
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Jurídico</h1>
            <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
          </div>
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Novo Lead</span>
          </button>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead cadastrado ainda</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro lead para visualizar o pipeline.</p>
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
              Criar primeiro lead
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ PipelineJuridico - Renderizando interface principal com', leads.length, 'leads');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Jurídico</h1>
          <p className="text-gray-600">Gestão visual do funil de vendas jurídico</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="h-4 w-4" />
          <span>Novo Lead</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
      </div>

      {/* Pipeline Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
          {stages.map(stage => (
            <div key={stage.id} className={`rounded-lg border-2 ${stage.color} min-h-96`}>
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{stage.title}</h3>
                <span className="text-sm text-gray-500">
                  {groupedLeads[stage.id]?.length || 0} leads
                </span>
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 space-y-3 min-h-80 ${snapshot.isDraggingOver ? 'bg-opacity-50' : ''}`}
                  >
                    {groupedLeads[stage.id]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 text-sm">{lead.nome_completo}</h4>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p><span className="font-medium">Área:</span> {lead.area_juridica}</p>
                                <p><span className="font-medium">Origem:</span> {lead.origem}</p>
                                <p><span className="font-medium">Valor:</span> R$ {lead.valor_causa?.toLocaleString('pt-BR')}</p>
                                <p><span className="font-medium">Responsável:</span> {lead.responsavel}</p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default PipelineJuridico;
