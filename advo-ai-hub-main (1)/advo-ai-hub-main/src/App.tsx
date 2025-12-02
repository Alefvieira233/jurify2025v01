import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load pages/components
const Auth = lazy(() => import("./pages/Auth"));
const GoogleAuthCallback = lazy(() => import("./pages/GoogleAuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));

// Lazy load feature components
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const LeadsPanel = lazy(() => import("./features/leads/LeadsPanel"));
const PipelineJuridico = lazy(() => import("./features/pipeline/PipelineJuridico"));
const AgendamentosManager = lazy(() => import("./features/scheduling/AgendamentosManager"));
const ContratosManager = lazy(() => import("./features/contracts/ContratosManager"));
const RelatoriosGerenciais = lazy(() => import("./features/reports/RelatoriosGerenciais"));
const WhatsAppIA = lazy(() => import("./features/whatsapp/WhatsAppIA"));
const AgentesIAManager = lazy(() => import("./features/ai-agents/AgentesIAManager"));
const UsuariosManager = lazy(() => import("./features/users/UsuariosManager"));
const LogsPanel = lazy(() => import("./features/logs/LogsPanel"));
const IntegracoesConfig = lazy(() => import("./features/settings/IntegracoesConfig"));
const ConfiguracoesGerais = lazy(() => import("./features/settings/ConfiguracoesGerais"));
const NotificationsPanel = lazy(() => import("./features/notifications/NotificationsPanel"));
const TimelineConversas = lazy(() => import("./features/timeline/TimelineConversas"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner fullScreen text="Carregando..." />}>
            <Routes>
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
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
