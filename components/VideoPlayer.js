"use client";

export default function VideoPlayer({ titulo, videoId }) {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-video w-full bg-black">
        {videoId ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Video no disponible
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-ink-900">{titulo}</p>
      </div>
    </div>
  );
}
