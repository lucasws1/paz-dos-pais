import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  ClipboardCheck,
  Calendar,
  FileText,
  Share2,
  UserRound,
  LogOut,
  Heart,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";
import PatientDialog from "@/pages/patient/PatientDialog";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { to: "/doses", icon: ClipboardCheck, label: "Doses de hoje" },
  { to: "/medications", icon: Pill, label: "Medicamentos" },
  { to: "/appointments", icon: Calendar, label: "Consultas" },
  { to: "/documents", icon: FileText, label: "Documentos" },
  { to: "/share", icon: Share2, label: "Compartilhar" },
  { to: "/patient", icon: UserRound, label: "Paciente" },
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
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Heart className="h-4.5 w-4.5 text-primary-foreground" fill="currentColor" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[15px] font-semibold tracking-tight">Paz dos Pais</p>
          <p className="text-muted-foreground truncate text-xs">
            Cuidado em família
          </p>
        </div>
      </div>

      <Separator />

      {/* Navegação */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Lista de pacientes */}
      <div className="px-3 py-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pacientes
          </p>
          <button
            onClick={() => setPatientDialogOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Adicionar paciente"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-0.5">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setActivePatient(patient)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                activePatient?.id === patient.id
                  ? "bg-accent"
                  : "hover:bg-muted"
              )}
            >
              <Avatar className="h-7 w-7 text-xs">
                <AvatarFallback
                  className={cn(
                    "text-xs",
                    activePatient?.id === patient.id &&
                      "bg-primary text-primary-foreground"
                  )}
                >
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

      <PatientDialog
        open={patientDialogOpen}
        onOpenChange={setPatientDialogOpen}
      />
    </aside>
  );
}
