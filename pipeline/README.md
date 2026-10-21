# Pipeline de datos (Python)

Genera todo lo que está en `public/data/`, `lib/stuffModel.ts` y `tests/fixtures.json`. No forma parte del sitio.
Se ejecuta desde este directorio, con el dataset en `../data/stuff_model_df.parquet`.

```
pip install pandas pyarrow lightgbm scikit-learn
python3 verificacion_sin_etiquetas.py   # exponentes.json (capa física)
python3 01_target.py                    # target.parquet
python3 02_features.py                  # features.parquet
python3 03_model.py                     # modelo + validación (~6 min)
python3 04_small_sample.py              # poder predictivo en muestras chicas
python3 05_results.py                   # escala, proyección CDMX, perfil, tableros
python3 06_export.py                    # public/data/*.json, lib/stuffModel.ts, tests/fixtures.json
```
`simulador_trayectoria.py` y `densidad_altitud.py` son el soporte físico (trayectoria con arrastre y Magnus).
`halton_offsets.npy` contiene los 64 desplazamientos deterministas con los que el simulador promedia la variación de ejecución.
