"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  // "password" = paso 1 (correo + contraseña)
  // "otp"      = paso 2 (código de 6 dígitos enviado por correo)
  const [paso, setPaso] = useState("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");

  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);
  const [segundosReenvio, setSegundosReenvio] = useState(0);

  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const t = setInterval(() => setSegundosReenvio((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [segundosReenvio]);

  // -------------------- PASO 1: correo + contraseña --------------------
  async function handleSubmitPassword(e) {
    e.preventDefault();
    setError("");
    setAviso("");
    setLoading(true);

    // 1) Verificamos que el correo y la contraseña sean correctos.
    const { error: passError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (passError) {
      setLoading(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }

    // 2) Son correctos, pero todavía NO dejamos entrar al usuario:
    //    cerramos esa sesión de inmediato...
    await supabase.auth.signOut();

    // 3) ...y en su lugar le enviamos un código de un solo uso por correo.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    setLoading(false);

    if (otpError) {
      setError(
        otpError.message?.includes("seconds")
          ? "Espera un momento antes de pedir otro código."
          : "No se pudo enviar el código. Intenta de nuevo."
      );
      return;
    }

    setSegundosReenvio(60);
    setPaso("otp");
  }

  // -------------------- PASO 2: código de 6 dígitos --------------------
  async function handleSubmitCodigo(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codigo,
      type: "email"
    });

    setLoading(false);

    if (error) {
      setError("El código es incorrecto o ya expiró. Pide uno nuevo si hace falta.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function reenviarCodigo() {
    if (segundosReenvio > 0) return;
    setError("");
    setAviso("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    setLoading(false);

    if (error) {
      setError("No se pudo reenviar el código. Intenta de nuevo en un momento.");
      return;
    }

    setAviso("Te enviamos un nuevo código a tu correo.");
    setSegundosReenvio(60);
  }

  function volverAlPaso1() {
    setPaso("password");
    setCodigo("");
    setError("");
    setAviso("");
  }

  return (
    <>
      <Navbar />
      <div className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="card w-full max-w-md p-8">
          {paso === "password" ? (
            <>
              <h1 className="text-2xl font-bold text-ink-900">Inicia sesión</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresa para ver tus ciclos, materias y unidades.
              </p>

              <form onSubmit={handleSubmitPassword} className="mt-6 space-y-4">
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
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
                  {loading ? "Verificando..." : "Continuar"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                ¿No tienes cuenta?{" "}
                <Link href="/registro" className="font-semibold text-brand-600">
                  Regístrate
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-ink-900">Ingresa el código</h1>
              <p className="mt-1 text-sm text-gray-500">
                Enviamos un código de 6 dígitos a <strong>{email}</strong>. Es
                de un solo uso y vale por 5 minutos.
              </p>

              <form onSubmit={handleSubmitCodigo} className="mt-6 space-y-4">
                <div>
                  <label className="label">Código de verificación</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    className="input text-center text-2xl font-bold tracking-[0.5em]"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}
                {aviso && (
                  <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    {aviso}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || codigo.length !== 6}
                  className="btn btn-primary w-full py-2.5"
                >
                  {loading ? "Verificando..." : "Verificar e ingresar"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button onClick={volverAlPaso1} className="font-semibold text-gray-500 hover:underline">
                  ← Usar otro correo
                </button>
                <button
                  onClick={reenviarCodigo}
                  disabled={segundosReenvio > 0 || loading}
                  className="font-semibold text-brand-600 hover:underline disabled:text-gray-300"
                >
                  {segundosReenvio > 0 ? `Reenviar en ${segundosReenvio}s` : "Reenviar código"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
