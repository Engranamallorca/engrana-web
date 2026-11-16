# ENGRANA | Diagnóstico de Automatización

Herramienta interactiva de captación publicada en **`/diagnostico/`**
(`https://www.engrana-mallorca.com/diagnostico/`).

Una empresa abre el enlace, responde 8 preguntas en unos 3 minutos y recibe un
diagnóstico orientativo **sin dar ningún dato**. Después, si quiere, solicita una
revisión con un formulario opcional que llega a Engrana mediante Netlify Forms.

---

## 1. Qué se ha añadido (y qué no se ha tocado)

La web sigue siendo HTML/CSS/JS estático en Netlify, así que el diagnóstico es una
página independiente, sin frameworks ni dependencias. **No se ha modificado ninguna
página existente ni `/styles.css`**: el diagnóstico usa su propia hoja de estilos con
prefijo `dg-`.

```
diagnostico/
  index.html               Portada + herramienta completa (una sola página, sin recargas)
  diagnostico.css          Estilos aislados
  og-diagnostico.jpg       Imagen para LinkedIn (1200 × 630)
  img/sistema-*.jpg/webp   Capturas del sistema comercial SIN el logotipo del cliente
  privacidad/index.html    Política de privacidad del diagnóstico (BORRADOR, ver §6)
  js/datos.js              ÚNICA fuente de preguntas, respuestas, niveles y textos
  js/motor.js              Cálculo del diagnóstico (sin interfaz, probado)
  js/app.js                Interfaz: etapas, cuestionario, resultado, formulario, galería
netlify/functions/
  submission-created.js    Validación en servidor + reenvío opcional a un webhook privado
tests/diagnostico/         Pruebas automáticas (node --test)
docs/diagnostico/          Esta documentación y los mensajes de difusión
_redirects                 + /diagnostico → /diagnostico/ y bloqueo de /netlify, /tests, /docs
sitemap.xml                + /diagnostico/
```

Las fotografías del almacén y las capturas de la aplicación se reutilizan desde `/img/`
(ya estaban anonimizadas). Para las del sistema comercial se han creado copias en
`diagnostico/img/` con el logotipo del cliente sustituido por un bloque «EMPRESA», para
que la empresa no se identifique públicamente.

## 2. Cómo editar los textos

Todo está en **`diagnostico/js/datos.js`**: preguntas, opciones, dimensiones, niveles,
oportunidades, recomendaciones, sectores y tamaños. Cambia ahí el texto y se actualiza en la
pantalla, en el formulario que llega a Engrana y en las pruebas.

La puntuación (A = 0, B = 1, C = 2, D = 3; máximo 24; cuatro dimensiones de 2 preguntas)
está en `motor.js`, con su documentación en la cabecera del archivo.

Si cambias CSS o JS, sube el número `?v=1` de `index.html` para evitar cachés antiguas.

## 3. Pruebas

```bash
node --test "tests/**/*.test.js"
```

Cubre los cuatro casos pedidos (0/24, 8/24, 16/24, 24/24), los límites de nivel, el cálculo de
cada dimensión, la dimensión prioritaria, los empates (dos y tres dimensiones), las
recomendaciones y la validación en servidor (honeypot, correo, teléfono, total manipulado).

Además se ha probado en navegador (Chromium, 1440 px y 390 px) el recorrido completo:
comenzar, elegir sector y tamaño, responder, retroceder conservando respuestas, botón Atrás
del navegador, resultado, repaso y cambio de una respuesta con recálculo, validación del
formulario, envío, confirmación, bloqueo de reenvíos duplicados, honeypot, ausencia de
errores en consola y de desplazamiento horizontal.

## 4. Publicación en Netlify (sin afectar al sitio actual)

1. Fusiona la rama en la rama de producción. No hace falta cambiar el comando de
   compilación ni la carpeta de publicación.
2. **Netlify Forms**: en *Site configuration → Forms*, comprueba que la detección de
   formularios está activada. Tras el primer despliegue aparecerá el formulario
   **`diagnostico-automatizacion`** (lo detecta en el HTML estático de `/diagnostico/`).
3. **Aviso por correo**: *Forms → Form notifications → Add notification → Email
   notification*, formulario `diagnostico-automatizacion`, destinatario
   `jaumemoranta@engrana-mallorca.com`.
4. **Funciones**: Netlify detecta automáticamente `netlify/functions/`. La función
   `submission-created` se ejecuta sola con cada envío verificado; no hay que activarla.
