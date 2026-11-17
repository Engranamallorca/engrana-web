/* =====================================================================
   ENGRANA · Envíos programados y personalizados desde Google Sheets
   Remitente: info@engrana-mallorca.com (Gmail / Google Workspace)

   Qué hace
   - Lee los contactos de la hoja «Contactos» y las plantillas de «Plantillas».
   - Personaliza cada correo con {{Columna}} (cualquier encabezado de la hoja).
   - Crea un enlace al diagnóstico con utm_* y una referencia por contacto,
     para saber quién lo ha completado cuando llegue la solicitud.
   - Envía en horario laborable, en pequeños lotes, con pausas y límite diario.
   - Envía un único seguimiento en el mismo hilo si no hay respuesta.
   - Detecta respuestas y peticiones de BAJA y deja de escribir a esa persona.
   - Anota todo en la hoja (Estado, fechas, hilo) y en «Registro».

   Seguridad y legalidad (actívalo con cabeza)
   - Por defecto solo envía a filas con Permiso = SI (personas que han pedido
     la información o han aceptado recibirla). Ver «Exigir permiso».
   - Arranca en «Modo prueba» = SI: todo va a tu correo de prueba y no se
     marca ninguna fila como enviada.
   - Cada correo incluye cómo darse de baja.

   Instalación: ver INSTRUCCIONES.md en esta misma carpeta.
   ===================================================================== */

var HOJA_CONTACTOS = "Contactos";
var HOJA_PLANTILLAS = "Plantillas";
var HOJA_CONFIG = "Configuración";
var HOJA_BAJAS = "Bajas";
var HOJA_REGISTRO = "Registro";
var HOJA_SOLICITUDES = "Solicitudes web";

var COLUMNAS_CONTACTOS = ["Email", "Nombre", "Empresa", "Cargo", "Sector", "Plantilla", "Permiso", "Cómo dio permiso",
  "Programar", "Estado", "Enviado el", "Seguimiento el", "Ref", "Hilo", "Notas",
  "Abrió el enlace", "Hizo el test", "Resultado del test", "Pidió revisión"];

/** Columnas de la pestaña «Solicitudes web» (lo que llega del formulario del diagnóstico). */
var COLUMNAS_SOLICITUDES = ["Recibido", "Ref", "Empresa", "Nombre", "Correo", "Cargo", "Teléfono", "Sector", "Tamaño",
  "Puntuación", "Índice", "Nivel", "Oportunidad principal", "Recomendaciones", "Respuestas", "Campaña",
  "Comunicaciones comerciales", "Consentimiento", "URL de origen", "ID envío"];

var CONFIG_POR_DEFECTO = [
  ["Enviar desde", "info@engrana-mallorca.com", "Cuenta o alias de Gmail desde el que salen los correos."],
  ["Nombre del remitente", "Engrana", "Nombre que verá el destinatario."],
  ["Responder a", "info@engrana-mallorca.com", "Dirección que recibe las respuestas."],
  ["Enlace del diagnóstico", "https://www.engrana-mallorca.com/diagnostico/", "Se usa en {{Enlace}}."],
  ["utm_source", "email", "Origen de la campaña (aparece en cada solicitud)."],
  ["utm_medium", "correo", ""],
  ["utm_campaign", "diagnostico-2026", "Cámbialo por campaña, por ejemplo distribuidoras-diciembre."],
  ["Límite diario", 40, "Máximo de correos nuevos + seguimientos al día. Recomendado 20-50 para cuidar la reputación del dominio."],
  ["Envíos por ejecución", 5, "Correos por tanda (cada 15 minutos)."],
  ["Solo días laborables", "SI", "SI = de lunes a viernes."],
  ["Hora de inicio", 9, "Hora (0-23) a partir de la cual se envía."],
  ["Hora de fin", 18, "Hora (0-23) a partir de la cual ya no se envía."],
  ["Exigir permiso", "SI", "SI = solo se envía a filas con Permiso = SI."],
  ["Seguimiento automático", "SI", "SI = un recordatorio en el mismo hilo si no responden."],
  ["Modo prueba", "SI", "SI = todo va al Email de prueba y no se marca nada como enviado. Ponlo en NO para enviar de verdad."],
  ["Email de prueba", "info@engrana-mallorca.com", "Dónde llegan los correos en modo prueba."],
  ["Firma", "Un saludo,\nEngrana\ninfo@engrana-mallorca.com\nwww.engrana-mallorca.com", ""],
  ["Avisarme a", "info@engrana-mallorca.com", "Te llega un correo en cuanto alguien hace el test o pide la revisión. Déjalo vacío para no recibir avisos."],
  ["Texto de baja", "Si prefieres no recibir más correos nuestros, responde a este mensaje con la palabra BAJA.", "Se añade al final de cada correo."]
];

var PLANTILLAS_POR_DEFECTO = [
  ["Plantilla", "Asunto", "Mensaje", "Días para seguimiento", "Mensaje de seguimiento"],
  ["diagnostico",
   "Un diagnóstico de 3 minutos para {{Empresa}}",
   "Hola, {{Nombre}}.\n\nTe comparto una herramienta que hemos preparado en Engrana para identificar oportunidades de automatización en empresas.\n\nSon 8 preguntas sobre procesos habituales como pedidos, presupuestos, seguimiento de clientes y gestión de información.\n\nAl finalizar obtendrás un diagnóstico orientativo de las áreas en las que podría existir margen de mejora.\n\nPuedes realizarlo aquí:\n{{Enlace}}\n\nEspero que te resulte interesante.",
   5,
   "Hola, {{Nombre}}.\n\nTe escribo solo por si se quedó perdido el correo anterior. Si en algún momento te apetece hacer el diagnóstico, aquí lo tienes:\n{{Enlace}}\n\nY si no es el momento, sin problema."],
  ["linkedin",
   "El diagnóstico que te comenté por LinkedIn",
   "Hola, {{Nombre}}.\n\nComo te comenté por LinkedIn, te dejo el enlace al diagnóstico de Engrana:\n{{Enlace}}\n\nEs bastante sencillo. Al terminar verás las áreas de {{Empresa}} en las que podría haber más margen para simplificar tareas, pedidos o seguimiento comercial.\n\nEspero que te resulte útil.",
   0,
   ""]
];

/* =====================================================================
   Menú
   ===================================================================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Engrana envíos")
    .addItem("★ Abrir panel de envíos", "abrirPanel")
    .addSeparator()
    .addItem("1 · Preparar hojas", "prepararHojas")
    .addItem("2 · Vista previa de la fila seleccionada", "vistaPrevia")
    .addItem("3 · Enviarme una prueba de la fila seleccionada", "enviarPruebaFila")
    .addSeparator()
    .addItem("Enviar una tanda ahora", "enviarTandaAhora")
    .addItem("Revisar respuestas y bajas", "revisarRespuestasMenu")
    .addSeparator()
    .addItem("▶ Activar envío programado", "activarProgramacion")
    .addItem("■ Desactivar envío programado", "desactivarProgramacion")
    .addItem("Estado de hoy", "mostrarEstado")
    .addSeparator()
    .addItem("🔗 Conectar con la web (clave)", "mostrarClaveWeb")
    .addToUi();
}

/* =====================================================================
   Preparación de la hoja
   ===================================================================== */
function prepararHojas() {
  asegurarHojas_();
  SpreadsheetApp.getUi().alert("Hojas preparadas. Abre «Engrana envíos → Abrir panel de envíos» para añadir contactos y plantillas.\n\nEl «Modo prueba» está activado: nada se enviará a contactos reales hasta que lo desactives.");
}

