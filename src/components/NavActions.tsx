"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function NavActions() {
  const { status, data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? "pt-BR";

  // Hide auth links on the home page so we don't duplicate the page CTA
  const isHome = pathname === `/${locale}` || pathname === "/";

  if (!mounted) return null;

  if (status === "authenticated") {
    const name = (session?.user?.name as string) || (session?.user?.email as string) || "Usuário";
    return (
      <div className="flex items-center gap-4 text-sm relative">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-neutral-50"
          title="Ver projetos"
        >
          Projetos
        </Link>
        <button
          className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-neutral-50"
          onClick={() => setOpen((v) => !v)}
          title="Conta"
        >
          {name}
        </button>
        {open && (
          <div className="absolute right-0 top-10 bg-white border rounded-md shadow p-2 min-w-[220px] z-50">
            <div className="px-3 py-2 text-xs text-neutral-500">{session?.user?.email}</div>
            <Link href={`/${locale}/account`} className="block w-full text-left px-3 py-2 rounded hover:bg-neutral-50">Minha conta</Link>
            {session?.user?.email && session.user.email.toLowerCase() === "erickanselmob@gmail.com" && (
              <Link href={`/${locale}/admin`} className="block w-full text-left px-3 py-2 rounded hover:bg-neutral-50">Admin</Link>
            )}
            <Link href={`/${locale}/feedback`} className="block w-full text-left px-3 py-2 rounded hover:bg-neutral-50">Enviar feedback</Link>
            <button
              className="w-full text-left px-3 py-2 rounded hover:bg-neutral-50"
              onClick={() => signOut({ callbackUrl: `/${locale}` })}
            >
              Sair
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isHome) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href={`/${locale}/login`} className="hover:underline">Entrar</Link>
      <Link href={`/${locale}/register`} className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700">Criar conta</Link>
    </div>
  );
}


