import { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initSentry } from "./lib/sentry";
import * as Sentry from '@sentry/react';

// ✅ Inicializar Sentry ANTES de tudo
initSentry();

// Import direto sem lazy (para debug)
import Auth from "./pages/Auth";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";

import Dashboard from "./features/dashboard/Dashboard";
import LeadsPanel from "./features/leads/LeadsPanel";
import PipelineJuridico from "./features/pipeline/PipelineJuridico";
import AgendamentosManager from "./features/scheduling/AgendamentosManager";
import ContratosManager from "./features/contracts/ContratosManager";
import RelatoriosGerenciais from "./features/reports/RelatoriosGerenciais";
import WhatsAppIA from "./features/whatsapp/WhatsAppIA";
import AgentesIAManager from "./features/ai-agents/AgentesIAManager";
import UsuariosManager from "./features/users/UsuariosManager";
import LogsPanel from "./features/logs/LogsPanel";
import IntegracoesConfig from "./features/settings/IntegracoesConfig";
import ConfiguracoesGerais from "./features/settings/ConfiguracoesGerais";
import NotificationsPanel from "./features/notifications/NotificationsPanel";
import TimelineConversas from "./features/timeline/TimelineConversas";
import AgentsPlayground from "./pages/AgentsPlayground";
import MissionControl from "./features/mission-control/MissionControl";
import DebugSupabase from "./components/DebugSupabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrap BrowserRouter com Sentry para tracking de navegação
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* 🔍 Debug Supabase Connection (apenas dev) */}
        <DebugSupabase />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<LoadingSpinner fullScreen text="Carregando..." />}>
              <SentryRoutes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />

                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Navigate to="/" replace />} />
                  <Route path="leads" element={<LeadsPanel />} />
                  <Route path="pipeline" element={<PipelineJuridico />} />
                  <Route path="agendamentos" element={<AgendamentosManager />} />
                  <Route path="contratos" element={<ContratosManager />} />
                  <Route path="relatorios" element={<RelatoriosGerenciais />} />
                  <Route path="whatsapp" element={<WhatsAppIA />} />
                  <Route path="agentes" element={<AgentesIAManager />} />
                  <Route path="usuarios" element={<UsuariosManager />} />
                  <Route path="logs" element={<LogsPanel />} />
                  <Route path="integracoes" element={<IntegracoesConfig />} />
                  <Route path="configuracoes" element={<ConfiguracoesGerais />} />
                  <Route path="notificacoes" element={<NotificationsPanel />} />
                  <Route path="timeline" element={<TimelineConversas />} />
                  <Route path="planos" element={<Pricing />} />
                  <Route path="admin/playground" element={<AgentsPlayground />} />
                  <Route path="admin/mission-control" element={<MissionControl />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </SentryRoutes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
