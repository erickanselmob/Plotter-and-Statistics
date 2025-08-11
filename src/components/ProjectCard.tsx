"use client";
import Link from "next/link";

export default function ProjectCard({ id, name, description, locale, isOwner, badge, ownerLabel, createdAtISO }: { id: string; name: string; description: string | null; locale: string; isOwner?: boolean; badge?: string; ownerLabel?: string; createdAtISO?: string }) {
  const del = async () => {
    if (!confirm("Excluir este projeto? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    window.location.reload();
  };
  const share = async () => {
    const email = prompt("Compartilhar com qual e-mail?");
    if (!email) return;
    const res = await fetch(`/api/projects/${id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    if (res.ok) alert("Projeto compartilhado"); else alert("Falha ao compartilhar");
  };
  return (
    <div className="group bg-white border rounded-xl p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/${locale}/projects/${id}`} className="text-lg font-medium leading-tight hover:underline">{name}</Link>
          {description && <div className="text-sm text-neutral-600 mt-1 line-clamp-2">{description}</div>}
        </div>
        {badge && (<span className="ml-2 inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-xs">{badge}</span>)}
      </div>
      {ownerLabel && (
        <div className="mt-2 text-xs text-neutral-500">por {ownerLabel} • {createdAtISO ? new Date(createdAtISO).toLocaleString() : null}</div>
      )}
      <div className="mt-3 flex justify-between gap-2">
        <Link href={`/${locale}/projects/${id}`} className="inline-flex items-center rounded-md bg-neutral-900 text-white px-3 py-1.5 text-sm hover:bg-neutral-800">Abrir</Link>
        {isOwner && (
          <div className="flex gap-2">
            <button type="button" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" onClick={share}>Compartilhar</button>
            <button type="button" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" onClick={del}>Excluir</button>
          </div>
        )}
      </div>
    </div>
  );
}


