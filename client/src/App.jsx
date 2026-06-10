import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { PatientProvider } from "@/context/PatientContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import MedicationsPage from "@/pages/medications/MedicationsPage";
import AppointmentsPage from "@/pages/appointments/AppointmentsPage";
import DocumentsPage from "@/pages/documents/DocumentsPage";
import SharePage from "@/pages/share/SharePage";
import PublicSharePage from "@/pages/share/PublicSharePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PatientProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/share/:token" element={<PublicSharePage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/medications" element={<MedicationsPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/share" element={<SharePage />} />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </PatientProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
