import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Today from "./pages/Today";
import Essay from "./pages/Essay";
import Objectives from "./pages/Objectives";
import Flashcards from "./pages/Flashcards";

import Plan from "./pages/Plan";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import History from "./pages/History";
import Onboarding from "./pages/Onboarding";
import ErrorsByTopic from "./pages/ErrorsByTopic";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Founders from "./pages/Founders";
import FounderSignup from "./pages/FounderSignup";
import Landing from "./pages/Landing";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/hoje" replace /> : <Navigate to="/fundadores" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route
              path="/hoje"
              element={
                <ProtectedRoute>
                  <Today />
                </ProtectedRoute>
              }
            />
            <Route
              path="/redacao"
              element={
                <ProtectedRoute>
                  <Essay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/objetivas"
              element={
                <ProtectedRoute>
                  <Objectives />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedRoute>
                  <Flashcards />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/historico"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/errors"
              element={
                <ProtectedRoute>
                  <ErrorsByTopic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plano"
              element={
                <ProtectedRoute>
                  <Plan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/fundadores" element={<Founders />} />
            <Route path="/fundadores/cadastro" element={<FounderSignup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
