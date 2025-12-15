
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads, type Lead } from '@/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import TimelineConversas from '@/features/timeline/TimelineConversas';
import NovoLeadForm from '@/components/forms/NovoLeadForm';
import EditarLeadForm from '@/components/forms/EditarLeadForm';

const LeadsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const { leads, loading, error, isEmpty, fetchLeads, deleteLead } = useLeads();

  // Debounce search term para evitar filtros excessivos
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.nome_completo?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false;
      const matchesStatus = filterStatus === '' || lead.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [leads, debouncedSearchTerm, filterStatus]);

  const getStatusColor = (status: string) => {
    const colors = {
      novo_lead: 'bg-blue-100 text-blue-800',
      em_qualificacao: 'bg-yellow-100 text-yellow-800',
      proposta_enviada: 'bg-purple-100 text-purple-800',
      contrato_assinado: 'bg-green-100 text-green-800',
      em_atendimento: 'bg-indigo-100 text-indigo-800',
      lead_perdido: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      novo_lead: 'Novo Lead',
      em_qualificacao: 'Em Qualificação',
      proposta_enviada: 'Proposta Enviada',
      contrato_assinado: 'Contrato Assinado',
      em_atendimento: 'Em Atendimento',
      lead_perdido: 'Lead Perdido'
    };
    return labels[status] || status;
  };

  const handleRetry = () => {
    console.log('🔄 Tentando recarregar leads...');
    fetchLeads();
  };

  const handleViewTimeline = (leadId: string, leadName: string) => {
    setSelectedLead(leadId);
    setShowTimeline(true);
  };

  const handleCloseTimeline = () => {
    setSelectedLead(null);
    setShowTimeline(false);
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    fetchLeads();
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
  };

  const handleEditSuccess = () => {
    setEditingLead(null);
    fetchLeads();
  };

  const handleDeleteLead = async (id: string, nome: string) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o lead "${nome}"?\n\nEsta ação não pode ser desfeita.`
    );

    if (confirmacao) {
      await deleteLead(id);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Gestão de Leads</CardTitle>
                <p className="text-gray-600">Gerencie seus leads e oportunidades</p>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-24" />
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
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Gestão de Leads</CardTitle>
                <p className="text-gray-600">Gerencie seus leads e oportunidades</p>
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
              <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar leads</h3>
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
                <CardTitle className="text-2xl">Gestão de Leads</CardTitle>
                <p className="text-gray-600">Gerencie seus leads e oportunidades</p>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Nenhum lead cadastrado</h3>
              <p className="text-blue-700 mb-6">Comece criando seu primeiro lead para começar a gerenciar suas oportunidades de negócio.</p>
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
              <CardTitle className="text-2xl">Gestão de Leads</CardTitle>
              <p className="text-gray-600">
                Gerencie seus leads e oportunidades • {leads.length} leads no total
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                aria-label="Atualizar lista de leads"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => setShowFormModal(true)}
                aria-label="Criar novo lead"
              >
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
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome do lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Todos os Status</option>
              <option value="novo_lead">Novo Lead</option>
              <option value="em_qualificacao">Em Qualificação</option>
              <option value="proposta_enviada">Proposta Enviada</option>
              <option value="contrato_assinado">Contrato Assinado</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="lead_perdido">Lead Perdido</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {lead.nome_completo}
                    </h3>
                    <Badge className={getStatusColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Telefone:</span> {lead.telefone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {lead.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Área Jurídica:</span> {lead.area_juridica}
                    </div>
                    <div>
                      <span className="font-medium">Responsável:</span> {lead.responsavel}
                    </div>
                    <div>
                      <span className="font-medium">Origem:</span> {lead.origem}
                    </div>
                    {lead.valor_causa && (
                      <div>
                        <span className="font-medium">Valor da Causa:</span> R$ {Number(lead.valor_causa).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {lead.observacoes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Observações:</span> {lead.observacoes}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Criado em: {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTimeline(lead.id, lead.nome_completo)}
                    aria-label="Ver timeline de conversas"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" aria-label="Visualizar detalhes do lead">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLead(lead)}
                    aria-label="Editar lead"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLead(lead.id, lead.nome_completo)}
                    className="text-red-600 hover:text-red-700"
                    aria-label="Excluir lead"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && debouncedSearchTerm && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-yellow-700">
                Não foram encontrados leads com o termo "{debouncedSearchTerm}". Tente ajustar sua busca.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Timeline de Conversas */}
      {showTimeline && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                Timeline de Conversas - {leads.find(l => l.id === selectedLead)?.nome_completo}
              </h2>
              <Button onClick={handleCloseTimeline} variant="outline" size="sm" aria-label="Fechar timeline">
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <TimelineConversas leadId={selectedLead} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lead */}
      <NovoLeadForm
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={handleFormSuccess}
      />

      {/* Modal Editar Lead */}
      {editingLead && (
        <EditarLeadForm
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default LeadsPanel;
