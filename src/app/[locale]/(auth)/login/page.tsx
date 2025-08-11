"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useParams() as unknown as { locale: string };
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError(null);
    const res = await signIn("credentials", { ...data, redirect: false });
    if (res?.ok) {
      toast.success("Bem-vindo de volta!");
      router.push(`/${locale}/dashboard`);
    } else {
      setError("Credenciais inválidas");
      toast.error("Falha ao entrar");
    }
  };

  return (
    <div className="max-w-sm mx-auto pt-12">
      <h1 className="text-2xl font-semibold mb-6">Entrar</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border rounded-lg p-6">
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
          {formState.isSubmitting ? "..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}



