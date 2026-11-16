/* Pruebas de la lógica de puntuación del diagnóstico.
   Ejecutar desde la raíz del repositorio:  node --test tests/
   (Node 18 o superior; sin dependencias). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../../diagnostico/js/datos.js");
const M = require("../../diagnostico/js/motor.js");

const todas = (v) => Array(8).fill(v);

test("estructura de datos: 8 preguntas de 4 opciones y 4 dimensiones de 2 preguntas", () => {
  assert.equal(D.preguntas.length, 8);
  D.preguntas.forEach((q) => assert.equal(q.opciones.length, 4));
  assert.equal(D.dimensiones.length, 4);
  const usadas = D.dimensiones.flatMap((d) => d.preguntas).sort();
  assert.deepEqual(usadas, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(D.MAX_TOTAL, 24);
  assert.deepEqual(D.PUNTOS, [0, 1, 2, 3]);
});

test("Caso A: todas las respuestas A → 0/24", () => {
  const r = M.calcular(todas(0));
  assert.equal(r.total, 0);
  assert.equal(r.porcentaje, 0);
  assert.equal(r.nivel.id, "conectados");
  assert.ok(r.sinPrioridad);
  assert.deepEqual(r.prioritarias, []);
  assert.equal(r.empate, false);
  assert.equal(r.oportunidades.length, 1);
  assert.equal(r.oportunidades[0].dimension, null);
  assert.deepEqual(r.recomendaciones.map((x) => x.id), ["revision-periodica"]);
  r.dimensiones.forEach((d) => { assert.equal(d.puntos, 0); assert.equal(d.porcentaje, 0); });
});

test("Caso B: todas las respuestas B → 8/24", () => {
  const r = M.calcular(todas(1));
  assert.equal(r.total, 8);
  assert.equal(r.porcentaje, 33);
  assert.equal(r.nivel.id, "simplificar");
  r.dimensiones.forEach((d) => { assert.equal(d.puntos, 2); assert.equal(d.porcentaje, 33); });
  // Empate entre las cuatro: se muestran las dos primeras
  assert.ok(r.empate);
  assert.deepEqual(r.prioritarias, ["solicitudes", "presupuestos"]);
});

test("Caso C: todas las respuestas C → 16/24", () => {
  const r = M.calcular(todas(2));
  assert.equal(r.total, 16);
  assert.equal(r.porcentaje, 67);
  assert.equal(r.nivel.id, "manual");
  r.dimensiones.forEach((d) => assert.equal(d.puntos, 4));
});

test("Caso D: todas las respuestas D → 24/24", () => {
  const r = M.calcular(todas(3));
  assert.equal(r.total, 24);
  assert.equal(r.porcentaje, 100);
  assert.equal(r.nivel.id, "alto");
  r.dimensiones.forEach((d) => { assert.equal(d.puntos, 6); assert.equal(d.porcentaje, 100); });
  assert.equal(r.recomendaciones.length, 3);
});

test("límites de nivel: 5/6, 11/12, 17/18", () => {
  const casos = [[5, "conectados"], [6, "simplificar"], [11, "simplificar"], [12, "manual"], [17, "manual"], [18, "alto"], [24, "alto"]];
  casos.forEach(([t, id]) => assert.equal(M.nivelPara(t).id, id, "total " + t));
});

test("cada dimensión suma solo sus dos preguntas", () => {
  // Solo pregunta 3 (D) y 4 (C) → presupuestos = 5
  const r = M.calcular([0, 0, 3, 2, 0, 0, 0, 0]);
  const p = Object.fromEntries(r.dimensiones.map((d) => [d.id, d.puntos]));
  assert.deepEqual(p, { solicitudes: 0, presupuestos: 5, seguimiento: 0, informacion: 0 });
  assert.equal(r.total, 5);
  assert.deepEqual(r.prioritarias, ["presupuestos"]);
  assert.equal(r.empate, false);
  assert.equal(r.oportunidades[0].titulo, "Reducir tareas repetitivas en la preparación de ofertas");
  assert.deepEqual(r.recomendaciones.map((x) => x.id), ["presupuestos", "dato-unico"]);
});

test("cada dimensión puede ser la prioritaria y muestra su oportunidad", () => {
  const esperado = {
    solicitudes: "Centralizar los pedidos",
    presupuestos: "Reducir tareas repetitivas en la preparación de ofertas",
    seguimiento: "Ordenar el seguimiento de clientes",
    informacion: "Conectar herramientas y centralizar información",
  };
  D.dimensiones.forEach((d) => {
    const resp = todas(1);
    d.preguntas.forEach((qi) => (resp[qi] = 3));
    const r = M.calcular(resp);
    assert.deepEqual(r.prioritarias, [d.id]);
    assert.equal(r.oportunidades.length, 1);
    assert.equal(r.oportunidades[0].titulo, esperado[d.id]);
    assert.equal(r.dimensiones.find((x) => x.prioritaria).id, d.id);
    // Las dos primeras recomendaciones pertenecen a la dimensión prioritaria
    const ids = D.recomendaciones.filter((x) => d.preguntas.includes(x.pregunta)).map((x) => x.id);
    assert.deepEqual(r.recomendaciones.slice(0, 2).map((x) => x.id).sort(), ids.sort());
  });
});

test("empate entre dos dimensiones: se muestran ambas", () => {
  // seguimiento = 6, informacion = 6, resto bajo
  const r = M.calcular([1, 0, 0, 1, 3, 3, 3, 3]);
  assert.ok(r.empate);
  assert.deepEqual(r.prioritarias, ["seguimiento", "informacion"]);
  assert.equal(r.oportunidades.length, 2);
  assert.deepEqual(r.oportunidades.map((o) => o.dimension), ["seguimiento", "informacion"]);
  assert.equal(r.dimensiones.filter((d) => d.prioritaria).length, 2);
  r.recomendaciones.forEach((x) => assert.ok(["avisos", "panel-seguimiento", "integracion", "panel-direccion"].includes(x.id)));
});

test("empate de tres dimensiones: se limitan a dos prioritarias", () => {
  const r = M.calcular([2, 2, 2, 2, 2, 2, 0, 0]);
  assert.ok(r.empate);
  assert.deepEqual(r.prioritarias, ["solicitudes", "presupuestos"]);
});

test("recomendaciones: máximo 3 y nunca de preguntas con 0 puntos", () => {
  const r = M.calcular([0, 3, 0, 1, 0, 0, 2, 0]);
  assert.ok(r.recomendaciones.length <= 3);
  assert.deepEqual(r.recomendaciones.map((x) => x.id), ["asignacion", "integracion", "dato-unico"]);
});

test("el porcentaje es total / 24 × 100 redondeado", () => {
  for (let t = 0; t <= 24; t++) {
    const resp = todas(0);
    let rest = t;
    for (let i = 0; i < 8 && rest > 0; i++) { const v = Math.min(3, rest); resp[i] = v; rest -= v; }
    const r = M.calcular(resp);
    assert.equal(r.total, t);
    assert.equal(r.porcentaje, Math.round((t / 24) * 100));
  }
});

test("contexto de sector y tamaño se añade cuando existe", () => {
  const r = M.calcular(todas(2), { sector: "distribucion", tamano: "6-10" });
  assert.equal(r.contexto.sector.nombre, "Distribución y suministros");
  assert.equal(r.contexto.tamano.nombre, "6-10 trabajadores");
  const s = M.calcular(todas(2));
  assert.equal(s.contexto.sector, null);
  assert.equal(s.contexto.tamano, null);
});

test("respuestas legibles con letra y puntos", () => {
  const r = M.calcular([0, 1, 2, 3, 0, 1, 2, 3]);
  assert.deepEqual(r.respuestas.map((x) => x.letra).join(""), "ABCDABCD");
  assert.deepEqual(r.respuestas.map((x) => x.puntos), [0, 1, 2, 3, 0, 1, 2, 3]);
});

test("entradas no válidas lanzan error", () => {
  assert.throws(() => M.calcular([0, 1]));
  assert.throws(() => M.calcular(todas(4)));
  assert.throws(() => M.calcular([0, 1, 2, 3, 0, 1, 2, -1]));
  assert.throws(() => M.calcular([0, 1, 2, 3, 0, 1, 2, 1.5]));
  assert.throws(() => M.calcular(null));
});
