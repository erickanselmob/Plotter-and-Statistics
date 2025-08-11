"use client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export default function NewProjectPage() {
  const router = useRouter();
  const { locale } = useParams() as unknown as { locale: string };
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  const onSubmit = async (data: z.infer<typeof schema>) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Projeto criado");
      router.push(`/${locale}/dashboard`);
    } else {
      toast.error("Falha ao criar projeto");
    }
  };
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Novo projeto</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border rounded-lg p-6">
        <div className="space-y-1">
          <Label>Nome</Label>
          <Input {...register("name")} />
        </div>
        <div className="space-y-1">
          <Label>Descrição</Label>
          <textarea className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" rows={4} {...register("description")} />
        </div>
        <Button disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "..." : "Criar"}
        </Button>
      </form>
    </div>
  );
}