/** Crea las hojas que falten (sin mensajes; lo usa también el panel). */
function asegurarHojas_() {
  var ss = SpreadsheetApp.getActive();

  var c = ss.getSheetByName(HOJA_CONTACTOS) || ss.insertSheet(HOJA_CONTACTOS);
  if (c.getLastRow() === 0) {
    c.appendRow(COLUMNAS_CONTACTOS);
    c.appendRow(["ejemplo@empresa.com", "Ana", "Empresa de Ejemplo SL", "Gerente", "Distribución", "diagnostico", "SI",
      "Pidió el enlace por LinkedIn el 16/11", "", "Ejemplo · borra esta fila", "", "", "", "", ""]);
    c.setFrozenRows(1);
    c.getRange(1, 1, 1, COLUMNAS_CONTACTOS.length).setFontWeight("bold").setBackground("#E6F0E9");
    var permiso = SpreadsheetApp.newDataValidation().requireValueInList(["SI", "NO"], true).build();
    c.getRange(2, COLUMNAS_CONTACTOS.indexOf("Permiso") + 1, 999, 1).setDataValidation(permiso);
    c.getRange(2, COLUMNAS_CONTACTOS.indexOf("Programar") + 1, 999, 1).setNumberFormat("dd/mm/yyyy hh:mm");
    c.autoResizeColumns(1, COLUMNAS_CONTACTOS.length);
  }

  var p = ss.getSheetByName(HOJA_PLANTILLAS) || ss.insertSheet(HOJA_PLANTILLAS);
  if (p.getLastRow() === 0) {
    p.getRange(1, 1, PLANTILLAS_POR_DEFECTO.length, 5).setValues(PLANTILLAS_POR_DEFECTO);
    p.setFrozenRows(1);
    p.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#E6F0E9");
    p.getRange(2, 3, PLANTILLAS_POR_DEFECTO.length, 1).setWrap(true);
    p.getRange(2, 5, PLANTILLAS_POR_DEFECTO.length, 1).setWrap(true);
    p.setColumnWidth(2, 280); p.setColumnWidth(3, 460); p.setColumnWidth(5, 380);
  }

  var cf = ss.getSheetByName(HOJA_CONFIG) || ss.insertSheet(HOJA_CONFIG);
  if (cf.getLastRow() === 0) {
    cf.appendRow(["Clave", "Valor", "Explicación"]);
    cf.getRange(2, 1, CONFIG_POR_DEFECTO.length, 3).setValues(CONFIG_POR_DEFECTO);
    cf.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#E6F0E9");
    cf.setColumnWidth(1, 200); cf.setColumnWidth(2, 340); cf.setColumnWidth(3, 520);
    cf.getRange(2, 2, CONFIG_POR_DEFECTO.length, 1).setWrap(true);
  }

  var claves = cf.getRange(1, 1, Math.max(1, cf.getLastRow()), 1).getValues().map(function (r) { return String(r[0]).trim(); });
  CONFIG_POR_DEFECTO.forEach(function (fila) { if (claves.indexOf(fila[0]) === -1) cf.appendRow(fila); });

  var b = ss.getSheetByName(HOJA_BAJAS) || ss.insertSheet(HOJA_BAJAS);
  if (b.getLastRow() === 0) { b.appendRow(["Email", "Fecha", "Motivo"]); b.getRange(1, 1, 1, 3).setFontWeight("bold"); }

  var r = ss.getSheetByName(HOJA_REGISTRO) || ss.insertSheet(HOJA_REGISTRO);
  if (r.getLastRow() === 0) { r.appendRow(["Fecha", "Fila", "Email", "Acción", "Detalle"]); r.getRange(1, 1, 1, 5).setFontWeight("bold"); }

  var sw = ss.getSheetByName(HOJA_SOLICITUDES) || ss.insertSheet(HOJA_SOLICITUDES);
  if (sw.getLastRow() === 0) {
    sw.appendRow(COLUMNAS_SOLICITUDES); sw.setFrozenRows(1);
    sw.getRange(1, 1, 1, COLUMNAS_SOLICITUDES.length).setFontWeight("bold").setBackground("#E6F0E9");
  }

  // Hojas creadas con una versión anterior: añade al final las columnas nuevas que falten
  var cab = c.getRange(1, 1, 1, Math.max(1, c.getLastColumn())).getValues()[0].map(function (h) { return String(h).trim(); });
  var faltan = COLUMNAS_CONTACTOS.filter(function (h) { return cab.indexOf(h) === -1; });
  if (faltan.length) {
    c.getRange(1, cab.length + 1, 1, faltan.length).setValues([faltan]).setFontWeight("bold").setBackground("#E6F0E9");
  }
}

/* =====================================================================
   Lectura de datos
   ===================================================================== */
function leerConfig_() {
  var datos = SpreadsheetApp.getActive().getSheetByName(HOJA_CONFIG).getDataRange().getValues();
  var m = {};
  datos.slice(1).forEach(function (f) { if (f[0] !== "") m[String(f[0]).trim()] = f[1]; });
  var si = function (v) { return String(v).trim().toUpperCase() === "SI" || v === true; };
  return {
    desde: String(m["Enviar desde"] || "").trim(),
    nombre: String(m["Nombre del remitente"] || "Engrana"),
    responderA: String(m["Responder a"] || "").trim(),
    enlace: String(m["Enlace del diagnóstico"] || "").trim(),
    utm: { utm_source: m["utm_source"] || "", utm_medium: m["utm_medium"] || "", utm_campaign: m["utm_campaign"] || "" },
    limiteDiario: Number(m["Límite diario"]) || 40,
    porEjecucion: Number(m["Envíos por ejecución"]) || 5,
    soloLaborables: si(m["Solo días laborables"]),
    horaInicio: Number(m["Hora de inicio"]),
    horaFin: Number(m["Hora de fin"]),
    exigirPermiso: si(m["Exigir permiso"]),
    seguimiento: si(m["Seguimiento automático"]),
    modoPrueba: si(m["Modo prueba"]),
    emailPrueba: String(m["Email de prueba"] || "").trim(),
    firma: String(m["Firma"] || ""),
    textoBaja: String(m["Texto de baja"] || ""),
    avisarA: String(m["Avisarme a"] === undefined ? "info@engrana-mallorca.com" : m["Avisarme a"]).trim()
  };
}

function leerPlantillas_() {
  var datos = SpreadsheetApp.getActive().getSheetByName(HOJA_PLANTILLAS).getDataRange().getValues();
  var p = {};
  datos.slice(1).forEach(function (f) {
    if (!f[0]) return;
    p[String(f[0]).trim().toLowerCase()] = { asunto: String(f[1]), mensaje: String(f[2]), dias: Number(f[3]) || 0, seguimiento: String(f[4] || "") };
  });
  return p;
}

function leerContactos_() {
  var hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_CONTACTOS);
  var valores = hoja.getDataRange().getValues();
  var cab = valores[0].map(function (h) { return String(h).trim(); });
  var col = {};
  cab.forEach(function (h, i) { col[h] = i; });
  ["Email", "Plantilla", "Permiso", "Estado", "Enviado el", "Seguimiento el", "Ref", "Hilo"].forEach(function (h) {
    if (col[h] === undefined) throw new Error("Falta la columna «" + h + "» en la hoja Contactos.");
  });
  var filas = valores.slice(1).map(function (v, i) {
    var o = { fila: i + 2, valores: {} };
    cab.forEach(function (h, k) { o.valores[h] = v[k]; });
    return o;
  });
  return { hoja: hoja, cab: cab, col: col, filas: filas };
}

function leerBajas_() {
  var h = SpreadsheetApp.getActive().getSheetByName(HOJA_BAJAS);
  var s = {};
  if (h && h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 1).getValues().forEach(function (f) { if (f[0]) s[normalizarEmail_(f[0])] = true; });
  return s;
}

/* =====================================================================
   Funciones puras (sin acceso a Google): personalización y formato
   ===================================================================== */

/** Normaliza un correo para comparar. */
function normalizarEmail_(e) { return String(e || "").trim().toLowerCase(); }

/** Comprueba el formato de un correo. */
function esEmail_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim()); }

