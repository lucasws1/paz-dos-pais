import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Save, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";
import { usePatient } from "@/context/PatientContext";

function toInputDate(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 10);
}

function buildForm(patient) {
  return {
    name: patient?.name ?? "",
    birthDate: toInputDate(patient?.birthDate),
    allergies: patient?.allergies ?? "",
    alerts: patient?.alerts ?? "",
    notes: patient?.notes ?? "",
  };
}

function PatientForm({ patient }) {
  const queryClient = useQueryClient();
  const { setActivePatient } = usePatient();

  const [form, setForm] = useState(() => buildForm(patient));
  const [nameError, setNameError] = useState("");
  const [saved, setSaved] = useState(false);

  const canEdit = patient.role === "OWNER" || patient.role === "CAREGIVER";

  const mutation = useMutation({
    mutationFn: () =>
      api
        .put(`/patients/${patient.id}`, {
          name: form.name.trim(),
          birthDate: form.birthDate
            ? new Date(form.birthDate).toISOString()
            : null,
          allergies: form.allergies.trim() || null,
          alerts: form.alerts.trim() || null,
          notes: form.notes.trim() || null,
        })
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setActivePatient({ ...updated, role: patient.role });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    if (field === "name") setNameError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError("Nome é obrigatório.");
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Dados básicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4" />
            Dados do paciente
          </CardTitle>
          <CardDescription>
            Informações básicas exibidas no painel e no resumo do médico.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patient-name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patient-name"
                value={form.name}
                disabled={!canEdit}
                onChange={(e) => set("name", e.target.value)}
              />
              {nameError && (
                <p className="text-destructive text-xs">{nameError}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patient-birth">Data de nascimento</Label>
              <Input
                id="patient-birth"
                type="date"
                value={form.birthDate}
                disabled={!canEdit}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alergias e alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Alergias e alertas
          </CardTitle>
          <CardDescription>
            Aparecem em destaque no resumo compartilhado com o médico — mantenha
            sempre atualizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="patient-allergies">Alergias</Label>
            <Textarea
              id="patient-allergies"
              placeholder="Ex: Dipirona, penicilina"
              rows={2}
              value={form.allergies}
              disabled={!canEdit}
              onChange={(e) => set("allergies", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="patient-alerts">Alertas fixos</Label>
            <Textarea
              id="patient-alerts"
              placeholder="Ex: Hipertenso, marcapasso, risco de queda"
              rows={2}
              value={form.alerts}
              disabled={!canEdit}
              onChange={(e) => set("alerts", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Anotações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anotações do cuidador</CardTitle>
          <CardDescription>
            Observações livres do dia a dia. Não aparecem no resumo do médico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="patient-notes"
            placeholder="Ex: Anda esquecendo a dose da noite; reclamou de tontura na terça…"
            rows={5}
            value={form.notes}
            disabled={!canEdit}
            onChange={(e) => set("notes", e.target.value)}
          />
        </CardContent>
      </Card>

      {mutation.isError && (
        <p className="text-destructive text-sm">
          Ocorreu um erro ao salvar. Tente novamente.
        </p>
      )}

      {canEdit ? (
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-muted-foreground text-sm">
              Alterações salvas ✓
            </span>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-right text-sm">
          Você tem acesso somente leitura a este paciente.
        </p>
      )}
    </form>
  );
}

export default function PatientPage() {
  const { activePatient } = usePatient();

  if (!activePatient) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>Selecione um paciente para editar o perfil.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">Perfil — {activePatient.name}</h1>
      {/* key força remontagem ao trocar de paciente */}
      <PatientForm key={activePatient.id} patient={activePatient} />
    </div>
  );
}
