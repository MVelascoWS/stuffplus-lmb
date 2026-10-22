# Sistema de diseño

El dashboard es una consola para el staff técnico: se consulta en la sala de juntas o en el dugout, a plena luz,
y se opera más de lo que se lee. De ahí sus tres decisiones de fondo:

1. **Fondo claro de alto contraste.** Lienzo gris de aplicación con paneles blancos; legible con luz de día.
2. **El rojo del club significa solo dos cosas:** el Estadio Alfredo Harp Helú y lo élite (el Stuff+ más alto, la
   mejor palanca, lo más efectivo). Nunca se usa como decoración. Se usan los colores del club, no su identidad:
   ni escudos, ni mascota, ni tipografías, ni el nombre de Diablos Rojos o de la LMB como marca.
3. **Los resultados se leen como un line score.** Las sedes son las columnas de un marcador (sin altitud, altitud
   media, Harp Helú) y la última columna es la diferencia, como las carreras totales. El comparador de candidatos
   usa la misma forma, con cada candidato como un equipo.

## Color

| Token | Valor | Uso |
|---|---|---|
| `--tinta` | `#000000` | Texto principal, barra lateral, encabezados del line score, botón principal |
| `--papel` | `#FFFFFF` | Paneles |
| `--lienzo` | `#F2F1F0` | Fondo de la aplicación, fondos de barras de progreso, chips neutros |
| `--rojo` | `#C8102E` | Harp Helú, lo élite, foco de teclado |
| `--rojo-suave` | `#FBEAEC` | Fondo de la columna Harp Helú y de chips rojos |
| `--grafito` | `#5C5552` | Texto secundario, etiquetas, ejes |
| `--linea` | `#E1DDDA` | Bordes de panel y separadores |
| `--linea-fuerte` | `#C9C3BF` | Bordes de controles |
| `--frio` | `#5E7385` | Extremo bajo de la escala divergente (peor que lo típico) |

Escala de las gráficas de calidad: divergente de `--frio` a un gris neutro (`#D9D4D1`) a `--rojo`, centrada en lo
típico (Stuff+ 100 o el percentil 50 del tipo). Estado "validado": un punto verde (`#3FA66B`), solo en el pie de la
barra lateral.

## Tipografía

Una sola familia, **Archivo**, con su eje de ancho variable:

- **Cifras:** ancho 70%, peso 700 a 800, números tabulares. Es lo que da el efecto de marcador.
- **Texto e interfaz:** ancho 100%. Título de página 20 px / 700; título de panel 15 px / 700; texto 14 px;
  etiquetas y metadatos 12 px en `--grafito`.
- Sin mayúsculas sostenidas en etiquetas, sin punto medio como separador.

## Estructura

- **Barra lateral** (232 px, `--tinta`): nombre del producto con un trazo rojo, navegación con íconos de trazo y un
  indicador rojo en la vista activa; al pie, el estado del modelo y del dataset. Bajo 820 px se convierte en barra
  superior desplazable.
- **Encabezado de página** (blanco, fijo al desplazar): título, una línea de descripción y, a la derecha, las
  acciones de la vista. No hay titulares grandes ni párrafos introductorios.
- **Lienzo** con cuadrícula de 12 columnas y 20 px de separación. Cada **panel** tiene borde de 1 px, radio de 8 px,
  sin sombra, y un encabezado con título, metadatos y, si aplica, sus controles.
- **Indicadores** dentro de un panel: etiqueta de 12 px, cifra condensada de 30 px, nota de 12 px; separados por
  líneas, no por tarjetas.
- **Lectura**: la interpretación en lenguaje llano va en una franja al pie del panel de resultados, con un ícono.

## Componentes

- **Line score**: encabezado negro, columna Harp Helú con encabezado rojo y celdas en `--rojo-suave` con cifras rojas,
  separador negro antes de la columna de diferencia. Fila principal con cifras de 52 px.
- **Controles**: botones de 6 px de radio; el principal en negro, el secundario con borde; selectores segmentados con
  la opción activa en negro.
- **Barras de palancas**: negras, la primera en rojo; las que no ayudan en gris.
- **Tablas**: encabezado negro, filas separadas por `--linea`, cifras alineadas a la derecha.
- **Estados de las hipótesis y validaciones**: chips en negro (confirmada), con borde (respaldada) o grises (no
  concluyente). El rojo no se usa para estados.

## Accesibilidad

Foco de teclado visible en rojo; contraste AA en todo el texto; ningún dato depende solo del color (el mapa de
movimiento usa además figuras distintas para lo más y lo menos efectivo); se respeta la preferencia de movimiento
reducido; nada se desborda horizontalmente a 375 px.
