
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plug, Users, Bell, Server, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import IntegracoesSection from './configuracoes/IntegracoesSection';
import UsuariosPermissoesSection from './configuracoes/UsuariosPermissoesSection';
import NotificacoesSection from './configuracoes/NotificacoesSection';
import SistemaSection from './configuracoes/SistemaSection';

const ConfiguracoesGerais = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('administrador');

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
              <p className="text-gray-600">
                Apenas administradores podem acessar as configurações gerais do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
        <p className="text-gray-600">
          Gerencie as configurações avançadas do sistema Jurify para otimizar o funcionamento do seu escritório
        </p>
      </div>

      <Tabs defaultValue="integracoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários & Permissões
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integracoes">
          <IntegracoesSection />
        </TabsContent>

        <TabsContent value="usuarios">
          <UsuariosPermissoesSection />
        </TabsContent>

        <TabsContent value="notificacoes">
          <NotificacoesSection />
        </TabsContent>

        <TabsContent value="sistema">
          <SistemaSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesGerais;
