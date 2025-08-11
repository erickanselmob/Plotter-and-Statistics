"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
  rowKey?: string;
  label: string;
  title?: string;
  className?: string;
  confirmMessage?: string;
  resetAll?: boolean;
};

export default function ResetStyleButton({ projectId, rowKey, label, title, className = "text-sm underline", confirmMessage = "Aplicar estilo padrão?", resetAll = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    await fetch(`/api/projects/${projectId}/grid/style`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resetAll ? { resetAll: true } : { rowKey, reset: true }),
    });
    setLoading(false);
    router.refresh();
  };
  return (
    <button className={className} title={title} onClick={onClick} disabled={loading}>
      {loading ? "Aplicando..." : label}
    </button>
  );
}


