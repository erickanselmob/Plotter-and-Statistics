"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useParams() as unknown as { locale: string };
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Conta criada com sucesso");
      alert("Sua conta foi criada e está aguardando aprovação do administrador. Você poderá acessar os gráficos após a aprovação.");
      router.push(`/${locale}/login`);
    } catch (e: any) {
      setError(e.message || "Error");
      toast.error("Falha ao criar conta");
    }
  };

  return (
    <div className="max-w-sm mx-auto pt-12">
      <h1 className="text-2xl font-semibold mb-6">Criar conta</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <Label className="mb-1">Nome</Label>
          <Input {...register("name")} />
        </div>
        <div>
          <Label className="mb-1">E-mail</Label>
          <Input type="email" {...register("email")} />
        </div>
        <div>
          <Label className="mb-1">Senha</Label>
          <Input type="password" {...register("password")} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "..." : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}



