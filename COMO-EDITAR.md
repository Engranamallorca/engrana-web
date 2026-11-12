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
| `/ayuda/` | `ayuda/index.html` (ayuda de digitalización 2027) |
| `/contacto/` | `contacto/index.html` (el formulario) |
| `/gracias/` | `gracias/index.html` |
| — | `404.html` (página de error) |
| — | `_plantilla-articulo.html` (plantilla del blog) |
| — | `_redirects` (redirecciones 301 de las direcciones antiguas `.html`) |
| — | `sitemap.xml`, `robots.txt` (para Google) |

## Reglas importantes

- **Enlaces e imágenes siempre empiezan por `/`**: `href="/contacto/"`, `src="/filosofia-02.jpg"`.
- **No borres `_redirects`**: hace que las direcciones antiguas (`/webs.html`…) sigan funcionando.
- **Página nueva** = carpeta nueva con su `index.html` + añadirla a `sitemap.xml`.

## Cambios rápidos

- **Correo de contacto:** `main.js`, línea `const EMAIL = "..."`.
- **Google Analytics 4:** `main.js`, línea `const GA4_ID = ""` → pega tu ID (`G-XXXXXXX`) entre las comillas.
- **Colores:** `styles.css`, arriba del todo.
- **Palabras en cursiva** en los títulos: van entre `<em>` y `</em>`.

## Fotografías reales

La web tiene huecos preparados para fotos reales (almacén, oficina, equipo). Mientras no haya foto, el hueco no se ve.

1. Prepara la foto en horizontal (1600 × 900 px) y guárdala en dos formatos con el mismo nombre: `foto-almacen.jpg` y `foto-almacen.webp`.
2. Súbelas a la carpeta principal.
3. En `main.js`, cambia `const FOTOS = [];` por `const FOTOS = ["foto-almacen"];`.

Hueco disponible ahora: `foto-almacen` (portada, sección «Venimos de la distribución»).

## Diseño (noviembre 2026)

- Tipografías: **Archivo** (títulos y texto), **Newsreader** (cursivas entre `<em>`), **IBM Plex Mono** (datos).
- El dorado solo se usa en el núcleo del engranaje y en pequeños acentos. Los botones son oscuros sobre fondo claro y claros sobre fondo oscuro.
- Cada página lleva en `<body class="p-… t-…">` su nombre y su tono (`t-light`, `t-white`, `t-dark`, `t-carbon`, `t-blue`). Al crear una página nueva, copia el `<body>` de una parecida.
- La capa de diseño actual está al final de `styles.css` («Dirección de arte v3»).

## Formulario de contacto

Está en `/contacto/`. Los botones de cada página llevan a él indicando el servicio
(`/contacto/?servicio=automatizacion`), y cada solicitud que llega a Netlify (Forms → diagnostico)
dice desde qué servicio y qué página vino.

## Publicar la frase de la semana (Filosofía)

1. Sube la imagen a la carpeta principal con el nombre `filosofia-02.jpg` (la siguiente, `filosofia-03.jpg`…).
2. Abre `filosofia/index.html` y pulsa el lápiz ✏️.
3. Copia un bloque `<article class="idea"> … </article>` y pégalo **encima** del anterior.
4. Cambia: `id="idea-02"`, número, fecha, imagen (`src="/filosofia-02.jpg"`), frase (también en `alt`), traducción y significado.
5. **Commit changes.**

## Escribir un artículo del blog

1. Copia el contenido de `_plantilla-articulo.html`.
2. **Add file → Create new file** y escribe como nombre `blog/nombre-del-articulo/index.html` (sin tildes ni espacios). Pega.
3. Cambia título SEO, descripción, fecha, categoría, texto y los enlaces relacionados.
   Borra la línea `<meta name="robots" content="noindex, follow">` y cambia el `canonical` por la nueva dirección.
4. En `blog/index.html`, copia un bloque `<a class="post-card" …>…</a>`, pégalo el primero y cambia enlace, título y resumen.
5. Añade la dirección a `sitemap.xml`.
