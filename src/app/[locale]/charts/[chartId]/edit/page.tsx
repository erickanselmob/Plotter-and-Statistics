"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DataGrid } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type Row = { id?: string; label: string; value: number };

export default function EditChartPage() {
  const { chartId, locale } = useParams() as { chartId: string; locale: string };
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/charts/${chartId}/bars`);
      if (res.ok) {
        const json = await res.json();
        setRows(json.rows as Row[]);
      }
    })();
  }, [chartId]);

  const columns = [
    { key: "label", name: "Rótulo", editable: true, width: 200 },
    { key: "value", name: "Valor", editable: true },
  ];

  const option = useMemo(
    () => ({
      tooltip: {},
      xAxis: { type: "category", data: rows.map((r) => r.label) },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: rows.map((r) => r.value) }],
    }),
    [rows]
  );

  const save = async () => {
    setLoading(true);
    const res = await fetch(`/api/charts/${chartId}/bars`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setLoading(false);
    if (res.ok) toast.success("Dados salvos");
    else toast.error("Falha ao salvar");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-4">
        <div className="h-[420px]">
          {/* @ts-expect-error */}
          <ReactECharts option={option} style={{ height: 400 }} />
        </div>
      </div>
      <div className="bg-white border rounded-lg p-4">
        <div className="mb-3 flex gap-2">
          <Button onClick={() => setRows((r) => [...r, { label: "", value: 0 }])}>Adicionar linha</Button>
          <Button variant="outline" onClick={save} disabled={loading}>{loading ? "..." : "Salvar"}</Button>
        </div>
        <DataGrid
          className="rdg-light"
          columns={columns}
          rows={rows}
          onRowsChange={setRows}
          rowKeyGetter={(r) => r.id ?? `${r.label}-${r.value}-${Math.random()}`}
          style={{ blockSize: 360 }}
        />
      </div>
    </div>
  );
}


