"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { WithData } from "@/components/DataProvider";
import { Card, CardTitle } from "@/components/ui";
import {
  FASTBALL_TYPES, PITCH_TYPES, type ArsenalPitch, type DashboardData, type DashboardMeta, type FastballType,
} from "@/lib/data";
import { SEDE_CORTA, TIPO_CON_DEMOSTRATIVO, TIPO_LABEL, fmt0, fmt1, fmtMeters, fmtPct, fmtSigned, fmtStuff } from "@/lib/format";
import { simulate, type PitchInput, type PitchType, type SedeKey, type SedeResult } from "@/lib/simulator";
import { conResultados } from "@/types/resultados";
import { equivalencia } from "./equivalencias";
import { LeversPanel } from "./LeversPanel";
import { MovementChart } from "./MovementChart";
import { NumberField } from "./NumberField";

const MEASURED_AT: SedeKey[] = ["No Altitude", "Medium Altitude", "Extreme Altitude", "Harp Helu"];
const isFastballType = (t: PitchType): t is FastballType => (FASTBALL_TYPES as readonly string[]).includes(t);

/** Valores típicos de la liga para un tipo; la recta del pitcher se conserva si ya había una capturada. */
function typicalInput(meta: DashboardMeta, tipo: PitchType, prev?: PitchInput): PitchInput {
  const fb = meta.defaults._fastball;
  return {
    tipo,
    ...meta.defaults[tipo],
    // La recta de cuatro costuras y el sinker suelen ser la recta principal; el cutter, un complemento.
    isFastball: tipo === "Four-Seam" || tipo === "Sinker",
    fbTipo: prev?.fbTipo ?? "Four-Seam",
    fb_relspeed: prev?.fb_relspeed ?? fb.fb_relspeed,
    fb_ivb: prev?.fb_ivb ?? fb.fb_ivb,
    fb_hb: prev?.fb_hb ?? fb.fb_hb,
    fb_axis: prev?.fb_axis ?? fb.fb_axis,
  };
}

function inputFromArsenal(a: ArsenalPitch): PitchInput {
  return {
    tipo: a.tipo,
    RelSpeed: a.sim_RelSpeed, ivb: a.sim_ivb, hb_arm: a.sim_hb_arm, SpinRate: a.sim_SpinRate,
    spin_axis_m: a.sim_spin_axis_m, Extension: a.sim_Extension, RelHeight: a.sim_RelHeight,
    rel_side_arm: a.sim_rel_side_arm,
    isFastball: a.isFastball, fbTipo: a.fbTipo,
    fb_relspeed: a.fb_relspeed, fb_ivb: a.fb_ivb, fb_hb: a.fb_hb, fb_axis: a.fb_axis,
  };
}

export function Simulator() {
  const params = useSearchParams();
  const p = params.get("p");
  const t = params.get("t");
  return (
    <WithData>
      {(data) => {
        const source = p && t ? data.arsenal.find((a) => a.pitcher_anon_id === p && a.tipo === t) ?? null : null;
        // La clave reinicia el estado si se abre otro lanzamiento desde la vista de pitchers.
        return <SimulatorView key={`${p}|${t}`} data={data} source={source} notFound={Boolean(p && t && !source)} />;
      }}
    </WithData>
  );
}

