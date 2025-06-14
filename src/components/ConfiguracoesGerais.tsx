
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plug, User, Bell } from 'lucide-react';
import IntegracoesConfig from './IntegracoesConfig';

const ConfiguracoesGerais = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema Jurify</p>
      </div>

      <Tabs defaultValue="integracoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integracoes" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integracoes">
          <IntegracoesConfig />
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Usuários</CardTitle>
              <CardDescription>
                Gerencie configurações relacionadas aos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como as notificações são enviadas e recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configurações gerais do sistema Jurify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesGerais;
