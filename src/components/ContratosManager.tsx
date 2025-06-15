
import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, FileSignature, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContratos } from '@/hooks/useContratos';

const ContratosManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { contratos, loading, error, isEmpty, fetchContratos } = useContratos();

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = contrato.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = filterStatus === '' || contrato.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      rascunho: 'bg-gray-100 text-gray-800',
      enviado: 'bg-blue-100 text-blue-800',
      assinado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      rascunho: 'Rascunho',
      enviado: 'Enviado',
      assinado: 'Assinado',
      cancelado: 'Cancelado'
    };
    return labels[status] || status;
  };

  const handleRetry = () => {
    console.log('🔄 Tentando recarregar contratos...');
    fetchContratos();
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Gestão de Contratos</CardTitle>
                <p className="text-gray-600">Gerencie contratos e assinaturas digitais</p>
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
                <CardTitle className="text-2xl">Gestão de Contratos</CardTitle>
                <p className="text-gray-600">Gerencie contratos e assinaturas digitais</p>
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar contratos</h3>
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
                <CardTitle className="text-2xl">Gestão de Contratos</CardTitle>
                <p className="text-gray-600">Gerencie contratos e assinaturas digitais</p>
              </div>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-8">
            <div className="text-center">
              <FileSignature className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Nenhum contrato cadastrado</h3>
              <p className="text-blue-700 mb-6">Comece criando seu primeiro contrato para gerenciar assinaturas digitais.</p>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro contrato
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
              <CardTitle className="text-2xl">Gestão de Contratos</CardTitle>
              <p className="text-gray-600">
                Gerencie contratos e assinaturas digitais • {contratos.length} contratos no total
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
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
                placeholder="Buscar por nome do cliente..."
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
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Enviado</option>
              <option value="assinado">Assinado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contratos */}
      <div className="grid gap-4">
        {filteredContratos.map((contrato) => (
          <Card key={contrato.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contrato.nome_cliente}
                    </h3>
                    <Badge className={getStatusColor(contrato.status)}>
                      {getStatusLabel(contrato.status)}
                    </Badge>
                    {contrato.status_assinatura && (
                      <Badge variant="outline">
                        {contrato.status_assinatura}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Área Jurídica:</span> {contrato.area_juridica}
                    </div>
                    <div>
                      <span className="font-medium">Responsável:</span> {contrato.responsavel}
                    </div>
                    <div>
                      <span className="font-medium">Valor da Causa:</span> R$ {Number(contrato.valor_causa).toLocaleString('pt-BR')}
                    </div>
                    {contrato.data_envio && (
                      <div>
                        <span className="font-medium">Data de Envio:</span> {new Date(contrato.data_envio).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {contrato.data_assinatura && (
                      <div>
                        <span className="font-medium">Data de Assinatura:</span> {new Date(contrato.data_assinatura).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {contrato.observacoes && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Observações:</span> {contrato.observacoes}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Criado em: {new Date(contrato.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {contrato.status === 'rascunho' && (
                    <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  {contrato.link_assinatura_zapsign && (
                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                      <FileSignature className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContratos.length === 0 && searchTerm && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-yellow-700">
                Não foram encontrados contratos com o termo "{searchTerm}". Tente ajustar sua busca.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContratosManager;
