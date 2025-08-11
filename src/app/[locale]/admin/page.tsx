import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import UsersTable from "@/components/admin/UsersTable";
import FeedbackTable from "@/components/admin/FeedbackTable";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email || !isAdminEmail(email)) {
    redirect(`/${locale}`);
  }
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { email: true } } } });
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-neutral-600 mt-1">Bem-vindo, {email}.</p>
      </div>
      <div className="grid grid-cols-1 gap-14">
        <section className="bg-white border rounded-lg p-8">
          <h2 className="text-lg font-medium mb-3">Usuários</h2>
          <UsersTable initialUsers={users.map(u => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt.toISOString(), approved: u.approved }))} />
        </section>
        <section className="bg-white border rounded-lg p-8">
          <h2 className="text-lg font-medium mb-3">Feedbacks</h2>
          <FeedbackTable items={feedbacks.map(f => ({ id: f.id, createdAt: f.createdAt.toISOString(), type: f.type as any, title: f.title, message: f.message, userEmail: (f as any).user?.email ?? null }))} />
        </section>
      </div>
    </div>
  );
}