function SimulatorView({ data, source: initialSource, notFound }: {
  data: DashboardData; source: ArsenalPitch | null; notFound: boolean;
}) {
  const { meta, model } = data;
  const [source, setSource] = useState(initialSource);
  const [input, setInput] = useState<PitchInput>(() =>
    initialSource ? inputFromArsenal(initialSource) : typicalInput(meta, "Four-Seam"));
  const [measuredAt, setMeasuredAt] = useState<SedeKey>(initialSource?.measuredAt ?? "No Altitude");

  // El cálculo es rápido, pero diferirlo mantiene fluidos los controles deslizantes en celulares.
  const deferredInput = useDeferredValue(input);
  const deferredAt = useDeferredValue(measuredAt);
  const results = useMemo(
    () => simulate(model, meta, deferredInput, deferredAt),
    [model, meta, deferredInput, deferredAt],
  );

  const set = <K extends keyof PitchInput>(k: K) => (v: PitchInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const r = meta.ranges;
  const showFastballPanel = !(input.isFastball && isFastballType(input.tipo));

  const changeTipo = (tipo: PitchType) => {
    setSource(null);
    setInput((s) => typicalInput(meta, tipo, s));
  };
  const changeFbTipo = (fbTipo: FastballType) => {
    const d = meta.defaults[fbTipo];
    setInput((s) => ({ ...s, fbTipo, fb_relspeed: d.RelSpeed, fb_ivb: d.ivb, fb_hb: d.hb_arm, fb_axis: d.spin_axis_m }));
  };
  const reset = () => {
    setSource(null);
    setMeasuredAt("No Altitude");
    setInput((s) => typicalInput(meta, s.tipo));
  };

  return (
    <div className="pb-20 lg:pb-0">
      {source && (
        <div className="mb-6 flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-neutral-700">
            Lanzamiento real: <span className="font-medium text-neutral-900">{source.pitcher_anon_id}</span> ·{" "}
            {TIPO_LABEL[source.tipo]} · {fmt0(source.n)} lanzamientos · medido en: {SEDE_CORTA[source.measuredAt]}
          </p>
          <div className="flex shrink-0 gap-3">
            <Link href={`/pitchers/?p=${source.pitcher_anon_id}`} className="text-accent underline-offset-2 hover:underline">
              Ver pitcher
            </Link>
            <button type="button" onClick={reset} className="text-neutral-600 underline-offset-2 hover:underline">
              Usar valores típicos
            </button>
          </div>
        </div>
      )}
      {notFound && (
        <p className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          No se encontró ese lanzamiento en el arsenal; se muestran valores típicos de la liga.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardTitle sub="Al cambiar el tipo se cargan los valores típicos de la liga.">El lanzamiento</CardTitle>
            <div className="space-y-4">
              <SelectField
                label="Tipo de lanzamiento" value={input.tipo}
                options={PITCH_TYPES.map((k) => ({ value: k, label: TIPO_LABEL[k] }))}
                onChange={(v) => changeTipo(v as PitchType)}
              />
              <SelectField
                label="¿Dónde se midieron estos valores?" value={measuredAt}
                options={MEASURED_AT.map((k) => ({ value: k, label: meta.sedes[k].label }))}
                onChange={(v) => { setSource(null); setMeasuredAt(v as SedeKey); }}
              />
              <NumberField label="Velocidad" unit="mph" value={input.RelSpeed} onChange={set("RelSpeed")} range={r.RelSpeed} step={0.1} digits={1} />
              <NumberField label="Movimiento vertical (IVB)" unit="in" value={input.ivb} onChange={set("ivb")} range={r.ivb} step={0.1} digits={1} />
              <NumberField
                label="Movimiento horizontal (HB)" unit="in" value={input.hb_arm} onChange={set("hb_arm")} range={r.hb_arm}
                step={0.1} digits={1} hint="Positivo hacia el lado del brazo, también para zurdos."
              />
              <NumberField label="Giro" unit="rpm" value={input.SpinRate} onChange={set("SpinRate")} range={r.SpinRate} step={10} digits={0} />
              <NumberField label="Eje de giro" unit="°" value={input.spin_axis_m} onChange={set("spin_axis_m")} range={r.spin_axis_m} step={1} digits={0} />
              <NumberField label="Extensión" unit="ft" value={input.Extension} onChange={set("Extension")} range={r.Extension} step={0.1} digits={1} />
              <NumberField label="Altura de liberación" unit="ft" value={input.RelHeight} onChange={set("RelHeight")} range={r.RelHeight} step={0.1} digits={1} />
              <NumberField
                label="Lado de liberación" unit="ft" value={input.rel_side_arm} onChange={set("rel_side_arm")} range={r.rel_side_arm}
                step={0.1} digits={1} hint="Distancia lateral desde el centro del montículo."
              />
              {isFastballType(input.tipo) && (
                <label className="flex items-start gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox" className="mt-0.5 accent-[var(--color-accent)]"
                    checked={input.isFastball} onChange={(e) => set("isFastball")(e.target.checked)}
                  />
                  Es la recta principal del pitcher
                </label>
              )}
            </div>
          </Card>

          {showFastballPanel && (
            <Card>
              <CardTitle sub="Un lanzamiento vale también por lo distinto que es de la recta del mismo pitcher.">
                La recta del pitcher
              </CardTitle>
              <div className="space-y-4">
                <SelectField
                  label="Tipo de recta" value={input.fbTipo}
                  options={FASTBALL_TYPES.map((k) => ({ value: k, label: TIPO_LABEL[k] }))}
                  onChange={(v) => changeFbTipo(v as FastballType)}
                />
                <NumberField label="Velocidad" unit="mph" value={input.fb_relspeed} onChange={set("fb_relspeed")} range={r.RelSpeed} step={0.1} digits={1} />
                <NumberField label="Movimiento vertical (IVB)" unit="in" value={input.fb_ivb} onChange={set("fb_ivb")} range={r.ivb} step={0.1} digits={1} />
                <NumberField label="Movimiento horizontal (HB)" unit="in" value={input.fb_hb} onChange={set("fb_hb")} range={r.hb_arm} step={0.1} digits={1} />
                <NumberField label="Eje de giro" unit="°" value={input.fb_axis} onChange={set("fb_axis")} range={r.spin_axis_m} step={1} digits={0} />
              </div>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Interpretation results={results} tipo={deferredInput.tipo} meta={meta} />
          <div className="grid gap-4 sm:grid-cols-3">
            {results.map((res) => (
              <ResultCard key={res.sede} r={res} base={results[0]} meta={meta} />
            ))}
          </div>
          <Card>
            <CardTitle sub="Cada punto es el mismo lanzamiento en una sede. Con menos aire, el movimiento se acerca al centro.">
              Cómo se encoge el movimiento
            </CardTitle>
            <MovementChart results={results} />
          </Card>
          <LeversPanel meta={conResultados(meta)} tipo={deferredInput.tipo} />
          <Method meta={meta} />
        </div>
      </div>

      <MobileSummary results={results} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm text-neutral-800">
      {label}
      <select
        className="mt-1 block w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ResultCard({ r, base, meta }: { r: SedeResult; base: SedeResult; meta: DashboardMeta }) {
  const harp = r.sede === "Harp Helu";
  const delta = Math.round(r.stuffPlus) - Math.round(base.stuffPlus);
  const ext = meta.sedes["Extreme Altitude"];
  return (
    <div className={`flex flex-col rounded-lg border p-4 ${harp ? "border-accent bg-accent-soft" : "border-neutral-200 bg-white"}`}>
      <h3 className={`text-sm font-semibold ${harp ? "text-accent" : "text-neutral-900"}`}>{SEDE_CORTA[r.sede]}</h3>
      <p className="text-xs text-neutral-500">{fmtMeters(meta.sedes[r.sede].h)}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tabular-nums text-neutral-900">{fmtStuff(r.stuffPlus)}</span>
        <span className="text-xs text-neutral-500">Stuff+</span>
      </div>
      <p className="text-xs text-neutral-600">Mejor que el {fmt0(r.percentil)}% de su tipo de sede</p>
      <dl className="mt-3 space-y-1 text-sm">
        <Row k="IVB / HB" v={`${fmt1(r.ivb)} / ${fmt1(r.hb_arm)} in`} />
        <Row k="Movimiento total" v={`${fmt1(r.breakTotal)} in`} />
        <Row k="Vs. nivel del mar" v={fmtPct(r.perdidaMovPct)} />
        {r.sede !== "No Altitude" && <Row k="Stuff+ vs. sin altitud" v={fmtSigned(delta)} strong />}
      </dl>
      {harp && (
        <p className="mt-3 border-t border-red-200 pt-2 text-xs leading-snug text-neutral-700">
          <span className="font-medium text-accent">Extrapolación.</span> El Harp Helú está{" "}
          {fmtMeters(meta.sedes["Harp Helu"].h - ext.h, 10)} arriba del promedio de las sedes
          de altitud extrema ({fmtMeters(ext.h)}) con las que se estimó la ley física. Se califica con la escala de
          altitud extrema.
        </p>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-neutral-600">{k}</dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-neutral-900" : "text-neutral-800"}`}>{v}</dd>
    </div>
  );
}

/** Una frase que resume el resultado para quien no quiere leer la tabla. */
function Interpretation({ results, tipo, meta }: { results: SedeResult[]; tipo: PitchType; meta: DashboardMeta }) {
  const base = results.find((x) => x.sede === "No Altitude")!;
  const harp = results.find((x) => x.sede === "Harp Helu")!;
  const a = Math.round(base.stuffPlus), b = Math.round(harp.stuffPlus);
  const lost = fmt0(Math.abs(harp.perdidaMovPct));
  const name = TIPO_CON_DEMOSTRATIVO[tipo];
  let rest: string;
  if (b > a) rest = `aun así su Stuff+ sube de ${a} a ${b}, porque pierde menos que el lanzamiento típico de esa sede: viaja bien a la CDMX.`;
  else if (b < a) rest = `su Stuff+ baja de ${a} a ${b}, porque pierde más que el lanzamiento típico de esa sede.`;
  else rest = `su Stuff+ se queda en ${a}: pierde lo mismo que el lanzamiento típico de esa sede.`;
  // La equivalencia usa el cambio exacto, no la diferencia entre los valores redondeados.
  const eq = b !== a ? equivalencia(meta, harp.stuffPlus - base.stuffPlus) : null;
  return (
    <p className="rounded-lg border-l-4 border-accent bg-white p-4 text-base leading-relaxed text-neutral-800">
      En el Harp Helú {name} pierde {lost}% de su movimiento frente al nivel del mar; {rest}
      {eq && ` En el campo, ese cambio equivale a ${eq.fallos} y ${eq.carreras}.`}
    </p>
  );
}

function Method({ meta }: { meta: DashboardMeta }) {
  const { sigma, offsets } = meta.smoothing;
  return (
    <details className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
      <summary className="cursor-pointer font-medium text-neutral-900">Cómo calcula el simulador</summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>
          Lleva el lanzamiento a nivel del mar dividiendo su movimiento inducido entre el factor físico de la sede donde
          se midió: (densidad de la sede ÷ densidad a nivel del mar) elevada al exponente de su tipo.
        </li>
        <li>
          Lo traslada a cada sede multiplicando por el factor de esa sede. La recta del pitcher se traslada con el
          exponente de su propio tipo y las diferencias contra la recta se recalculan.
        </li>
        <li>
          El modelo lo califica con la categoría de altitud de la sede. La predicción se promedia sobre {offsets.length}{" "}
          variaciones de ejecución (±{fmt1(sigma.RelSpeed)} mph, ±{fmt1(sigma.ivb)} in de movimiento), para que no
          dependa de un solo umbral del modelo.
        </li>
        <li>Stuff+ se escala con la media y la desviación estándar de esa categoría de altitud.</li>
      </ol>
    </details>
  );
}

/** En celular, los controles ocupan la pantalla: esta barra mantiene el resultado a la vista. */
function MobileSummary({ results }: { results: SedeResult[] }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl justify-between gap-2 text-center">
        {results.map((r) => (
          <div key={r.sede} className="min-w-0 flex-1">
            <div className={`truncate text-[11px] ${r.sede === "Harp Helu" ? "font-medium text-accent" : "text-neutral-500"}`}>
              {SEDE_CORTA[r.sede]}
            </div>
            <div className="text-lg font-semibold tabular-nums text-neutral-900">{fmtStuff(r.stuffPlus)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
