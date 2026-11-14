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

## Diseño (v4, noviembre 2026)

- Tipografías: **Bricolage Grotesque** (títulos, la misma familia que el logotipo), **Instrument Sans** (texto) e **IBM Plex Mono** (etiquetas y datos).
- Colores en `styles.css`, arriba del todo: verde `#103D33`, verde oscuro `#082820`, dorado `#E5A52F` (solo acentos), blanco cálido `#F5F3EC`.
- Secciones: `sec` (papel), `sec sec--paper2` (papel más oscuro), `sec on-dark` / `on-deep` (verde). Para que algo aparezca al bajar, añade `data-r`.
- La segunda parte de un titular en gris va en `<span class="soft">…</span>`.
- Cambios de página con transición suave (View Transitions) y todas las animaciones se desactivan si el visitante lo pide en su sistema.

## Formulario de contacto

Está en `/contacto/`. Los botones de cada página llevan a él indicando el servicio
(`/contacto/?servicio=automatizacion`), y cada solicitud que llega a Netlify (Forms → diagnostico). El formulario de `/ayuda/` llega como `ayuda-digitalizacion`. Ambos validan los campos antes de enviar y tienen campo trampa contra spam
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
