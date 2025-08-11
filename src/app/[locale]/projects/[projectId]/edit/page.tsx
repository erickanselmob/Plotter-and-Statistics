"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

export default function EditProjectPage() {
  const params = useParams<{ projectId: string; locale: string }>();
  const projectId = params.projectId;
  const [label, setLabel] = useState("");
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const addBar = async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/bars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, value }),
    });
    if (res.ok) toast.success("Barra adicionada");
    else toast.error("Falha ao adicionar barra");
    setLabel("");
    setValue(0);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">Adicionar barra</h1>
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="space-y-1">
          <Label>Rótulo</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Valor</Label>
          <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
        <Button disabled={loading} onClick={addBar}>
          {loading ? "..." : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}



