
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, AlertCircle, RefreshCw, Layers, User } from 'lucide-react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { useLeads, type Lead } from '@/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import NovoLeadForm from '@/components/forms/NovoLeadForm';
import PipelineColumn from './PipelineColumn';

const PipelineJuridico = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterResponsavel, setFilterResponsavel] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const { toast } = useToast();

  const { leads, loading, error, isEmpty, updateLead, fetchLeads } = useLeads();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const stages = [
    { id: 'novo_lead', title: 'Captação', color: 'primary' },
    { id: 'em_qualificacao', title: 'Qualificação', color: 'amber' },
    { id: 'proposta_enviada', title: 'Proposta', color: 'indigo' },
    { id: 'contrato_assinado', title: 'Contrato', color: 'emerald' },
    { id: 'em_atendimento', title: 'Execução', color: 'blue' },
    { id: 'lead_perdido', title: 'Arquivados', color: 'rose' }
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

    const success = await updateLead(draggableId, { status: destination.droppableId });

    if (success) {
      toast({
        title: "Status Atualizado",
        description: "O lead foi movido com sucesso no pipeline.",
      });
    }
  };

  const handleRetry = () => fetchLeads();
  const handleFormSuccess = () => {
    setShowFormModal(false);
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <Skeleton className="h-12 w-64 bg-white/5" />
            <Skeleton className="h-4 w-96 bg-white/5" />
          </div>
          <Skeleton className="h-12 w-40 bg-primary/20" />
        </div>
        <div className="grid grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[600px] rounded-3xl bg-white/5" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-10 selection:bg-primary/30">
      {/* Header Section */}
      <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 fade-in">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-6xl font-bold premium-gradient-text" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Pipeline Jurídico
            </h1>
          </div>
          <p className="text-white/40 text-lg ml-12">
            Gestão estratégica de oportunidades — <span className="text-primary font-bold">{leads.length} leads</span> ativos no ecossistema.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={handleRetry}
            variant="ghost"
            className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl px-6 transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowFormModal(true)}
            className="bg-primary hover:bg-primary/80 text-black font-black px-8 py-6 rounded-xl shadow-[0_10px_30px_rgba(251,191,36,0.2)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" strokeWidth={3} />
            NOVO LEAD
          </Button>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="glass-premium p-6 rounded-3xl flex flex-col lg:flex-row gap-6 items-center fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou detalhes do caso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all focus:bg-white/[0.08]"
          />
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="w-full lg:w-64 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white/70 appearance-none cursor-pointer hover:bg-white/[0.08] transition-all focus:outline-none focus:border-primary/50"
            >
              <option value="" className="bg-[#0a0a0a]">Todas as Áreas</option>
              {areasJuridicas.map(area => (
                <option key={area} value={area} className="bg-[#0a0a0a]">{area}</option>
              ))}
            </select>
            <Filter className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
          </div>

          <div className="relative group flex-1 lg:flex-none">
            <select
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="w-full lg:w-64 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white/70 appearance-none cursor-pointer hover:bg-white/[0.08] transition-all focus:outline-none focus:border-primary/50"
            >
              <option value="" className="bg-[#0a0a0a]">Responsáveis</option>
              {responsaveis.map(resp => (
                <option key={resp} value={resp} className="bg-[#0a0a0a]">{resp}</option>
              ))}
            </select>
            <User className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Kanban Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 min-h-[800px] fade-in" style={{ animationDelay: '0.2s' }}>
          {stages.map((stage, stageIndex) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              leads={groupedLeads[stage.id] || []}
              stageIndex={stageIndex}
            />
          ))}
        </main>
      </DragDropContext>

      <NovoLeadForm
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default PipelineJuridico;