/** Genera una referencia corta y legible para un contacto. */
function nuevaRef_() {
  var c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "E-";
  for (var i = 0; i < 6; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return s;
}

/** Enlace al diagnóstico con utm_* y la referencia del contacto. */
function construirEnlace_(base, utm, ref) {
  var partes = [];
  Object.keys(utm).forEach(function (k) { if (utm[k]) partes.push(k + "=" + encodeURIComponent(String(utm[k]).trim())); });
  if (ref) partes.push("ref=" + encodeURIComponent(ref));
  if (!partes.length) return base;
  return base + (base.indexOf("?") === -1 ? "?" : "&") + partes.join("&");
}

/**
 * Sustituye {{Columna}} por su valor. Admite un texto por defecto: {{Nombre|hola}}.
 * Devuelve { texto, faltan: [columnas sin valor ni texto por defecto] }.
 */
function rellenar_(plantilla, datos) {
  var faltan = [];
  var texto = String(plantilla).replace(/\{\{\s*([^}|]+?)\s*(?:\|([^}]*))?\}\}/g, function (_, clave, defecto) {
    var v = datos[clave];
    if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), "dd/MM/yyyy");
    v = v === undefined || v === null ? "" : String(v).trim();
    if (v) return v;
    if (defecto !== undefined) return defecto.trim();
    faltan.push(clave);
    return "";
  });
  return { texto: texto, faltan: faltan };
}

