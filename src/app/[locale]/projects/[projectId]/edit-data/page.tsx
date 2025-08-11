"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Minus, ClipboardPaste, Clipboard, Save as SaveIcon, Settings2, Sigma } from "lucide-react";
import { DataGrid, SelectColumn } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

type Col = { key: string; name: string; width?: number };
type Row = Record<string, any> & { __key?: string };

export default function EditProjectDataPage() {
  const { projectId, locale } = useParams() as { projectId: string; locale: string };
  const router = useRouter();
  const [columns, setColumns] = useState<Col[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set());
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  const [defaultStyle, setDefaultStyle] = useState<any>({ color: "#3b82f6" });
  const [rowStyles, setRowStyles] = useState<Record<string, any>>({});
  const [includeUnitOnPaste, setIncludeUnitOnPaste] = useState(false);
  const [recentCols, setRecentCols] = useState<string[]>([]);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useState<HTMLCanvasElement | null>(null)[0] || (typeof document !== 'undefined' ? document.createElement('canvas') : null);

  const makeKey = () =>
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random()}`;

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/projects/${projectId}/grid`);
      if (res.ok) {
        const json = await res.json();
        if (json.columns && json.rows) {
          // Filter out any legacy N columns and ensure 'unit' column exists after name
          let filteredCols = (json.columns as Col[]).filter((c: Col) => !/\_n$/.test(c.key));
          const hasUnit = filteredCols.some((c) => c.key === "unit");
          if (!hasUnit) {
            filteredCols = [filteredCols[0], { key: "unit", name: "Unidade" }, ...filteredCols.slice(1)];
          }
          const filteredRows = (json.rows as Row[]).map((r: Row) => {
            const copy: any = { __key: r.__key ?? makeKey() };
            filteredCols.forEach((c) => {
              if (c.key === "unit") {
                copy[c.key] = (r as any)[c.key] ?? "";
              } else {
                copy[c.key] = (r as any)[c.key];
              }
            });
            // ensure name exists
            if (typeof copy[filteredCols[0]?.key] === 'undefined') copy[filteredCols[0]?.key ?? 'name'] = '';
            return copy;
          });
          setColumns(filteredCols);
          setRows(filteredRows);
          if (json.defaultStyle) setDefaultStyle(json.defaultStyle);
          if (json.rowStyles) setRowStyles(json.rowStyles);
        } else {
          // Default: first column is Plot name, 3 groups
          setColumns([
            { key: "name", name: "Nome do gráfico" },
            { key: "unit", name: "Unidade" },
            { key: "group1_value", name: "G1" },
            { key: "group1_sd", name: "G1 (DP)" },
            { key: "group2_value", name: "G2" },
            { key: "group2_sd", name: "G2 (DP)" },
            { key: "group3_value", name: "G3" },
            { key: "group3_sd", name: "G3 (DP)" },
          ]);
          setRows(() => [{ __key: makeKey(), name: "", unit: "", group1_value: 0, group1_sd: 0, group2_value: 0, group2_sd: 0, group3_value: 0, group3_sd: 0 }]);
        }
      }
    })();
  }, [projectId]);

  const emptyRow = () => {
    const base: Row = { __key: makeKey() };
    columns.forEach((c, idx) => {
      if (idx === 0) base[c.key] = ""; // name
      else if (c.key === "unit") base[c.key] = "";
      else base[c.key] = 0;
    });
    return base;
  };

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const addColumn = () => {
    // Determine next group index by counting existing value columns
    const currentGroupCount = columns.filter((c) => /group\d+_value$/.test(c.key)).length;
    const next = currentGroupCount + 1;
    const valueKey = `group${next}_value`;
    const sdKey = `group${next}_sd`;
    setColumns((c) => [...c, { key: valueKey, name: `G${next}` }, { key: sdKey, name: `G${next} (DP)` }]);
    setRows((r) => r.map((row) => ({ ...row, [valueKey]: row[valueKey] ?? 0, [sdKey]: row[sdKey] ?? 0 })));
    setRecentCols([valueKey, sdKey]);
    toast.success(`Adicionadas colunas G${next} e G${next} (DP)`);
  };

  // Auto-fit column widths based on header and sampled cell contents
  useEffect(() => {
    if (recentCols.length === 0) return;
    const el = gridContainerRef.current?.querySelector('.rdg') as HTMLElement | null;
    if (el) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
    const t = setTimeout(() => setRecentCols([]), 1500);
    return () => clearTimeout(t);
  }, [recentCols]);

  useEffect(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;
    ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    const measure = (text: string) => Math.ceil(ctx.measureText(text ?? '').width);
    const sampleCount = Math.min(rows.length, 80);
    const newCols = columns.map((c) => {
      const headerW = measure(c.name) + 28; // padding
      let cellW = 0;
      for (let i = 0; i < sampleCount; i++) {
        const v = rows[i]?.[c.key];
        const s = typeof v === 'number' && Number.isFinite(v) ? String(v) : String(v ?? '');
        cellW = Math.max(cellW, measure(s));
      }
      const isText = c.key === 'name' || c.key === 'unit';
      const min = isText ? 140 : 80;
      const max = isText ? 320 : 160;
      const width = Math.max(min, Math.min(max, Math.ceil(Math.max(headerW, cellW + 24))));
      return { ...c, width } as Col;
    });
    // only update if widths changed
    const changed = newCols.some((nc, i) => Math.abs((nc.width ?? 0) - (columns[i]?.width ?? 0)) > 1);
    if (changed) setColumns(newCols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns.map((c) => `${c.key}:${c.name}`).join('|')]);

  const removeLastColumn = () => {
    if (columns.length <= 1) return; // keep first column
    // Remove last group pair (value+sd)
    const lastValueIdx = [...columns].map((c, i) => (/group\d+_value$/.test(c.key) ? i : -1)).filter((i) => i >= 0).pop();
    if (lastValueIdx == null) return;
    const pair = [lastValueIdx, lastValueIdx + 1];
    const removedKeys = pair.map((i) => columns[i]?.key).filter(Boolean) as string[];
    setColumns((c) => c.filter((_, i) => i !== pair[0] && i !== pair[1]));
    setRows((r) => r.map((row) => {
      const copy: any = { ...row };
      removedKeys.forEach((k) => delete copy[k]);
      return copy;
    }));
  };

  const removeSelectedRows = () => {
    if (selectedRows.size === 0) return;
    setRows((r) => r.filter((row) => !selectedRows.has(row.__key as string)));
    setSelectedRows(new Set());
  };

  const removeLastRow = () => {
    setRows((r) => (r.length > 0 ? r.slice(0, -1) : r));
  };

  const save = async () => {
    setLoading(true);
    const sanitized = rows.map((row) => {
      const out: any = { __key: row.__key };
      columns.forEach((c, idx) => {
        const v = row[c.key];
        if (c.key === 'name' || c.key === 'unit') {
          out[c.key] = v ?? "";
        } else {
          out[c.key] = Number(v ?? 0);
        }
      });
      return out;
    });
    const res = await fetch(`/api/projects/${projectId}/grid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns, rows: sanitized, defaultStyle, rowStyles }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Dados salvos");
      router.push(`/${locale}/projects/${projectId}`);
    } else {
      toast.error("Falha ao salvar");
    }
  };

  const parseClipboardTable = (text: string): string[][] => {
    const rows = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((r) => r.trim().length > 0)
      .map((line) => (line.includes("\t") ? line.split("\t") : line.split(",")));
    return rows;
  };

  const [useFirstRowAsHeaders, setUseFirstRowAsHeaders] = useState(false);

  const extractFirstNumber = (v: any) => {
    const m = String(v ?? "").match(/-?\d+(?:[.,]\d+)?/);
    return m ? Number(m[0].replace(',', '.')) : 0;
  };

  const extractMeanSd = (v: any): { mean: number; sd: number } => {
    const s = String(v ?? "");
    const nums = s.match(/-?\d+(?:[.,]\d+)?/g);
    if (!nums || nums.length === 0) return { mean: 0, sd: 0 };
    const mean = Number(nums[0].replace(',', '.'));
    const sd = nums[1] ? Number(nums[1].replace(',', '.')) : 0;
    return { mean, sd };
  };

  const parseCellAuto = (v: any): { mean: number; sd: number } => {
    const s = String(v ?? "");
    const nums = s.match(/-?\d+(?:[.,]\d+)?/g);
    if (nums && nums.length >= 1) {
      const mean = Number(nums[0].replace(',', '.'));
      const sd = nums[1] ? Number(nums[1].replace(',', '.')) : 0;
      return { mean: isNaN(mean) ? 0 : mean, sd: isNaN(sd) ? 0 : sd };
    }
    const num = Number(s);
    return { mean: isNaN(num) ? 0 : num, sd: 0 };
  };

  const pasteTable = useCallback(
    (
      text: string,
      mode: 'plain' | 'first-number' | 'mean-sd' = 'plain',
    ) => {
      const table = parseClipboardTable(text);
      if (table.length === 0) return;
      let targetColCount = 0;
      let headerNames: string[] = [];
      let dataRows: string[][] = [];

      if (useFirstRowAsHeaders) {
        headerNames = table[0].map((h) => (h ?? '').toString());
        dataRows = table.slice(1);
        targetColCount = Math.max(headerNames.length, ...dataRows.map((r) => r.length));
      } else {
        dataRows = table;
        targetColCount = Math.max(columns.length || 1, ...dataRows.map((r) => r.length));
        // Fill header names from existing or defaults
        headerNames = Array.from({ length: targetColCount }, (_, i) => {
          if (i === 0) return columns[0]?.name ?? 'Nome do gráfico';
          return columns[i]?.name ?? `G${i}`;
        });
      }

      // Determine how many group columns exist in the paste source
      const startIdxForGroups = includeUnitOnPaste ? 2 : 1; // 0: name, 1: unit (optional)
      const groupHeaderNames = useFirstRowAsHeaders ? headerNames.slice(startIdxForGroups) : [];
      const targetGroupCount = Math.max(
        groupHeaderNames.length,
        ...dataRows.map((r) => Math.max(0, r.length - startIdxForGroups))
      );

      // Build columns to fit the data set: name, unit, then pairs (value, sd) for each group
      const newColumns: Col[] = [
        { key: 'name', name: headerNames[0] ?? 'Nome do gráfico' },
        { key: 'unit', name: 'Unidade' },
      ];
      for (let i = 1; i <= targetGroupCount; i++) {
        const baseName = (groupHeaderNames[i - 1] ?? `G${i}`).toString();
        newColumns.push({ key: `group${i}_value`, name: baseName });
        newColumns.push({ key: `group${i}_sd`, name: `${baseName} (DP)` });
      }

      // Build rows
      const newRows: Row[] = dataRows.map((arr) => {
        const r: Row = { __key: makeKey() };
        // first column: label
        r['name'] = arr[0] ?? '';
        r['unit'] = includeUnitOnPaste ? (arr[1] ?? '') : '';
        for (let i = 1; i <= targetGroupCount; i++) {
          const cell = arr[startIdxForGroups + (i - 1)];
          if (mode === 'mean-sd') {
            const { mean, sd } = extractMeanSd(cell);
            r[`group${i}_value`] = mean;
            r[`group${i}_sd`] = sd;
          } else if (mode === 'first-number') {
            const mean = extractFirstNumber(cell);
            r[`group${i}_value`] = mean;
            r[`group${i}_sd`] = 0;
          } else {
            const { mean, sd } = parseCellAuto(cell);
            r[`group${i}_value`] = mean;
            r[`group${i}_sd`] = sd;
          }
        }
        return r;
      });

      setColumns(newColumns);
      setRows(newRows.length > 0 ? newRows : [emptyRow()]);
    },
    [columns, useFirstRowAsHeaders]
  );

  // Removed global onPaste handler to allow normal Ctrl+V behavior inside cells

  const pasteFromClipboard = async (mode: 'plain' | 'first-number' | 'mean-sd' = 'plain') => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) pasteTable(text, mode);
    } catch {
      toast.error("Permissão negada para ler a área de transferência. Use Ctrl+V na área de colagem.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-start mb-2">
        <Link href={`/${locale}/projects/${projectId}`}>
          <Button variant="outline" title="Voltar para a visualização dos gráficos deste projeto"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar aos gráficos</Button>
        </Link>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <fieldset className="lg:col-span-5">
            <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600 mb-2">Estrutura</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button variant="outline" onClick={addRow} title="Adiciona uma nova linha ao final da tabela"><Plus className="mr-2 h-4 w-4"/>Adicionar linha</Button>
              <Button variant="outline" onClick={addColumn} title="Adiciona uma nova coluna (grupo)"><Plus className="mr-2 h-4 w-4"/>Adicionar coluna</Button>
              <Button variant="outline" onClick={removeSelectedRows} title="Remove todas as linhas selecionadas à esquerda"><Minus className="mr-2 h-4 w-4"/>Remover linhas</Button>
              <Button variant="outline" onClick={removeLastRow} title="Remove a última linha da tabela"><Minus className="mr-2 h-4 w-4"/>Última linha</Button>
              <Button variant="outline" onClick={removeLastColumn} title="Remove a última coluna (grupo)"><Minus className="mr-2 h-4 w-4"/>Última coluna</Button>
              <Button variant="outline" onClick={() => setShowHeaderEditor((v) => !v)} title="Permite editar o texto dos cabeçalhos das colunas"><Settings2 className="mr-2 h-4 w-4"/>{showHeaderEditor ? "Ocultar cabeçalhos" : "Editar cabeçalhos"}</Button>
            </div>
          </fieldset>
          <fieldset className="lg:col-span-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600 mb-2">Colar</legend>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => pasteFromClipboard('plain')} title="Cola a tabela do Excel/Sheets como está (valores numéricos); DP será 0"><ClipboardPaste className="mr-2 h-4 w-4"/>Colar tabela</Button>
                <Button variant="outline" onClick={() => pasteFromClipboard('mean-sd')} title="Cola células no formato 'valor ± desvio', preenchendo valor e DP"><Sigma className="mr-2 h-4 w-4"/>Colar (valor ± DP)</Button>
                <Button variant="outline" onClick={() => pasteFromClipboard('first-number')} title="Cola células no formato 'valor ± erro' pegando apenas o primeiro número (valor)"><Clipboard className="mr-2 h-4 w-4"/>Colar (1º número)</Button>
              </div>
              <div className="flex flex-wrap gap-4 items-center text-sm text-neutral-700">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={useFirstRowAsHeaders} onChange={(e) => setUseFirstRowAsHeaders(e.target.checked)} />
                  Usar primeira linha como cabeçalhos
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={includeUnitOnPaste} onChange={(e) => setIncludeUnitOnPaste(e.target.checked)} />
                  Preencher coluna "Unidade" ao colar
                </label>
              </div>
            </div>
          </fieldset>
          <fieldset className="lg:col-span-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600 mb-2">Estilo padrão</legend>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-neutral-700">Cor da barra</label>
                <input type="color" value={defaultStyle?.color ?? '#3b82f6'} onChange={(e) => setDefaultStyle((s: any) => ({ ...s, color: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-neutral-700">Estilo</label>
                <select
                  className="border rounded px-2 py-1"
                  value={defaultStyle?.styleType ?? 'solid'}
                  onChange={(e) => setDefaultStyle((s: any) => ({ ...s, styleType: e.target.value }))}
                >
                  <option value="solid">Cor sólida</option>
                  <option value="banded">Faixas alternadas</option>
                  <option value="colorful">Colorido</option>
                  <option value="grayscale">Tons de cinza</option>
                  <option value="blackwhite">Preto e branco</option>
                </select>
              </div>
              <p className="text-xs text-neutral-500">Obs: a cor é usada apenas nos estilos Cor sólida e Faixas alternadas.</p>
            </div>
          </fieldset>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={save} disabled={loading} title="Grava a tabela deste projeto"><SaveIcon className="mr-2 h-4 w-4"/>{loading ? "Salvando..." : "Salvar"}</Button>
        </div>
      </div>

      {showHeaderEditor && (
        <div className="bg-white border rounded-lg p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.map((c, idx) => (
              <div key={c.key} className="space-y-1">
                <label className="block text-sm text-neutral-700">Coluna {idx + 1}</label>
                <input
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={c.name}
                  onChange={(e) => setColumns((cols) => cols.map((col) => col.key === c.key ? { ...col, name: e.target.value } : col))}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white border rounded-lg p-2 shadow-sm overflow-auto" ref={gridContainerRef}>
        <DataGrid
          className="rdg-light"
          columns={[SelectColumn, ...columns.map((c, idx) => ({
            ...c,
            editable: true,
            headerCellClass: recentCols.includes(c.key) ? "highlight-pulse" : undefined,
            cellClass: recentCols.includes(c.key) ? "highlight-pulse" : undefined,
            renderEditCell: (p: any) => (
              <input
                autoFocus
                className="w-full h-full px-2 outline-none"
                type={c.key === 'name' || c.key === 'unit' ? "text" : "number"}
                value={p.row[c.key] ?? (c.key === 'name' || c.key === 'unit' ? "" : 0)}
                onChange={(e) => {
                  const v = c.key === 'name' || c.key === 'unit' ? e.target.value : Number(e.target.value);
                  p.onRowChange({ ...p.row, [c.key]: v });
                }}
              />
            )
          }))]}
          rows={rows}
          onRowsChange={setRows}
          rowKeyGetter={(r) => r.__key as string}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          defaultColumnOptions={{ editable: true, resizable: true, editorOptions: { editOnClick: true } }}
          enableVirtualization={false}
          style={{ blockSize: 520 }}
        />
      </div>
      <p className="text-sm text-neutral-600">Dica: clique ou pressione Enter para editar; copie/cole do Excel; use as ações acima para colunas/linhas.</p>
    </div>
  );
}


