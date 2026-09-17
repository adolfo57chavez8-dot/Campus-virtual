"use client";

import { useState } from "react";

export default function ImageViewer({ titulo, url }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <>
      <div className="card overflow-hidden">
        <button
          onClick={() => setExpandido(true)}
          className="block aspect-video w-full overflow-hidden bg-gray-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={titulo}
            className="h-full w-full object-contain transition hover:scale-[1.02]"
          />
        </button>
        <div className="p-4">
          <p className="font-semibold text-ink-900">{titulo}</p>
          <p className="text-xs font-semibold uppercase text-brand-600">
            Toca la imagen para verla en grande
          </p>
        </div>
      </div>

      {expandido && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpandido(false)}
        >
          <div className="max-h-full max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="truncate pr-4 font-semibold text-white">{titulo}</p>
              <button
                onClick={() => setExpandido(false)}
                className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
              >
                ✕ Cerrar
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={titulo}
              className="max-h-[80vh] w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
