
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Database, 
  Shield, 
  Activity,
  Download,
  Upload,
  BarChart3,
  Settings
} from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeysManager from '../ApiKeysManager';
import BackupRestore from '../BackupRestore';
import PerformanceDashboard from '../PerformanceDashboard';

const SistemaSection = () => {
  const { hasRole } = useAuth();
  const { settings, isLoading } = useSystemSettings();
  const [activeSubTab, setActiveSubTab] = useState('configuracoes');

  const isAdmin = hasRole('administrador');

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-600">
              Apenas administradores podem acessar as configurações do sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const systemStats = [
    {
      title: 'Configurações',
      value: settings.length,
      icon: Settings,
      color: 'text-blue-600'
    },
    {
      title: 'Uptime',
      value: '99.9%',
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Storage',
      value: '2.3 GB',
      icon: Database,
      color: 'text-purple-600'
    },
    {
      title: 'Users Online',
      value: '12',
      icon: Shield,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Abas principais */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup/Restore
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {['sistema', 'email', 'ai', 'integracoes'].map(category => {
                    const categorySettings = settings.filter(s => s.category === category);
                    if (categorySettings.length === 0) return null;

                    return (
                      <div key={category} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3 capitalize flex items-center gap-2">
                          {category === 'sistema' && <Server className="h-4 w-4" />}
                          {category === 'email' && <Activity className="h-4 w-4" />}
                          {category === 'ai' && <Shield className="h-4 w-4" />}
                          {category === 'integracoes' && <Database className="h-4 w-4" />}
                          {category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorySettings.map(setting => (
                            <div key={setting.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">{setting.key}</label>
                                {setting.is_sensitive && (
                                  <Badge variant="secondary" size="sm">Sensível</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {setting.description}
                              </div>
                              <div className="text-xs text-gray-500">
                                Valor: {setting.is_sensitive ? '***' : setting.value || 'Não definido'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="backup">
          <BackupRestore />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SistemaSection;
