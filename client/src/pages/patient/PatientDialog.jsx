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
import api from "@/services/api";
import { usePatient } from "@/context/PatientContext";

export default function PatientDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const { setActivePatient } = usePatient();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nameError, setNameError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api
        .post("/patients", {
          name: name.trim(),
          birthDate: birthDate ? new Date(birthDate).toISOString() : null,
        })
        .then((r) => r.data),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setActivePatient({ ...patient, role: "OWNER" });
      handleClose();
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Nome é obrigatório.");
      return;
    }
    mutation.mutate();
  }

  function handleClose() {
    if (mutation.isPending) return;
    setName("");
    setBirthDate("");
    setNameError("");
    mutation.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar paciente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="patient-name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="patient-name"
              placeholder="Ex: Maria da Silva"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
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
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          {mutation.isError && (
            <p className="text-destructive text-xs">
              Ocorreu um erro ao criar o paciente. Tente novamente.
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
              {mutation.isPending ? "Criando…" : "Criar paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
