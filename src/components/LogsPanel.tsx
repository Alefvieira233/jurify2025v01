
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarIcon, FilterIcon, RefreshCwIcon, DownloadIcon } from 'lucide-react';
import { useActivityLogs, ActivityLog, LogFilters } from '@/hooks/useActivityLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LogsPanel = () => {
  const { logs, loading, totalCount, fetchLogs } = useActivityLogs();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LogFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 50;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    fetchLogs(filters, currentPage, itemsPerPage);
  }, [currentPage, filters]);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const getActionBadgeColor = (tipo: ActivityLog['tipo_acao']) => {
    switch (tipo) {
      case 'criacao':
        return 'bg-green-100 text-green-800';
      case 'edicao':
        return 'bg-blue-100 text-blue-800';
      case 'exclusao':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-emerald-100 text-emerald-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'erro':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (tipo: ActivityLog['tipo_acao']) => {
    const labels = {
      criacao: 'Criação',
      edicao: 'Edição',
      exclusao: 'Exclusão',
      login: 'Login',
      logout: 'Logout',
      erro: 'Erro',
      outro: 'Outro'
    };
    return labels[tipo];
  };

  const exportToCsv = () => {
    const csvHeaders = ['Data/Hora', 'Usuário', 'Tipo', 'Módulo', 'Descrição'];
    const csvData = logs.map(log => [
      format(new Date(log.data_hora), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      log.nome_usuario,
      getActionLabel(log.tipo_acao),
      log.modulo,
      log.descricao
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_atividades_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Atividades</h1>
          <p className="text-gray-600">Auditoria de ações realizadas no sistema</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FilterIcon className="h-4 w-4" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchLogs(filters, currentPage, itemsPerPage)}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={exportToCsv}
            className="flex items-center gap-2"
            disabled={logs.length === 0}
          >
            <DownloadIcon className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Ação</label>
                <Select
                  value={filters.tipo_acao || 'all'}
                  onValueChange={(value) => handleFilterChange('tipo_acao', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="criacao">Criação</SelectItem>
                    <SelectItem value="edicao">Edição</SelectItem>
                    <SelectItem value="exclusao">Exclusão</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Módulo</label>
                <Input
                  placeholder="Filtrar por módulo"
                  value={filters.modulo || ''}
                  onChange={(e) => handleFilterChange('modulo', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Início</label>
                <Input
                  type="datetime-local"
                  value={filters.data_inicio || ''}
                  onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Fim</label>
                <Input
                  type="datetime-local"
                  value={filters.data_fim || ''}
                  onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registros de Atividades ({totalCount})</CardTitle>
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.data_hora), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{log.nome_usuario}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.tipo_acao)}>
                          {getActionLabel(log.tipo_acao)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.modulo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.descricao}>
                        {log.descricao}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.ip_usuario || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum registro encontrado
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPanel;
