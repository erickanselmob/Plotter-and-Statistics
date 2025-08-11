import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import BarChart from "@/components/BarChart";
const prisma = new PrismaClient();

export default async function ChartPage({ params }: { params: Promise<{ chartId: string; locale: string }> }) {
  const { chartId, locale } = await params;
  const chart = await prisma.chart.findUnique({ where: { id: chartId }, include: { bars: true, project: true } });
  if (!chart) return <div className="p-8">Not found</div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{chart.name}</h1>
        <Link href={`/${locale}/projects/${chart.projectId}/edit-data`} className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50">Editar dados</Link>
      </div>
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <BarChart labels={chart.bars.map((b) => b.label)} values={chart.bars.map((b) => b.value)} />
      </div>
      <Link href={`/${locale}/projects/${chart.projectId}`} className="underline text-sm">Voltar ao projeto</Link>
    </div>
  );
}


