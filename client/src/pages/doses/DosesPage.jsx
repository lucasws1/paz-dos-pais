import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Clock, Pill, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { usePatient } from "@/context/PatientContext";

const STATUS_LABELS = {
  PENDING: { label: "Pendente", variant: "secondary" },
  TAKEN: { label: "Tomou", variant: "default" },
  MISSED: { label: "Perdida", variant: "destructive" },
  SKIPPED: { label: "Pulada", variant: "outline" },
};

function todayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

/** Constrói o Date de hoje no horário "HH:mm" local. */
function slotDate(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function DoseRow({ medication, scheduledFor, log, onMark, isPending }) {
  const status = log?.status ?? "PENDING";
  const { label, variant } = STATUS_LABELS[status] ?? STATUS_LABELS.PENDING;
  const details = [medication.dosage, medication.frequency]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <Pill className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{medication.name}</span>
          <Badge variant={variant} className="text-xs">
            {label}
          </Badge>
        </div>
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {format(scheduledFor, "HH:mm")}
          {details && <span> · {details}</span>}
        </p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        {status === "TAKEN" || status === "SKIPPED" ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground text-xs"
            disabled={isPending}
            onClick={() => onMark("PENDING")}
          >
            Desfazer
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => onMark("TAKEN")}
            >
              <Check className="mr-1 h-4 w-4" />
              Tomou
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => onMark("SKIPPED")}
            >
              <X className="mr-1 h-4 w-4" />
              Pulou
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function DosesPage() {
  const { activePatient } = usePatient();
  const queryClient = useQueryClient();
  const patientId = activePatient?.id;

  const { from, to } = todayRange();

  const { data: medications = [], isLoading: loadingMeds } = useQuery({
    queryKey: ["medications", patientId],
    queryFn: () =>
      api.get(`/patients/${patientId}/medications`).then((r) => r.data),
    enabled: !!patientId,
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["medication-logs", patientId, format(from, "yyyy-MM-dd")],
    queryFn: () =>
      api
        .get(`/patients/${patientId}/medication-logs`, {
          params: { from: from.toISOString(), to: to.toISOString() },
        })
        .then((r) => r.data),
    enabled: !!patientId,
  });

  const markMutation = useMutation({
    mutationFn: ({ medicationId, scheduledFor, status }) =>
      api
        .post(`/patients/${patientId}/medication-logs`, {
          medicationId,
          scheduledFor: scheduledFor.toISOString(),
          status,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medication-logs", patientId],
      });
    },
  });

  if (!activePatient) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>Selecione um paciente para ver as doses do dia.</p>
      </div>
    );
  }

  const isLoading = loadingMeds || loadingLogs;
  const activeMeds = medications.filter((m) => m.isActive);
  const timedMeds = activeMeds.filter((m) => m.times);
  const untimedMeds = activeMeds.filter((m) => !m.times);

  // Uma linha por dose do dia: horários do medicamento + log correspondente
  const logsByKey = new Map(
    logs.map((l) => [
      `${l.medicationId}-${new Date(l.scheduledFor).getTime()}`,
      l,
    ]),
  );

  const slots = timedMeds
    .flatMap((medication) =>
      medication.times.split(",").map((time) => {
        const scheduledFor = slotDate(time.trim());
        const log = logsByKey.get(`${medication.id}-${scheduledFor.getTime()}`);
        return { medication, scheduledFor, log };
      }),
    )
    .sort((a, b) => a.scheduledFor - b.scheduledFor);

  const taken = slots.filter((s) => s.log?.status === "TAKEN").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Doses de hoje</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "dd/MM/yyyy")} — {activePatient.name}
          </p>
        </div>
        {slots.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {taken}/{slots.length} tomadas
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
          Carregando doses…
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Clock className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium">
            Nenhuma dose programada para hoje
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Defina os horários das doses nos medicamentos para acompanhá-las
            aqui.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y pt-2 pb-2">
            {slots.map(({ medication, scheduledFor, log }) => (
              <DoseRow
                key={`${medication.id}-${scheduledFor.getTime()}`}
                medication={medication}
                scheduledFor={scheduledFor}
                log={log}
                isPending={markMutation.isPending}
                onMark={(status) =>
                  markMutation.mutate({
                    medicationId: medication.id,
                    scheduledFor,
                    status,
                  })
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      {untimedMeds.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Sem horários definidos</h2>
          <p className="text-muted-foreground text-xs">
            Estes medicamentos ativos não têm horários cadastrados — edite-os em
            Medicamentos para receber lembretes e acompanhar as doses.
          </p>
          <Card>
            <CardContent className="divide-y pt-2 pb-2">
              {untimedMeds.map((medication) => (
                <div
                  key={medication.id}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{medication.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[medication.dosage, medication.frequency]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
