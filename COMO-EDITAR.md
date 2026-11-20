# Cómo editar la web de Engrana

Cada página vive en su propia carpeta con un archivo `index.html`. Así las direcciones quedan limpias
(`engrana-mallorca.com/automatizacion/`). Las imágenes, `styles.css` y `main.js` siguen en la carpeta principal.

| Dirección | Archivo |
|---|---|
| `/` | `index.html` (portada) |
| `/servicios/` | `servicios/index.html` |
| `/automatizacion/` | `automatizacion/index.html` |
| `/sistemas-comerciales/` | `sistemas-comerciales/index.html` |
| `/ia-aplicada/` | `ia-aplicada/index.html` |
| `/webs/` | `webs/index.html` |
| `/marketing/` | `marketing/index.html` |
| `/correo/` | `correo/index.html` |
| `/sectores/distribucion-suministro/` | `sectores/distribucion-suministro/index.html` |
| `/casos/` | `casos/index.html` |
| `/inox-brico/` | `inox-brico/index.html` |
| `/gaspar-pico/` | `gaspar-pico/index.html` |
| `/taxi-25-muro/` | `taxi-25-muro/index.html` |
| `/sobre-nosotros/` | `sobre-nosotros/index.html` |
| `/filosofia/` | `filosofia/index.html` |
| `/blog/` | `blog/index.html` |
| `/blog/senales-web-pierde-clientes/` | `blog/senales-web-pierde-clientes/index.html` |
| `/contacto/` | `contacto/index.html` (el formulario) |
| `/gracias/` | `gracias/index.html` |
| — | `404.html` (página de error) |
| — | `_plantilla-articulo.html` (plantilla del blog) |
| — | `_redirects` (redirecciones 301 de las direcciones antiguas `.html`) |
| — | `sitemap.xml`, `robots.txt` (para Google) |

## Reglas importantes

- **Enlaces e imágenes siempre empiezan por `/`**: `href="/contacto/"`, `src="/img/taxi25-acceso.jpg"`.
- **Imágenes de proyectos:** están en `/img/`, en `.webp` y `.jpg` y en dos o más tamaños. Son copias **anonimizadas**:
  nunca subas capturas originales con nombres de clientes, personas, importes o referencias.
- **No borres `_redirects`**: hace que las direcciones antiguas (`/webs.html`…) sigan funcionando.
- **Página nueva** = carpeta nueva con su `index.html` + añadirla a `sitemap.xml`.

## Cambios rápidos

- **Correo de contacto:** `main.js`, línea `const EMAIL = "..."`.
- **Google Ads (AW-18540834573):** está en el `<head>` de cada página con modo de consentimiento. No lo dupliques.
- **Google Analytics 4:** `main.js`, línea `const GA4_ID = ""` → pega tu ID (`G-XXXXXXX`) entre las comillas.
- **Colores:** `styles.css`, arriba del todo.
- **Palabras en cursiva** en los títulos: van entre `<em>` y `</em>`.

## Fotografías reales

La fotografía del almacén (`/img/almacen-fertilizantes-baleares.*`) es real: matrícula y rostros difuminados.
Se usa como contexto del sector, **no** como proyecto de cliente; mantén esa aclaración en los pies de foto.

## Diseño (v5, noviembre 2026, hecho con Hallmark)

- Las reglas del diseño están en `design.md`; los colores, tipografías y espacios, en `tokens.css`. `styles.css` solo usa esos tokens.
- Paleta clara: papel blanco, salvia claro para alternar secciones, verde de marca solo en el botón principal y dorado como acento.
- Tipografías: **Bricolage Grotesque** (títulos, la familia del logotipo) e **Instrument Sans** (texto).
- Secciones: `sec` (blanco), `sec band--cream` (crema), `sec band` (salvia). Para que algo aparezca al bajar, añade `data-reveal` (una vez por página).
- No pongas etiquetas pequeñas en mayúsculas encima de los títulos ni partas un título en dos colores: el título va de una pieza.
- Las capturas van en `<div class="shot">`, sin marcos de navegador ni de móvil dibujados.

## Formulario de contacto

Está en `/contacto/`. Los botones de cada página llevan a él indicando el servicio
(`/contacto/?servicio=automatizacion`), y cada solicitud que llega a Netlify (Forms → diagnostico). Ambos validan los campos antes de enviar y tienen campo trampa contra spam
dice desde qué servicio y qué página vino.

## Publicar la frase de la semana (Filosofía)

1. Sube la imagen a la carpeta principal con el nombre `filosofia-02.jpg` (la siguiente, `filosofia-03.jpg`…).
2. Abre `filosofia/index.html` y pulsa el lápiz ✏️.
3. Copia un bloque `<article class="idea" …> … </article>` y pégalo **encima** del anterior.
4. Cambia: `id="idea-02"`, número, fecha, imagen (`src="/filosofia-02.jpg"`), frase (también en `alt`), traducción y significado.
5. **Commit changes.**

## Escribir un artículo del blog

1. Copia el contenido de `_plantilla-articulo.html`.
2. **Add file → Create new file** y escribe como nombre `blog/nombre-del-articulo/index.html` (sin tildes ni espacios). Pega.
3. Cambia título SEO, descripción, fecha, categoría, texto y los enlaces relacionados.
   Borra la línea `<meta name="robots" content="noindex, follow">` y cambia el `canonical` por la nueva dirección.
4. En `blog/index.html`, copia un bloque `<a class="post" …>…</a>`, pégalo el primero y cambia enlace, título y resumen.
5. Añade la dirección a `sitemap.xml`.

## Archivos de Netlify

- `_redirects`: redirecciones 301 (URLs antiguas `.html`, imágenes retiradas y atajos como `/proyectos`).
- `_headers`: cabeceras de seguridad y caché de imágenes.
- `.hallmark/`: capturas y registros internos del rediseño (no se suben a git).
