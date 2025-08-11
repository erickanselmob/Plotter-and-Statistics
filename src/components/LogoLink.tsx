"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

export default function LogoLink() {
  const { status } = useSession();
  const { locale } = (useParams() as { locale?: string }) ?? { locale: "pt-BR" };
  const href = status === "authenticated" ? `/${locale}/dashboard` : `/${locale}`;
  return (
    <Link href={href} className="font-semibold tracking-tight">
      Mariana Plotter
    </Link>
  );
}