function escaparHtml_(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Convierte el texto plano en HTML sencillo: párrafos, saltos de línea y enlaces. */
function textoAHtml_(texto, firma, textoBaja) {
  var parrafo = function (t) {
    var h = escaparHtml_(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#286B54;font-weight:bold">$1</a>');
    return '<p style="margin:0 0 14px">' + h.replace(/\n/g, "<br>") + "</p>";
  };
  var cuerpo = String(texto).split(/\n\s*\n/).map(parrafo).join("");
  var pie = firma ? parrafo(firma) : "";
  var baja = textoBaja ? '<p style="margin:22px 0 0;font-size:12px;color:#65736D">' + escaparHtml_(textoBaja) + "</p>" : "";
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#17231F;max-width:600px">' + cuerpo + pie + baja + "</div>";
}

function textoPlanoCompleto_(texto, firma, textoBaja) {
  return [texto, firma, textoBaja ? "—\n" + textoBaja : ""].filter(Boolean).join("\n\n");
}

/** ¿Estamos dentro del horario de envío? */
function enHorario_(ahora, cfg) {
  var dia = ahora.getDay(), hora = ahora.getHours();
  if (cfg.soloLaborables && (dia === 0 || dia === 6)) return false;
  return hora >= cfg.horaInicio && hora < cfg.horaFin;
}

/** Prepara el correo de una fila. Devuelve { ok, motivo, para, asunto, texto, html, ref }. */
function componer_(fila, cfg, plantillas, tipo) {
  var v = fila.valores;
  var nombrePl = String(v["Plantilla"] || "").trim().toLowerCase();
  var pl = plantillas[nombrePl];
  if (!pl) return { ok: false, motivo: "La plantilla «" + v["Plantilla"] + "» no existe" };
  var ref = String(v["Ref"] || "").trim() || nuevaRef_();
  var datos = {};
  Object.keys(v).forEach(function (k) { datos[k] = v[k]; });
  datos["Enlace"] = construirEnlace_(cfg.enlace, cfg.utm, ref);
  var cuerpoPl = tipo === "seguimiento" ? pl.seguimiento : pl.mensaje;
  var asunto = rellenar_(pl.asunto, datos), cuerpo = rellenar_(cuerpoPl, datos);
  var faltan = asunto.faltan.concat(cuerpo.faltan).filter(function (x, i, a) { return a.indexOf(x) === i; });
  if (faltan.length) return { ok: false, motivo: "Faltan datos: " + faltan.join(", ") };
  return {
    ok: true, ref: ref, para: String(v["Email"]).trim(), asunto: asunto.texto,
    texto: textoPlanoCompleto_(cuerpo.texto, cfg.firma, cfg.textoBaja),
    html: textoAHtml_(cuerpo.texto, cfg.firma, cfg.textoBaja)
  };
}

/* =====================================================================
   Envío
   ===================================================================== */
function opcionesEnvio_(cfg) {
  var o = { name: cfg.nombre };
  if (cfg.responderA) o.replyTo = cfg.responderA;
  var yo = normalizarEmail_(Session.getEffectiveUser().getEmail());
  if (cfg.desde && normalizarEmail_(cfg.desde) !== yo) o.from = cfg.desde;
  return o;
}

/** Comprueba que la cuenta puede enviar como «Enviar desde». */
function comprobarRemitente_(cfg) {
  var yo = normalizarEmail_(Session.getEffectiveUser().getEmail());
  var desde = normalizarEmail_(cfg.desde);
  if (!desde || desde === yo) return;
  var alias = GmailApp.getAliases().map(normalizarEmail_);
  if (alias.indexOf(desde) === -1) {
    throw new Error("Esta hoja se está ejecutando con " + yo + ", que no puede enviar como " + cfg.desde +
      ". Abre la hoja con la cuenta " + cfg.desde + " o añade esa dirección como alias «Enviar como» en Gmail.");
  }
}

/** Envía un correo nuevo y devuelve el mensaje (para guardar el hilo). */
function enviarNuevo_(cfg, para, asunto, texto, html) {
  var o = opcionesEnvio_(cfg); o.htmlBody = html;
  return GmailApp.createDraft(para, asunto, texto, o).send();
}

/** Responde en el mismo hilo al destinatario del primer correo. */
function enviarSeguimiento_(cfg, hiloId, texto, html) {
  var hilo = GmailApp.getThreadById(hiloId);
  if (!hilo) throw new Error("No se encuentra el hilo");
  var original = hilo.getMessages()[0];
  var o = opcionesEnvio_(cfg); o.htmlBody = html;
  delete o.replyTo;
  original.createDraftReplyAll(texto, o).send();
}

function misDirecciones_(cfg) {
  var s = {};
  [Session.getEffectiveUser().getEmail(), cfg.desde, cfg.responderA].concat(GmailApp.getAliases()).forEach(function (e) { if (e) s[normalizarEmail_(e)] = true; });
  return s;
}

/** Extrae el correo de una cabecera «Nombre <correo>». */
function emailDe_(cabecera) {
  var m = String(cabecera).match(/<([^>]+)>/);
  return normalizarEmail_(m ? m[1] : cabecera);
}

/* =====================================================================
   Proceso principal
   ===================================================================== */
function procesar_(manual) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return "Ya hay un envío en curso.";
  try {
    var cfg = leerConfig_();
    var ahora = new Date();
    if (!manual && cfg.modoPrueba) { registrar_("", "", "Pausa", "Modo prueba activo: el envío programado no envía nada."); return "Modo prueba activo."; }
    if (!manual && !enHorario_(ahora, cfg)) return "Fuera de horario.";
    comprobarRemitente_(cfg);

    var c = leerContactos_(), plantillas = leerPlantillas_(), bajas = leerBajas_();
    revisarRespuestas_(cfg, c, bajas);

    var hoyClave = "enviados_" + Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy-MM-dd");
    var props = PropertiesService.getScriptProperties();
    var enviadosHoy = Number(props.getProperty(hoyClave)) || 0;
    var cupo = Math.min(cfg.porEjecucion, cfg.limiteDiario - enviadosHoy, MailApp.getRemainingDailyQuota());
    if (cfg.modoPrueba) cupo = Math.min(cupo, 3);
    if (cupo <= 0) return "Límite diario alcanzado (" + enviadosHoy + ").";

    var ya = {};
    c.filas.forEach(function (f) { var e = String(f.valores["Estado"]); if (/^(Enviado|Seguimiento|Respondido)/.test(e)) ya[normalizarEmail_(f.valores["Email"])] = true; });

    var hechos = 0, resumen = [];

    // 1) Seguimientos pendientes (solo envío real)
    if (cfg.seguimiento && !cfg.modoPrueba) {
      for (var i = 0; i < c.filas.length && hechos < cupo; i++) {
        var f = c.filas[i], v = f.valores;
        if (String(v["Estado"]) !== "Enviado" || !v["Hilo"] || v["Seguimiento el"]) continue;
        if (v["Hizo el test"] || v["Pidió revisión"]) continue;   // ya ha usado el diagnóstico: sin recordatorio
        var pl = plantillas[String(v["Plantilla"]).trim().toLowerCase()];
        if (!pl || !pl.dias || !pl.seguimiento) continue;
        if (bajas[normalizarEmail_(v["Email"])]) continue;
        var enviadoEl = v["Enviado el"] instanceof Date ? v["Enviado el"] : new Date(v["Enviado el"]);
        if ((ahora - enviadoEl) / 864e5 < pl.dias) continue;
        var m = componer_(f, cfg, plantillas, "seguimiento");
        if (!m.ok) { escribir_(c, f, { "Estado": "Error: " + m.motivo }); continue; }
        try {
          enviarSeguimiento_(cfg, String(v["Hilo"]), m.texto, m.html);
          escribir_(c, f, { "Estado": "Seguimiento enviado", "Seguimiento el": new Date() });
          registrar_(f.fila, m.para, "Seguimiento", m.asunto);
          hechos++; resumen.push("Seguimiento → " + m.para);
          pausa_();
        } catch (e) { escribir_(c, f, { "Estado": "Error: " + e.message }); registrar_(f.fila, m.para, "Error", e.message); }
      }
    }

    // 2) Correos nuevos
    for (var j = 0; j < c.filas.length && hechos < cupo; j++) {
      var g = c.filas[j], w = g.valores;
      if (String(w["Estado"]).trim() !== "") continue;            // solo filas sin estado
      if (!w["Email"]) continue;
      var email = normalizarEmail_(w["Email"]);
      if (!esEmail_(email)) { escribir_(c, g, { "Estado": "Omitido: correo no válido" }); continue; }
      if (bajas[email]) { escribir_(c, g, { "Estado": "Baja" }); continue; }
      if (ya[email]) { escribir_(c, g, { "Estado": "Omitido: duplicado" }); continue; }
      if (cfg.exigirPermiso && String(w["Permiso"]).trim().toUpperCase() !== "SI") continue;
      if (w["Programar"] instanceof Date && w["Programar"] > ahora) continue;

      var msg = componer_(g, cfg, plantillas, "nuevo");
      if (!msg.ok) { escribir_(c, g, { "Estado": "Error: " + msg.motivo }); continue; }

      try {
        if (cfg.modoPrueba) {
          enviarNuevo_(cfg, cfg.emailPrueba, "[PRUEBA → " + msg.para + "] " + msg.asunto, msg.texto, msg.html);
          registrar_(g.fila, msg.para, "Prueba", "Enviado a " + cfg.emailPrueba);
          resumen.push("Prueba de " + msg.para + " → " + cfg.emailPrueba);
        } else {
          var enviado = enviarNuevo_(cfg, msg.para, msg.asunto, msg.texto, msg.html);
          escribir_(c, g, { "Estado": "Enviado", "Enviado el": new Date(), "Ref": msg.ref, "Hilo": enviado.getThread().getId() });
          registrar_(g.fila, msg.para, "Enviado", msg.asunto + " · " + msg.ref);
          ya[email] = true;
          resumen.push("Enviado → " + msg.para);
        }
        hechos++;
        pausa_();
      } catch (e2) {
        escribir_(c, g, { "Estado": "Error: " + e2.message });
        registrar_(g.fila, msg.para, "Error", e2.message);
      }
    }

    if (!cfg.modoPrueba) props.setProperty(hoyClave, String(enviadosHoy + hechos));
    return hechos ? resumen.join("\n") : "No había correos pendientes que cumplan las condiciones.";
  } finally {
    lock.releaseLock();
  }
}

/** Revisa los hilos enviados: marca respuestas y bajas. */
function revisarRespuestas_(cfg, c, bajas) {
  var mias = misDirecciones_(cfg);
  c.filas.forEach(function (f) {
    var v = f.valores, estado = String(v["Estado"]);
    if (!v["Hilo"] || !/^(Enviado|Seguimiento enviado)$/.test(estado)) return;
    var hilo;
    try { hilo = GmailApp.getThreadById(String(v["Hilo"])); } catch (e) { return; }
    if (!hilo) return;
    var respuestas = hilo.getMessages().filter(function (m) { return !mias[emailDe_(m.getFrom())]; });
    if (!respuestas.length) return;
    var pideBaja = respuestas.some(function (m) {
      var t = m.getPlainBody().split(/\n>|\nEl .* escribió:|\nOn .* wrote:/)[0].slice(0, 500);
      return /\b(baja|darme de baja|no me escrib|unsubscribe|no deseo recibir)\b/i.test(t);
    });
    if (pideBaja) {
      escribir_(c, f, { "Estado": "Baja" });
      anadirBaja_(v["Email"], "Respondió pidiendo la baja");
      bajas[normalizarEmail_(v["Email"])] = true;
      registrar_(f.fila, v["Email"], "Baja", "Detectada en la respuesta");
    } else {
      escribir_(c, f, { "Estado": "Respondido" });
      registrar_(f.fila, v["Email"], "Respondido", "");
    }
  });
}

/* =====================================================================
   Utilidades de hoja
   ===================================================================== */
function escribir_(c, f, cambios) {
  Object.keys(cambios).forEach(function (k) {
    var idx = c.col[k]; if (idx === undefined) return;
    c.hoja.getRange(f.fila, idx + 1).setValue(cambios[k]);
    f.valores[k] = cambios[k];
  });
}

function registrar_(fila, email, accion, detalle) {
  var h = SpreadsheetApp.getActive().getSheetByName(HOJA_REGISTRO);
  if (h) h.appendRow([new Date(), fila, email, accion, detalle]);
}

function anadirBaja_(email, motivo) {
  var h = SpreadsheetApp.getActive().getSheetByName(HOJA_BAJAS);
  if (h) h.appendRow([normalizarEmail_(email), new Date(), motivo]);
}

/** Pausa aleatoria entre correos (8-20 s) para no enviar en ráfaga. */
function pausa_() { Utilities.sleep(8000 + Math.floor(Math.random() * 12000)); }

function filaSeleccionada_() {
  var hoja = SpreadsheetApp.getActiveSheet();
  if (hoja.getName() !== HOJA_CONTACTOS) throw new Error("Selecciona una fila en la hoja «Contactos».");
  var n = hoja.getActiveRange().getRow();
  if (n < 2) throw new Error("Selecciona una fila de contacto (no el encabezado).");
  var c = leerContactos_();
  return { c: c, f: c.filas[n - 2] };
}

/* =====================================================================
   Acciones del menú
   ===================================================================== */
function vistaPrevia() {
  var ui = SpreadsheetApp.getUi();
  try {
    var s = filaSeleccionada_(), cfg = leerConfig_(), m = componer_(s.f, cfg, leerPlantillas_(), "nuevo");
    if (!m.ok) return ui.alert(m.motivo);
    var html = "<div style='font-family:Arial;font-size:13px;color:#65736D;margin-bottom:10px'><b>Para:</b> " + escaparHtml_(m.para) +
      "<br><b>Asunto:</b> " + escaparHtml_(m.asunto) + "<br><b>Desde:</b> " + escaparHtml_(cfg.nombre + " <" + cfg.desde + ">") + "</div><hr>" + m.html;
    ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(640).setHeight(560), "Vista previa");
  } catch (e) { ui.alert(e.message); }
}

