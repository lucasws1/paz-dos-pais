import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Heart, Pill, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function calcAge(birthDate) {
  try {
    return differenceInYears(new Date(), new Date(birthDate));
  } catch {
    return null;
  }
}

function formatDate(isoString) {
  try {
    return format(new Date(isoString), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return isoString;
  }
}

// ── Estados de carregamento / erro ──────────────────────────────────────────

function CenteredMessage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="text-center">{children}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <CenteredMessage>
      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-rose-500" />
      <p className="text-sm text-gray-600">
        Carregando informações do paciente…
      </p>
    </CenteredMessage>
  );
}

function ErrorState({ status }) {
  const message =
    status === 404
      ? "Link inválido ou inexistente."
      : status === 410
        ? "Este link expirou. Solicite um novo ao responsável."
        : "Não foi possível carregar as informações.";

  return (
    <CenteredMessage>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mx-auto">
        <Heart className="h-8 w-8 text-rose-400" />
      </div>
      <p className="text-base font-medium text-gray-800">{message}</p>
    </CenteredMessage>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function PublicSharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/share/${token}`)
      .then((res) => {
        setData(res.data);
        setStatus("ok");
      })
      .catch((err) => {
        setErrorStatus(err.response?.status ?? null);
        setStatus("error");
      });
  }, [token]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState status={errorStatus} />;

  const { patient, medications = [], documents = [] } = data;
  const age = calcAge(patient.birthDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            <span className="text-base font-semibold text-gray-900">
              Paz dos Pais
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Resumo médico — acesso temporário
          </span>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-2xl space-y-5 px-6 py-8">
        {/* Card do paciente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do paciente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {patient.name}
              </p>
              <p className="text-sm text-gray-500">
                {age !== null ? `${age} anos` : ""}
                {patient.birthDate && (
                  <> · Nascido em {formatDate(patient.birthDate)}</>
                )}
              </p>
            </div>

            {/* Alergias */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Alergias
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(patient.allergies)
                    ? patient.allergies
                    : [patient.allergies]
                  ).map((a, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Alertas */}
            {patient.alerts && patient.alerts.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Alertas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(patient.alerts)
                    ? patient.alerts
                    : [patient.alerts]
                  ).map((a, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4 text-blue-500" />
              Medicamentos em uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhum medicamento registrado.
              </p>
            ) : (
              <ul className="divide-y">
                {medications.map((med, i) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-gray-900">
                      {med.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                      {med.startDate && (
                        <> · Início: {formatDate(med.startDate)}</>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-violet-500" />
              Documentos recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhum documento disponível.
              </p>
            ) : (
              <ul className="divide-y">
                {documents.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {doc.title}
                      </p>
                      {doc.aiSummary && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                          {doc.aiSummary}
                        </p>
                      )}
                      {doc.createdAt && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatDate(doc.createdAt)}
                        </p>
                      )}
                    </div>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        Abrir
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-4 pb-10 text-center">
        <Separator className="mb-6 mx-auto max-w-2xl" />
        <p className="text-xs text-gray-400 px-6">
          Este link é temporário e gerado pelo responsável do paciente. Acesso
          registrado.
        </p>
      </footer>
    </div>
  );
}
