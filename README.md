# Stuff+ calibrado por altitud · LMB

Métrica de calidad de pitcheo (Stuff+) para la Liga Mexicana de Béisbol que incorpora la física del aire
delgado, con un simulador para estimar cómo rinde cualquier lanzamiento en el Estadio Alfredo Harp Helú
(Ciudad de México, 2,240 m).

Proyecto para el reto **Diablos Rojos** del hackathon ISAC 2026.

- **Dashboard:** https://stuffplus-lmb.vercel.app/
- **Reporte técnico:** [`public/reporte.html`](public/reporte.html) (versión PDF: [`public/reporte.pdf`](public/reporte.pdf))
- **Video de demostración:** [LINK DEL VIDEO]

## Hallazgo principal

En las sedes de altitud extrema los lanzamientos pierden en promedio **25% de su movimiento** frente a las
sedes a nivel del mar, midiendo al mismo pitcher con el mismo lanzamiento. La pérdida es mayor de lo que la
densidad del aire explica por sí sola: la fuerza que curva la pelota cae como la densidad elevada a 1.5, una
ley que se estimó en altitud extrema y se confirmó, sin reajustar, en altitud media.

Como Stuff+ compara cada lanzamiento contra los que se tiran en el mismo tipo de sede, lo relevante es quién
pierde menos que los demás. En el Harp Helú las rectas de cuatro costuras pierden terreno relativo y los
sliders y cutters lo ganan; la proyección física y lo observado en los datos coinciden.

## Cómo está construido

| Capa | Qué hace | Dónde |
|---|---|---|
| Objetivo | Valor de carrera de cada lanzamiento según el cambio de conteo, con valores de conteo y pesos de eventos calculados para la LMB y batazos valorados por velocidad de salida y ángulo | `pipeline/01_target.py` |
| Variables | Solo "stuff": velocidad, giro, movimiento, liberación y diferencias contra la recta del mismo pitcher. Sin ubicación ni etiqueta de tipo de lanzamiento | `pipeline/02_features.py` |
| Modelo | LightGBM, 500 árboles. Stuff+ = 100 + 10·z dentro de cada categoría de altitud | `pipeline/03_model.py`, `05_results.py` |
| Validación | Pitchers no vistos, temporada 2026 fuera de muestra, estabilidad año contra año, poder predictivo con muestras chicas, proyección a altitud contra resultados reales, equivalencias en el campo | `pipeline/03_model.py`, `04_small_sample.py`, `07_validate_projection.py`, `08_calibration.py` |
| Palancas | Efecto promedio de cambios pequeños (velocidad, movimiento, giro, eje, extensión) por tipo de lanzamiento y altitud | `pipeline/09_levers.py` |
| Física | Descomposición de la aceleración medida en arrastre y Magnus; exponentes por tipo con validación cruzada entre altitudes; simulador de trayectoria | `pipeline/verificacion_sin_etiquetas.py`, `simulador_trayectoria.py` |
| Simulador web | El mismo modelo evaluado en el navegador, con el traslado físico entre sedes | `lib/stuffModel.ts`, `lib/simulator.ts` |

Resultados clave de la validación:

| Prueba | Resultado |
|---|---|
| Correlación Stuff+ vs. valor de carrera real (pitcher × lanzamiento, pitchers no vistos) | 0.41 |
| Igual, entrenando 2024–2025 y evaluando 2026 | 0.46 |
| Estabilidad del Stuff+ de una temporada a la siguiente | 0.88 |
| Con 25 lanzamientos: Stuff+ vs. resultado real para predecir el resto de la temporada | 0.37 vs. 0.16 |
| Anticipar el Stuff+ de un pitcher en altitud desde sus lanzamientos a nivel del mar (pitchers no vistos): error del simulador vs. suponer que rinde igual | 3.2 vs. 5.9 puntos (46% menos) |
| Correlación con las carreras reales permitidas en altitud: Stuff+ proyectado vs. Stuff+ a nivel del mar | 0.30 vs. 0.23 |

Cada 10 puntos de Stuff+ equivalen en el campo a +5.3 puntos porcentuales de fallos por swing y 5.9 carreras menos por cada 1,000 lanzamientos.

## Estructura del repositorio

```
├── app/, components/       Dashboard (Next.js, sitio estático)
├── lib/
│   ├── stuffModel.ts        Evaluador del modelo en TypeScript
│   └── simulator.ts         Traslado físico entre sedes + calificación
├── public/
│   ├── data/                Modelo y tableros generados por el pipeline (JSON)
│   ├── reporte.html         Reporte técnico
│   └── reporte.pdf
├── pipeline/                Código de Python que genera public/data/ (ver pipeline/README.md)
├── tests/fixtures.json      Casos de referencia: Stuff+ esperado por sede, calculado en Python
├── scripts/check-fixtures.ts  Verifica que el simulador web reproduce los casos de referencia
└── docs/dashboard.md        Diseño funcional del dashboard
```

## Correr localmente

```bash
npm install
npm run check   # el simulador web debe reproducir tests/fixtures.json (tolerancia 0.01)
npm run dev
```

## Datos

Datos Trackman de la LMB 2024–2026 provistos por Diablos Rojos para el hackathon: 635,002 lanzamientos con
pitchers, bateadores y juegos anónimos. **El dataset original no se incluye en este repositorio.** El
directorio `public/data/` contiene solo resultados agregados y el modelo entrenado. Para reproducir el
pipeline, colocar el archivo en `data/stuff_model_df.parquet`.

## Equipo

[NOMBRES DEL EQUIPO]