function enviarPruebaFila() {
  var ui = SpreadsheetApp.getUi();
  try {
    var s = filaSeleccionada_(), cfg = leerConfig_();
    comprobarRemitente_(cfg);
    var m = componer_(s.f, cfg, leerPlantillas_(), "nuevo");
    if (!m.ok) return ui.alert(m.motivo);
    enviarNuevo_(cfg, cfg.emailPrueba, "[PRUEBA → " + m.para + "] " + m.asunto, m.texto, m.html);
    registrar_(s.f.fila, m.para, "Prueba", "Enviado a " + cfg.emailPrueba);
    ui.alert("Prueba enviada a " + cfg.emailPrueba + ".");
  } catch (e) { ui.alert(e.message); }
}

function enviarTandaAhora() {
  var ui = SpreadsheetApp.getUi();
  var cfg = leerConfig_();
  var aviso = cfg.modoPrueba
    ? "Modo prueba: se enviarán como máximo 3 correos a " + cfg.emailPrueba + " y no se marcará nada como enviado. ¿Continuar?"
    : "Se enviarán de verdad hasta " + cfg.porEjecucion + " correos a contactos con Permiso = SI. ¿Continuar?";
  if (ui.alert(aviso, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  try { ui.alert(procesar_(true)); } catch (e) { ui.alert(e.message); }
}

function revisarRespuestasMenu() {
  var cfg = leerConfig_(), c = leerContactos_();
  revisarRespuestas_(cfg, c, leerBajas_());
  SpreadsheetApp.getUi().alert("Respuestas y bajas revisadas. Mira la columna «Estado».");
}

/** Función que ejecuta el activador cada 15 minutos. */
function envioProgramado() { procesar_(false); }

function activarProgramacion() {
  var ui = SpreadsheetApp.getUi(), cfg = leerConfig_();
  try { comprobarRemitente_(cfg); } catch (e) { return ui.alert(e.message); }
  if (cfg.modoPrueba) return ui.alert("El «Modo prueba» está en SI. Haz tus pruebas con «Enviarme una prueba» y, cuando todo esté bien, ponlo en NO antes de activar el envío programado.");
  programar_(true);
  ui.alert("Envío programado activado.\n\nCada 15 minutos, en horario de " + cfg.horaInicio + ":00 a " + cfg.horaFin + ":00" +
    (cfg.soloLaborables ? " de lunes a viernes" : "") + ", se envían hasta " + cfg.porEjecucion + " correos, con un máximo de " + cfg.limiteDiario + " al día.");
}

function desactivarProgramacion() {
  programar_(false);
  SpreadsheetApp.getUi().alert("Envío programado desactivado.");
}

/** Activa (true) o desactiva (false) el activador de cada 15 minutos. */
function programar_(activar) {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "envioProgramado") ScriptApp.deleteTrigger(t); });
  if (activar) ScriptApp.newTrigger("envioProgramado").timeBased().everyMinutes(15).create();
}

function programacionActiva_() {
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "envioProgramado"; });
}

function mostrarEstado() {
  var cfg = leerConfig_(), c = leerContactos_();
  var hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var enviadosHoy = Number(PropertiesService.getScriptProperties().getProperty("enviados_" + hoy)) || 0;
  var cuenta = {};
  c.filas.forEach(function (f) { var e = String(f.valores["Estado"]).split(":")[0] || "Pendiente"; cuenta[e] = (cuenta[e] || 0) + 1; });
  var activo = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "envioProgramado"; });
  SpreadsheetApp.getUi().alert(
    "Cuenta: " + Session.getEffectiveUser().getEmail() + "\nEnviar desde: " + cfg.desde +
    "\nModo prueba: " + (cfg.modoPrueba ? "SI" : "NO") + "\nEnvío programado: " + (activo ? "ACTIVO" : "desactivado") +
    "\nEnviados hoy: " + enviadosHoy + " / " + cfg.limiteDiario + "\nCuota de Gmail restante hoy: " + MailApp.getRemainingDailyQuota() +
    "\n\n" + Object.keys(cuenta).map(function (k) { return k + ": " + cuenta[k]; }).join("\n"));
}

/* =====================================================================
   PANEL DE ENVÍOS (Panel.html)
   Se abre desde el menú (ventana dentro de la hoja) o como aplicación
   web: Implementar → Nueva implementación → Aplicación web,
   «Ejecutar como: yo» y «Quién tiene acceso: solo yo».
   ===================================================================== */
var SECTORES = ["Distribución y suministros", "Industria y fabricación", "Construcción y reformas", "Transporte y logística",
  "Comercio", "Hostelería", "Servicios profesionales", "Otros"];

