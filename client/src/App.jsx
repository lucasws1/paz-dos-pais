import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { PatientProvider } from "@/context/PatientContext";
import AppLayout from "@/components/layout/AppLayout";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const DosesPage = lazy(() => import("@/pages/doses/DosesPage"));
const MedicationsPage = lazy(() => import("@/pages/medications/MedicationsPage"));
const AppointmentsPage = lazy(() => import("@/pages/appointments/AppointmentsPage"));
const DocumentsPage = lazy(() => import("@/pages/documents/DocumentsPage"));
const PatientPage = lazy(() => import("@/pages/patient/PatientPage"));
const SharePage = lazy(() => import("@/pages/share/SharePage"));
const PublicSharePage = lazy(() => import("@/pages/share/PublicSharePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
  },
});

function PageFallback() {
  return (
    <div className="text-muted-foreground flex h-screen items-center justify-center text-sm">
      Carregando…
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PatientProvider>
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/share/:token" element={<PublicSharePage />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/doses" element={<DosesPage />} />
                  <Route path="/medications" element={<MedicationsPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/patient" element={<PatientPage />} />
                  <Route path="/share" element={<SharePage />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PatientProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
