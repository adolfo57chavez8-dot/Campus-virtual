"use client";

import { useState } from "react";

export default function VideoPlayer({ titulo, videoId }) {
  const [expandido, setExpandido] = useState(false);

  if (!videoId) {
    return (
      <div className="card overflow-hidden">
        <div className="flex aspect-video items-center justify-center bg-black text-sm text-gray-400">
          Video no disponible
        </div>
        <div className="p-4">
          <p className="font-semibold text-ink-900">{titulo}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="group relative aspect-video w-full bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <button
            onClick={() => setExpandido(true)}
            className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-90 hover:bg-black/90"
            title="Ver en pantalla grande"
          >
            ⛶ Pantalla grande
          </button>
        </div>
        <div className="p-4">
          <p className="font-semibold text-ink-900">{titulo}</p>
        </div>
      </div>

      {expandido && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpandido(false)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="truncate pr-4 font-semibold text-white">{titulo}</p>
              <button
                onClick={() => setExpandido(false)}
                className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
              >
                ✕ Cerrar
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                title={titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
