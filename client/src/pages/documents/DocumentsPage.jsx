import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  File,
  FileText,
  Image,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import DocumentUploadDialog from "./DocumentUploadDialog";
import DocumentEditDialog from "./DocumentEditDialog";

// ─── helpers ────────────────────────────────────────────────────────────────

function getFileType(fileUrl = "") {
  const lower = fileUrl.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|webp)$/.test(lower)) return "image";
  return "other";
}

function FileIcon({ fileUrl }) {
  const type = getFileType(fileUrl);
  if (type === "pdf")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <FileText className="h-5 w-5" />
      </div>
    );
  if (type === "image")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Image className="h-5 w-5" />
      </div>
    );
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <File className="h-5 w-5" />
    </div>
  );
}

// ─── DocumentCard ────────────────────────────────────────────────────────────

function DocumentCard({ document, onEdit, onDelete }) {
  const date = (() => {
    try {
      return format(new Date(document.createdAt), "dd/MM/yyyy", {
        locale: ptBR,
      });
    } catch {
      return null;
    }
  })();

  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5 pb-4">
        <FileIcon fileUrl={document.fileUrl} />

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            title={document.title}
          >
            {document.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {date && (
              <span className="text-muted-foreground text-xs">{date}</span>
            )}
            <Badge
              variant={document.source === "AI_EXTRACTION" ? "outline" : "secondary"}
              className="text-xs"
            >
              {document.source === "AI_EXTRACTION" ? "Extraído por IA" : "Manual"}
            </Badge>
          </div>

          {document.aiSummary && (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs">
              {document.aiSummary}
            </p>
          )}

          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Abrir arquivo
          </a>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(document)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(document)}
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

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5 pb-4">
        <div className="bg-muted h-10 w-10 shrink-0 animate-pulse rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── DocumentsPage ───────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { activePatient } = usePatient();
  const queryClient = useQueryClient();
  const patientId = activePatient?.id;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [deletingDocument, setDeletingDocument] = useState(null);

  const {
    data: documents = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["documents", patientId],
    queryFn: () =>
      api.get(`/patients/${patientId}/documents`).then((r) => r.data),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId) =>
      api.delete(`/patients/${patientId}/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      setDeletingDocument(null);
    },
  });

  // ── guard ──────────────────────────────────────────────────────────────────
  if (!activePatient) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        <p>Selecione um paciente para ver os documentos.</p>
      </div>
    );
  }

  // ── content ────────────────────────────────────────────────────────────────
  function renderContent() {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-destructive flex items-center justify-center py-12 text-sm">
          Erro ao carregar documentos. Tente novamente.
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <File className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium">
            Nenhum documento enviado ainda
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Envie um documento usando o botão acima.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onEdit={setEditingDocument}
            onDelete={setDeletingDocument}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Documentos</h1>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Enviar documento
        </Button>
      </div>

      {renderContent()}

      {/* Dialog upload */}
      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        patientId={patientId}
      />

      {/* Dialog edição — key força remontagem ao trocar documento */}
      <DocumentEditDialog
        key={editingDocument?.id ?? "edit-doc"}
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        patientId={patientId}
        document={editingDocument}
      />

      {/* AlertDialog confirmar exclusão */}
      <AlertDialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="text-foreground font-medium">
                {deletingDocument?.title}
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
              onClick={() => deleteMutation.mutate(deletingDocument.id)}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
