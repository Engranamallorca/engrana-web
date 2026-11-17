/* Pruebas de la función de avisos (netlify/functions/diagnostico-evento.js). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validarEvento, handler } = require("../../netlify/functions/diagnostico-evento.js");

test("acepta abierto e iniciado con referencia válida", () => {
  assert.deepEqual(validarEvento({ ref: "E-AB12CD", evento: "abierto" }), { ref: "E-AB12CD", evento: "abierto", campana: "" });
  assert.ok(validarEvento({ ref: "E-AB12CD", evento: "iniciado", campana: "dist" }));
});
test("completado exige porcentaje entero 0-100", () => {
  assert.equal(validarEvento({ ref: "E-AB12CD", evento: "completado" }), null);
  assert.equal(validarEvento({ ref: "E-AB12CD", evento: "completado", porcentaje: 101 }), null);
  const e = validarEvento({ ref: "E-AB12CD", evento: "completado", porcentaje: 58, nivel: "El trabajo manual…", oportunidad: "Centralizar los pedidos" });
  assert.equal(e.porcentaje, 58);
});
test("rechaza referencias o eventos no válidos", () => {
  assert.equal(validarEvento({ ref: "cualquiera", evento: "abierto" }), null);
  assert.equal(validarEvento({ ref: "E-AB12CD", evento: "borrar" }), null);
  assert.equal(validarEvento(null), null);
});
test("handler: 400 con datos malos, 204 sin hoja configurada", async () => {
  delete process.env.DIAGNOSTICO_WEBHOOK_URL;
  assert.equal((await handler({ httpMethod: "GET" })).statusCode, 405);
  assert.equal((await handler({ httpMethod: "POST", body: "{" })).statusCode, 400);
  assert.equal((await handler({ httpMethod: "POST", body: JSON.stringify({ ref: "x", evento: "abierto" }) })).statusCode, 400);
  assert.equal((await handler({ httpMethod: "POST", body: JSON.stringify({ ref: "E-AB12CD", evento: "abierto" }) })).statusCode, 204);
});
test("handler reenvía a la hoja con la clave en el servidor", async () => {
  process.env.DIAGNOSTICO_WEBHOOK_URL = "https://hoja.example/exec";
  process.env.DIAGNOSTICO_WEBHOOK_TOKEN = "secreto";
  const llamadas = [];
  const original = global.fetch;
  global.fetch = async (url, o) => { llamadas.push({ url, cuerpo: JSON.parse(o.body) }); return { ok: true }; };
  try {
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ ref: "E-AB12CD", evento: "completado", porcentaje: 40 }) });
    assert.equal(r.statusCode, 204);
    assert.equal(llamadas[0].url, "https://hoja.example/exec");
    assert.equal(llamadas[0].cuerpo.tipo, "evento");
    assert.equal(llamadas[0].cuerpo.token, "secreto");
    assert.equal(llamadas[0].cuerpo.porcentaje, 40);
  } finally {
    global.fetch = original;
    delete process.env.DIAGNOSTICO_WEBHOOK_URL; delete process.env.DIAGNOSTICO_WEBHOOK_TOKEN;
  }
});
