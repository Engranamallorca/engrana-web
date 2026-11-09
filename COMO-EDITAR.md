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

- **Enlaces e imágenes siempre empiezan por `/`**: `href="/contacto/"`, `src="/filosofia-02.jpg"`.
- **No borres `_redirects`**: hace que las direcciones antiguas (`/webs.html`…) sigan funcionando.
- **Página nueva** = carpeta nueva con su `index.html` + añadirla a `sitemap.xml`.

## Cambios rápidos

- **Correo de contacto:** `main.js`, línea `const EMAIL = "..."`.
- **Google Analytics 4:** `main.js`, línea `const GA4_ID = ""` → pega tu ID (`G-XXXXXXX`) entre las comillas.
- **Colores:** `styles.css`, arriba del todo.
- **Palabras en dorado y cursiva** en los títulos: van entre `<em>` y `</em>`.

## Foto de fondo de la portada (opcional)

1. Sube una foto horizontal (mínimo 2000 px de ancho, menos de 400 KB) llamada `hero.jpg`.
2. En `index.html`, busca `FOTO DE FONDO OPCIONAL` y borra `<!--` del principio de la nota y `-->` del final de la línea siguiente.

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
