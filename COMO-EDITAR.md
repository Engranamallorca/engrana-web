# Cómo editar la web de Engrana

Todos los archivos van sueltos, sin carpetas.

| Archivo | Qué es |
|---|---|
| `index.html` | Portada |
| `automatizacion.html` | Solución: automatización empresarial |
| `sistemas-comerciales.html` | Solución: sistemas comerciales y CRM |
| `ia-aplicada.html` | Solución: inteligencia artificial aplicada |
| `webs.html` | Solución: desarrollo y renovación web |
| `marketing.html` | Solución: marketing digital |
| `correo.html` | Solución: correo profesional |
| `inox-brico.html` | Caso real: Inox Brico |
| `taxi-25-muro.html` | Caso real: Taxi 25 Muro |
| `sobre-nosotros.html` | Sobre nosotros |
| `filosofia.html` | Filosofía: la frase de cada semana |
| `blog.html` | Lista de artículos del blog |
| `senales-web-pierde-clientes.html` | Primer artículo del blog |
| `_plantilla-articulo.html` | Plantilla para artículos nuevos |
| `gracias.html` | Página que se ve después de enviar el formulario |
| `404.html` | Página de error |
| `styles.css` | Colores, letras, diseño y animaciones de TODA la web |
| `main.js` | Tu correo de contacto y las animaciones |
| `sitemap.xml`, `robots.txt` | Para Google (añade aquí las páginas nuevas) |

## Cambios rápidos

- **Correo de contacto:** en `main.js`, cambia la línea `const EMAIL = "..."`.
- **Colores:** en `styles.css`, arriba del todo: `--green` (verde), `--gold` (dorado), `--warm` (blanco cálido), `--carbon` (gris carbón).
- **Textos:** abre la página, busca el texto y cámbialo. No borres lo que va entre `< >`.
- **Palabras en dorado y cursiva** en los títulos: van entre `<em>` y `</em>`.

## Foto de fondo de la portada (opcional)

1. Sube una foto horizontal (mínimo 2000 px de ancho, menos de 400 KB) con el nombre `hero.jpg`.
2. En `index.html`, busca `FOTO DE FONDO OPCIONAL` y borra `<!--` del principio de esa nota y `-->` del final de la línea siguiente.

## Formulario de contacto

El formulario funciona con Netlify Forms. En Netlify: **Site configuration → Forms → Enable form detection** (solo una vez).
Los mensajes llegan en Netlify → **Forms → diagnostico**, y puedes activar que te lleguen al correo en **Form notifications**.

## Publicar la frase de la semana (Filosofía)

1. Sube la imagen de la frase con **Add file → Upload files** y llámala `filosofia-02.jpg` (la siguiente, `filosofia-03.jpg`…).
2. Abre `filosofia.html` y pulsa el lápiz ✏️.
3. Copia un bloque `<article class="idea"> … </article>` entero y pégalo **encima** del anterior (la más nueva va arriba).
4. Cambia: `id="idea-02"`, el número y la fecha, el nombre de la imagen, la frase (también en el `alt`), la traducción y el significado.
5. Pulsa **Commit changes**.

## Escribir un artículo del blog

1. En GitHub, abre `_plantilla-articulo.html`, copia todo el contenido.
2. Pulsa **Add file → Create new file**, ponle nombre sin espacios ni tildes (ej. `como-conseguir-resenas.html`) y pega.
3. Cambia título, descripción, fecha, categoría y párrafos. Borra la línea `<meta name="robots" content="noindex">`. Pulsa **Commit changes**.
4. Abre `blog.html`, copia un bloque `<a class="post-card" …> … </a>`, pégalo el primero y cambia el enlace, el título y el resumen.
5. Añade la página nueva a `sitemap.xml`.

## Editar desde el navegador

- **Un archivo:** ábrelo en GitHub, pulsa el lápiz ✏️, cambia y pulsa **Commit changes**. Se publica solo en un minuto.
- **Varios archivos:** en la página del repositorio pulsa la tecla `.` (punto) para abrir el editor completo.
