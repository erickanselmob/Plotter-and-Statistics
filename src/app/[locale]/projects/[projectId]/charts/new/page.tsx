"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1),
});

export default function NewChartPage() {
  const router = useRouter();
  const { projectId, locale } = useParams() as { projectId: string; locale: string };
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const res = await fetch(`/api/charts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: data.name }),
    });
    if (res.ok) {
      const json = await res.json();
      toast.success("Gráfico criado");
      router.push(`/${locale}/charts/${json.id}`);
    } else {
      toast.error("Falha ao criar gráfico");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold">Novo gráfico</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-lg p-6">
        <div className="space-y-1">
          <Label>Nome</Label>
          <Input {...register("name")} />
        </div>
        <Button disabled={formState.isSubmitting}>{formState.isSubmitting ? "..." : "Criar"}</Button>
      </form>
    </div>
  );
}


