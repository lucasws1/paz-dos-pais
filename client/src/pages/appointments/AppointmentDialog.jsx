import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";

const EMPTY_FORM = {
  doctorName: "",
  specialty: "",
  dateTime: "",
  status: "SCHEDULED",
  notes: "",
};

/** Converte ISO string → "YYYY-MM-DDTHH:mm" para input datetime-local */
function toDateTimeLocal(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 16);
}

function buildForm(appointment) {
  if (!appointment) return EMPTY_FORM;
  return {
    doctorName: appointment.doctorName ?? "",
    specialty: appointment.specialty ?? "",
    dateTime: toDateTimeLocal(appointment.dateTime),
    status: appointment.status ?? "SCHEDULED",
    notes: appointment.notes ?? "",
  };
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  patientId,
  appointment,
}) {
  const queryClient = useQueryClient();
  const isEditing = !!appointment;

  const [form, setForm] = useState(() => buildForm(appointment));
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? api
            .put(
              `/patients/${patientId}/appointments/${appointment.id}`,
              data,
            )
            .then((r) => r.data)
        : api
            .post(`/patients/${patientId}/appointments`, data)
            .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", patientId] });
      onOpenChange(false);
    },
  });

  function validate() {
    const errs = {};
    if (!form.doctorName.trim()) errs.doctorName = "Nome do médico é obrigatório.";
    if (!form.dateTime) errs.dateTime = "Data e hora são obrigatórias.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    mutation.mutate({
      doctorName: form.doctorName.trim(),
      specialty: form.specialty.trim() || null,
      dateTime: new Date(form.dateTime).toISOString(),
      status: form.status,
      notes: form.notes.trim() || null,
    });
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar consulta" : "Nova consulta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Médico */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appt-doctor">
              Médico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appt-doctor"
              placeholder="Ex: Dr. João Silva"
              value={form.doctorName}
              onChange={(e) => set("doctorName", e.target.value)}
            />
            {errors.doctorName && (
              <p className="text-destructive text-xs">{errors.doctorName}</p>
            )}
          </div>

          {/* Especialidade + Data e hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="appt-specialty">Especialidade</Label>
              <Input
                id="appt-specialty"
                placeholder="Ex: Cardiologia"
                value={form.specialty}
                onChange={(e) => set("specialty", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="appt-datetime">
                Data e hora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="appt-datetime"
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) => set("dateTime", e.target.value)}
              />
              {errors.dateTime && (
                <p className="text-destructive text-xs">{errors.dateTime}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appt-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", v)}
            >
              <SelectTrigger id="appt-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Agendada</SelectItem>
                <SelectItem value="COMPLETED">Realizada</SelectItem>
                <SelectItem value="CANCELED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appt-notes">Notas</Label>
            <Textarea
              id="appt-notes"
              placeholder="Observações, exames solicitados, etc."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-destructive text-xs">
              Ocorreu um erro ao salvar. Tente novamente.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
