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

  const inputClass =
    "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
          </div>
          <CardTitle className="text-2xl">Paz dos Pais</CardTitle>
          <CardDescription>Crie sua conta para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                required
                className={inputClass}
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                className={inputClass}
                value={form.email}
                onChange={handleChange}
                placeholder="voce@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                className={inputClass}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repita a senha"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
