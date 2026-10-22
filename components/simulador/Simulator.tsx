"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCalculo } from "@/components/calculo/useCalculo";
import { useDashboardData } from "@/components/DataProvider";
import { Campo } from "@/components/consola/Campo";
import { IcoCargar, IcoLink } from "@/components/consola/Iconos";
import { LineScore } from "@/components/consola/LineScore";
import { Kpis, Lectura, Panel, Segmentado } from "@/components/consola/Panel";
import { Palancas } from "@/components/consola/Palancas";
import { SEDE_SEG, TIPO_PLURAL, mayuscula } from "@/components/consola/textos";
import { Cargando, ErrorDatos, Vista } from "@/components/consola/Vista";
import {
  FASTBALL_TYPES, PITCH_TYPES, type ArsenalPitch, type DashboardData, type DashboardMeta, type FastballType,
} from "@/lib/data";
import { TIPO_CON_DEMOSTRATIVO, TIPO_LABEL, fmt0, fmt1, fmtMeters, fmtSigned, fmtStuff } from "@/lib/format";
import { tangibles, type PitchInput, type PitchType, type SedeKey, type SedeResult, type SmoothField } from "@/lib/simulator";
import { conConvocatoria } from "@/types/convocatoria";
import { conResultados } from "@/types/resultados";
import { codificar, decodificar } from "./enlace";
import { MovementMap } from "./MovementMap";

const MEDIDO_EN: SedeKey[] = ["No Altitude", "Medium Altitude", "Extreme Altitude", "Harp Helu"];
const TITULO = "Simulador de lanzamiento";
const DESCRIPCION = "Califica un lanzamiento en cada tipo de sede, con la física del aire delgado.";
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

interface Inicial { input: PitchInput; medido: SedeKey; source: ArsenalPitch | null; aviso: string | null }

/** ?p=&t= abre un lanzamiento real de la liga; ?s= trae un lanzamiento compartido. Lo inválido se ignora. */
function desdeUrl(params: URLSearchParams, data: DashboardData): Inicial {
  const p = params.get("p"), t = params.get("t"), s = params.get("s");
  if (p && t) {
    const source = data.arsenal.find((a) => a.pitcher_anon_id === p && a.tipo === t);
    if (source) return { input: inputFromArsenal(source), medido: source.measuredAt, source, aviso: null };
    return { input: typicalInput(data.meta, "Four-Seam"), medido: "No Altitude", source: null, aviso: "No se encontró ese lanzamiento en el arsenal; se muestran valores típicos de la liga." };
  }
  const compartido = s ? decodificar(s) : null;
  if (compartido) return { ...compartido, source: null, aviso: null };
  return { input: typicalInput(data.meta, "Four-Seam"), medido: "No Altitude", source: null, aviso: s ? "El link no es válido; se muestran valores típicos de la liga." : null };
}

export function Simulator() {
  const params = useSearchParams();
  const estado = useDashboardData();
  if (estado.status !== "ready") {
    return (
      <Vista titulo={TITULO} descripcion={DESCRIPCION}>
        {estado.status === "error" ? <ErrorDatos mensaje={estado.message} /> : <Cargando />}
      </Vista>
    );
  }
  return <SimulatorView data={estado.data} inicial={desdeUrl(params, estado.data)} />;
}

