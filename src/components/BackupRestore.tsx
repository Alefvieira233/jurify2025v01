
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [backupData, setBackupData] = useState('');
  const { toast } = useToast();
  const { hasRole } = useAuth();

  // Lista de tabelas para backup (apenas as necessárias)
  const BACKUP_TABLES = [
    'system_settings',
    'notification_templates', 
    'agentes_ia',
    'api_keys',
    'google_calendar_settings',
    'configuracoes_integracoes'
  ];

  const exportConfigurations = async () => {
    if (!hasRole('administrador')) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem exportar configurações.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const backupObj: any = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        data: {}
      };

      // Exportar cada tabela
      for (const table of BACKUP_TABLES) {
        console.log(`Exportando tabela: ${table}`);
        
        const { data, error } = await supabase
          .from(table as any)
          .select('*');

        if (error) {
          console.error(`Erro ao exportar ${table}:`, error);
          continue;
        }

        // Para system_settings, filtrar dados sensíveis
        if (table === 'system_settings') {
          backupObj.data[table] = data?.filter((item: any) => !item.is_sensitive) || [];
        } else {
          backupObj.data[table] = data || [];
        }
      }

      const jsonString = JSON.stringify(backupObj, null, 2);
      setBackupData(jsonString);

      // Criar download automático
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jurify-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup criado",
        description: "Configurações exportadas com sucesso."
      });

    } catch (error) {
      console.error('Erro no backup:', error);
      toast({
        title: "Erro no backup",
        description: "Falha ao exportar configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const importConfigurations = async () => {
    if (!hasRole('administrador')) {
      toast({
        title: "Acesso negado", 
        description: "Apenas administradores podem importar configurações.",
        variant: "destructive"
      });
      return;
    }

    if (!backupData.trim()) {
      toast({
        title: "Dados inválidos",
        description: "Por favor, cole o JSON de backup.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const parsedData = JSON.parse(backupData);
      
      if (!parsedData.data) {
        throw new Error('Formato de backup inválido');
      }

      // Confirmar antes de importar
      const confirmed = window.confirm(
        'ATENÇÃO: Esta ação irá sobrescrever as configurações atuais. Tem certeza?'
      );
      
      if (!confirmed) {
        setLoading(false);
        return;
      }

      // Importar cada tabela
      for (const table of BACKUP_TABLES) {
        if (parsedData.data[table] && Array.isArray(parsedData.data[table])) {
          console.log(`Importando tabela: ${table}`);
          
          // Limpar tabela atual (exceto dados críticos)
          if (table !== 'api_keys') {
            await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          }
          
          // Inserir novos dados
          const { error } = await supabase
            .from(table as any)
            .insert(parsedData.data[table]);

          if (error) {
            console.error(`Erro ao importar ${table}:`, error);
          }
        }
      }

      toast({
        title: "Importação concluída",
        description: "Configurações restauradas com sucesso."
      });

      setBackupData('');

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Falha ao importar configurações. Verifique o formato do JSON.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('administrador')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">
              Apenas administradores podem acessar o sistema de backup e restore.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Exporte todas as configurações do sistema para backup.
          </p>
          <Button 
            onClick={exportConfigurations} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Exportando...' : 'Criar Backup'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-data">JSON de Backup</Label>
            <Textarea
              id="backup-data"
              placeholder="Cole aqui o JSON de backup..."
              value={backupData}
              onChange={(e) => setBackupData(e.target.value)}
              rows={10}
            />
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Atenção</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Esta ação irá sobrescrever as configurações atuais. Faça um backup antes de prosseguir.
            </p>
          </div>
          
          <Button 
            onClick={importConfigurations} 
            disabled={loading || !backupData.trim()}
            variant="destructive"
            className="w-full"
          >
            {loading ? 'Importando...' : 'Restaurar Backup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
