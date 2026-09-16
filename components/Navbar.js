"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/constants";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const admin = isAdminEmail(user?.email);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
            CV
          </span>
          <span className="text-lg tracking-tight">Campus Virtual</span>
        </Link>

        <nav className="flex items-center gap-2">
          {!loading && admin && (
            <Link href="/admin" className="btn btn-outline hidden sm:inline-flex">
              Panel admin
            </Link>
          )}
          {!loading && user && (
            <>
              <span className="hidden text-sm text-gray-500 md:inline">
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn btn-ghost">
                Cerrar sesión
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="btn btn-ghost">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn btn-primary">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
