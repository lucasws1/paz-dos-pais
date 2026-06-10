import { Outlet, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
