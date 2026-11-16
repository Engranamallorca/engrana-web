/* =========================================================
   Netlify · función de evento "submission-created"
   Se ejecuta en el servidor cada vez que Netlify Forms acepta
   un envío verificado (después de su filtro antispam y del honeypot).

   Para el formulario "diagnostico-automatizacion":
     1. Vuelve a validar los datos en el servidor.
     2. Si existe la variable de entorno DIAGNOSTICO_WEBHOOK_URL,
        reenvía la solicitud ordenada a ese webhook privado
        (Google Apps Script, Make, n8n, CRM…). Opcionalmente añade
        DIAGNOSTICO_WEBHOOK_TOKEN como cabecera de autorización.

   La URL del webhook y el token viven solo en las variables de
   entorno de Netlify; nunca llegan al navegador.
   Si los datos no son válidos, el envío no se reenvía (seguirá
   visible en el panel de Netlify Forms para revisarlo a mano).
   ========================================================= */
"use strict";

const FORM = "diagnostico-automatizacion";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEL_RE = /^\+?[0-9\s().-]{9,20}$/;

function limpiar(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max || 500) : "";
}

/** Validación en servidor. Devuelve { ok, errores, lead }. */
function validar(d) {
  const errores = [];
  const lead = {
    id_envio: limpiar(d.id_envio, 80),
    fecha_envio: limpiar(d.fecha_envio, 40),
    nombre: limpiar(d.nombre, 120),
    correo: limpiar(d.correo, 160).toLowerCase(),
    empresa: limpiar(d.empresa, 160),
    cargo: limpiar(d.cargo, 120),
    telefono: limpiar(d.telefono, 30),
    sector: limpiar(d.sector, 80),
    tamano_equipo: limpiar(d.tamano_equipo, 40),
    puntuacion_total: limpiar(d.puntuacion_total, 10),
    indice_porcentaje: limpiar(d.indice_porcentaje, 10),
    nivel: limpiar(d.nivel, 120),
    dim_solicitudes: limpiar(d.dim_solicitudes, 60),
    dim_presupuestos: limpiar(d.dim_presupuestos, 60),
    dim_seguimiento: limpiar(d.dim_seguimiento, 60),
    dim_informacion: limpiar(d.dim_informacion, 60),
    oportunidad_principal: limpiar(d.oportunidad_principal, 300),
    recomendaciones: limpiar(d.recomendaciones, 500),
    respuestas: limpiar(d.respuestas, 3000),
    url_origen: limpiar(d.url_origen, 500),
    campana: limpiar(d.campana, 400),
    referente: limpiar(d.referente, 300),
    comunicaciones_comerciales: limpiar(d.comunicaciones_comerciales, 5),
    consentimiento_registro: limpiar(d.consentimiento_registro, 600),
  };

  if (limpiar(d["bot-field"])) errores.push("honeypot");
  if (lead.nombre.length < 2) errores.push("nombre");
  if (!EMAIL_RE.test(lead.correo)) errores.push("correo");
  if (lead.empresa.length < 2) errores.push("empresa");
  if (lead.telefono && !TEL_RE.test(lead.telefono)) errores.push("telefono");
  if (!/^\d{1,2}\/24$/.test(lead.puntuacion_total)) errores.push("puntuacion");

  let datos = null;
  try { datos = JSON.parse(d.datos_json || "null"); } catch (e) { errores.push("datos_json"); }
  if (datos) {
    const ok = Array.isArray(datos.respuestas) && datos.respuestas.length === 8 &&
      datos.respuestas.every((r) => Number.isInteger(r.puntos) && r.puntos >= 0 && r.puntos <= 3);
    if (!ok) errores.push("respuestas");
    else {
      const total = datos.respuestas.reduce((s, r) => s + r.puntos, 0);
      if (total !== datos.total) errores.push("total_incoherente");
    }
  }
  lead.datos = datos;
  return { ok: errores.length === 0, errores, lead };
}

exports.validar = validar;

exports.handler = async (event) => {
  let payload;
  try { payload = JSON.parse(event.body || "{}").payload || {}; } catch (e) { return { statusCode: 400, body: "JSON no válido" }; }
  if ((payload.form_name || (payload.data && payload.data["form-name"])) !== FORM) {
    return { statusCode: 200, body: "Otro formulario: sin acción" };
  }

  const { ok, errores, lead } = validar(payload.data || {});
  if (!ok) {
    console.warn("[diagnostico] Envío no válido, no se reenvía:", errores.join(", "));
    return { statusCode: 200, body: "No válido" };
  }

  const url = process.env.DIAGNOSTICO_WEBHOOK_URL;
  if (!url) {
    console.log("[diagnostico] Solicitud válida", lead.id_envio, "(sin webhook configurado)");
    return { statusCode: 200, body: "OK" };
  }

  const headers = { "Content-Type": "application/json" };
  if (process.env.DIAGNOSTICO_WEBHOOK_TOKEN) headers.Authorization = "Bearer " + process.env.DIAGNOSTICO_WEBHOOK_TOKEN;
  // Google Apps Script no lee cabeceras: el token también viaja en el cuerpo.
  const cuerpo = Object.assign({ token: process.env.DIAGNOSTICO_WEBHOOK_TOKEN || "", recibido: payload.created_at || new Date().toISOString() }, lead);

  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(cuerpo), redirect: "follow" });
    if (!res.ok) console.error("[diagnostico] El webhook respondió", res.status);
  } catch (e) {
    console.error("[diagnostico] Error al llamar al webhook:", e.message);
  }
  return { statusCode: 200, body: "OK" };
};
