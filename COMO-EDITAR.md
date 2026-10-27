# Cómo editar la web de Engrana

## Qué hay en cada carpeta

| Archivo | Qué es |
|---|---|
| `index.html` | Portada |
| `servicios/webs.html` | Página de webs |
| `servicios/automatizacion.html` | Página de automatización |
| `servicios/marketing.html` | Página de marketing y redes |
| `servicios/correo.html` | Página de correo profesional |
| `sobre-nosotros.html` | Sobre nosotros |
| `blog/index.html` | Lista de artículos del blog |
| `blog/_plantilla-articulo.html` | Plantilla para artículos nuevos |
| `assets/styles.css` | Colores, letras y diseño de TODA la web |
| `assets/main.js` | Tu correo de contacto (se cambia en un solo sitio) |
| `assets/` | Logos e icono |

## Cambios rápidos

- **Cambiar el correo de contacto:** abre `assets/main.js` y cambia la línea `const EMAIL = "..."`. Se actualiza en todas las páginas.
- **Cambiar colores:** abre `assets/styles.css`; arriba del todo están `--pine` (verde) y `--gold` (dorado).
- **Cambiar un texto:** abre la página, busca el texto y escríbelo encima. No borres lo que va entre `< >`.

## Escribir un artículo del blog

1. Copia `blog/_plantilla-articulo.html` y ponle un nombre sin espacios ni tildes, por ejemplo `blog/como-conseguir-resenas.html`.
2. Cambia el título, la fecha, la categoría y los párrafos.
3. Abre `blog/index.html`, copia un bloque `<a class="post-card" …> … </a>`, pégalo el primero y cambia el enlace, el título y el resumen.
4. Si quieres que salga también en la portada, haz lo mismo en la sección «Del blog» de `index.html`.

## Añadir una página de servicio nueva

1. Copia uno de los archivos de `servicios/` y cámbiale el nombre.
2. Cambia los textos.
3. Añade el enlace en el menú (`<ul class="sub">`) y en el pie (`<h4>Servicios</h4>`). El menú está repetido en cada página, así que hay que añadirlo en todas. Si te da pereza, pídeselo a Claude.

## Publicar con GitHub + Netlify (se hace una sola vez)

1. Crea una cuenta gratis en github.com.
2. Pulsa **New repository**, llámalo `engrana-web`, márcalo como **Private** y créalo.
3. Pulsa **uploading an existing file** y arrastra **el contenido** de esta carpeta (no la carpeta entera). Pulsa **Commit changes**.
4. En Netlify, entra en tu proyecto actual (el de engranamallorca.com) → **Project configuration → Build & deploy → Continuous deployment → Link repository**.
5. Elige GitHub, autoriza y selecciona `engrana-web`. Deja **Build command** vacío y **Publish directory** en `/`. Guarda.

A partir de aquí, cada cambio que guardes en GitHub se publica solo en tu web en un minuto.

## Editar desde el navegador

- **Un archivo:** en GitHub, ábrelo, pulsa el lápiz ✏️, cambia lo que quieras y pulsa **Commit changes**.
- **Varios archivos a la vez:** en la página del repositorio pulsa la tecla `.` (punto). Se abre un editor completo en el navegador. Cuando acabes, ve al icono de ramas de la izquierda, escribe qué has cambiado y pulsa **Commit & Push**.
