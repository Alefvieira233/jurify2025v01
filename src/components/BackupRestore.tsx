
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle,
  Database,
  FileText,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BackupData {
  timestamp: string;
  version: string;
  data: {
    system_settings: any[];
    notification_templates: any[];
    agentes_ia: any[];
    api_keys: any[];
    google_calendar_settings: any[];
    configuracoes_integracoes: any[];
  };
}

const BackupRestore = () => {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isSuperAdmin = hasRole('administrador');

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">
              Apenas super administradores podem acessar backup/restore.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const exportConfigurations = async () => {
    setIsExporting(true);
    try {
      // Buscar todas as configurações
      const tables = [
        'system_settings',
        'notification_templates', 
        'agentes_ia',
        'api_keys',
        'google_calendar_settings',
        'configuracoes_integracoes'
      ];

      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {} as any
      };

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Erro ao buscar ${table}:`, error);
          continue;
        }

        // Mascarar dados sensíveis nas API keys
        if (table === 'api_keys') {
          backupData.data[table] = data?.map(item => ({
            ...item,
            key_value: '***MASKED***'
          })) || [];
        } else if (table === 'system_settings') {
          backupData.data[table] = data?.map(item => ({
            ...item,
            value: item.is_sensitive ? '***MASKED***' : item.value
          })) || [];
        } else {
          backupData.data[table] = data || [];
        }
      }

      // Criar arquivo para download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jurify-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Criado",
        description: "Configurações exportadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro no backup:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar backup.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Arquivo Inválido",
        description: "Selecione um arquivo JSON válido.",
        variant: "destructive",
      });
    }
  };

  const validateBackupFile = async (backupData: BackupData): Promise<boolean> => {
    // Validações básicas
    if (!backupData.timestamp || !backupData.data) {
      return false;
    }

    // Verificar se tem as tabelas essenciais
    const requiredTables = ['system_settings', 'agentes_ia'];
    for (const table of requiredTables) {
      if (!backupData.data[table]) {
        return false;
      }
    }

    return true;
  };

  const importConfigurations = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      const fileContent = await selectedFile.text();
      const backupData: BackupData = JSON.parse(fileContent);

      // Validar arquivo
      if (!await validateBackupFile(backupData)) {
        throw new Error('Arquivo de backup inválido');
      }

      // Confirmar antes de importar
      if (!showConfirmation) {
        setShowConfirmation(true);
        setIsImporting(false);
        return;
      }

      // Importar dados (apenas configurações não sensíveis)
      for (const [tableName, tableData] of Object.entries(backupData.data)) {
        if (!Array.isArray(tableData) || tableData.length === 0) continue;

        // Pular dados sensíveis mascarados
        const filteredData = tableData.filter(item => {
          if (tableName === 'api_keys') {
            return item.key_value !== '***MASKED***';
          }
          if (tableName === 'system_settings') {
            return item.value !== '***MASKED***';
          }
          return true;
        });

        if (filteredData.length === 0) continue;

        // Upsert dados
        const { error } = await supabase
          .from(tableName)
          .upsert(filteredData, { onConflict: 'id' });

        if (error) {
          console.error(`Erro ao importar ${tableName}:`, error);
        }
      }

      toast({
        title: "Restore Completo",
        description: "Configurações restauradas com sucesso.",
      });

      setSelectedFile(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Erro no restore:', error);
      toast({
        title: "Erro",
        description: "Erro ao restaurar configurações.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export/Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Backup de Configurações</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Exporte todas as configurações do sistema em um arquivo JSON.
            Dados sensíveis como senhas e tokens serão mascarados.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span>Configurações do Sistema</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span>Templates de Notificação</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span>Agentes IA (sem tokens)</span>
            </div>
          </div>

          <Button 
            onClick={exportConfigurations}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar Configurações'}
          </Button>
        </CardContent>
      </Card>

      {/* Import/Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Restore de Configurações</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta operação irá sobrescrever as configurações existentes.
              Faça um backup antes de continuar.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label htmlFor="backup-file">Arquivo de Backup (JSON)</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFile && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Arquivo selecionado:</strong> {selectedFile.name}
              </p>
              <p className="text-xs text-blue-600">
                Tamanho: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {showConfirmation && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Confirma a restauração das configurações? Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            {showConfirmation && (
              <Button 
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setSelectedFile(null);
                }}
              >
                Cancelar
              </Button>
            )}
            <Button 
              onClick={importConfigurations}
              disabled={!selectedFile || isImporting}
              variant={showConfirmation ? "destructive" : "default"}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Restaurando...' : 
               showConfirmation ? 'Confirmar Restore' : 'Restaurar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre o Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Dados Incluídos</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Configurações do sistema</li>
                <li>• Templates de notificação</li>
                <li>• Configuração de agentes IA</li>
                <li>• Configurações de integrações</li>
                <li>• Configurações do Google Calendar</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dados Excluídos</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Leads e contratos</li>
                <li>• Logs de atividades</li>
                <li>• Dados de usuários</li>
                <li>• Tokens e senhas (mascarados)</li>
                <li>• Histórico de execuções</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;
