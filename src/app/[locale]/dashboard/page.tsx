import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { ArrowRight, Search, ChevronsUpDown } from "lucide-react";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; sort?: string }> }) {
  const { locale } = await params;
  const { q = "", sort = "updated" } = await searchParams;
  const session: any = await getServerSession(authOptions as any);
  if (!session?.user?.email) {
    return (
      <div className="p-8">
        <Link href={`/${locale}/login`} className="underline">Login</Link>
      </div>
    );
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return null;
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId: user.id },
        { shares: { some: { userId: user.id } } },
      ],
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, description: true, createdAt: true, userId: true, user: { select: { email: true, name: true } } },
    orderBy: sort === "name" ? { name: "asc" } : { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projetos</h1>
          <p className="text-sm text-neutral-600 mt-1">Selecione um projeto para visualizar os gráficos ou crie um novo.</p>
        </div>
        <Link href={`/${locale}/projects/new`} className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Novo projeto</Link>
      </div>
      <form className="bg-white border rounded-xl p-4 flex flex-wrap items-center gap-3" method="get">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-neutral-400" />
          <input name="q" defaultValue={q} placeholder="Buscar projetos..." className="pl-8 pr-3 py-2 border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-neutral-600">
          <span>Ordenar por:</span>
          <select name="sort" defaultValue={sort} className="border rounded px-2 py-1">
            <option value="updated">Mais recente</option>
            <option value="name">Nome</option>
          </select>
          <button type="submit" className="inline-flex items-center rounded-md bg-neutral-900 text-white px-3 py-2 text-sm hover:bg-neutral-800">Aplicar</button>
        </div>
      </form>

      {projects.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-neutral-600">
          <p className="mb-4">Você ainda não tem projetos.</p>
          <Link href={`/${locale}/projects/new`} className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Criar meu primeiro projeto</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p: any) => (
            <ProjectCard
              key={p.id}
              id={p.id}
              name={p.name}
              description={p.description}
              locale={locale}
              isOwner={p.userId === user.id}
              badge={p.userId === user.id ? undefined : "Compartilhado"}
              ownerLabel={p.user?.name || p.user?.email || ""}
              createdAtISO={p.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}


