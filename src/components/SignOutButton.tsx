"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton({ label = "Sair" }: { label?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/pt-BR" })}
      className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
    >
      {label}
    </button>
  );
}


