"use client";
import React from "react";
import JSZip from "jszip";

export default function DownloadAllButton({ filePrefix = "graficos" }: { filePrefix?: string }) {
  const [busy, setBusy] = React.useState(false);
  const handleDownloadAll = async () => {
    const charts = ((window as any).__charts || []) as Array<{ name: string; getPng: () => string | null }>;
    if (!charts.length) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      for (const ch of charts) {
        const dataUrl = ch.getPng && ch.getPng();
        if (!dataUrl) continue;
        const base64 = dataUrl.split(",")[1];
        zip.file(`${sanitize(ch.name)}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${sanitize(filePrefix)}.zip`;
      a.click();
    } finally {
      setBusy(false);
    }
  };
  return (
    <button onClick={handleDownloadAll} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" disabled={busy} title="Baixar todos os gráficos como ZIP">
      {busy ? "Preparando..." : "Baixar todos"}
    </button>
  );
}

function sanitize(s: string) {
  return (s || "grafico").replace(/[^a-zA-Z0-9-_\s]/g, "").replace(/\s+/g, "_");
}


