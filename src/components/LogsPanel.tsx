
import React, { useState, useEffect } from 'react';
import { Activity, Download, Trash, Search, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useActivityLogs, LogAtividade, FiltrosLog } from '@/hooks/useActivityLogs';
import { useToast } from '@/hooks/use-toast';

const LogsPanel = () => {
  const { logs, loading, totalCount, fetchLogs, clearOldLogs, exportLogs } = useActivityLogs();
  const [currentPage, setCurrentPage] = useState(1);
  const [filtros, setFiltros] = useState<FiltrosLog>({});
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    handleSearch();
  }, [currentPage, filtros]);

  const handleSearch = async () => {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const filtrosComBusca = {
      ...filtros,
      ...(searchTerm && { modulo: searchTerm })
    };
    await fetchLogs(ITEMS_PER_PAGE, offset, filtrosComBusca);
  };

  const handleFilterChange = (key: keyof FiltrosLog, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(1);
  };

  const handleClearOldLogs = async () => {
    const confirmed = window.confirm('Tem certeza que deseja remover logs antigos (90+ dias)?');
    if (confirmed) {
      await clearOldLogs(90);
    }
  };

  const handleExportLogs = async () => {
    await exportLogs(filtros);
  };

  const getActionBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'criacao': return 'bg-green-100 text-green-800';
      case 'edicao': return 'bg-blue-100 text-blue-800';
      case 'exclusao': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Logs de Atividade</CardTitle>
                <CardDescription>
                  Monitoramento completo das ações do sistema
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleExportLogs} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleClearOldLogs} variant="outline" size="sm">
                <Trash className="h-4 w-4 mr-2" />
                Limpar Antigos
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar por módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filtros.tipo_acao || ''}
              onChange={(e) => handleFilterChange('tipo_acao', e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todas as ações</option>
              <option value="criacao">Criação</option>
              <option value="edicao">Edição</option>
              <option value="exclusao">Exclusão</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="erro">Erro</option>
              <option value="outro">Outro</option>
            </select>

            <Input
              type="date"
              placeholder="Data início"
              value={filtros.data_inicio || ''}
              onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data fim"
              value={filtros.data_fim || ''}
              onChange={(e) => handleFilterChange('data_fim', e.target.value)}
            />

            <Button onClick={handleSearch} className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-blue-800">Total de Logs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.tipo_acao === 'criacao').length}
              </div>
              <div className="text-sm text-green-800">Criações</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.tipo_acao === 'edicao').length}
              </div>
              <div className="text-sm text-yellow-800">Edições</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.tipo_acao === 'erro').length}
              </div>
              <div className="text-sm text-red-800">Erros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getActionBadgeColor(log.tipo_acao)}>
                          {log.tipo_acao.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900">{log.modulo}</span>
                        <span className="text-sm text-gray-500">{log.nome_usuario}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{log.descricao}</p>
                      {log.detalhes_adicionais && (
                        <details className="text-xs text-gray-500">
                          <summary className="cursor-pointer">Detalhes adicionais</summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.detalhes_adicionais, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(log.data_hora).toLocaleDateString('pt-BR')}</div>
                      <div>{new Date(log.data_hora).toLocaleTimeString('pt-BR')}</div>
                      {log.ip_usuario && (
                        <div className="text-xs">IP: {log.ip_usuario}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages} ({totalCount} logs)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPanel;
