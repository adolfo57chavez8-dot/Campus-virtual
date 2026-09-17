"use client";

import { useState } from "react";

const ICONS = {
  pdf: "📄",
  archivo: "📎"
};

export default function DocCard({ titulo, url, tipo }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">
          {ICONS[tipo] || "📎"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-900">{titulo}</p>
          <div className="mt-1 flex gap-3">
            {tipo === "pdf" && (
              <button
                onClick={() => setAbierto((v) => !v)}
                className="text-xs font-semibold uppercase text-brand-600 hover:underline"
              >
                {abierto ? "Ocultar vista previa" : "Ver aquí"}
              </button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold uppercase text-gray-500 hover:underline"
            >
              Abrir / descargar
            </a>
          </div>
        </div>
      </div>

      {abierto && tipo === "pdf" && (
        <iframe
          src={url}
          title={titulo}
          className="h-[70vh] w-full border-t border-gray-100"
        />
      )}
    </div>
  );
}
