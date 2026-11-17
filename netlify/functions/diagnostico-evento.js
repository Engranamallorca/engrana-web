/* =========================================================
   Netlify · /.netlify/functions/diagnostico-evento
   Recibe los avisos del diagnóstico de quienes llegan con un enlace
   personal del panel de envíos (?ref=E-XXXXXX): «abierto», «iniciado»
   y «completado» (con la puntuación). Valida los datos y los reenvía
   al Apps Script de la hoja (DIAGNOSTICO_WEBHOOK_URL), con la clave
   DIAGNOSTICO_WEBHOOK_TOKEN. Ni la URL ni la clave llegan al navegador.
   No guarda IP, cookies ni ningún otro dato.
   ========================================================= */
"use strict";

const EVENTOS = ["abierto", "iniciado", "completado"];
const REF_RE = /^E-[A-Z0-9]{6}$/;

function limpiar(v, max) { return typeof v === "string" ? v.trim().slice(0, max) : ""; }

/** Devuelve el evento listo para reenviar, o null si no es válido. */
function validarEvento(d) {
  if (!d || typeof d !== "object") return null;
  if (!REF_RE.test(d.ref || "") || EVENTOS.indexOf(d.evento) === -1) return null;
  const e = { ref: d.ref, evento: d.evento, campana: limpiar(d.campana, 80) };
  if (d.evento === "completado") {
    const p = Number(d.porcentaje);
    if (!Number.isInteger(p) || p < 0 || p > 100) return null;
    e.porcentaje = p;
    e.nivel = limpiar(d.nivel, 80);
    e.oportunidad = limpiar(d.oportunidad, 200);
  }
  return e;
}
exports.validarEvento = validarEvento;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "" };
  if ((event.body || "").length > 2000) return { statusCode: 413, body: "" };
  let d;
  try { d = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body); }
  catch (e) { return { statusCode: 400, body: "" }; }

  const ev = validarEvento(d);
  if (!ev) return { statusCode: 400, body: "" };

  const url = process.env.DIAGNOSTICO_WEBHOOK_URL;
  if (!url) return { statusCode: 204, body: "" };   // sin hoja conectada: se ignora en silencio

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ tipo: "evento", token: process.env.DIAGNOSTICO_WEBHOOK_TOKEN || "", fecha: new Date().toISOString() }, ev)),
      redirect: "follow"
    });
  } catch (e) {
    console.error("[diagnostico-evento] No se pudo avisar a la hoja:", e.message);
  }
  return { statusCode: 204, body: "" };
};
