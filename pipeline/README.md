# Pipeline de datos (Python)

Genera todo lo que está en `public/data/`, `lib/stuffModel.ts` y `tests/fixtures.json`. No forma parte del sitio.
Se ejecuta desde este directorio, con el dataset en `../data/stuff_model_df.parquet`.

```
pip install pandas pyarrow lightgbm scikit-learn scipy
python3 verificacion_sin_etiquetas.py   # exponentes.json (capa física)
python3 01_target.py                    # target.parquet (valor de carrera por lanzamiento)
python3 02_features.py                  # features.parquet
python3 03_model.py                     # modelo + validación (~6 min)
python3 04_small_sample.py              # poder predictivo en muestras chicas
python3 05_results.py                   # escala, proyección CDMX, perfil, tableros
python3 07_validate_projection.py       # ¿la proyección predice el rendimiento en altitud? (~6 min)
python3 08_calibration.py               # Stuff+ en unidades de campo (carreras, % de fallos)
python3 09_levers.py                    # palancas de desarrollo por tipo y altitud
python3 11_contacto.py                  # riesgo de contacto duro y jonrón por perfil; hipótesis H3
python3 13_robustez.py                  # baseline nulo por conteo, park holdout y SHAP (~8 min)
python3 13b_park_estricto.py            # park holdout sin la sede ni los pitchers evaluados (~4 min)
python3 06_export.py                    # public/data/*.json, lib/stuffModel.ts, tests/fixtures.json
(cd .. && npx tsx scripts/build-arsenal-ref.ts)  # referencia de la liga para el evaluador de arsenal
python3 10_arsenal.py                   # casos de prueba del evaluador de arsenal y su validación (~6 min)
python3 12_movement_map.py              # datos del mapa de movimiento
python3 gen_reporte.py                  # public/reporte.html (el PDF se imprime desde el navegador)
```
`simulador_trayectoria.py` y `densidad_altitud.py` son el soporte físico (trayectoria con arrastre y Magnus).
`simcore.py` es el núcleo del simulador en Python, equivalente a `lib/simulator.ts`: lo usan los casos de prueba y la validación del evaluador de arsenal. El suavizado promedia cada predicción sobre 128 variaciones (secuencia de Sobol con semilla fija) con la mitad de la variación natural de ejecución de cada variable.
