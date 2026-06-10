import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pill,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import MedicationDialog from "./MedicationDialog";

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return format(new Date(isoString), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return null;
  }
}

function MedicationCard({ medication, onEdit, onDelete, onToggleActive }) {
  const startDate = formatDate(medication.startDate);
  const endDate = formatDate(medication.endDate);

  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5 pb-4">
        {/* Ícone */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Pill className="h-5 w-5" />
        </div>

        {/* Conteúdo principal */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{medication.name}</span>
            <Badge
              variant={medication.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {medication.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          {(medication.dosage || medication.frequency) && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {[medication.dosage, medication.frequency]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {(startDate || endDate) && (
            <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>
                {startDate && endDate
                  ? `${startDate} → ${endDate}`
                  : startDate
                    ? `Início: ${startDate}`
                    : `Até: ${endDate}`}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={medication.isActive}
            onCheckedChange={(checked) => onToggleActive(medication, checked)}
            aria-label={
              medication.isActive
                ? "Desativar medicamento"
                : "Ativar medicamento"
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(medication)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(medication)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
        <Pill className="text-muted-foreground h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-medium">{message}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Adicione um medicamento usando o botão acima.
      </p>
    </div>
  );
}

export default function MedicationsPage() {
  const { activePatient } = usePatient();
  const queryClient = useQueryClient();
  const patientId = activePatient?.id;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [deletingMedication, setDeletingMedication] = useState(null);

  const {
    data: medications = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["medications", patientId],
    queryFn: () =>
      api.get(`/patients/${patientId}/medications`).then((r) => r.data),
    enabled: !!patientId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ medication, isActive }) =>
      api
        .put(`/patients/${patientId}/medications/${medication.id}`, {
          ...medication,
          isActive,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications", patientId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (medicationId) =>
      api.delete(`/patients/${patientId}/medications/${medicationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications", patientId] });
      setDeletingMedication(null);
    },
  });

  function openCreate() {
    setEditingMedication(null);
    setDialogOpen(true);
  }

  function openEdit(medication) {
    setEditingMedication(medication);
    setDialogOpen(true);
  }

  function handleDialogChange(open) {
    setDialogOpen(open);
    if (!open) setEditingMedication(null);
  }

  if (!activePatient) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>Selecione um paciente para ver os medicamentos.</p>
      </div>
    );
  }

  const active = medications.filter((m) => m.isActive);
  const inactive = medications.filter((m) => !m.isActive);

  function renderList(list, emptyMessage) {
    if (isLoading) {
      return (
        <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
          Carregando medicamentos…
        </div>
      );
    }
    if (isError) {
      return (
        <div className="text-destructive flex items-center justify-center py-12 text-sm">
          Erro ao carregar medicamentos.
        </div>
      );
    }
    if (list.length === 0) {
      return <EmptyState message={emptyMessage} />;
    }
    return (
      <div className="flex flex-col gap-3">
        {list.map((med) => (
          <MedicationCard
            key={med.id}
            medication={med}
            onEdit={openEdit}
            onDelete={setDeletingMedication}
            onToggleActive={(medication, isActive) =>
              toggleMutation.mutate({ medication, isActive })
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Medicamentos</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar medicamento
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Todos
            {medications.length > 0 && (
              <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs leading-none font-medium">
                {medications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativos
            {active.length > 0 && (
              <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs leading-none font-medium">
                {active.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inativos
            {inactive.length > 0 && (
              <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs leading-none font-medium">
                {inactive.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderList(medications, "Nenhum medicamento cadastrado")}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {renderList(active, "Nenhum medicamento ativo")}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {renderList(inactive, "Nenhum medicamento inativo")}
        </TabsContent>
      </Tabs>

      {/* Dialog criar/editar — key força remontagem ao trocar de medicamento */}
      <MedicationDialog
        key={editingMedication?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        patientId={patientId}
        medication={editingMedication}
      />

      {/* AlertDialog confirmar exclusão */}
      <AlertDialog
        open={!!deletingMedication}
        onOpenChange={(open) => !open && setDeletingMedication(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir medicamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="text-foreground font-medium">
                {deletingMedication?.name}
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
              onClick={() => deleteMutation.mutate(deletingMedication.id)}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
