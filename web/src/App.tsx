import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InboxPage from "./pages/InboxPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import AgendaPage from "./pages/AgendaPage";
import ConsultationPage from "./pages/ConsultationPage";
import { DashboardPage } from "./pages/DashboardPage";
import RegisterPage from "./pages/RegisterPage";
import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import BillingPage from "./pages/BillingPage";
import AutomationsPage from "./pages/AutomationsPage";
import UsersPage from "./pages/UsersPage";
import TasksPage from "./pages/TasksPage";
import CRMPage from "./pages/CRMPage";
import { useAuthStore } from "./store/useAuthStore";

import { SidebarNavigation } from "./components/SidebarNavigation";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex bg-background w-full">
      <SidebarNavigation />
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/inbox" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <MainLayout><InboxPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <MainLayout><PatientsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <MainLayout><PatientDetailPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge"
          element={
            <ProtectedRoute>
              <MainLayout><KnowledgeBasePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/automations"
          element={
            <ProtectedRoute>
              <MainLayout><AutomationsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <MainLayout><TasksPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/crm"
          element={
            <ProtectedRoute>
              <MainLayout><CRMPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <MainLayout><BillingPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <MainLayout><UsersPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout><SettingsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <MainLayout><AgendaPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultation"
          element={
            <ProtectedRoute>
              <MainLayout><ConsultationPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout><DashboardPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
                <p className="text-muted-foreground mb-4">Página não encontrada</p>
                <a href="/inbox" className="text-primary hover:underline">Voltar ao Inbox</a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
