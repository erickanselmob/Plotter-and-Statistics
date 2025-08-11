"use client";
import React from "react";

type FeedbackRow = {
  id: string;
  createdAt: string; // ISO
  type: string;
  title: string;
  message: string;
  userEmail: string | null;
};

export default function FeedbackTable({ items }: { items: FeedbackRow[] }) {
  const [open, setOpen] = React.useState<FeedbackRow | null>(null);
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) =>
      (f.title || "").toLowerCase().includes(q) ||
      (f.userEmail || "").toLowerCase().includes(q) ||
      (f.type || "").toLowerCase().includes(q)
    );
  }, [items, query]);
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 text-sm w-full md:w-72"
          placeholder="Buscar por título, email ou tipo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 font-medium">Quando</th>
            <th className="py-2 font-medium">Tipo</th>
            <th className="py-2 font-medium">Quem</th>
            <th className="py-2 font-medium">Título</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((f) => (
            <tr key={f.id} className="border-b last:border-0 cursor-pointer hover:bg-neutral-50 odd:bg-neutral-50/50" onClick={() => setOpen(f)}>
              <td className="py-2">{new Date(f.createdAt).toLocaleString()}</td>
              <td className="py-2">{f.type}</td>
              <td className="py-2 break-all">{f.userEmail}</td>
              <td className="py-2">{f.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-lg border shadow-lg w-[560px] max-w-[95vw] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{open.title}</div>
              <button className="text-sm underline" onClick={() => setOpen(null)}>Fechar</button>
            </div>
            <div className="text-xs text-neutral-500 mb-3">
              {new Date(open.createdAt).toLocaleString()} • {open.type} • {open.userEmail}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-neutral-800">{open.message}</pre>
          </div>
        </div>
      )}
    </>
  );
}


