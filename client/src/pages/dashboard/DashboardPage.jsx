import { useQuery } from "@tanstack/react-query";
import { differenceInYears, format, isToday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pill, Calendar, FileText, AlertTriangle, QrCode, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/services/api";
import { usePatient } from "@/context/PatientContext";

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <div className={`rounded-md bg-primary/10 p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-none">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MedicationRow({ medication }) {
  const taken = false; // será implementado com MedicationLogs

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Pill className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{medication.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[medication.dosage, medication.frequency].filter(Boolean).join(" · ")}
        </p>
      </div>
      <Badge variant={taken ? "default" : "secondary"}>
        {taken ? "Tomou" : "Pendente"}
      </Badge>
    </div>
  );
}

function AppointmentCard({ appointment }) {
  const date = new Date(appointment.dateTime);

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 text-center">
        <span className="text-xl font-bold text-primary leading-none">
          {format(date, "dd")}
        </span>
        <span className="text-xs font-medium text-primary uppercase">
          {format(date, "MMM", { locale: ptBR })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{appointment.doctorName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[appointment.specialty, format(date, "HH:mm")].filter(Boolean).join(" · ")}
        </p>
        {appointment.notes && (
          <p className="text-xs text-muted-foreground truncate">{appointment.notes}</p>
        )}
      </div>
      <Badge>{appointment.status === "SCHEDULED" ? "Agendada" : appointment.status}</Badge>
    </div>
  );
}

export default function DashboardPage() {
  const { activePatient } = usePatient();

  const patientId = activePatient?.id;

  const { data: medications = [] } = useQuery({
    queryKey: ["medications", patientId],
    queryFn: () => api.get(`/patients/${patientId}/medications`).then((r) => r.data),
    enabled: !!patientId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", patientId],
    queryFn: () => api.get(`/patients/${patientId}/appointments`).then((r) => r.data),
    enabled: !!patientId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", patientId],
    queryFn: () => api.get(`/patients/${patientId}/documents`).then((r) => r.data),
    enabled: !!patientId,
  });

  if (!activePatient) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Nenhum paciente cadastrado. Adicione um para começar.</p>
      </div>
    );
  }

  const activeMeds = medications.filter((m) => m.isActive);
  const todayMeds = activeMeds.slice(0, 3); // mostra os 3 primeiros por ora
  const nextAppointment = appointments
    .filter((a) => a.status === "SCHEDULED" && isFuture(new Date(a.dateTime)))
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];

  const age = activePatient.birthDate
    ? differenceInYears(new Date(), new Date(activePatient.birthDate))
    : null;

  const lastDocument = documents[0];
  const daysSinceLastDoc = lastDocument
    ? Math.floor((Date.now() - new Date(lastDocument.createdAt)) / 86400000)
    : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Painel — {activePatient.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <QrCode className="mr-2 h-4 w-4" />
            Gerar QR code
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </div>
      </div>

      {/* Card do paciente */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-base font-semibold">
              {initials(activePatient.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold">
                {activePatient.name}
                {age !== null && `, ${age} anos`}
              </h2>
              {activePatient.allergies && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Alérgico a {activePatient.allergies}
                </Badge>
              )}
            </div>
            {activePatient.birthDate && (
              <p className="text-sm text-muted-foreground">
                Nascido em {format(new Date(activePatient.birthDate), "dd/MM/yyyy")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Pill}
          label="Remédios ativos"
          value={activeMeds.length}
          sub={`${todayMeds.length} para tomar hoje`}
        />
        <StatCard
          icon={Calendar}
          label="Próxima consulta"
          value={
            nextAppointment
              ? format(new Date(nextAppointment.dateTime), "dd MMM", { locale: ptBR })
              : "—"
          }
          sub={
            nextAppointment
              ? [nextAppointment.specialty, nextAppointment.doctorName]
                  .filter(Boolean)
                  .join(" · ")
              : "Nenhuma agendada"
          }
        />
        <StatCard
          icon={FileText}
          label="Documentos"
          value={documents.length}
          sub={
            daysSinceLastDoc !== null
              ? `Último: ${daysSinceLastDoc === 0 ? "hoje" : `${daysSinceLastDoc} dias atrás`}`
              : "Nenhum enviado"
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Remédios de hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Remédios de hoje</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-0">
              Ver todos
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {todayMeds.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum medicamento ativo
              </p>
            ) : (
              <div className="divide-y">
                {todayMeds.map((med) => (
                  <MedicationRow key={med.id} medication={med} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próxima consulta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Próxima consulta</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-0">
              Ver agenda
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {nextAppointment ? (
              <AppointmentCard appointment={nextAppointment} />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhuma consulta agendada
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