5. Haz un envío de prueba real y bórralo después desde el panel de Forms.
6. Comprueba la previsualización en LinkedIn con el
   [Post Inspector](https://www.linkedin.com/post-inspector/) usando
   `https://www.engrana-mallorca.com/diagnostico/`.

> Antes de difundir el enlace, completa los puntos legales de la sección 6.

### Qué recibe Engrana en cada solicitud

Campos ordenados para seguimiento comercial: `fecha_envio`, `nombre`, `correo`,
`empresa`, `cargo`, `telefono`, `sector`, `tamano_equipo`, `puntuacion_total`,
`indice_porcentaje`, `nivel`, `dim_solicitudes`, `dim_presupuestos`, `dim_seguimiento`,
`dim_informacion`, `oportunidad_principal`, `recomendaciones`, `respuestas` (las 8, con
letra, puntos y texto), `url_origen`, `campana` (parámetros `utm_*`), `referente`,
`comunicaciones_comerciales`, `consentimiento_registro`, `id_envio` y `datos_json`
(todo lo anterior en JSON estructurado).

Para medir campañas, comparte el enlace con parámetros, por ejemplo:
`https://www.engrana-mallorca.com/diagnostico/?utm_source=linkedin&utm_medium=mensaje&utm_campaign=distribuidoras-2026`

### Duplicados y antispam

- Honeypot `bot-field` (Netlify lo descarta; además el navegador no envía nada si se rellena).
- Filtro antispam propio de Netlify Forms.
- Una solicitud por diagnóstico: tras enviarla, los reintentos llevan a la confirmación sin
  volver a enviar. Cada solicitud lleva un `id_envio` único para deduplicar en destino.
- La función de servidor vuelve a validar los datos y no reenvía al webhook los que no
  cumplen (correo, teléfono, coherencia de la puntuación…).

## 5. Variables que debes configurar

| Dónde | Nombre | Obligatoria | Para qué |
|---|---|---|---|
| Netlify → Forms → Notifications | Email a `jaumemoranta@engrana-mallorca.com` | Recomendada | Aviso de cada solicitud |
| Netlify → Environment variables | `DIAGNOSTICO_WEBHOOK_URL` | No | URL privada a la que reenviar cada solicitud (Apps Script, n8n, Make, CRM…) |
| Netlify → Environment variables | `DIAGNOSTICO_WEBHOOK_TOKEN` | No (recomendada si hay webhook) | Secreto compartido; se envía como `Authorization: Bearer` y en el campo `token` |

Ninguna de estas variables llega al navegador. Sin ellas, todo funciona igual: las
solicitudes quedan en Netlify Forms y llegan por correo.

### Opción: registrar las solicitudes en Google Sheets (Apps Script)

1. Crea una hoja de cálculo y abre *Extensiones → Apps Script*.
2. Pega este código, cambia `TOKEN` por un valor largo y aleatorio, y en *Configuración del proyecto* no necesitas nada más.
3. *Implementar → Nueva implementación → Aplicación web*. Ejecutar como: tú. Acceso: cualquiera.
4. Copia la URL en `DIAGNOSTICO_WEBHOOK_URL` y el token en `DIAGNOSTICO_WEBHOOK_TOKEN`. Vuelve a desplegar en Netlify.

```javascript
const TOKEN = "PEGA_AQUI_EL_MISMO_VALOR_QUE_DIAGNOSTICO_WEBHOOK_TOKEN";
const COLS = ["recibido","id_envio","fecha_envio","nombre","correo","empresa","cargo","telefono",
  "sector","tamano_equipo","puntuacion_total","indice_porcentaje","nivel","dim_solicitudes",
  "dim_presupuestos","dim_seguimiento","dim_informacion","oportunidad_principal","recomendaciones",
  "respuestas","url_origen","campana","referente","comunicaciones_comerciales","consentimiento_registro"];

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.token !== TOKEN) return ContentService.createTextOutput("forbidden");
  const hoja = SpreadsheetApp.getActive().getSheetByName("Solicitudes") || SpreadsheetApp.getActive().insertSheet("Solicitudes");
  if (hoja.getLastRow() === 0) hoja.appendRow(COLS);
  // Evita duplicados por id_envio
  const ids = hoja.getLastRow() > 1 ? hoja.getRange(2, 2, hoja.getLastRow() - 1, 1).getValues().flat() : [];
  if (ids.indexOf(d.id_envio) === -1) hoja.appendRow(COLS.map(c => d[c] || ""));
  return ContentService.createTextOutput("ok");
}
```

## 6. Aspectos legales pendientes antes de activar la captación

La página `/diagnostico/privacidad/` es un **borrador** y lo indica de forma visible.
Antes de difundir el enlace:

- [ ] Identidad del responsable: nombre o razón social, **NIF** y **domicilio** (marcados como PENDIENTE).
- [ ] Plazo de conservación de los datos de las solicitudes y de los consentimientos.
- [ ] Lista de encargados del tratamiento (Netlify; Google u otra herramienta si se activa el webhook) y sus garantías para transferencias internacionales.
- [ ] Revisión del texto por un profesional (RGPD y LOPDGDD) y, si procede, del aviso legal de la web (LSSI).
- [ ] Mecanismo de baja en cualquier comunicación comercial que se envíe a quien marque la casilla (art. 21 LSSI).
- [ ] Registro de actividades de tratamiento: añadir «Solicitudes del diagnóstico» y «Comunicaciones comerciales».
- [ ] Cuando todo esté validado: quitar el aviso amarillo y las marcas PENDIENTE de `privacidad/index.html`, poner la fecha y actualizar `POLITICA_VERSION` en `js/app.js`.

Ya implementado: resultado sin pedir datos; primera capa informativa junto al formulario;
casilla de comunicaciones comerciales opcional, desmarcada y separada de la solicitud;
registro del consentimiento (fecha, texto aceptado y versión de la política) en cada
envío; ningún dato personal en `localStorage`/`sessionStorage` ni cookies propias.

## 7. Notas

- Sin analítica: la página no carga Google Analytics/Ads. Si se quiere medir conversiones,
  conviene reutilizar el banner de consentimiento de la web principal antes de añadirla.
- No se muestran teléfonos ni precios, ni resultados económicos inventados.
- El panel animado de la portada está marcado como «Ejemplo ilustrativo con datos ficticios».
