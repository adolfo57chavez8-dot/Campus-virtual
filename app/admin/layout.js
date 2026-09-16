import Link from "next/link";
import Navbar from "@/components/Navbar";

const links = [
  { href: "/admin", label: "Resumen", icon: "🏠" },
  { href: "/admin/ciclos", label: "Ciclos", icon: "🎓" },
  { href: "/admin/materias", label: "Materias", icon: "📚" },
  { href: "/admin/unidades", label: "Unidades", icon: "🗂️" },
  { href: "/admin/contenidos", label: "Archivos y videos", icon: "🎬" }
];

export default function AdminLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="container-app py-8">
        <div className="mb-6">
          <span className="badge bg-ink-900 text-white">Panel de administración</span>
          <h1 className="mt-2 text-2xl font-extrabold text-ink-900">
            Gestión del contenido
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="card h-fit p-3 lg:sticky lg:top-20">
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                >
                  <span>{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
