"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  projectId: string;
  rowKey?: string;
  initialColor?: string;
  triggerClassName?: string;
  children: React.ReactNode;
};

export default function StyleDialog({ projectId, rowKey, initialColor = "#3b82f6", triggerClassName = "", children }: Props) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(initialColor);
  const [styleType, setStyleType] = useState<"solid" | "banded" | "colorful" | "grayscale" | "blackwhite">("solid");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const save = async () => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/grid/style`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowKey, style: { color, styleType } }),
    });
    setSaving(false);
    setOpen(false);
    // Refresh server components so the chart updates instantly
    router.refresh();
  };

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)}>{children}</button>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center">
          <div className="bg-white rounded-lg border shadow-lg w-[360px] p-4">
            <div className="font-medium mb-3">Estilo do gráfico</div>
            <p className="text-xs text-neutral-500 mb-1">A cor é usada apenas nos estilos "Cor sólida" e "Alternado".</p>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-neutral-700">Cor da barra</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-neutral-700">Estilo</label>
              <select
                className="border rounded px-2 py-1"
                value={styleType}
                onChange={(e) => setStyleType(e.target.value as any)}
              >
                <option value="solid">Cor sólida</option>
                <option value="banded">Faixas alternadas</option>
                <option value="colorful">Colorido</option>
                <option value="grayscale">Tons de cinza</option>
                <option value="blackwhite">Preto e branco</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded border" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


