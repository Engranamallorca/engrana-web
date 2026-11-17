# Envíos programados desde Google Sheets + Gmail (info@engrana-mallorca.com)

Tres archivos para pegar en Google Apps Script:

| Archivo | Qué es |
|---|---|
| `Codigo.gs` | Toda la lógica: personalización, envíos, seguimientos, bajas, programación |
| `Panel.html` | El panel visual (estilo panel comercial) para rellenar y controlar todo |
| `appsscript.json` | Zona horaria de Madrid |

## 1. Instalación (una sola vez, 10 minutos)

1. **Entra en Google con la cuenta `info@engrana-mallorca.com`**: los correos salen de la cuenta que ejecuta el script.
   - Si `info@` no es una cuenta propia sino un alias de otra cuenta, entra con esa cuenta y comprueba en Gmail → Configuración → *Cuentas* → *Enviar como* que `info@engrana-mallorca.com` está añadido y verificado.
2. Crea una hoja nueva en [sheets.new](https://sheets.new) y llámala, por ejemplo, «Envíos Engrana».
3. Menú **Extensiones → Apps Script**.
4. En el archivo `Código.gs` que aparece, borra todo y pega el contenido de **`Codigo.gs`**.
5. Pulsa **＋ → HTML**, llámalo exactamente **`Panel`** y pega el contenido de **`Panel.html`**.
6. (Recomendado) Engranaje *Configuración del proyecto* → marca «Mostrar el archivo de manifiesto appsscript.json» → abre `appsscript.json` y pega el de esta carpeta (zona horaria Europe/Madrid).
7. Guarda (💾), vuelve a la hoja y **recárgala**. Aparece el menú **Engrana envíos**.
8. **Engrana envíos → ★ Abrir panel de envíos**. La primera vez Google pide permisos (Hojas de cálculo y Gmail): acepta. Si sale «Google no ha verificado esta aplicación», pulsa *Configuración avanzada → Ir a … (no seguro)*: es tu propio script.

El panel crea solo las pestañas `Contactos`, `Plantillas`, `Configuración`, `Bajas` y `Registro`.

### Abrir el panel en pantalla completa (opcional)

En Apps Script: **Implementar → Nueva implementación → Aplicación web**. *Ejecutar como*: Yo. *Quién tiene acceso*: **Solo yo**. Guarda la URL en marcadores: es el panel a pantalla completa, también desde el móvil.

## 2. Uso diario

1. **Añadir contactos** (pestaña *＋ Añadir contactos*):
   - Uno a uno, o
   - **Pegar desde Excel**: en tu Excel ordena las columnas como `Email | Nombre | Empresa | Cargo`, selecciónalas, copia y pega. El panel te enseña qué filas son válidas antes de guardar y descarta duplicados.
   - Marca **«Ha pedido la información o ha aceptado recibirla»** y escribe cómo (por ejemplo «me pidió el enlace por LinkedIn el 16/11»). Sin eso no se envía.
2. **Plantillas**: edita el texto y ves el correo final a la derecha al momento. Datos disponibles: `{{Nombre}}`, `{{Empresa}}`, `{{Cargo}}`, `{{Sector}}`, `{{Enlace}}` y cualquier columna que añadas en la hoja. `{{Nombre|hola}}` pone «hola» si falta el nombre; si falta un dato sin valor por defecto, ese contacto no se envía y queda marcado como error.
3. **Probar**: en *Contactos* pulsa **Ver** (vista previa) o **Prueba** (te llega a ti). Mientras el *Modo prueba* esté activo, «Enviar tanda ahora» manda como máximo 3 correos a tu email de prueba y no marca nada.
4. **Enviar de verdad**: *Configuración* → desmarca *Modo prueba* → Guardar. Después:
   - **✉ Enviar tanda ahora** envía una tanda en el momento, o
   - **Envío programado** (interruptor de arriba): cada 15 minutos, de lunes a viernes entre las 9 y las 18 h (configurable), envía una tanda pequeña hasta el límite diario.
   - Para mandar a alguien un día y hora concretos, rellena **Programar** al añadirlo.
5. **Seguimiento**: si la plantilla tiene «Seguimiento a los N días», se envía un único recordatorio **en el mismo hilo** a quien no haya respondido.
6. **Respuestas y bajas**: cada tanda revisa los hilos. Si alguien responde, pasa a *Respondido* y no recibe el seguimiento. Si responde «BAJA», pasa a *Baja* y a la lista de bajas, y no se le vuelve a escribir.

### Saber quién ha hecho el diagnóstico

Cada contacto recibe un enlace con su referencia (`ref=E-XXXXXX`) y la campaña. Cuando alguien solicite la revisión en la web, el campo **URL de origen** de la solicitud lleva esa referencia: búscala en el panel para saber de qué contacto viene.

## 2 bis. Conectar con la web (saber quién abre el enlace, hace el test o pide revisión)

Una vez configurado, el panel apunta en cada contacto que llegó con tu enlace:

- **Abrió el enlace**
- **Hizo el test**, con su resultado (por ejemplo, `58 % · El trabajo manual tiene un peso importante · Centralizar los pedidos`)
- **Pidió revisión**

Además, todas las solicitudes del formulario se guardan en la pestaña **Solicitudes web** (también las de quien llegó sin enlace) y aparecen en la pestaña **Solicitudes** del panel. A quien ya hizo el test no se le envía el recordatorio.

Se configura una sola vez (5 minutos), con la cuenta info@:

1. **Actualiza los archivos.** Pega en Apps Script los nuevos `Codigo.gs` y `Panel.html`, guarda y recarga la hoja. Aparecen columnas nuevas en Contactos y la pestaña «Solicitudes web».
2. **Copia la clave.** En el panel: *Configuración → Conectar con la web → Mostrar clave para Netlify*. Copia el texto.
3. **Publica el receptor.** En Apps Script: **Implementar → Nueva implementación → Aplicación web**:
   - *Descripción*: «Receptor web»
   - *Ejecutar como*: **Yo**
   - *Quién tiene acceso*: **Cualquiera**

   Copia la URL que termina en `/exec`.

   Esta implementación es distinta de la del panel, que sigue siendo «Solo yo». Aunque alguien encontrara esta URL, solo vería «Acceso restringido»: el panel comprueba que eres tú, y para escribir en la hoja hace falta la clave.
4. **Pon las variables en Netlify.** En [tu proyecto de Netlify](https://app.netlify.com/projects/ephemeral-sfogliatella-85ee45) → *Site configuration → Environment variables → Add a variable*:
   - `DIAGNOSTICO_WEBHOOK_URL` = la URL `/exec` del paso 3
   - `DIAGNOSTICO_WEBHOOK_TOKEN` = la clave del paso 2
5. **Vuelve a publicar la web** para que cargue las variables: *Deploys → Trigger deploy → Deploy site*.
6. **Prueba.** Añade un contacto con tu propio correo, envíatelo de verdad, abre el enlace del correo y haz el test. En un minuto el panel mostrará «Abrió el enlace» y «Hizo el test».

Cuando cambies `Codigo.gs`, actualiza **las dos** implementaciones: *Gestionar implementaciones → ✏️ → Nueva versión*.

> Solo se registra a quien llega con un enlace personal (`ref=E-…`). Las visitas normales a la web no dejan rastro. La política de privacidad del diagnóstico explica este seguimiento.

## 3. Límites recomendados

- Google Workspace permite hasta 1.500 destinatarios al día; una cuenta gratuita de Gmail, 100. El panel muestra la cuota restante.
- Aun así, empieza con **20-40 al día** y tandas de **3-5**: muchos correos idénticos de golpe desde un dominio nuevo acaban en spam y dañan la reputación de `engrana-mallorca.com`.
- Asegúrate de que el dominio tiene SPF, DKIM y DMARC configurados en Google Workspace (Admin → Gmail → Autenticar correo electrónico).

## 4. Importante: a quién se puede enviar

En España, enviar publicidad por correo a quien no la ha pedido ni autorizado está prohibido (art. 21 LSSI), también entre empresas, y sancionado por la AEPD. Por eso el panel:

- solo envía a contactos con **permiso = SI** y te pide anotar cómo se obtuvo (te sirve como prueba si alguien reclama);
- incluye siempre cómo darse de baja y la respeta automáticamente;
- arranca en modo prueba.

Úsalo para escribir a quien te ha pedido el enlace (por ejemplo, tras el primer mensaje de LinkedIn), a clientes y a contactos que lo hayan autorizado. Para empresas que no te conocen, usa primero LinkedIn pidiendo permiso (mensajes en `../MENSAJES-CAPTACION.md`) y añádelas aquí cuando digan que sí.

## 5. Problemas frecuentes

| Mensaje | Solución |
|---|---|
| «…no puede enviar como info@…» | Abre la hoja con la cuenta info@ o añade info@ como alias *Enviar como* en esa cuenta. |
| «Falta la columna …» | No cambies los nombres de los encabezados de la pestaña Contactos (sí puedes añadir columnas nuevas). |
| «Faltan datos: Nombre» | Rellena el nombre o usa `{{Nombre|hola}}` en la plantilla. Luego, en el contacto, ⋯ → *Volver a pendiente*. |
| El envío programado no envía | Comprueba que el modo prueba está desactivado, que estás dentro del horario y que hay contactos *Listos*. Mira la pestaña *Registro*. |