function doGet() {
  if (!esPropietario_()) {
    return HtmlService.createHtmlOutput('<p style="font-family:Arial;margin:40px">Acceso restringido.</p>').setTitle("Engrana");
  }
  asegurarHojas_();
  return panelHtml_()
    .setTitle("Panel de envíos · Engrana")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/** Carga Panel.html aunque el nombre tenga pequeñas variaciones; si no existe, explica cómo crearlo. */
function panelHtml_() {
  soloPropietario_();
  var nombres = ["Panel", "panel", "Panel.html", "PANEL", "Panel ", "Pagina", "Página"];
  for (var i = 0; i < nombres.length; i++) {
    try { return HtmlService.createHtmlOutputFromFile(nombres[i]); } catch (e) {}
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;max-width:620px;margin:40px auto;line-height:1.6;color:#17231F">' +
    '<h2 style="color:#173F34">Falta el archivo «Panel»</h2>' +
    '<p>El script no encuentra el archivo HTML del panel. Para arreglarlo:</p><ol>' +
    '<li>En el editor de Apps Script, pulsa <b>＋ → HTML</b>.</li>' +
    '<li>Escribe como nombre solo <b>Panel</b> (sin «.html»: lo añade Google). Debe verse como <b>Panel.html</b> en la lista.</li>' +
    '<li>Pega dentro todo el contenido del archivo Panel.html y guarda.</li>' +
    '<li>Si lo abres como aplicación web: <b>Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar</b>.</li></ol></div>');
}

function abrirPanel() {
  asegurarHojas_();
  var html = panelHtml_().setWidth(1280).setHeight(820);
  SpreadsheetApp.getUi().showModalDialog(html, "Panel de envíos · Engrana");
}

function iso_(v) { return v instanceof Date && !isNaN(v) ? v.toISOString() : ""; }

/** Clasifica una fila para el panel. */
function grupo_(v, cfg, bajas, ahora) {
  var e = String(v["Estado"] || "").trim();
  if (/^Ejemplo/.test(e)) return "ejemplo";
  if (e === "Respondido") return "respondido";
  if (e === "Baja" || bajas[normalizarEmail_(v["Email"])]) return "baja";
  if (/^Error/.test(e)) return "error";
  if (/^Omitido/.test(e)) return "omitido";
  if (e === "Enviado" || e === "Seguimiento enviado") return "enviado";
  if (cfg.exigirPermiso && String(v["Permiso"]).trim().toUpperCase() !== "SI") return "sinpermiso";
  if (v["Programar"] instanceof Date && v["Programar"] > ahora) return "programado";
  return "listo";
}

/** Todos los datos que necesita el panel en una sola llamada. */
function panelDatos() {
  soloPropietario_();
  asegurarHojas_();
  var cfg = leerConfig_(), c = leerContactos_(), bajas = leerBajas_(), ahora = new Date();
  var hoy = Utilities.formatDate(ahora, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var cont = { listo: 0, programado: 0, sinpermiso: 0, enviado: 0, respondido: 0, baja: 0, error: 0, omitido: 0, ejemplo: 0 };
  var contactos = c.filas.filter(function (f) { return f.valores["Email"] || f.valores["Empresa"]; }).map(function (f) {
    var v = f.valores, g = grupo_(v, cfg, bajas, ahora);
    cont[g]++;
    return {
      fila: f.fila, email: String(v["Email"] || ""), nombre: String(v["Nombre"] || ""), empresa: String(v["Empresa"] || ""),
      cargo: String(v["Cargo"] || ""), sector: String(v["Sector"] || ""), plantilla: String(v["Plantilla"] || ""),
      permiso: String(v["Permiso"] || ""), comoPermiso: String(v["Cómo dio permiso"] || ""), programar: iso_(v["Programar"]),
      estado: String(v["Estado"] || ""), grupo: g, enviadoEl: iso_(v["Enviado el"]), seguimientoEl: iso_(v["Seguimiento el"]),
      ref: String(v["Ref"] || ""), notas: String(v["Notas"] || ""),
      abrio: iso_(v["Abrió el enlace"]), test: iso_(v["Hizo el test"]),
      resultado: String(v["Resultado del test"] || ""), solicitud: iso_(v["Pidió revisión"])
    };
  });
  var actividad = { abrieron: 0, test: 0, solicitudes: 0 };
  contactos.forEach(function (x) { if (x.abrio) actividad.abrieron++; if (x.test) actividad.test++; if (x.solicitud) actividad.solicitudes++; });
  var sw = SpreadsheetApp.getActive().getSheetByName(HOJA_SOLICITUDES);
  actividad.solicitudesTotal = sw ? Math.max(0, sw.getLastRow() - 1) : 0;
  var plantillas = leerPlantillas_();
  var reg = SpreadsheetApp.getActive().getSheetByName(HOJA_REGISTRO);
  var registro = [];
  if (reg && reg.getLastRow() > 1) {
    var n = Math.min(60, reg.getLastRow() - 1);
    registro = reg.getRange(reg.getLastRow() - n + 1, 1, n, 5).getValues().reverse()
      .map(function (r) { return { fecha: iso_(r[0]), fila: r[1], email: String(r[2]), accion: String(r[3]), detalle: String(r[4]) }; });
  }
  return {
    cuenta: Session.getEffectiveUser().getEmail(),
    hoy: hoy,
    enviadosHoy: Number(PropertiesService.getScriptProperties().getProperty("enviados_" + hoy)) || 0,
    cuota: MailApp.getRemainingDailyQuota(),
    programado: programacionActiva_(),
    enHorario: enHorario_(ahora, cfg),
    cfg: cfg,
    contadores: cont,
    actividad: actividad,
    webConectada: !!PropertiesService.getScriptProperties().getProperty("TOKEN_WEB"),
    contactos: contactos,
    plantillas: Object.keys(plantillas).map(function (k) { var p = plantillas[k]; return { nombre: k, asunto: p.asunto, mensaje: p.mensaje, dias: p.dias, seguimiento: p.seguimiento }; }),
    sectores: SECTORES,
    registro: registro
  };
}

/** Escribe una fila nueva respetando el orden de columnas de la hoja. */
function anadirFila_(c, valores) {
  var fila = c.cab.map(function (h) { return valores[h] !== undefined ? valores[h] : ""; });
  c.hoja.appendRow(fila);
}

function validarContacto_(d, existentes, exigirPermiso) {
  var email = normalizarEmail_(d.email);
  if (!esEmail_(email)) return "Correo no válido: " + (d.email || "(vacío)");
  if (existentes[email]) return "Ya existe: " + email;
  if (!String(d.empresa || "").trim()) return "Falta la empresa de " + email;
  if (exigirPermiso && d.permiso === "SI" && !String(d.comoPermiso || "").trim()) return "Indica cómo dio permiso " + email;
  return "";
}

function emailsExistentes_(c) {
  var s = {};
  c.filas.forEach(function (f) { if (f.valores["Email"]) s[normalizarEmail_(f.valores["Email"])] = true; });
  return s;
}

function filaContacto_(d) {
  return {
    "Email": normalizarEmail_(d.email), "Nombre": String(d.nombre || "").trim(), "Empresa": String(d.empresa || "").trim(),
    "Cargo": String(d.cargo || "").trim(), "Sector": String(d.sector || ""), "Plantilla": String(d.plantilla || "").trim(),
    "Permiso": d.permiso === "SI" ? "SI" : "NO", "Cómo dio permiso": String(d.comoPermiso || "").trim(),
    "Programar": d.programar ? new Date(d.programar) : "", "Notas": String(d.notas || "").trim()
  };
}

/** Añade un contacto desde el formulario del panel. */
function panelGuardarContacto(d) {
  soloPropietario_();
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var c = leerContactos_(), cfg = leerConfig_();
    var err = validarContacto_(d, emailsExistentes_(c), cfg.exigirPermiso);
    if (err) throw new Error(err);
    anadirFila_(c, filaContacto_(d));
    registrar_("", normalizarEmail_(d.email), "Alta", "Añadido desde el panel");
  } finally { lock.releaseLock(); }
  return panelDatos();
}

/**
 * Añade varios contactos pegados desde Excel (una fila por línea).
 * Columnas: Email, Nombre, Empresa, Cargo (opcional). Separador: tabulador, «;» o «,».
 * «comun» lleva plantilla, sector, permiso, comoPermiso y programar para todos.
 */
function panelGuardarLote(texto, comun) {
  soloPropietario_();
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  var anadidos = 0, omitidos = [];
  try {
    var c = leerContactos_(), cfg = leerConfig_(), existentes = emailsExistentes_(c), nuevas = [];
    String(texto || "").split(/\r?\n/).forEach(function (linea, i) {
      if (!linea.trim()) return;
      var p = linea.split(linea.indexOf("\t") !== -1 ? "\t" : (linea.indexOf(";") !== -1 ? ";" : ",")).map(function (x) { return x.trim(); });
      if (i === 0 && !esEmail_(p[0]) && /mail|correo/i.test(p[0])) return;   // fila de encabezados
      var d = { email: p[0], nombre: p[1], empresa: p[2], cargo: p[3], sector: comun.sector, plantilla: comun.plantilla,
                permiso: comun.permiso, comoPermiso: comun.comoPermiso, programar: comun.programar };
      var err = validarContacto_(d, existentes, cfg.exigirPermiso);
      if (err) { omitidos.push(err); return; }
      existentes[normalizarEmail_(d.email)] = true;
      var f = filaContacto_(d);
      nuevas.push(c.cab.map(function (h) { return f[h] !== undefined ? f[h] : ""; }));
    });
    if (nuevas.length) {
      c.hoja.getRange(c.hoja.getLastRow() + 1, 1, nuevas.length, c.cab.length).setValues(nuevas);
      anadidos = nuevas.length;
      registrar_("", "", "Alta", anadidos + " contactos pegados desde el panel");
    }
  } finally { lock.releaseLock(); }
  return { anadidos: anadidos, omitidos: omitidos, datos: panelDatos() };
}

function filaPorNumero_(n) {
  var c = leerContactos_();
  var f = c.filas.filter(function (x) { return x.fila === Number(n); })[0];
  if (!f) throw new Error("No se encuentra la fila " + n + ". Recarga el panel.");
  return { c: c, f: f };
}

/** Correo tal como se enviaría (sin enviarlo). */
function panelVistaPrevia(fila, tipo) {
  soloPropietario_();
  var s = filaPorNumero_(fila), cfg = leerConfig_();
  var m = componer_(s.f, cfg, leerPlantillas_(), tipo === "seguimiento" ? "seguimiento" : "nuevo");
  if (!m.ok) throw new Error(m.motivo);
  return { para: m.para, asunto: m.asunto, html: m.html, desde: cfg.nombre + " <" + cfg.desde + ">" };
}

/** Envía la versión de prueba de una fila al Email de prueba. */
function panelPrueba(fila) {
  soloPropietario_();
  var s = filaPorNumero_(fila), cfg = leerConfig_();
  comprobarRemitente_(cfg);
  var m = componer_(s.f, cfg, leerPlantillas_(), "nuevo");
  if (!m.ok) throw new Error(m.motivo);
  enviarNuevo_(cfg, cfg.emailPrueba, "[PRUEBA → " + m.para + "] " + m.asunto, m.texto, m.html);
  registrar_(s.f.fila, m.para, "Prueba", "Enviado a " + cfg.emailPrueba);
  return "Prueba enviada a " + cfg.emailPrueba;
}

/** Cambia el estado de una fila: "pendiente", "omitir", "baja" o "eliminar". */
function panelAccion(fila, accion) {
  soloPropietario_();
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var s = filaPorNumero_(fila), v = s.f.valores;
    if (accion === "pendiente") {
      if (/^(Enviado|Seguimiento enviado|Respondido)$/.test(String(v["Estado"]))) throw new Error("Este contacto ya recibió el correo.");
      escribir_(s.c, s.f, { "Estado": "" });
    } else if (accion === "omitir") {
      escribir_(s.c, s.f, { "Estado": "Omitido: manual" });
    } else if (accion === "baja") {
      escribir_(s.c, s.f, { "Estado": "Baja" }); anadirBaja_(v["Email"], "Marcada desde el panel");
    } else if (accion === "eliminar") {
      if (String(v["Estado"]).trim() && !/^(Ejemplo|Omitido|Error)/.test(String(v["Estado"]))) throw new Error("Solo se pueden eliminar contactos que aún no han recibido nada.");
      s.c.hoja.deleteRow(s.f.fila);
    }
    registrar_(fila, v["Email"], "Cambio", accion);
  } finally { lock.releaseLock(); }
  return panelDatos();
}

