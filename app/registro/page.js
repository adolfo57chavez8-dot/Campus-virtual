"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function RegistroPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined
      }
    });

    setLoading(false);

    if (error) {
      setError(error.message || "No se pudo crear la cuenta.");
      return;
    }

    setOk(true);
  }

  return (
    <>
      <Navbar />
      <div className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="card w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-ink-900">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Regístrate para acceder a los ciclos, materias y unidades.
          </p>

          {ok ? (
            <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Cuenta creada. Revisa tu correo para confirmar tu cuenta y luego
              inicia sesión.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
                {loading ? "Creando..." : "Crear cuenta"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-brand-600">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
