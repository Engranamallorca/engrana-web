/* Pruebas de la validación en servidor (netlify/functions/submission-created.js). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validar, handler } = require("../../netlify/functions/submission-created.js");

const base = () => ({
  "form-name": "diagnostico-automatizacion", "bot-field": "",
  nombre: "Ana Prueba", correo: "ana@empresa.com", empresa: "Empresa SL", telefono: "",
  puntuacion_total: "14/24",
  datos_json: JSON.stringify({ total: 14, respuestas: [3, 2, 3, 1, 0, 1, 2, 2].map((p, i) => ({ p: i + 1, puntos: p })) }),
});

test("envío válido", () => { assert.equal(validar(base()).ok, true); });
test("honeypot rellenado", () => { const d = base(); d["bot-field"] = "x"; assert.ok(validar(d).errores.includes("honeypot")); });
test("correo no válido", () => { const d = base(); d.correo = "ana@empresa"; assert.ok(validar(d).errores.includes("correo")); });
test("teléfono no válido", () => { const d = base(); d.telefono = "12"; assert.ok(validar(d).errores.includes("telefono")); });
test("total manipulado", () => { const d = base(); d.datos_json = d.datos_json.replace('"total":14', '"total":3'); assert.ok(validar(d).errores.includes("total_incoherente")); });
test("ignora otros formularios", async () => {
  const r = await handler({ body: JSON.stringify({ payload: { form_name: "diagnostico", data: {} } }) });
  assert.match(r.body, /Otro formulario/);
});
test("sin webhook configurado responde OK", async () => {
  delete process.env.DIAGNOSTICO_WEBHOOK_URL;
  const r = await handler({ body: JSON.stringify({ payload: { form_name: "diagnostico-automatizacion", data: base() } }) });
  assert.equal(r.body, "OK");
});
