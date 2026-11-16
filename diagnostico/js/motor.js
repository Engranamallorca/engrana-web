/* =========================================================
   ENGRANA · Diagnóstico de Automatización
   motor.js — Cálculo del diagnóstico. Sin interfaz, sin DOM.

   Uso:
     var r = EngranaDiagMotor.calcular([3,2,1,0,2,2,3,1], { sector: "distribucion", tamano: "6-10" });

   Entrada:
     respuestas  Array de 8 enteros entre 0 y 3: el índice de la opción
                 elegida en cada pregunta (0 = A, 1 = B, 2 = C, 3 = D).
     contexto    Opcional. { sector: id, tamano: id } según datos.js.

   Salida (objeto):
     total            Suma de puntos (0-24).
     max              Máximo posible (24).
     porcentaje       total / 24 × 100, redondeado a entero.
     nivel            { id, titulo, descripcion } según el tramo de puntos.
     dimensiones      [{ id, nombre, puntos, max: 6, porcentaje, prioritaria }]
     prioritarias     Ids de las dimensiones con más puntos (máximo 2).
     empate           true si hay más de una dimensión con la puntuación máxima.
     sinPrioridad     true si ninguna dimensión suma puntos.
     oportunidades    [{ dimension, titulo, texto }] (1 o 2 elementos).
     recomendaciones  [{ id, titulo, texto }] (máximo 3).
     contexto         { sector, tamano } con nombres y frases de contexto.
     respuestas       Detalle legible de cada respuesta.

   Lanza un Error si las respuestas no son válidas.
   Es un indicador orientativo construido solo con las respuestas
   del usuario: no es un benchmark ni una auditoría.
   ========================================================= */
(function (root, factory) {
  var datos = (typeof module === "object" && module.exports) ? require("./datos.js") : root.EngranaDiagDatos;
  var motor = factory(datos);
  if (typeof module === "object" && module.exports) module.exports = motor;
  else root.EngranaDiagMotor = motor;
})(typeof self !== "undefined" ? self : this, function (D) {
  "use strict";

  /** Comprueba que hay una respuesta válida (0-3) para cada pregunta. */
  function validar(respuestas) {
    if (!Array.isArray(respuestas) || respuestas.length !== D.preguntas.length) {
      throw new Error("Se esperaban " + D.preguntas.length + " respuestas.");
    }
    respuestas.forEach(function (r, i) {
      if (typeof r !== "number" || r % 1 !== 0 || r < 0 || r >= D.PUNTOS.length) {
        throw new Error("Respuesta no válida en la pregunta " + (i + 1) + ".");
      }
    });
  }

  /** Puntos de una respuesta (índice de opción → puntos). */
  function puntosDe(indiceOpcion) { return D.PUNTOS[indiceOpcion]; }

  /** Nivel de resultado para una puntuación total. */
  function nivelPara(total) {
    for (var i = 0; i < D.niveles.length; i++) {
      var n = D.niveles[i];
      if (total >= n.min && total <= n.max) return { id: n.id, titulo: n.titulo, descripcion: n.descripcion };
    }
    throw new Error("Puntuación fuera de rango: " + total);
  }

  function buscar(lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  /** Cálculo principal. */
  function calcular(respuestas, contexto) {
    validar(respuestas);
    contexto = contexto || {};

    var puntos = respuestas.map(puntosDe);
    var total = puntos.reduce(function (a, b) { return a + b; }, 0);
    var max = D.MAX_TOTAL;
    var maxDim = D.PUNTOS[D.PUNTOS.length - 1] * 2;

    // Dimensiones
    var dims = D.dimensiones.map(function (d) {
      var p = d.preguntas.reduce(function (s, qi) { return s + puntos[qi]; }, 0);
      return { id: d.id, nombre: d.nombre, nombreLargo: d.nombreLargo, puntos: p, max: maxDim,
               porcentaje: Math.round(p / maxDim * 100), prioritaria: false };
    });

    // Dimensión(es) prioritaria(s): la mayor puntuación. En empate, las dos primeras en orden.
    var mayor = Math.max.apply(null, dims.map(function (d) { return d.puntos; }));
    var empatadas = dims.filter(function (d) { return d.puntos === mayor; });
    var sinPrioridad = mayor === 0;
    var prioritarias = sinPrioridad ? [] : empatadas.slice(0, 2).map(function (d) { return d.id; });
    dims.forEach(function (d) { d.prioritaria = prioritarias.indexOf(d.id) !== -1; });

    // Oportunidades
    var oportunidades = sinPrioridad
      ? [{ dimension: null, titulo: D.oportunidadSinPrioridad.titulo, texto: D.oportunidadSinPrioridad.texto }]
      : prioritarias.map(function (id) {
          var d = buscar(D.dimensiones, id);
          return { dimension: id, titulo: d.oportunidad.titulo, texto: d.oportunidad.texto };
        });

    // Recomendaciones: una por pregunta con puntos. Primero las de dimensiones
    // prioritarias, después por puntos (desc) y por orden de pregunta.
    var dimDePregunta = {};
    D.dimensiones.forEach(function (d) { d.preguntas.forEach(function (qi) { dimDePregunta[qi] = d.id; }); });
    var candidatas = D.recomendaciones
      .filter(function (r) { return puntos[r.pregunta] > 0; })
      .sort(function (a, b) {
        var pa = prioritarias.indexOf(dimDePregunta[a.pregunta]) !== -1 ? 0 : 1;
        var pb = prioritarias.indexOf(dimDePregunta[b.pregunta]) !== -1 ? 0 : 1;
        if (pa !== pb) return pa - pb;
        if (puntos[b.pregunta] !== puntos[a.pregunta]) return puntos[b.pregunta] - puntos[a.pregunta];
        return a.pregunta - b.pregunta;
      })
      .slice(0, D.MAX_RECOMENDACIONES)
      .map(function (r) { return { id: r.id, titulo: r.titulo, texto: r.texto }; });
    if (!candidatas.length) {
      var s = D.recomendacionSinPrioridad;
      candidatas = [{ id: s.id, titulo: s.titulo, texto: s.texto }];
    }

    // Contexto (opcional)
    var sector = buscar(D.sectores, contexto.sector);
    var tamano = buscar(D.tamanos, contexto.tamano);

    return {
      version: D.version,
      total: total,
      max: max,
      porcentaje: Math.round(total / max * 100),
      nivel: nivelPara(total),
      dimensiones: dims,
      prioritarias: prioritarias,
      empate: !sinPrioridad && empatadas.length > 1,
      sinPrioridad: sinPrioridad,
      oportunidades: oportunidades,
      recomendaciones: candidatas,
      contexto: {
        sector: sector ? { id: sector.id, nombre: sector.nombre, frase: sector.contexto } : null,
        tamano: tamano ? { id: tamano.id, nombre: tamano.nombre, frase: tamano.contexto } : null
      },
      respuestas: respuestas.map(function (r, i) {
        var q = D.preguntas[i];
        return { pregunta: i + 1, id: q.id, tema: q.tema, letra: D.LETRAS[r], texto: q.opciones[r], puntos: puntos[i] };
      })
    };
  }

  return { calcular: calcular, nivelPara: nivelPara, validar: validar };
});
