import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import BarChartCard from "@/components/BarChartCard";
import DownloadAllButton from "@/components/DownloadAllButton";
import StyleDialog from "@/components/StyleDialog";
import ResetStyleButton from "@/components/ResetStyleButton";

const prisma = new PrismaClient();

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string; locale: string }> }) {
  const { projectId, locale } = await params;
  const session: any = await getServerSession(authOptions as any);
  let approved = false;
  if (session?.user?.email) {
    const prismaCheck = new PrismaClient();
    const me = await prismaCheck.user.findUnique({ where: { email: session.user.email as string }, select: { approved: true } });
    approved = !!me?.approved;
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { charts: { select: { id: true, name: true, type: true } }, grid: true, user: { select: { email: true } }, shares: { include: { user: { select: { email: true } } } } },
  });
  if (!project) return <div className="p-8">Not found</div>;
  const columns = (project.grid?.columns as any[] | undefined) ?? null;
  const rows = (project.grid?.rows as any[] | undefined) ?? null;
  const hasGrid = columns && rows && columns.length > 0 && rows.length > 0;
  // Check access: owner or shared
  let hasAccess = false;
  if (session?.user?.email) {
    const me = session.user.email.toLowerCase();
    if (project.user?.email?.toLowerCase() === me) hasAccess = true;
    else if (project.shares?.some((s: any) => s.user?.email?.toLowerCase() === me)) hasAccess = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-neutral-600 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <StyleDialog projectId={projectId} initialColor={(project.grid as any)?.defaultStyle?.color} triggerClassName="text-sm underline">Estilo padrão</StyleDialog>
          <ResetStyleButton projectId={projectId} label="Aplicar estilo padrão a todos" title="Limpa estilos individuais e usa o padrão" resetAll />
          <DownloadAllButton filePrefix={project.name} />
          <Link href={`/${locale}/projects/${project.id}/edit-data`} className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700">Editar dados</Link>
        </div>
      </div>

      {!hasGrid && (
        <div className="bg-white border rounded-lg p-8 text-center text-neutral-600">
          <p>Sem dados ainda.</p>
          <div className="mt-4">
            <Link href={`/${locale}/projects/${project.id}/edit-data`} className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700">Inserir dados</Link>
          </div>
        </div>
      )}

      {hasGrid && approved && hasAccess && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows!.map((row: any, idx: number) => {
            const label = row[columns![0].key] as string;
            // Support paired value/sd columns if present, else fallback to legacy single columns
            const valueCols = columns!.filter((c) => /group\d+_value$/.test(c.key));
            const sdCols = columns!.filter((c) => /group\d+_sd$/.test(c.key));
            let numericValues: number[] = [];
            let errors: number[] = [];
            let groupLabels: string[] = [];
            if (valueCols.length > 0) {
              // Sort by group index to ensure order
              const withIndex = valueCols.map((c) => ({ c, i: Number((c.key.match(/group(\d+)_value$/) || [])[1] || '0') }));
              withIndex.sort((a, b) => a.i - b.i);
              numericValues = withIndex.map(({ c }) => Number(row[c.key] ?? 0));
              groupLabels = withIndex.map(({ c }) => c.name);
              errors = withIndex.map(({ i }) => {
                const sdKey = `group${i}_sd`;
                return Number((row as any)[sdKey] ?? 0);
              });
            } else {
              numericValues = columns!.slice(1).map((c) => Number(row[c.key] ?? 0));
              groupLabels = columns!.slice(1).map((c) => c.name);
              errors = numericValues.map(() => 0);
            }
            const rowKey = row.__key as string | undefined;
            const unit = (row as any).unit || undefined;
            const rowStyle = (project.grid as any)?.rowStyles?.[rowKey!] || {};
            const defaultStyle = (project.grid as any)?.defaultStyle || {};
            const color = rowStyle.color || defaultStyle.color || undefined;
            const styleType = (rowStyle.styleType || defaultStyle.styleType || "solid") as any;
            return (
              <div key={idx} className="bg-white rounded-lg border p-4 hover:shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{label || `Gráfico ${idx + 1}`}</div>
                  {rowKey && (
                    <StyleDialog
                      projectId={projectId}
                      rowKey={rowKey}
                      initialColor={color}
                      triggerClassName="text-sm underline"
                    >Editar estilo</StyleDialog>
                  )}
                  {rowKey && <ResetStyleButton projectId={projectId} rowKey={rowKey} label="Usar estilo padrão" title="Remove o estilo deste gráfico" />}
                </div>
                <BarChartCard chartName={label || `Grafico-${idx + 1}`} labels={groupLabels} values={numericValues} errors={errors} yLabel={unit} color={color} styleType={styleType} />
              </div>
            );
          })}
        </div>
      )}
      {hasGrid && approved && !hasAccess && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6">
          <div className="font-medium mb-1">Sem acesso</div>
          <p className="text-sm">Você não tem permissão para visualizar este projeto.</p>
        </div>
      )}
      {hasGrid && !approved && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6">
          <div className="font-medium mb-1">Conta aguardando aprovação</div>
          <p className="text-sm">Você pode inserir e salvar dados, mas os gráficos só serão exibidos após a aprovação do seu acesso por um administrador.</p>
        </div>
      )}
    </div>
  );
}


