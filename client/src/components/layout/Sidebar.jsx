import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  Calendar,
  FileText,
  Share2,
  LogOut,
  Heart,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/medications", icon: Pill, label: "Medicamentos" },
  { to: "/appointments", icon: Calendar, label: "Consultas" },
  { to: "/documents", icon: FileText, label: "Documentos" },
  { to: "/share", icon: Share2, label: "Compartilhar" },
];

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { patients, activePatient, setActivePatient } = usePatient();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <Heart className="h-6 w-6 text-primary" fill="currentColor" />
        <span className="text-lg font-semibold tracking-tight">Paz dos Pais</span>
      </div>

      <Separator />

      {/* Navegação */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Lista de pacientes */}
      <div className="px-3 py-3">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pacientes
        </p>
        <div className="space-y-0.5">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setActivePatient(patient)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                activePatient?.id === patient.id
                  ? "bg-accent font-medium"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <Avatar className="h-7 w-7 text-xs">
                <AvatarFallback className="text-xs">
                  {initials(patient.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-none text-foreground">
                  {patient.name}
                </p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {patient.role?.toLowerCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Usuário + logout */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials(user?.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