/** Crea o actualiza una plantilla (por nombre). */
function panelGuardarPlantilla(p) {
  soloPropietario_();
  var nombre = String(p.nombre || "").trim().toLowerCase().replace(/\s+/g, "-");
  if (!nombre) throw new Error("La plantilla necesita un nombre.");
  if (!String(p.asunto || "").trim() || !String(p.mensaje || "").trim()) throw new Error("Escribe el asunto y el mensaje.");
  var h = SpreadsheetApp.getActive().getSheetByName(HOJA_PLANTILLAS), datos = h.getDataRange().getValues();
  var fila = [nombre, p.asunto, p.mensaje, Number(p.dias) || 0, p.seguimiento || ""];
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]).trim().toLowerCase() === nombre) { h.getRange(i + 1, 1, 1, 5).setValues([fila]); return panelDatos(); }
  }
  h.appendRow(fila);
  return panelDatos();
}

/** Guarda los ajustes de «Configuración» que se editan desde el panel. */
function panelGuardarConfig(n) {
  soloPropietario_();
  var mapa = {
    "Nombre del remitente": n.nombre, "Responder a": n.responderA, "Enviar desde": n.desde, "utm_campaign": n.campana,
    "Límite diario": Number(n.limiteDiario), "Envíos por ejecución": Number(n.porEjecucion),
    "Hora de inicio": Number(n.horaInicio), "Hora de fin": Number(n.horaFin),
    "Solo días laborables": n.soloLaborables ? "SI" : "NO", "Exigir permiso": n.exigirPermiso ? "SI" : "NO",
    "Seguimiento automático": n.seguimiento ? "SI" : "NO", "Modo prueba": n.modoPrueba ? "SI" : "NO",
    "Email de prueba": n.emailPrueba, "Firma": n.firma, "Texto de baja": n.textoBaja, "Avisarme a": n.avisarA
  };
  if (!(mapa["Hora de inicio"] >= 0 && mapa["Hora de fin"] <= 24 && mapa["Hora de inicio"] < mapa["Hora de fin"])) throw new Error("Revisa el horario.");
  if (!(mapa["Límite diario"] > 0) || !(mapa["Envíos por ejecución"] > 0)) throw new Error("Los límites deben ser mayores que 0.");
  if (!esEmail_(mapa["Email de prueba"])) throw new Error("El email de prueba no es válido.");
  if (mapa["Avisarme a"] && !esEmail_(mapa["Avisarme a"])) throw new Error("El correo de «Avisarme a» no es válido.");
  var h = SpreadsheetApp.getActive().getSheetByName(HOJA_CONFIG), datos = h.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    var k = String(datos[i][0]).trim();
    if (mapa.hasOwnProperty(k) && mapa[k] !== undefined) h.getRange(i + 1, 2).setValue(mapa[k]);
  }
  if (!n.modoPrueba) comprobarRemitente_(leerConfig_());
  if (n.modoPrueba && programacionActiva_()) programar_(false);
  return panelDatos();
}

function panelEnviarTanda() {
  soloPropietario_(); return { mensaje: procesar_(true), datos: panelDatos() }; }

function panelProgramacion(activar) {
  soloPropietario_();
  if (activar) {
    var cfg = leerConfig_();
    if (cfg.modoPrueba) throw new Error("Desactiva el modo prueba en Configuración antes de activar el envío programado.");
    comprobarRemitente_(cfg);
  }
  programar_(!!activar);
  return panelDatos();
}

function panelRevisar() {
  soloPropietario_();
  revisarRespuestas_(leerConfig_(), leerContactos_(), leerBajas_());
  return panelDatos();
}


/* =====================================================================
   CONEXIÓN CON LA WEB DEL DIAGNÓSTICO
   La web (a través de las funciones de Netlify) envía aquí:
   - tipo "evento":    un contacto con enlace personal abrió el enlace,
                       empezó o terminó el test (con su puntuación).
   - tipo "solicitud": alguien pidió la revisión desde el formulario.
   Para recibirlos hay que publicar este proyecto como aplicación web con
   acceso «Cualquiera» (ver INSTRUCCIONES.md) y poner su URL y la clave
   en las variables de entorno de Netlify. Sin la clave correcta no se
   escribe nada.
   ===================================================================== */

/** true si quien ejecuta es el propietario del script (o la propia hoja abierta por un editor). */
function esPropietario_() {
  var activo = "", efectivo = "";
  try { activo = normalizarEmail_(Session.getActiveUser().getEmail()); } catch (e) {}
  try { efectivo = normalizarEmail_(Session.getEffectiveUser().getEmail()); } catch (e) {}
  return !!activo && activo === efectivo;
}

function soloPropietario_() {
  if (!esPropietario_()) throw new Error("Acceso restringido.");
}

/** Devuelve la clave para Netlify; la crea la primera vez. */
function claveWeb_() {
  var props = PropertiesService.getScriptProperties(), t = props.getProperty("TOKEN_WEB");
  if (!t) {
    t = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "").slice(0, 16);
    props.setProperty("TOKEN_WEB", t);
  }
  return t;
}

function mostrarClaveWeb() {
  var t = claveWeb_();
  var html = '<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#17231F">' +
    '<p>Copia esta clave en Netlify como variable <b>DIAGNOSTICO_WEBHOOK_TOKEN</b>:</p>' +
    '<p style="font-family:monospace;font-size:14px;background:#F1F7F3;padding:10px;border-radius:6px;word-break:break-all">' + t + '</p>' +
    '<p>Los pasos completos están en INSTRUCCIONES.md, apartado «Conectar con la web».</p></div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(520).setHeight(240), "Conectar con la web");
}

function panelClaveWeb() {
  soloPropietario_();
  return claveWeb_();
}

/** Busca la fila de un contacto por su referencia (E-XXXXXX). */
function filaPorRef_(c, ref) {
  if (!/^E-[A-Z0-9]{6}$/.test(String(ref || ""))) return null;
  for (var i = 0; i < c.filas.length; i++) if (String(c.filas[i].valores["Ref"]).trim() === ref) return c.filas[i];
  return null;
}

/** Saca la referencia de una URL de origen (…?ref=E-XXXXXX…). */
function refDeUrl_(url) {
  var m = String(url || "").match(/[?&]ref=(E-[A-Z0-9]{6})\b/);
  return m ? m[1] : "";
}

