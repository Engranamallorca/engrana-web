# Cómo editar la web de Engrana

Todos los archivos van sueltos, sin carpetas.

| Archivo | Qué es |
|---|---|
| `index.html` | Portada |
| `webs.html` | Servicio: webs |
| `automatizacion.html` | Servicio: automatización |
| `marketing.html` | Servicio: marketing y redes |
| `correo.html` | Servicio: correo profesional |
| `sobre-nosotros.html` | Sobre nosotros |
| `blog.html` | Lista de artículos del blog |
| `senales-web-pierde-clientes.html` | Primer artículo del blog |
| `_plantilla-articulo.html` | Plantilla para artículos nuevos |
| `styles.css` | Colores, letras y diseño de TODA la web |
| `main.js` | Tu correo de contacto (se cambia en un solo sitio) |
| `logo-*.png`, `icono.png`, `favicon.png` | Logos e icono |

## Cambios rápidos

- **Correo de contacto:** en `main.js`, cambia la línea `const EMAIL = "..."`.
- **Colores:** en `styles.css`, arriba del todo, `--pine` (verde) y `--gold` (dorado).
- **Textos:** abre la página, busca el texto y cámbialo. No borres lo que va entre `< >`.

## Escribir un artículo del blog

1. En GitHub, abre `_plantilla-articulo.html`, copia todo el contenido.
2. Pulsa **Add file → Create new file**, ponle nombre sin espacios ni tildes (ej. `como-conseguir-resenas.html`) y pega.
3. Cambia título, fecha, categoría y párrafos. Pulsa **Commit changes**.
4. Abre `blog.html`, copia un bloque `<a class="post-card" …> … </a>`, pégalo el primero y cambia el enlace, el título y el resumen.

## Editar desde el navegador

- **Un archivo:** ábrelo en GitHub, pulsa el lápiz ✏️, cambia y pulsa **Commit changes**. Se publica solo en un minuto.
- **Varios archivos:** en la página del repositorio pulsa la tecla `.` (punto) para abrir el editor completo.
