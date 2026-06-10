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

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao criar conta.");
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
          <CardTitle className="text-lg">Criar conta</CardTitle>
          <CardDescription>
            Leva menos de um minuto para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="voce@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repita a senha"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta…" : "Criar conta"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-5 text-center text-sm">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
