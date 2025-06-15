
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plug, Users, Bell, Server, TestTube } from 'lucide-react';
import IntegracoesSection from './configuracoes/IntegracoesSection';
import UsuariosPermissoesSection from './configuracoes/UsuariosPermissoesSection';
import NotificacoesSection from './configuracoes/NotificacoesSection';
import SistemaSection from './configuracoes/SistemaSection';
import TesteN8N from './TesteN8N';

const ConfiguracoesGerais = () => {
  // 🔓 ACESSO TOTAL: Qualquer usuário autenticado pode acessar configurações
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
        <p className="text-gray-600">
          Gerencie as configurações avançadas do sistema Jurify para otimizar o funcionamento do seu escritório
        </p>
      </div>

      <Tabs defaultValue="integracoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="teste-n8n" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Teste N8N
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

        <TabsContent value="teste-n8n">
          <TesteN8N />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesGerais;
