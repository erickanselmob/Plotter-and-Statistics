import Link from "next/link";
import { getMessages } from "@/i18n/request";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const m = await getMessages(locale);
  const session: any = await getServerSession(authOptions as any);
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-semibold">Mariana Plotter</h1>
        <p className="text-neutral-600 mt-2">v{process.env.npm_package_version}</p>
      </header>
      <section className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white border rounded-lg p-5">
          <h2 className="text-lg font-medium mb-3">Gráficos disponíveis</h2>
          <ul className="list-disc ml-5 space-y-1 text-neutral-700 text-sm">
            <li>Barras com desvios padrão (erro) por grupo</li>
          </ul>
          <p className="text-sm text-neutral-500 mt-2">Em breve, novas visualizações estarão disponíveis.</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <h2 className="text-lg font-medium mb-3">Testes estatísticos</h2>
          <ul className="list-disc ml-5 space-y-1 text-neutral-700 text-sm">
            <li>Seleção de testes será adicionada em breve</li>
          </ul>
          <p className="text-sm text-neutral-500 mt-2">Mais funcionalidades estatísticas serão liberadas em atualizações futuras.</p>
        </div>
      </section>
      <div className="text-center mt-8">
        <div className="flex justify-center gap-4">
          <Link className="inline-flex items-center rounded-md bg-black text-white px-5 py-2 text-sm hover:bg-neutral-800" href={`/${locale}/login`}>{m.app.login}</Link>
          <Link className="inline-flex items-center rounded-md border px-5 py-2 text-sm hover:bg-neutral-50" href={`/${locale}/register`}>{m.app.register}</Link>
        </div>
      </div>
    </div>
  );
}


