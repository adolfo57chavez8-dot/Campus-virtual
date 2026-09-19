"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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

function formatoTiempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
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
  const [verPassword, setVerPassword] = useState(false);

  // Código como arreglo de 6 casillas individuales
  const [digitos, setDigitos] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [loading, setLoading] = useState(false);
  const [segundosReenvio, setSegundosReenvio] = useState(0);
  const [segundosExpiracion, setSegundosExpiracion] = useState(300);

  // Cuenta regresiva para reenviar código
  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const t = setInterval(() => setSegundosReenvio((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [segundosReenvio]);

  // Cuenta regresiva de expiración del código (5 minutos)
  useEffect(() => {
    if (paso !== "otp" || segundosExpiracion <= 0) return;
    const t = setInterval(() => setSegundosExpiracion((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paso, segundosExpiracion]);

  const codigoCompleto = digitos.join("");
  const expirado = paso === "otp" && segundosExpiracion <= 0;

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
      setError("El usuario o la contraseña son incorrectos.");
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

    setDigitos(["", "", "", "", "", ""]);
    setSegundosReenvio(60);
    setSegundosExpiracion(300);
    setPaso("otp");
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }

  // -------------------- Manejo de las 6 casillas --------------------
  function handleDigitoChange(index, value) {
    const limpio = value.replace(/\D/g, "");
    if (!limpio) {
      const copia = [...digitos];
      copia[index] = "";
      setDigitos(copia);
      return;
    }

    const copia = [...digitos];
    // Si el usuario pega varios dígitos de una vez en una casilla
    const caracteres = limpio.split("");
    let i = index;
    for (const c of caracteres) {
      if (i > 5) break;
      copia[i] = c;
      i++;
    }
    setDigitos(copia);

    const siguiente = Math.min(i, 5);
    inputsRef.current[siguiente]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  // -------------------- PASO 2: verificar código --------------------
  async function handleSubmitCodigo(e) {
    e.preventDefault();
    if (expirado) return;
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codigoCompleto,
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

    setDigitos(["", "", "", "", "", ""]);
    setAviso("Te enviamos un nuevo código a tu correo.");
    setSegundosReenvio(60);
    setSegundosExpiracion(300);
    inputsRef.current[0]?.focus();
  }

  function volverAlPaso1() {
    setPaso("password");
    setDigitos(["", "", "", "", "", ""]);
    setError("");
    setAviso("");
  }

  return (
    <>
      <Navbar />
      <div className="container-app flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="card w-full max-w-sm p-8">
          {/* Encabezado con la marca propia (nunca logos externos) */}
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-extrabold text-white shadow-card">
              CV
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-400">
              Campus Virtual
            </p>
          </div>

          {paso === "password" ? (
            <>
              <h1 className="text-center text-2xl font-extrabold text-ink-900">
                Iniciar sesión
              </h1>

              <form onSubmit={handleSubmitPassword} className="mt-6 space-y-4">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconoCorreo />
                  </span>
                  <input
                    type="email"
                    required
                    className="input pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <IconoCandado />
                  </span>
                  <input
                    type={verPassword ? "text" : "password"}
                    required
                    className="input pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <IconoOjo abierto={verPassword} />
                  </button>
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
                  {loading ? "Verificando..." : "Iniciar sesión"}
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
              <h1 className="text-center text-2xl font-extrabold text-ink-900">
                Doble factor de autenticación
              </h1>
              <p className="mt-2 text-center text-sm text-gray-500">
                Ingresa el código de verificación enviado a{" "}
                <strong className="text-gray-700">{email}</strong>
              </p>

              <form onSubmit={handleSubmitCodigo} className="mt-6">
                <div className="flex justify-center gap-2">
                  {digitos.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={d}
                      onChange={(e) => handleDigitoChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="h-14 w-11 rounded-xl border border-gray-300 text-center text-xl font-bold text-ink-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      disabled={expirado}
                    />
                  ))}
                </div>

                <p
                  className={`mt-4 text-center text-sm font-semibold ${
                    expirado ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {expirado
                    ? "El código expiró. Pide uno nuevo."
                    : `El código caduca en: ${formatoTiempo(segundosExpiracion)}`}
                </p>

                {error && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
                    {error}
                  </p>
                )}
                {aviso && (
                  <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
                    {aviso}
                  </p>
                )}

                <div className="mt-6 space-y-2">
                  <button
                    type="submit"
                    disabled={loading || expirado || codigoCompleto.length !== 6}
                    className="btn btn-primary w-full py-2.5"
                  >
                    {loading ? "Verificando..." : "Verificar código"}
                  </button>
                  <button type="button" onClick={volverAlPaso1} className="btn btn-outline w-full py-2.5">
                    Cancelar
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  onClick={reenviarCodigo}
                  disabled={segundosReenvio > 0 || loading}
                  className="font-semibold text-brand-600 hover:underline disabled:text-gray-300"
                >
                  {segundosReenvio > 0 ? `Reenviar código en ${segundosReenvio}s` : "Reenviar código"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function IconoCorreo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconoCandado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconoOjo({ abierto }) {
  if (abierto) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
      <path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13.3 13.3 0 0 1-3.4 4.3M6.6 6.6C4 8.3 2 12 2 12a13.4 13.4 0 0 0 5 5.6" />
    </svg>
  );
}
