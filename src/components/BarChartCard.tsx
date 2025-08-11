"use client";
import React, { useEffect, useRef } from "react";
import BarChart, { BarChartHandle } from "./BarChart";

type Props = {
  chartName: string;
  labels: string[];
  values: number[];
  errors: number[];
  yLabel?: string;
  color?: string;
  styleType?: any;
};

export default function BarChartCard({ chartName, labels, values, errors, yLabel, color, styleType }: Props) {
  const ref = useRef<BarChartHandle>(null);

  useEffect(() => {
    // register for bulk download
    (window as any).__charts = (window as any).__charts || [];
    const entry = { name: chartName, getPng: () => ref.current?.getPng() };
    (window as any).__charts.push(entry);
    return () => {
      (window as any).__charts = ((window as any).__charts || []).filter((e: any) => e !== entry);
    };
  }, [chartName]);

  const downloadOne = () => {
    const dataUrl = ref.current?.getPng();
    if (dataUrl) {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${sanitize(chartName)}.png`;
      a.click();
    }
  };

  return (
    <div className="space-y-2">
      <BarChart ref={ref} labels={labels} values={values} errors={errors} yLabel={yLabel} color={color} styleType={styleType} />
      <div className="text-right">
        <button className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50" onClick={downloadOne}>Baixar PNG</button>
      </div>
    </div>
  );
}

function sanitize(s: string) {
  return (s || "grafico").replace(/[^a-zA-Z0-9-_\s]/g, "").replace(/\s+/g, "_");
}


