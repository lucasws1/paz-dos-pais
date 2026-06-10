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
import api from "@/services/api";

export default function DocumentEditDialog({
  open,
  onOpenChange,
  patientId,
  document,
}) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(document?.title ?? "");
  const [aiSummary, setAiSummary] = useState(document?.aiSummary ?? "");
  const [titleError, setTitleError] = useState("");

  const mutation = useMutation({
    mutationFn: (data) =>
      api
        .put(`/patients/${patientId}/documents/${document.id}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
      onOpenChange(false);
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Título é obrigatório.");
      return;
    }
    mutation.mutate({
      title: title.trim(),
      aiSummary: aiSummary.trim() || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-doc-title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-doc-title"
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

          {/* Resumo */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-doc-summary">Resumo / observações</Label>
            <Textarea
              id="edit-doc-summary"
              placeholder="Resumo ou observações (opcional)"
              rows={4}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
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