function SimulatorView({ data, inicial }: { data: DashboardData; inicial: Inicial }) {
  const { meta, model } = data;
  const [source, setSource] = useState(inicial.source);
  // Un lanzamiento real editado conserva su origen en la etiqueta, pero el link ya lleva los valores.
  const [editado, setEditado] = useState(false);
  const [input, setInput] = useState<PitchInput>(inicial.input);
  const [measuredAt, setMeasuredAt] = useState<SedeKey>(inicial.medido);
  const [copiado, setCopiado] = useState(false);
  // La URL se reescribe al editar; el aviso sobre el link original se conserva.
  const [aviso] = useState(inicial.aviso);

  // El modelo corre en un worker: los controles responden aunque el cálculo tarde en un celular.
  const ctx = useMemo(() => ({ model, meta }), [model, meta]);
  const calculo = useCalculo({ kind: "simulate", input, measuredAt }, ctx);
  const results = calculo.valor!;
  // Lo que acompaña a los resultados describe el lanzamiento que los produjo.
  const calculado = calculo.trabajo.input;

  const query = source && !editado ? `p=${source.pitcher_anon_id}&t=${source.tipo}` : `s=${codificar(input, measuredAt)}`;
  useEffect(() => {
    const t = setTimeout(() => window.history.replaceState(null, "", `${window.location.pathname}?${query}`), 300);
    return () => clearTimeout(t);
  }, [query]);

  const tocar = () => { setEditado(true); setCopiado(false); };
  const set = <K extends keyof PitchInput>(k: K) => (v: PitchInput[K]) => { tocar(); setInput((s) => ({ ...s, [k]: v })); };
  const changeTipo = (tipo: PitchType) => { tocar(); setSource(null); setInput((s) => typicalInput(meta, tipo, s)); };
  const changeFbTipo = (fbTipo: FastballType) => {
    const d = meta.defaults[fbTipo];
    tocar();
    setInput((s) => ({ ...s, fbTipo, fb_relspeed: d.RelSpeed, fb_ivb: d.ivb, fb_hb: d.hb_arm, fb_axis: d.spin_axis_m }));
  };
  const cargar = (a: ArsenalPitch) => {
    setSource(a); setEditado(false); setCopiado(false);
    setInput(inputFromArsenal(a)); setMeasuredAt(a.measuredAt);
  };
  const tipicos = () => { setSource(null); tocar(); setMeasuredAt("No Altitude"); setInput((s) => typicalInput(meta, s.tipo)); };
  const copiar = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try { await navigator.clipboard.writeText(url); setCopiado(true); } catch { window.prompt("Copia este link:", url); }
  };

  const r = meta.ranges;
  const mostrarRecta = !(input.isFastball && isFastballType(input.tipo));

  return (
    <Vista
      titulo={TITULO}
      descripcion={DESCRIPCION}
      acciones={
        <>
          <span className="seg-lbl">Medido en</span>
          <Segmentado
            etiqueta="Dónde se midieron los valores" valor={measuredAt}
            onChange={(v) => { tocar(); setMeasuredAt(v); }}
            opciones={MEDIDO_EN.map((k) => ({ value: k, label: SEDE_SEG[k] }))}
          />
          <CargarPitcher data={data} onCargar={cargar} />
          <button type="button" className="btn prim" onClick={copiar}><IcoLink />{copiado ? "Link copiado" : "Copiar link"}</button>
        </>
      }
    >
      {aviso && <p className="c12 -my-1.5 text-xs text-grafito">{aviso}</p>}

      <Panel
        ancho={3}
        titulo="Parámetros"
        meta={source ? `${source.pitcher_anon_id}${editado ? ", editado" : ""}` : "Trackman"}
        controles={source ? <button type="button" className="btn" onClick={tipicos}>Valores típicos</button> : undefined}
      >
        <form className="pb params" onSubmit={(e) => e.preventDefault()}>
          <select className="ctl" aria-label="Tipo de lanzamiento" value={input.tipo} onChange={(e) => changeTipo(e.target.value as PitchType)}>
            {PITCH_TYPES.map((k) => <option key={k} value={k}>{TIPO_LABEL[k]}</option>)}
          </select>
          <Campo label="Velocidad" unidad="mph" valor={input.RelSpeed} onChange={set("RelSpeed")} rango={r.RelSpeed} paso={0.1} decimales={1} />
          <Campo label="Movimiento vertical (IVB)" unidad="in" valor={input.ivb} onChange={set("ivb")} rango={r.ivb} paso={0.1} decimales={1} />
          <Campo label="Horizontal, hacia el brazo" unidad="in" valor={input.hb_arm} onChange={set("hb_arm")} rango={r.hb_arm} paso={0.1} decimales={1} />
          <Campo label="Giro" unidad="rpm" valor={input.SpinRate} onChange={set("SpinRate")} rango={r.SpinRate} paso={10} decimales={0} />
          <Campo label="Eje de giro" unidad="°" valor={input.spin_axis_m} onChange={set("spin_axis_m")} rango={r.spin_axis_m} paso={1} decimales={0} />
          {isFastballType(input.tipo) && (
            <label className="flex items-start gap-2 text-[13px]">
              <input type="checkbox" className="mt-0.5 accent-black" checked={input.isFastball} onChange={(e) => set("isFastball")(e.target.checked)} />
              Es la recta principal del pitcher
            </label>
          )}
          <div className="sub">Liberación</div>
          <Campo label="Extensión" unidad="ft" valor={input.Extension} onChange={set("Extension")} rango={r.Extension} paso={0.01} decimales={2} />
          <Campo label="Altura" unidad="ft" valor={input.RelHeight} onChange={set("RelHeight")} rango={r.RelHeight} paso={0.01} decimales={2} />
          <Campo label="Lado, desde el centro del montículo" unidad="ft" valor={input.rel_side_arm} onChange={set("rel_side_arm")} rango={r.rel_side_arm} paso={0.01} decimales={2} />
          {mostrarRecta && (
            <>
              <div className="sub">Recta del pitcher</div>
              <select className="ctl" aria-label="Tipo de recta" value={input.fbTipo} onChange={(e) => changeFbTipo(e.target.value as FastballType)}>
                {FASTBALL_TYPES.map((k) => <option key={k} value={k}>{TIPO_LABEL[k]}</option>)}
              </select>
              <Campo label="Velocidad de la recta" unidad="mph" valor={input.fb_relspeed} onChange={set("fb_relspeed")} rango={r.RelSpeed} paso={0.1} decimales={1} />
              <Campo label="IVB de la recta" unidad="in" valor={input.fb_ivb} onChange={set("fb_ivb")} rango={r.ivb} paso={0.1} decimales={1} />
              <Campo label="HB de la recta" unidad="in" valor={input.fb_hb} onChange={set("fb_hb")} rango={r.hb_arm} paso={0.1} decimales={1} />
              <Campo label="Eje de la recta" unidad="°" valor={input.fb_axis} onChange={set("fb_axis")} rango={r.spin_axis_m} paso={1} decimales={0} />
            </>
          )}
        </form>
      </Panel>

      <Resultado meta={meta} results={results} input={calculado} source={source} />
      <MovementMap tipo={calculado.tipo} results={results} />
      <Palancas meta={conResultados(meta)} tipo={input.tipo} />
      <Metodo meta={meta} />
    </Vista>
  );
}

