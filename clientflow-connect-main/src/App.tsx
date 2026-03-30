import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import NovoCliente from "./pages/NovoCliente";
import Campanhas from "./pages/Campanhas";
import Agendamentos from "./pages/Agendamentos";
import Historico from "./pages/Historico";
import Configuracoes from "./pages/Configuracoes";
import Integracoes from "./pages/Integracoes";
import WorkflowBuilder from "./workflow-builder/WorkflowBuilder";
import EngineMonitor from "./pages/EngineMonitor";
import Billing from "./pages/Billing";
import AIAnalytics from "./pages/AIAnalytics";
import GrowthDashboard from "./pages/admin/Growth";
import { ThemeProvider } from "next-themes";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { I18nProvider } from "./i18n/useTranslation";
import { AICopilot } from "./components/AICopilot";
import { WhiteLabelProvider } from "./hooks/useWhiteLabel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <I18nProvider>
            <WhiteLabelProvider>
              <TooltipProvider>
                <Toaster />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Routes>
                {/* Public routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout><Dashboard /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clientes" element={
                  <ProtectedRoute>
                    <AppLayout><Clientes /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clientes/:id" element={
                  <ProtectedRoute>
                    <AppLayout><ClienteDetalhes /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clientes/novo" element={
                  <ProtectedRoute>
                    <AppLayout><NovoCliente /></AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/campanhas" element={
                  <ProtectedRoute>
                    <AppLayout><Campanhas /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/agendamentos" element={
                  <ProtectedRoute>
                    <AppLayout><Agendamentos /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/historico" element={
                  <ProtectedRoute>
                    <AppLayout><Historico /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/configuracoes" element={
                  <ProtectedRoute>
                    <AppLayout><Configuracoes /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/integracoes" element={
                  <ProtectedRoute>
                    <AppLayout><Integracoes /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute>
                    <AppLayout><Billing /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/ai" element={
                  <ProtectedRoute>
                    <AppLayout><AIAnalytics /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/automacoes/builder" element={
                  <ProtectedRoute>
                    <WorkflowBuilder />
                  </ProtectedRoute>
                } />
                <Route path="/admin/monitor" element={
                  <ProtectedRoute>
                    <AppLayout><EngineMonitor /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin/growth" element={
                  <ProtectedRoute>
                    <AppLayout><GrowthDashboard /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AICopilot />
            </BrowserRouter>
            <Sonner />
              </TooltipProvider>
            </WhiteLabelProvider>
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};


export default App;
