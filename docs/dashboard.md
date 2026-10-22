# Diseño del dashboard

El dashboard es un sitio estático: todo el cálculo ocurre en el navegador, sin servidor ni API. Así cualquier
persona puede abrirlo con un link, desde laptop o celular, sin instalar nada.

## Principios

- **Lenguaje llano primero.** Cada vista abre con una o dos frases que explican qué se está viendo antes de
  mostrar números. El público principal son tomadores de decisiones, no analistas.
- **Una sola fuente de verdad.** El modelo y todas las cifras vienen de `public/data/`, generados por el
  pipeline de Python. La interfaz no contiene números escritos a mano.
- **Paridad verificada.** El simulador web reproduce los cálculos de Python; `tests/fixtures.json` contiene
  casos de referencia y `npm run check` falla si alguno difiere en más de 0.01 puntos de Stuff+.
- **Identidad neutral.** Sin logos, escudos ni tipografías de Diablos Rojos, la LMB ni ningún equipo. Pitchers
  siempre por su identificador anónimo.

## Tecnología

- Next.js (App Router) con exportación estática, TypeScript, Tailwind CSS y Recharts.
- Los JSON se cargan una sola vez en el cliente (`model.json` pesa 0.6 MB) y se reutilizan entre vistas.
- Formato numérico: Stuff+ sin decimales; pulgadas y mph con un decimal.

## Datos

| Archivo | Contenido |
|---|---|
| `model.json` | 500 árboles del modelo en formato compacto (`[feature, umbral/valor, izq, der]` por nodo) |
| `meta.json` | Escala por categoría de altitud, sedes y densidades, exponentes físicos, valores por defecto y rangos del simulador, percentiles, validación, perfil físico, pérdida de movimiento por tipo, equivalencias en el campo (`calibration`), palancas (`levers`) y validación de la proyección (`projection_validation`) |
| `pitchers.json` | 601 pitchers con al menos 300 lanzamientos: Stuff+ global, por categoría de altitud y proyectado en CDMX |
| `arsenal.json` | Arsenal de cada pitcher, con los campos `sim_*` necesarios para cargarlo en el simulador |

## Lógica del simulador (`lib/simulator.ts`)

1. El lanzamiento capturado se lleva a "nivel del mar" dividiendo su movimiento inducido entre el factor físico
   de la sede donde se midió: `(ρ_sede / ρ_mar) ^ p_tipo`.
2. Se traslada a cada sede multiplicando por el factor de esa sede. La recta del mismo pitcher se traslada con
   el exponente de su propio tipo, y las diferencias lanzamiento − recta se recalculan.
3. El modelo califica el lanzamiento con la categoría de altitud de la sede. La predicción se promedia sobre 64
   variaciones de ejecución (±0.6 mph, ±1.2 in de movimiento) para que el resultado no dependa de un umbral
   individual del modelo.
4. Stuff+ se escala con la media y desviación estándar de esa categoría de altitud.

5. **Equivalencias:** `tangibles(meta, ΔStuff+)` traduce una diferencia de Stuff+ a fallos por swing y carreras
   por cada 1,000 lanzamientos, con la relación medida en `pipeline/08_calibration.py`.
6. **Palancas:** `levers(meta, tipo, sede)` devuelve, ordenados, los cambios pequeños que más suben el Stuff+ de
   ese tipo de lanzamiento en la sede, con una descripción en lenguaje llano. Son efectos promedio sobre miles de
   lanzamientos reales, no un cálculo sobre el punto capturado: un modelo de árboles tiene ondulaciones locales y
   el promedio es lo estable.

Sedes que muestra el simulador: sin altitud (promedio 151 m), altitud media (1,454 m) y Estadio Alfredo Harp
Helú (2,240 m). El Harp Helú está 270 m arriba del promedio de las sedes de altitud extrema con las que se
estimó la ley física: esa columna es una extrapolación y la interfaz lo indica.

## Vistas

### Inicio (`/`)
Hallazgo principal en una frase, tres indicadores (lanzamientos analizados, pérdida de movimiento en altitud
extrema, lanzamientos necesarios para que Stuff+ prediga mejor que el resultado real) y acceso a las demás vistas.

### Simulador (`/simulador`)
La vista central de la demostración.
- Selector de tipo de lanzamiento; al cambiarlo se precargan valores típicos de la liga.
- Controles para velocidad, movimiento vertical (IVB), movimiento horizontal hacia el lado del brazo (HB),
  giro, eje, extensión y altura de liberación, dentro de los rangos observados en la LMB.
- Panel de la recta del pitcher, que se oculta cuando el lanzamiento evaluado es la propia recta.
- Selector "¿Dónde se midieron estos valores?" para capturar datos tomados en cualquier sede.
- Resultado por sede, con el Harp Helú resaltado: Stuff+, percentil, movimiento en pulgadas y porcentaje
  perdido, y el cambio de Stuff+ frente a la sede sin altitud.
- Gráfica de IVB contra HB con un punto por sede, que muestra cómo se encoge el movimiento.
- Interpretación automática en una frase, con el cambio de Stuff+ traducido a fallos y carreras.
- Panel "¿Qué mover para rendir más en el Harp Helú?": las palancas del tipo de lanzamiento, con los puntos de
  Stuff+ que aporta cada una y la nota de que son asociaciones aprendidas por el modelo.
- Se puede abrir con un lanzamiento real desde la vista de pitchers (`?p=<pitcher>&t=<tipo>`).

### Pitchers (`/pitchers`)
"¿Quién viaja bien a la CDMX?" Tabla ordenable y con búsqueda, ordenada por defecto por Stuff+ proyectado en
CDMX (proyección validada contra el rendimiento real en altitud), con filtro por mano. Al seleccionar un pitcher se muestra su arsenal (uso, Stuff+, velocidad, movimiento,
giro y cambio proyectado en CDMX por lanzamiento) con la opción de abrir cada lanzamiento en el simulador.

### Física (`/fisica`)
Pérdida de movimiento por tipo de lanzamiento contra la predicción por densidad; exponentes por tipo con su
intervalo de confianza y si validaron en altitud media; y tres conclusiones en lenguaje llano: el sensor está
bien calibrado, el tiempo de vuelo no explica la pérdida, y la pelota "muerde" menos el aire de lo que la
densidad sola predice.

### Modelo (`/modelo`)
Cómo se construyó la métrica en cinco pasos (objetivo, variables, modelo, escala, validación); qué significa un
punto de Stuff+ en el campo; la validación de la proyección a altitud con pitchers que el modelo no vio; la
escalera de modelos, el poder predictivo con muestras chicas, la estabilidad año contra año y la importancia de
variables.

### Reporte (`/reporte`)
El reporte técnico completo, con opción de abrirlo aparte o imprimirlo como PDF.