/** Desplegable para cargar un lanzamiento real de un pitcher de la liga. */
function CargarPitcher({ data, onCargar }: { data: DashboardData; onCargar: (a: ArsenalPitch) => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const ids = useMemo(() => data.pitchers.map((p) => p.pitcher_anon_id).sort(), [data.pitchers]);
  const [id, setId] = useState(ids[0]);
  const lanzamientos = useMemo(() => data.arsenal.filter((a) => a.pitcher_anon_id === id), [data.arsenal, id]);
  const [tipo, setTipo] = useState<PitchType | "">("");
  const elegido = lanzamientos.find((a) => a.tipo === tipo) ?? lanzamientos[0];
  return (
    <details ref={ref} className="relative">
      <summary className="btn list-none"><IcoCargar />Cargar pitcher</summary>
      <div className="absolute right-0 z-10 mt-2 grid w-72 max-w-[calc(100vw-32px)] gap-3 rounded-lg border border-linea bg-papel p-4">
        <label className="grid gap-1 text-xs text-grafito">
          Pitcher de la LMB
          <select className="ctl text-sm text-tinta" value={id} onChange={(e) => { setId(e.target.value); setTipo(""); }}>
            {ids.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-grafito">
          Lanzamiento
          <select className="ctl text-sm text-tinta" value={elegido?.tipo ?? ""} onChange={(e) => setTipo(e.target.value as PitchType)}>
            {lanzamientos.map((a) => <option key={a.tipo} value={a.tipo}>{TIPO_LABEL[a.tipo]} ({fmt0(a.uso * 100)}% de uso)</option>)}
          </select>
        </label>
        <button
          type="button" className="btn prim justify-center" disabled={!elegido}
          onClick={() => { if (elegido) { onCargar(elegido); if (ref.current) ref.current.open = false; } }}
        >
          Cargar
        </button>
      </div>
    </details>
  );
}

function Resultado({ meta, results, input, source }: {
  meta: DashboardMeta; results: SedeResult[]; input: PitchInput; source: ArsenalPitch | null;
}) {
  const por = (k: SedeKey) => results.find((x) => x.sede === k)!;
  const base = por("No Altitude"), media = por("Medium Altitude"), harp = por("Harp Helu");
  const a = Math.round(base.stuffPlus), b = Math.round(harp.stuffPlus);
  // Las equivalencias usan el cambio exacto, no la diferencia entre los valores redondeados.
  const t = tangibles(meta, harp.stuffPlus - base.stuffPlus);
  const riesgo = conConvocatoria(meta).contacto.por_tipo.find((c) => c.tipo === input.tipo);
  const riesgoNulo = riesgo ? riesgo.hr_ic95[0] <= 0 && riesgo.hr_ic95[1] >= 0 : false;
  const ext = meta.sedes["Extreme Altitude"];
  const movDelta = 100 * (harp.breakTotal / base.breakTotal - 1);

  const nombre = TIPO_CON_DEMOSTRATIVO[input.tipo];
  const perdida = `${fmt0(Math.abs(harp.perdidaMovPct))}% de su movimiento`;
  let resto: string;
  if (b > a) resto = `, pero su Stuff+ sube de ${a} a ${b}: pierde menos que el lanzamiento típico de esa sede`;
  else if (b < a) resto = ` y su Stuff+ baja de ${a} a ${b}: pierde más que el lanzamiento típico de esa sede`;
  else resto = ` y su Stuff+ se queda en ${a}: pierde lo mismo que el lanzamiento típico de esa sede`;

  const recta = input.isFastball && isFastballType(input.tipo)
    ? "Es la recta principal"
    : `Recta: ${TIPO_LABEL[input.fbTipo].replace(/^Recta de /, "").toLowerCase()}, ${fmt1(input.fb_relspeed)} mph`;

  return (
    <Panel
      ancho={9}
      className="primero-movil"
      titulo="Resultado por sede"
      controles={
        <div className="chips">
          <span className="chip">{TIPO_LABEL[input.tipo]}</span>
          <span className="chip">{recta}</span>
          {source && <span className="chip">{source.pitcher_anon_id}</span>}
          <span className="chip r">Percentil {fmt0(harp.percentil)} en el Harp Helú</span>
        </div>
      }
    >
      <LineScore
        titulo="Stuff+ y movimiento"
        columnas={[
          { key: "mar", label: "Sin altitud", sub: fmtMeters(meta.sedes["No Altitude"].h) },
          { key: "media", label: "Altitud media", sub: fmtMeters(meta.sedes["Medium Altitude"].h) },
          { key: "hh", label: "Harp Helú", sub: fmtMeters(meta.sedes["Harp Helu"].h), hh: true },
          { key: "d", label: "Δ", sub: "vs. sin altitud", tot: true },
        ]}
        filas={[
          { key: "s", label: "Stuff+", main: true, celdas: { mar: fmtStuff(base.stuffPlus), media: fmtStuff(media.stuffPlus), hh: fmtStuff(harp.stuffPlus), d: fmtSigned(b - a) } },
          { key: "p", label: "Percentil en su sede", celdas: { mar: fmt0(base.percentil), media: fmt0(media.percentil), hh: fmt0(harp.percentil), d: fmtSigned(harp.percentil - base.percentil) } },
          { key: "m", label: "Movimiento total (in)", celdas: { mar: fmt1(base.breakTotal), media: fmt1(media.breakTotal), hh: fmt1(harp.breakTotal), d: `${fmtSigned(movDelta, 0)}%` } },
        ]}
      />
      <p className="px-[18px] py-2 text-xs text-grafito">
        Harp Helú: extrapolación, {fmtMeters(meta.sedes["Harp Helu"].h - ext.h, 10)} arriba del promedio de las sedes de
        altitud extrema ({fmtMeters(ext.h)}) con las que se estimó la ley física; se califica con la escala de altitud extrema.
      </p>
      <Kpis
        borde
        items={[
          {
            k: "Fallos por swing, Harp Helú vs. sin altitud",
            v: t ? `${fmtSigned(t.whiffPp, 1)} pp` : "—",
            d: "Por el cambio de Stuff+ de este lanzamiento",
          },
          {
            k: "Carreras por cada 1,000 lanzamientos",
            v: t ? fmtSigned(t.carrerasPor1000, 1) : "—",
            d: "Negativo: permite menos carreras",
          },
          riesgo
            ? {
                k: "Jonrones por bola en juego en altitud",
                v: `${fmtSigned(riesgo.hr_riesgo_pct, 0)}%`,
                tono: riesgoNulo ? "nulo" as const : "r" as const,
                d: `${mayuscula(TIPO_PLURAL[input.tipo])} de la LMB, IC95 ${fmtSigned(riesgo.hr_ic95[0], 0)}% a ${fmtSigned(riesgo.hr_ic95[1], 0)}%${riesgoNulo ? ": no distinguible de cero" : ""}`,
              }
            : { k: "Jonrones por bola en juego en altitud", v: "—" },
        ]}
      />
      <Lectura>
        En el Harp Helú {nombre} pierde <b>{perdida}</b>{resto}
        {b !== a && t ? ` (${fmtSigned(t.whiffPp, 1)} pp de fallos por swing).` : "."}
      </Lectura>
    </Panel>
  );
}

/** Variables del lanzamiento cuya variación se describe (la recta usa las mismas magnitudes). */
const VARIACION: [SmoothField, string, string, number][] = [
  ["RelSpeed", "velocidad", "mph", 1],
  ["ivb", "movimiento vertical", "in", 1],
  ["hb_arm", "movimiento horizontal", "in", 1],
  ["SpinRate", "giro", "rpm", 0],
  ["spin_axis_m", "eje", "°", 0],
  ["Extension", "extensión", "ft", 2],
  ["RelHeight", "altura de liberación", "ft", 2],
  ["rel_side_arm", "lado de liberación", "ft", 2],
];
const nf = (v: number, d: number) => v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

function Metodo({ meta }: { meta: DashboardMeta }) {
  const { sigma, offsets } = meta.smoothing;
  return (
    <details className="panel c12 colapsable">
      <summary className="ph flex !border-b-0">
        <h2>Cómo calcula el simulador</h2>
      </summary>
      <ol className="pb m-0 grid list-decimal gap-2 border-t border-linea pl-10 text-[14px]">
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
          variaciones de ejecución del lanzamiento y de la recta, de la mitad de la variación natural de cada variable:{" "}
          {VARIACION.map(([campo, nombre, unidad, d]) => `±${nf(sigma[campo], d)} ${unidad} de ${nombre}`).join(", ")}.
          Así un cambio de una décima no mueve la calificación por un umbral del modelo.
        </li>
        <li>Stuff+ se escala con la media y la desviación estándar de esa categoría de altitud.</li>
      </ol>
    </details>
  );
}
