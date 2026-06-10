import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="from-accent to-background flex min-h-screen flex-col items-center justify-center bg-gradient-to-b p-4">
      {/* Marca */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-md">
          <Heart className="text-primary-foreground h-6 w-6" fill="currentColor" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Paz dos Pais</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            O acompanhamento médico da sua família em um só lugar
          </p>
        </div>
      </div>

      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta para acompanhar seus pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="voce@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Sua senha"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-5 text-center text-sm">
            Não tem conta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-8 max-w-sm text-center text-xs">
        Medicamentos, consultas e exames organizados — e um resumo seguro para
        levar ao médico.
      </p>
    </div>
  );
}
