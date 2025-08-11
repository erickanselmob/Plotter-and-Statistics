"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const res = await fetch(`/api/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, currentPassword, newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      alert("Informações atualizadas");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Falha ao atualizar");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Minha conta</h1>
      <div className="bg-white border rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="text-sm text-neutral-600">Para alterar a senha, informe a atual e a nova.</div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm mb-1">Senha atual</label>
            <input type="password" className="border rounded px-3 py-2 w-full" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Nova senha</label>
            <input type="password" className="border rounded px-3 py-2 w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Link className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" href={`/${locale}/dashboard`}>Cancelar</Link>
          <button onClick={save} disabled={loading} className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50">{loading ? "Salvando..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}


