
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ExportDataButtonProps {
  table: string;
  filename?: string;
  className?: string;
}

const ExportDataButton = ({ table, filename, className }: ExportDataButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const exportToCSV = async () => {
    if (!hasPermission('usuarios', 'read')) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para exportar dados.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados para exportar nesta tabela.",
        });
        return;
      }

      // Converter para CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escapar aspas e quebras de linha
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `${table}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: `${data.length} registros exportados com sucesso.`,
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={exportToCSV}
      disabled={loading}
      variant="outline"
      size="sm"
      className={className}
    >
      {loading ? (
        <Download className="h-4 w-4 mr-2 animate-pulse" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      {loading ? 'Exportando...' : 'Exportar CSV'}
    </Button>
  );
};

export default ExportDataButton;
