"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function FeedbackPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const [type, setType] = useState<"BUG" | "SUGGESTION">("SUGGESTION");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    const res = await fetch(`/api/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, title, message }) });
    setLoading(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard`);
    } else {
      alert("Falha ao enviar feedback");
    }
  };
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Enviar feedback</h1>
      <div className="space-y-4 bg-white border rounded-lg p-4">
        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select className="border rounded px-3 py-2 w-full" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="SUGGESTION">Sugestão</option>
            <option value="BUG">Bug</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input className="border rounded px-3 py-2 w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resumo curto" />
        </div>
        <div>
          <label className="block text-sm mb-1">Mensagem</label>
          <textarea className="border rounded px-3 py-2 w-full min-h-40" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva sua sugestão ou problema" />
        </div>
        <div className="flex justify-end gap-2">
          <Link className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" href={`/${locale}/dashboard`}>Cancelar</Link>
          <button onClick={submit} disabled={loading} className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50">{loading ? "Enviando..." : "Enviar"}</button>
        </div>
      </div>
    </div>
  );
}


