import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Sparkles, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";

/**
 * Fluxo de cadastro via foto da receita:
 * 1. Usuário envia a foto → backend extrai os medicamentos com IA (nada é salvo)
 * 2. Candidatos aparecem em formulários editáveis para revisão humana
 * 3. Só os confirmados são salvos, com source AI_EXTRACTION + receiptUrl
 */
export default function MedicationExtractDialog({
  open,
  onOpenChange,
  patientId,
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [candidates, setCandidates] = useState(null); // null = ainda não extraiu

  const extractMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("file", file);
      return api
        .post(`/patients/${patientId}/medications/extract`, formData)
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      setReceiptUrl(data.receiptUrl);
      setCandidates(
        data.medications.map((m) => ({
          name: m.name ?? "",
          dosage: m.dosage ?? "",
          frequency: m.frequency ?? "",
          times: m.times ?? "",
        })),
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const valid = candidates.filter((c) => c.name.trim());
      for (const candidate of valid) {
        await api.post(`/patients/${patientId}/medications`, {
          name: candidate.name.trim(),
          dosage: candidate.dosage.trim() || null,
          frequency: candidate.frequency.trim() || null,
          times: candidate.times.trim() || null,
          source: "AI_EXTRACTION",
          receiptUrl,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications", patientId] });
      handleClose(true);
    },
  });

  function setCandidate(index, field, value) {
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function removeCandidate(index) {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClose(force = false) {
    if (!force && (extractMutation.isPending || saveMutation.isPending)) return;
    setFile(null);
    setReceiptUrl(null);
    setCandidates(null);
    extractMutation.reset();
    saveMutation.reset();
    onOpenChange(false);
  }

  const reviewing = candidates !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Ler receita com IA
          </DialogTitle>
          <DialogDescription>
            {reviewing
              ? "Revise os dados extraídos antes de salvar — a IA pode errar."
              : "Envie uma foto da receita e a IA extrai os medicamentos para sua revisão."}
          </DialogDescription>
        </DialogHeader>

        {!reviewing ? (
          /* Etapa 1: enviar foto */
          <div className="flex flex-col gap-4 py-2">
            <div
              role="button"
              tabIndex={0}
              className="border-border hover:border-primary/60 hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                fileInputRef.current?.click()
              }
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0] ?? null;
                if (dropped) setFile(dropped);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Camera className="text-muted-foreground h-7 w-7" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Clique para selecionar ou arraste a foto da receita
                </p>
              )}
              <p className="text-muted-foreground text-xs">JPG, PNG, WEBP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            {extractMutation.isError && (
              <p className="text-destructive text-xs">
                {extractMutation.error?.response?.data?.error ??
                  "Erro ao processar a receita. Tente novamente."}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose()}
                disabled={extractMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!file || extractMutation.isPending}
                onClick={() => extractMutation.mutate()}
              >
                {extractMutation.isPending ? "Analisando…" : "Analisar receita"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Etapa 2: revisar candidatos */
          <div className="flex flex-col gap-4 py-2">
            {candidates.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Nenhum medicamento foi identificado na imagem. Tente outra foto
                ou cadastre manualmente.
              </p>
            ) : (
              candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Extraído por IA
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                      onClick={() => removeCandidate(index)}
                      title="Descartar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`extract-name-${index}`}>
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`extract-name-${index}`}
                      value={candidate.name}
                      onChange={(e) =>
                        setCandidate(index, "name", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`extract-dosage-${index}`}>Dosagem</Label>
                      <Input
                        id={`extract-dosage-${index}`}
                        value={candidate.dosage}
                        onChange={(e) =>
                          setCandidate(index, "dosage", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`extract-frequency-${index}`}>
                        Frequência
                      </Label>
                      <Input
                        id={`extract-frequency-${index}`}
                        value={candidate.frequency}
                        onChange={(e) =>
                          setCandidate(index, "frequency", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`extract-times-${index}`}>
                      Horários das doses
                    </Label>
                    <Input
                      id={`extract-times-${index}`}
                      placeholder="Ex: 08:00, 20:00"
                      value={candidate.times}
                      onChange={(e) =>
                        setCandidate(index, "times", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))
            )}

            {saveMutation.isError && (
              <p className="text-destructive text-xs">
                {saveMutation.error?.response?.data?.error ??
                  "Erro ao salvar os medicamentos. Tente novamente."}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCandidates(null)}
                disabled={saveMutation.isPending}
              >
                Voltar
              </Button>
              {candidates.length > 0 && (
                <Button
                  type="button"
                  disabled={
                    saveMutation.isPending ||
                    candidates.every((c) => !c.name.trim())
                  }
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending
                    ? "Salvando…"
                    : `Salvar ${candidates.filter((c) => c.name.trim()).length} medicamento(s)`}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
