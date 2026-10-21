"use client";

import {
  CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import { Legend } from "@/components/ui";
import type { SedeResult } from "@/lib/simulator";
import { SEDE_CORTA, fmt1 } from "@/lib/format";

const COLOR: Record<string, string> = {
  "No Altitude": "#525252",
  "Medium Altitude": "#a3a3a3",
  "Harp Helu": "#b91c1c",
};

/** Bordes del eje que incluyen el origen y todos los puntos, redondeados a múltiplos de 5 pulgadas. */
function axis(values: number[]): { domain: [number, number]; ticks: number[] } {
  const lo = Math.floor((Math.min(0, ...values) - 2) / 5) * 5;
  const hi = Math.ceil((Math.max(0, ...values) + 2) / 5) * 5;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += 5) ticks.push(v);
  return { domain: [lo, hi], ticks };
}

/** Movimiento vertical (IVB) contra horizontal (HB) en cada sede: muestra cómo se encoge hacia el origen. */
export function MovementChart({ results }: { results: SedeResult[] }) {
  const points = results.map((r) => ({ ...r, name: SEDE_CORTA[r.sede] }));
  const x = axis(points.map((p) => p.hb_arm));
  const y = axis(points.map((p) => p.ivb));
  return (
    <>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" />
            <XAxis
              type="number" dataKey="hb_arm" domain={x.domain} ticks={x.ticks}
              tick={{ fontSize: 12, fill: "#737373" }} stroke="#d4d4d4"
              label={{ value: "HB hacia el brazo (in)", position: "insideBottom", offset: -14, fontSize: 12, fill: "#525252" }}
            />
            <YAxis
              type="number" dataKey="ivb" domain={y.domain} ticks={y.ticks} width={40}
              tick={{ fontSize: 12, fill: "#737373" }} stroke="#d4d4d4"
              label={{ value: "IVB (in)", angle: -90, position: "insideLeft", offset: 12, fontSize: 12, fill: "#525252" }}
            />
            <ZAxis range={[120, 120]} />
            <ReferenceLine x={0} stroke="#a3a3a3" />
            <ReferenceLine y={0} stroke="#a3a3a3" />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const p = active ? (payload?.[0]?.payload as (typeof points)[number] | undefined) : undefined;
                if (!p) return null;
                return (
                  <div className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs shadow-sm">
                    <div className="font-medium text-neutral-900">{p.name}</div>
                    <div className="text-neutral-600">IVB {fmt1(p.ivb)} in · HB {fmt1(p.hb_arm)} in</div>
                  </div>
                );
              }}
            />
            {points.map((p) => (
              <Scatter
                key={p.sede} name={p.name} data={[p]} fill={COLOR[p.sede]} stroke="#fff" strokeWidth={2}
                shape="circle" isAnimationActive={false}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <Legend items={points.map((p) => ({ color: COLOR[p.sede], label: p.name }))} />
    </>
  );
}
