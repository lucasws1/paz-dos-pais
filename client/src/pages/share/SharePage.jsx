import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Check, QrCode, Plus, Trash2, Eye } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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

const EXPIRY_OPTIONS = [
  { label: "24 horas", value: "24" },
  { label: "48 horas", value: "48" },
  { label: "72 horas", value: "72" },
  { label: "7 dias", value: "168" },
];

function buildShareUrl(token) {
  return `${window.location.origin}/share/${token}`;
}

function formatExpiry(isoString) {
  try {
    return format(new Date(isoString), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  } catch {
    return isoString;
  }
}

function CopyButton({ url }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copiar link
        </>
      )}
    </Button>
  );
}

function QrDialog({ open, onOpenChange, token }) {
  const url = buildShareUrl(token);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code do link</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <QRCodeSVG value={url} size={180} />
          <div className="w-full">
            <Input readOnly value={url} className="text-xs" />
          </div>
          <CopyButton url={url} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TokenCard({ tokenData, onRevoke }) {
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={tokenData.expired ? "secondary" : "default"}>
                {tokenData.expired ? "Expirado" : "Ativo"}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {tokenData.accessCount}{" "}
                {tokenData.accessCount === 1 ? "acesso" : "acessos"}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Expira em: {formatExpiry(tokenData.expiresAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setQrOpen(true)}
            >
              <Eye className="h-4 w-4" />
              Ver QR
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onRevoke(tokenData)}
            >
              <Trash2 className="h-4 w-4" />
              Revogar
            </Button>
          </div>
        </CardContent>
      </Card>

      <QrDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        token={tokenData.token}
      />
    </>
  );
}

export default function SharePage() {
  const { activePatient } = usePatient();
  const queryClient = useQueryClient();
  const patientId = activePatient?.id;

  // Estado do dialog de geração
  const [generateOpen, setGenerateOpen] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [createdToken, setCreatedToken] = useState(null); // resultado da criação

  // Estado do AlertDialog de revogação
  const [revokingToken, setRevokingToken] = useState(null);

  // --- Queries ---
  const {
    data: tokens = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shareTokens", patientId],
    queryFn: () =>
      api.get(`/patients/${patientId}/share`).then((r) => r.data),
    enabled: !!patientId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api
        .post(`/patients/${patientId}/share`, {
          expiresInHours: Number(expiresInHours),
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setCreatedToken(data);
      queryClient.invalidateQueries({ queryKey: ["shareTokens", patientId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (tokenId) =>
      api.delete(`/patients/${patientId}/share/${tokenId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareTokens", patientId] });
      setRevokingToken(null);
    },
  });

  function openGenerate() {
    setCreatedToken(null);
    setExpiresInHours("24");
    setGenerateOpen(true);
  }

  function handleGenerateClose(open) {
    if (!open) {
      setCreatedToken(null);
      setExpiresInHours("24");
    }
    setGenerateOpen(open);
  }

  if (!activePatient) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6">
        <p>Selecione um paciente para gerenciar os links de compartilhamento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Compartilhar com médico</h1>
        <Button size="sm" onClick={openGenerate} className="gap-2">
          <Plus className="h-4 w-4" />
          Gerar novo link
        </Button>
      </div>

      {/* Descrição */}
      <p className="text-muted-foreground max-w-prose text-sm">
        Gere um link temporário para o médico acessar o resumo do paciente sem
        precisar de cadastro. O link expira automaticamente e cada acesso é
        registrado.
      </p>

      <Separator />

      {/* Lista de tokens */}
      {isLoading && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Carregando links…
        </p>
      )}
      {isError && (
        <p className="text-destructive py-8 text-center text-sm">
          Erro ao carregar links de compartilhamento.
        </p>
      )}
      {!isLoading && !isError && tokens.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-14 text-center">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <QrCode className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium">
            Nenhum link gerado ainda
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Clique em "Gerar novo link" para criar um acesso temporário.
          </p>
        </div>
      )}
      {!isLoading && !isError && tokens.length > 0 && (
        <div className="flex flex-col gap-3">
          {tokens.map((t) => (
            <TokenCard
              key={t.id}
              tokenData={t}
              onRevoke={setRevokingToken}
            />
          ))}
        </div>
      )}

      {/* Dialog: gerar novo link */}
      <Dialog open={generateOpen} onOpenChange={handleGenerateClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerar link de acesso</DialogTitle>
          </DialogHeader>

          {/* Etapa 1: configuração */}
          {!createdToken && (
            <>
              <div className="flex flex-col gap-2 py-2">
                <Label htmlFor="expiry-select">Validade do link</Label>
                <Select
                  value={expiresInHours}
                  onValueChange={setExpiresInHours}
                >
                  <SelectTrigger id="expiry-select">
                    <SelectValue placeholder="Selecione a validade" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={createMutation.isPending}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Gerando…" : "Gerar link"}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Etapa 2: resultado */}
          {createdToken && (
            <>
              <div className="flex flex-col items-center gap-4 py-2">
                <QRCodeSVG
                  value={buildShareUrl(createdToken.token)}
                  size={180}
                />
                <div className="w-full">
                  <Input
                    readOnly
                    value={buildShareUrl(createdToken.token)}
                    className="text-xs"
                  />
                </div>
                <CopyButton url={buildShareUrl(createdToken.token)} />
                <p className="text-muted-foreground text-xs">
                  Expira em:{" "}
                  <span className="font-medium text-foreground">
                    {formatExpiry(createdToken.expiresAt)}
                  </span>
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Fechar</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog: confirmar revogação */}
      <AlertDialog
        open={!!revokingToken}
        onOpenChange={(open) => !open && setRevokingToken(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar link</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja revogar este link? Qualquer pessoa que
              tentar acessá-lo receberá um erro. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revokeMutation.isPending}
              onClick={() => revokeMutation.mutate(revokingToken.id)}
            >
              {revokeMutation.isPending ? "Revogando…" : "Revogar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
