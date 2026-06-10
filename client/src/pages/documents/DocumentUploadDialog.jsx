import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
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
import api from "@/services/api";

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

export default function DocumentUploadDialog({ open, onOpenChange, patientId }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [titleError, setTitleError] = useState("");
  const [fileError, setFileError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (aiSummary.trim()) formData.append("aiSummary", aiSummary.trim());
      formData.append("source", "MANUAL");
      return api
        .post(`/patients/${patientId}/documents`, formData)
        .then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      handleClose();
    },
  });

  function handleFileChange(e) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setFileError("");
    if (selected && !title) {
      setTitle(stripExtension(selected.name));
      setTitleError("");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (!dropped) return;
    setFile(dropped);
    setFileError("");
    if (!title) {
      setTitle(stripExtension(dropped.name));
      setTitleError("");
    }
  }

  function validate() {
    let valid = true;
    if (!file) {
      setFileError("Selecione um arquivo.");
      valid = false;
    }
    if (!title.trim()) {
      setTitleError("Título é obrigatório.");
      valid = false;
    }
    return valid;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  function handleClose() {
    if (mutation.isPending) return;
    setFile(null);
    setTitle("");
    setAiSummary("");
    setTitleError("");
    setFileError("");
    mutation.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Área de upload */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Arquivo <span className="text-destructive">*</span>
            </Label>
            <div
              role="button"
              tabIndex={0}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors
                ${fileError ? "border-destructive" : "border-border hover:border-primary/60 hover:bg-muted/40"}
              `}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                fileInputRef.current?.click()
              }
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="text-muted-foreground h-7 w-7" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Clique para selecionar ou arraste um arquivo
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                PDF, JPG, PNG, WEBP
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileError && (
              <p className="text-destructive text-xs">{fileError}</p>
            )}
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doc-title"
              placeholder="Ex: Exame de sangue - junho"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError("");
              }}
            />
            {titleError && (
              <p className="text-destructive text-xs">{titleError}</p>
            )}
          </div>

          {/* Resumo / observações */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-summary">Resumo / observações</Label>
            <Textarea
              id="doc-summary"
              placeholder="Anotações ou resumo gerado por IA (opcional)"
              rows={3}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="text-destructive text-xs">
              Ocorreu um erro ao enviar o documento. Tente novamente.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
