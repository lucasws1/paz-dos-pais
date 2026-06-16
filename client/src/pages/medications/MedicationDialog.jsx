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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";

const INTERVAL_OPTIONS = [
  { value: "1", label: "Diário" },
  { value: "2", label: "A cada 2 dias" },
  { value: "7", label: "Semanal" },
  { value: "14", label: "Quinzenal" },
  { value: "30", label: "Mensal" },
];

const EMPTY_FORM = {
  name: "",
  dosage: "",
  frequency: "",
  intervalDays: "1",
  times: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimes(times) {
  return times
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .every((t) => TIME_REGEX.test(t));
}

function toISOOrNull(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toISOString();
}

function toInputDate(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 10); // "YYYY-MM-DD"
}

function buildForm(medication) {
  if (!medication) return EMPTY_FORM;
  return {
    name: medication.name ?? "",
    dosage: medication.dosage ?? "",
    frequency: medication.frequency ?? "",
    intervalDays: String(medication.intervalDays ?? 1),
    times: medication.times ?? "",
    startDate: toInputDate(medication.startDate),
    endDate: toInputDate(medication.endDate),
    isActive: medication.isActive ?? true,
  };
}

export default function MedicationDialog({
  open,
  onOpenChange,
  patientId,
  medication,
}) {
  const queryClient = useQueryClient();
  const isEditing = !!medication;

  const [form, setForm] = useState(() => buildForm(medication));
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? api
            .put(`/patients/${patientId}/medications/${medication.id}`, data)
            .then((r) => r.data)
        : api
            .post(`/patients/${patientId}/medications`, data)
            .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications", patientId] });
      onOpenChange(false);
    },
  });

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório.";
    if (form.times.trim() && !isValidTimes(form.times))
      errs.times = "Use horários HH:mm separados por vírgula. Ex: 08:00, 20:00";
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
      name: form.name.trim(),
      dosage: form.dosage.trim() || null,
      frequency: form.frequency.trim() || null,
      intervalDays: Number(form.intervalDays),
      times: form.times.trim() || null,
      startDate: toISOOrNull(form.startDate),
      endDate: toISOOrNull(form.endDate),
      isActive: form.isActive,
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
            {isEditing ? "Editar medicamento" : "Adicionar medicamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="med-name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="med-name"
              placeholder="Ex: Paracetamol"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
          </div>

          {/* Dosagem + Frequência */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="med-dosage">Dosagem</Label>
              <Input
                id="med-dosage"
                placeholder="Ex: 500mg"
                value={form.dosage}
                onChange={(e) => set("dosage", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="med-frequency">Frequência</Label>
              <Input
                id="med-frequency"
                placeholder="Ex: 8 em 8 horas"
                value={form.frequency}
                onChange={(e) => set("frequency", e.target.value)}
              />
            </div>
          </div>

          {/* Horários das doses + Intervalo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="med-times">Horários das doses</Label>
              <Input
                id="med-times"
                placeholder="Ex: 08:00, 20:00"
                value={form.times}
                onChange={(e) => set("times", e.target.value)}
              />
              {errors.times ? (
                <p className="text-destructive text-xs">{errors.times}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Lembretes por e-mail.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="med-interval">Intervalo</Label>
              <Select
                value={form.intervalDays}
                onValueChange={(v) => set("intervalDays", v)}
              >
                <SelectTrigger id="med-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="med-start">Data de início</Label>
              <Input
                id="med-start"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="med-end">Data de fim</Label>
              <Input
                id="med-end"
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3">
            <Switch
              id="med-active"
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
            />
            <Label htmlFor="med-active" className="cursor-pointer">
              Medicamento ativo
            </Label>
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
