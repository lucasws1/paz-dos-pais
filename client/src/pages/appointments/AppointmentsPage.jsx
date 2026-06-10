import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  CheckCircle,
  XCircle,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/services/api";
import { usePatient } from "@/context/PatientContext";
import AppointmentDialog from "./AppointmentDialog";

/* ─── Helpers ─────────────────────────────────────────────── */

const STATUS_LABEL = {
  SCHEDULED: "Agendada",
  COMPLETED: "Realizada",
  CANCELED: "Cancelada",
};

function statusBadge(status) {
  if (status === "SCHEDULED")
    return <Badge variant="default">{STATUS_LABEL[status]}</Badge>;
  if (status === "COMPLETED")
    return <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>;
  return (
    <Badge variant="outline" className="border-destructive text-destructive">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function sortAppointments(list, tab) {
  const copy = [...list];
  if (tab === "SCHEDULED") {
    // próximas primeiro (ASC)
    return copy.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }
  // demais: mais recentes primeiro (DESC)
  return copy.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
}

/* ─── AppointmentItem ──────────────────────────────────────── */

function AppointmentItem({
  appointment,
  onEdit,
  onDelete,
  onMarkDone,
  onCancel,
}) {
  const date = new Date(appointment.dateTime);
  const isScheduled = appointment.status === "SCHEDULED";

  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5 pb-4">
        {/* Widget de data */}
        <div className="bg-primary/10 flex w-12 shrink-0 flex-col items-center justify-center rounded-lg py-2 text-center">
          <span className="text-primary text-xl leading-none font-bold">
            {format(date, "dd")}
          </span>
          <span className="text-primary mt-0.5 text-[11px] font-semibold tracking-wide uppercase">
            {format(date, "MMM", { locale: ptBR })}
          </span>
        </div>

        {/* Corpo */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {appointment.doctorName}
            </span>
            {statusBadge(appointment.status)}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {[appointment.specialty, format(date, "HH:mm")]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {appointment.notes && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {appointment.notes}
            </p>
          )}
        </div>

        {/* Ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(appointment)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>

            {isScheduled && (
              <>
                <DropdownMenuItem onClick={() => onMarkDone(appointment)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como realizada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCancel(appointment)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar consulta
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(appointment)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

/* ─── CountBadge ──────────────────────────────────────────── */

function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs leading-none font-medium">
      {count}
    </span>
  );
}

/* ─── EmptyState ───────────────────────────────────────────── */

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
        <CalendarDays className="text-muted-foreground h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-medium">{message}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Adicione uma consulta usando o botão acima.
      </p>
    </div>
  );
}

/* ─── AppointmentsPage ─────────────────────────────────────── */

export default function AppointmentsPage() {
  const { activePatient } = usePatient();
  const queryClient = useQueryClient();
  const patientId = activePatient?.id;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  /* ── Queries ── */
  const {
    data: appointments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["appointments", patientId],
    queryFn: () =>
      api.get(`/patients/${patientId}/appointments`).then((r) => r.data),
    enabled: !!patientId,
  });

  /* ── Mutations ── */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) =>
      api
        .put(`/patients/${patientId}/appointments/${id}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", patientId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (appointmentId) =>
      api.delete(`/patients/${patientId}/appointments/${appointmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", patientId] });
      setDeletingAppointment(null);
    },
  });

  /* ── Handlers ── */
  function openCreate() {
    setEditingAppointment(null);
    setDialogOpen(true);
  }

  function openEdit(appointment) {
    setEditingAppointment(appointment);
    setDialogOpen(true);
  }

  function handleDialogChange(open) {
    setDialogOpen(open);
    if (!open) setEditingAppointment(null);
  }

  function handleMarkDone(appointment) {
    updateMutation.mutate({
      id: appointment.id,
      data: { ...appointment, status: "COMPLETED" },
    });
  }

  function handleCancel(appointment) {
    updateMutation.mutate({
      id: appointment.id,
      data: { ...appointment, status: "CANCELED" },
    });
  }

  /* ── Guard ── */
  if (!activePatient) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>Selecione um paciente para ver as consultas.</p>
      </div>
    );
  }

  /* ── Filtragem por tab ── */
  const TAB_FILTER = {
    all: appointments,
    SCHEDULED: appointments.filter((a) => a.status === "SCHEDULED"),
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED"),
    CANCELED: appointments.filter((a) => a.status === "CANCELED"),
  };

  function renderList(list, emptyMessage) {
    if (isLoading) {
      return (
        <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
          Carregando consultas…
        </div>
      );
    }
    if (isError) {
      return (
        <div className="text-destructive flex items-center justify-center py-12 text-sm">
          Erro ao carregar consultas.
        </div>
      );
    }

    const sorted = sortAppointments(list, activeTab);

    if (sorted.length === 0) {
      return <EmptyState message={emptyMessage} />;
    }

    return (
      <div className="flex flex-col gap-3">
        {sorted.map((appt) => (
          <AppointmentItem
            key={appt.id}
            appointment={appt}
            onEdit={openEdit}
            onDelete={setDeletingAppointment}
            onMarkDone={handleMarkDone}
            onCancel={handleCancel}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Consultas</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova consulta
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Todas
            <CountBadge count={appointments.length} />
          </TabsTrigger>
          <TabsTrigger value="SCHEDULED">
            Agendadas
            <CountBadge count={TAB_FILTER.SCHEDULED.length} />
          </TabsTrigger>
          <TabsTrigger value="COMPLETED">
            Realizadas
            <CountBadge count={TAB_FILTER.COMPLETED.length} />
          </TabsTrigger>
          <TabsTrigger value="CANCELED">
            Canceladas
            <CountBadge count={TAB_FILTER.CANCELED.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderList(TAB_FILTER.all, "Nenhuma consulta cadastrada")}
        </TabsContent>

        <TabsContent value="SCHEDULED" className="mt-4">
          {renderList(TAB_FILTER.SCHEDULED, "Nenhuma consulta agendada")}
        </TabsContent>

        <TabsContent value="COMPLETED" className="mt-4">
          {renderList(TAB_FILTER.COMPLETED, "Nenhuma consulta realizada")}
        </TabsContent>

        <TabsContent value="CANCELED" className="mt-4">
          {renderList(TAB_FILTER.CANCELED, "Nenhuma consulta cancelada")}
        </TabsContent>
      </Tabs>

      {/* Dialog criar/editar — key força remontagem ao trocar de consulta */}
      <AppointmentDialog
        key={editingAppointment?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        patientId={patientId}
        appointment={editingAppointment}
      />

      {/* AlertDialog confirmar exclusão */}
      <AlertDialog
        open={!!deletingAppointment}
        onOpenChange={(open) => !open && setDeletingAppointment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consulta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a consulta com{" "}
              <span className="text-foreground font-medium">
                {deletingAppointment?.doctorName}
              </span>{" "}
              marcada para{" "}
              <span className="text-foreground font-medium">
                {deletingAppointment &&
                  format(
                    new Date(deletingAppointment.dateTime),
                    "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deletingAppointment.id)}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
