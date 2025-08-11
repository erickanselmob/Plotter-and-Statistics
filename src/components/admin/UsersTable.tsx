"use client";
import React from "react";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string; // ISO string
  approved: boolean;
};

export default function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = React.useState<UserRow[]>(initialUsers);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  const approve = async (userId: string, approved: boolean) => {
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved }),
      });
      if (res.ok) {
        setUsers((list) => list.map((u) => (u.id === userId ? { ...u, approved } : u)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) return;
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((list) => list.filter((u) => u.id !== userId));
      }
    } finally {
      setBusyId(null);
    }
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-3 py-2 text-sm w-full md:w-72"
          placeholder="Buscar por email ou nome"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2 font-medium">Email</th>
          <th className="py-2 font-medium">Nome</th>
          <th className="py-2 font-medium">Criado em</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((u) => (
          <tr key={u.id} className="border-b last:border-0 odd:bg-neutral-50">
            <td className="py-2 break-all">{u.email}</td>
            <td className="py-2 break-all">{u.name}</td>
            <td className="py-2">{new Date(u.createdAt).toLocaleString()}</td>
            <td className="py-2">
              {u.approved ? (
                <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5">Aprovado</span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-50 text-yellow-700 px-2 py-0.5">Pendente</span>
              )}
            </td>
            <td className="py-2 text-right space-x-2">
              {u.approved ? (
                <button
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
                  onClick={() => approve(u.id, false)}
                  disabled={busyId === u.id}
                >
                  Revogar
                </button>
              ) : (
                <button
                  className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-xs hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => approve(u.id, true)}
                  disabled={busyId === u.id}
                >
                  Aprovar
                </button>
              )}
              <button
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:opacity-50"
                onClick={() => removeUser(u.id)}
                disabled={busyId === u.id}
              >
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}