function respuesta_(texto) { return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.TEXT); }

function doPost(e) {
  var d;
  try { d = JSON.parse(e && e.postData ? e.postData.contents : "{}"); } catch (x) { return respuesta_("json"); }
  var t = PropertiesService.getScriptProperties().getProperty("TOKEN_WEB");
  if (!t || d.token !== t) return respuesta_("forbidden");

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return respuesta_("busy");
  try {
    asegurarHojas_();
    var c = leerContactos_(), ahora = new Date();
    if (d.tipo === "evento") {
      var f = filaPorRef_(c, d.ref);
      if (!f) return respuesta_("ref desconocida");
      var cambios = {};
      if (d.evento === "abierto" && !f.valores["Abrió el enlace"]) cambios["Abrió el enlace"] = ahora;
      if (d.evento === "iniciado" && !f.valores["Abrió el enlace"]) cambios["Abrió el enlace"] = ahora;
      if (d.evento === "completado") {
        if (!f.valores["Abrió el enlace"]) cambios["Abrió el enlace"] = ahora;
        cambios["Hizo el test"] = ahora;
        cambios["Resultado del test"] = Math.max(0, Math.min(100, Number(d.porcentaje) || 0)) + " % · " +
          String(d.nivel || "").slice(0, 80) + (d.oportunidad ? " · " + String(d.oportunidad).slice(0, 160) : "");
      }
      var primeraVez = d.evento === "completado" && !f.valores["Hizo el test"];
      if (Object.keys(cambios).length) {
        escribir_(c, f, cambios);
        if (primeraVez) avisarme_("✅ " + (f.valores["Empresa"] || f.valores["Email"]) + " ha hecho el diagnóstico (" + cambios["Resultado del test"].split(" · ")[0] + ")", [
          ["Empresa", f.valores["Empresa"]], ["Contacto", [f.valores["Nombre"], f.valores["Cargo"]].filter(String).join(" · ")],
          ["Correo", f.valores["Email"]], ["Resultado", cambios["Resultado del test"]], ["Referencia", d.ref]],
          "Todavía no ha pedido la revisión. Es buen momento para escribirle o llamarle.");
        var etiqueta = { abierto: "Abrió el enlace", iniciado: "Empezó el test", completado: "Hizo el test" }[d.evento] || d.evento;
        registrar_(f.fila, f.valores["Email"], etiqueta, d.evento === "completado" ? cambios["Resultado del test"] : (d.ref || ""));
      }
      return respuesta_("ok");
    }
    if (d.tipo === "solicitud") {
      var sw = SpreadsheetApp.getActive().getSheetByName(HOJA_SOLICITUDES);
      // Sin duplicados por ID de envío
      if (sw.getLastRow() > 1) {
        var ids = sw.getRange(2, COLUMNAS_SOLICITUDES.length, sw.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); });
        if (d.id_envio && ids.indexOf(String(d.id_envio)) !== -1) return respuesta_("duplicado");
      }
      var ref = refDeUrl_(d.url_origen);
      var lim = function (v, n) { return String(v == null ? "" : v).slice(0, n || 500); };
      sw.appendRow([ahora, ref, lim(d.empresa, 160), lim(d.nombre, 120), lim(d.correo, 160), lim(d.cargo, 120), lim(d.telefono, 30),
        lim(d.sector, 80), lim(d.tamano_equipo, 40), lim(d.puntuacion_total, 10), lim(d.indice_porcentaje, 10), lim(d.nivel, 120),
        lim(d.oportunidad_principal, 300), lim(d.recomendaciones, 500), lim(d.respuestas, 3000), lim(d.campana, 400),
        lim(d.comunicaciones_comerciales, 5), lim(d.consentimiento_registro, 600), lim(d.url_origen, 500), lim(d.id_envio, 80)]);
      var fila = filaPorRef_(c, ref);
      if (fila) {
        var cam = { "Pidió revisión": ahora };
        if (!fila.valores["Hizo el test"]) cam["Hizo el test"] = ahora;
        if (!fila.valores["Resultado del test"]) cam["Resultado del test"] = lim(d.indice_porcentaje, 10) + " · " + lim(d.nivel, 80);
        escribir_(c, fila, cam);
      }
      avisarme_("⭐ Nueva solicitud de revisión: " + lim(d.empresa, 80), [
        ["Empresa", lim(d.empresa, 160)], ["Nombre", lim(d.nombre, 120)], ["Cargo", lim(d.cargo, 120)], ["Correo", lim(d.correo, 160)],
        ["Teléfono", lim(d.telefono, 30)], ["Sector", lim(d.sector, 80)], ["Tamaño", lim(d.tamano_equipo, 40)],
        ["Resultado", lim(d.indice_porcentaje, 10) + " · " + lim(d.nivel, 120)], ["Oportunidad", lim(d.oportunidad_principal, 300)],
        ["Recomendaciones", lim(d.recomendaciones, 500)], ["Origen", ref ? "Correo del panel (" + ref + ")" : "Web u otro enlace"]],
        "Ha pedido que revises su diagnóstico contigo. Las 8 respuestas están en la pestaña «Solicitudes web» y en Netlify → Forms.");
      registrar_(fila ? fila.fila : "", lim(d.correo, 160), "Pidió revisión", lim(d.empresa, 160) + (ref ? " · " + ref : " · llegó sin enlace del panel"));
      return respuesta_("ok");
    }
    return respuesta_("tipo desconocido");
  } finally {
    lock.releaseLock();
  }
}

/** Últimas solicitudes de revisión para el panel. */
function panelSolicitudes() {
  soloPropietario_();
  var sw = SpreadsheetApp.getActive().getSheetByName(HOJA_SOLICITUDES);
  if (!sw || sw.getLastRow() < 2) return [];
  var n = Math.min(50, sw.getLastRow() - 1);
  return sw.getRange(sw.getLastRow() - n + 1, 1, n, COLUMNAS_SOLICITUDES.length).getValues().reverse().map(function (r) {
    return { recibido: iso_(r[0]), ref: String(r[1]), empresa: String(r[2]), nombre: String(r[3]), correo: String(r[4]), cargo: String(r[5]),
             telefono: String(r[6]), indice: String(r[10]), nivel: String(r[11]), oportunidad: String(r[12]) };
  });
}


/** Envía un aviso a «Avisarme a» (si está configurado). Nunca rompe la recepción si falla. */
function avisarme_(asunto, filas, nota) {
  try {
    var cfg = leerConfig_();
    if (!cfg.avisarA || !esEmail_(cfg.avisarA)) return;
    var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#17231F;max-width:560px">' +
      '<p style="font-size:16px;font-weight:bold;color:#173F34;margin:0 0 12px">' + escaparHtml_(asunto) + '</p>' +
      '<table style="border-collapse:collapse;width:100%">' + filas.filter(function (x) { return x[1]; }).map(function (x) {
        return '<tr><td style="padding:6px 10px 6px 0;color:#65736D;vertical-align:top;white-space:nowrap">' + escaparHtml_(x[0]) +
          '</td><td style="padding:6px 0;border-bottom:1px solid #E3EAE5">' + escaparHtml_(x[1]) + '</td></tr>';
      }).join("") + '</table>' +
      (nota ? '<p style="margin:16px 0 0;color:#286B54;font-weight:bold">' + escaparHtml_(nota) + '</p>' : '') +
      '<p style="margin:18px 0 0;font-size:12px;color:#65736D">Aviso automático del panel de envíos de Engrana.</p></div>';
    var texto = asunto + "\n\n" + filas.filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ": " + x[1]; }).join("\n") + (nota ? "\n\n" + nota : "");
    MailApp.sendEmail({ to: cfg.avisarA, subject: asunto, body: texto, htmlBody: html, name: "Panel Engrana" });
  } catch (e) {
    registrar_("", "", "Error de aviso", e.message);
  }
}
