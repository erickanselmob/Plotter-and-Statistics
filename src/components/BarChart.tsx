"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import ReactECharts from "echarts-for-react";

type Props = {
  labels: string[];
  values: number[];
  errors?: number[];
  showStats?: boolean;
  statsBracket?: { start: number; end: number; label?: string } | null;
  height?: number;
  color?: string;
  styleType?: "solid" | "banded" | "colorful" | "grayscale" | "blackwhite";
  yLabel?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" + [r, g, b].map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0")).join("")
  );
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

export type BarChartHandle = { getPng: () => string | null };

const BarChart = forwardRef<BarChartHandle, Props>(function BarChart({ labels, values, errors, showStats = false, statsBracket = null, height = 400, color = "#3b82f6", styleType = "solid", yLabel }: Props, ref) {
  const chartRef = useRef<ReactECharts>(null);
  const paletteColorful = ["#2563eb", "#16a34a", "#eab308", "#ef4444", "#7c3aed", "#0ea5e9", "#d946ef", "#f97316"]; // Tailwind-like palette
  const paletteGrayscale = ["#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"];

  const colors = React.useMemo(() => {
    const n = labels.length || values.length;
    if (styleType === "colorful") {
      return Array.from({ length: n }, (_, i) => paletteColorful[i % paletteColorful.length]);
    }
    if (styleType === "grayscale") {
      return Array.from({ length: n }, (_, i) => paletteGrayscale[Math.floor((i / Math.max(1, n - 1)) * (paletteGrayscale.length - 1))]);
    }
    if (styleType === "blackwhite") {
      return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "#111111" : "#ffffff"));
    }
    if (styleType === "banded") {
      return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? lighten(color, 0.25) : darken(color, 0.15)));
    }
    // solid
    return Array.from({ length: n }, () => color);
  }, [labels.length, values.length, styleType, color]);
  const maxWithError = React.useMemo(() => {
    if (!values || values.length === 0) return 1;
    let m = 0;
    for (let i = 0; i < values.length; i++) {
      const candidate = values[i] + (errors ? Number(errors[i] || 0) : 0);
      if (isFinite(candidate)) m = Math.max(m, candidate);
    }
    return m || 1;
  }, [values, errors]);
  const axisMax = Math.max(1, maxWithError * 1.25);
  const bracketY = maxWithError * 1.12;
  const option = React.useMemo(
    () => ({
      tooltip: {},
      grid: { left: 44, right: 30, top: 54, bottom: 70, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          interval: 0,
          rotate: labels.length > 6 ? 30 : 0,
          overflow: "truncate",
        },
        axisLine: { show: true, lineStyle: { color: "#111", width: 2 } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        nameGap: 12,
        axisLabel: {
          margin: 10,
          showMaxLabel: false,
          formatter: (val: number) => (val >= axisMax ? "" : val),
        },
        axisLine: { show: true, lineStyle: { color: "#111", width: 2 } },
        splitLine: { show: false },
        max: axisMax,
        name: yLabel,
        nameTextStyle: { padding: [0, 0, 8, 0], fontWeight: 500 },
      },
      series: [
        {
          type: "bar",
          data: values,
          barMaxWidth: 28,
          itemStyle: {
            color: (params: any) => colors[params.dataIndex] ?? color,
            borderColor: styleType === "blackwhite" ? "#111111" : undefined,
          },
        },
        ...(errors && errors.some((e) => Number(e) !== 0)
          ? [
              {
                type: "custom",
                name: "errorbar",
                clip: false,
                renderItem: function (params: any, api: any) {
                  const xValue = api.value(0);
                  const yValue = api.value(1);
                  const err = api.value(2);
                  const pTop = api.coord([xValue, yValue + err]);
                  const pBottom = api.coord([xValue, yValue - err]);
                  const cap = 6; // pixels
                  return {
                    type: "group",
                    children: [
                      { type: "line", shape: { x1: pTop[0], y1: pTop[1], x2: pBottom[0], y2: pBottom[1] }, style: { stroke: "#111", lineWidth: 1.5 } },
                      { type: "line", shape: { x1: pTop[0] - cap, y1: pTop[1], x2: pTop[0] + cap, y2: pTop[1] }, style: { stroke: "#111", lineWidth: 1.5 } },
                      { type: "line", shape: { x1: pBottom[0] - cap, y1: pBottom[1], x2: pBottom[0] + cap, y2: pBottom[1] }, style: { stroke: "#111", lineWidth: 1.5 } },
                    ],
                  } as any;
                },
                encode: { x: 0, y: 1 },
                data: values.map((v, i) => [i, v, errors![i] ?? 0]),
                z: 10,
                silent: true,
              },
            ]
          : []),
        ...(showStats && statsBracket && Number.isFinite(statsBracket.start) && Number.isFinite(statsBracket.end)
          ? [
              {
                type: "custom",
                name: "stats-bracket",
                clip: false,
                renderItem: function (params: any, api: any) {
                  const total = labels.length;
                  const start = Math.max(0, Math.min(total - 1, statsBracket.start));
                  const end = Math.max(0, Math.min(total - 1, statsBracket.end));
                  const a = Math.min(start, end);
                  const b = Math.max(start, end);
                  const y = bracketY;
                  const p1 = api.coord([start, y]);
                  const p2 = api.coord([end, y]);
                  const textPos = [(p1[0] + p2[0]) / 2, p1[1] - 6];
                  const label = statsBracket.label || "p < 0.05";
                  return {
                    type: "group",
                    children: [
                      { type: "line", shape: { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }, style: { stroke: "#111", lineWidth: 1.5 } },
                      { type: "line", shape: { x1: p1[0], y1: p1[1], x2: p1[0], y2: p1[1] + 10 }, style: { stroke: "#111", lineWidth: 1.5 } },
                      { type: "line", shape: { x1: p2[0], y1: p2[1], x2: p2[0], y2: p2[1] + 10 }, style: { stroke: "#111", lineWidth: 1.5 } },
                      { type: "text", style: { text: label, x: textPos[0], y: textPos[1], textAlign: "center", textVerticalAlign: "bottom", fill: "#111" } },
                    ],
                  } as any;
                },
                data: [[0]],
                z: 20,
                silent: true,
              },
            ]
          : []),
      ],
    }),
    [labels, values, errors, showStats, statsBracket, color, colors, styleType, axisMax, bracketY]
  );
  useImperativeHandle(ref, () => ({
    getPng: () => {
      const inst = chartRef.current?.getEchartsInstance?.();
      try {
        if (inst) {
          return inst.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#ffffff" });
        }
      } catch {}
      return null;
    },
  }));
  return <ReactECharts ref={chartRef as any} option={option} style={{ height }} />;
});

export default BarChart;



