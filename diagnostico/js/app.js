/* =========================================================
   ENGRANA · Diagnóstico de Automatización
   app.js — Interfaz: navegación por etapas, cuestionario,
   resultado, formulario de solicitud y galería.

   Los textos salen de datos.js y el cálculo de motor.js.
   No se guarda ningún dato personal en localStorage ni en
   sessionStorage: todo vive en memoria mientras la página
   está abierta.
   ========================================================= */
(function () {
  "use strict";
  var D = window.EngranaDiagDatos, M = window.EngranaDiagMotor;
  if (!D || !M) return;

  var doc = document, win = window;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL = "jaumemoranta@engrana-mallorca.com";
  var POLITICA_VERSION = "diagnostico-privacidad v1.0 (borrador pendiente de validación)";
  var N = D.preguntas.length;

  /* ---------- Estado (solo en memoria) ---------- */
  var estado = {
    vista: "inicio",
    etapa: null,
    q: 0,
    respuestas: new Array(N).fill(null),
    sector: "",
    tamano: "",
    resultado: null,
    editando: false,
    idEnvio: null,
    enviando: false,
    enviado: false,
    origen: leerOrigen()
  };

  function leerOrigen() {
    var p = new URLSearchParams(win.location.search);
    var utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"].forEach(function (k) {
      var v = p.get(k); if (v) utm[k] = v.slice(0, 120);
    });
    return { url: (win.location.origin + win.location.pathname + win.location.search).slice(0, 500), utm: utm, referente: (doc.referrer || "").slice(0, 300) };
  }

  function nuevoId() {
    if (win.crypto && win.crypto.randomUUID) return win.crypto.randomUUID();
    return "d-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- Elementos ---------- */
  var vInicio = $("#vista-inicio"), vApp = $("#vista-app");
  var etapas = {};
  $$(".dg-stage").forEach(function (s) { etapas[s.getAttribute("data-stage")] = s; });
  var progreso = $("[data-progreso]"), barra = $("[data-barra]"), num = $("[data-num]"), etiqueta = $("[data-etiqueta]");
  var btnSig = $('[data-accion="siguiente"]'), sigTxt = $("[data-sig-txt]");
  var form = $(".dg-form");

  /* =========================================================
     Navegación (con historial: el botón Atrás del navegador funciona)
     ========================================================= */
  function ir(destino, opciones) {
    opciones = opciones || {};
    var st = { vista: destino === "inicio" ? "inicio" : "app", etapa: destino === "inicio" ? null : destino, q: estado.q };
    if (!opciones.sinHistorial) {
      if (opciones.reemplazar) history.replaceState(st, "");
      else history.pushState(st, "");
    }
    pintar(st, opciones);
  }

  function pintar(st, opciones) {
    opciones = opciones || {};
    var qPrev = typeof estado.qPintada === "number" ? estado.qPintada : -1;
    var dir = st.q < qPrev ? "prev" : "next";
    estado.vista = st.vista;
    if (typeof st.q === "number") estado.q = st.q;

    if (st.vista === "inicio") {
      vApp.hidden = true; vInicio.hidden = false;
      estado.etapa = null;
      doc.title = "Diagnóstico de Automatización Empresarial | Engrana";
      if (!opciones.mantenerScroll) win.scrollTo(0, 0);
      return;
    }

    // Etapas que necesitan datos previos
    var etapa = st.etapa;
    if ((etapa === "resultado" || etapa === "solicitud" || etapa === "confirmacion") && !estado.resultado) etapa = "intro";
    if (etapa === "confirmacion" && !estado.enviado) etapa = estado.resultado ? "resultado" : "intro";
    if (etapa === "analisis") etapa = estado.resultado ? "resultado" : "pregunta";

    vInicio.hidden = true; vApp.hidden = false;
    var anterior = estado.etapa;
    estado.etapa = etapa;
    Object.keys(etapas).forEach(function (k) { etapas[k].hidden = k !== etapa; });

    // Barra superior
    var enPreguntas = etapa === "pregunta";
    progreso.hidden = !enPreguntas;
    etiqueta.textContent = ({ intro: "Diagnóstico de automatización", analisis: "Analizando", resultado: "Tu diagnóstico", solicitud: "Solicitud de revisión", confirmacion: "Solicitud enviada" })[etapa] || "";

    if (etapa === "intro") pintarIntro();
    if (etapa === "pregunta") { pintarPregunta(anterior === "pregunta" ? dir : null); estado.qPintada = estado.q; }
    if (etapa === "resultado") pintarResultado(anterior !== "resultado");
    if (etapa === "solicitud") pintarSolicitud();

    if (etapa !== "pregunta" || anterior !== "pregunta") {
      var s = etapas[etapa];
      s.classList.remove("is-entering"); void s.offsetWidth; s.classList.add("is-entering");
    }
    if (!opciones.mantenerScroll) win.scrollTo(0, 0);
    var h = etapas[etapa].querySelector("h1");
    if (h) { if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    doc.title = (h ? h.textContent + " · " : "") + "Diagnóstico Engrana";
  }

  win.addEventListener("popstate", function (e) {
    var st = e.state || { vista: "inicio" };
    if (st.etapa === "analisis") st.etapa = "resultado";
    pintar(st);
  });
  history.replaceState({ vista: "inicio", etapa: null, q: 0 }, "");

  /* =========================================================
     Intro: sector y tamaño (opcionales)
     ========================================================= */
  var introPintada = false;
  function pintarIntro() {
    if (introPintada) return;
    introPintada = true;
    [["sector", D.sectores], ["tamano", D.tamanos]].forEach(function (par) {
      var cont = $('[data-ctx="' + par[0] + '"]');
      cont.innerHTML = "";
      par[1].forEach(function (op) {
        var l = doc.createElement("label");
        l.className = "dg-chip-opt";
        var i = doc.createElement("input");
        i.type = "radio"; i.name = "ctx-" + par[0]; i.value = op.id;
        i.checked = estado[par[0]] === op.id;
        i.addEventListener("change", function () { estado[par[0]] = op.id; });
        // Permite desmarcar pulsando de nuevo (los campos son opcionales)
        i.addEventListener("click", function () {
          if (i.dataset.was === "1") { i.checked = false; estado[par[0]] = ""; i.dataset.was = ""; }
          else { $$('input[name="ctx-' + par[0] + '"]').forEach(function (o) { o.dataset.was = ""; }); i.dataset.was = "1"; }
        });
        if (i.checked) i.dataset.was = "1";
        var s = doc.createElement("span"); s.textContent = op.nombre;
        l.appendChild(i); l.appendChild(s);
        cont.appendChild(l);
      });
    });
  }

  /* =========================================================
     Preguntas
     ========================================================= */
  var qBox = $("[data-q]"), qTema = $("[data-q-tema]"), qTexto = $("[data-q-texto]"), qLegend = $("[data-q-legend]"), qOps = $("[data-q-opciones]");

  function pintarPregunta(dir) {
    var i = estado.q, q = D.preguntas[i];
    var render = function () {
      qTema.textContent = q.tema;
      qTexto.textContent = q.texto;
      qLegend.textContent = q.texto;
      qOps.innerHTML = "";
      q.opciones.forEach(function (txt, k) {
        var l = doc.createElement("label");
        l.className = "dg-opt" + (estado.respuestas[i] === k ? " is-sel" : "");
        l.innerHTML = '<input type="radio" name="q' + i + '" value="' + k + '"><span class="dg-opt__l" aria-hidden="true">' + D.LETRAS[k] + '</span><span class="dg-opt__t"></span><span class="dg-opt__c" aria-hidden="true"><svg><use href="#i-check"/></svg></span>';
        l.querySelector(".dg-opt__t").textContent = txt;
        var inp = l.querySelector("input");
        inp.checked = estado.respuestas[i] === k;
        inp.addEventListener("change", function () { elegir(i, k); });
        qOps.appendChild(l);
      });
      actualizarBarra();
      qBox.classList.remove("is-out", "is-in-next", "is-in-prev");
      if (dir && !reduce) { void qBox.offsetWidth; qBox.classList.add(dir === "prev" ? "is-in-prev" : "is-in-next"); }
    };
    if (dir && !reduce && qOps.children.length) {
      qBox.classList.remove("is-in-next", "is-in-prev");
      qBox.classList.add("is-out");
      setTimeout(render, 170);
    } else render();
  }

  function elegir(i, k) {
    estado.respuestas[i] = k;
    $$(".dg-opt", qOps).forEach(function (el, idx) { el.classList.toggle("is-sel", idx === k); });
    actualizarBarra();
  }

  function actualizarBarra() {
    var i = estado.q;
    var respondidas = estado.respuestas.filter(function (r) { return r !== null; }).length;
    num.textContent = String(i + 1).padStart(2, "0");
    var pct = Math.max(i + (estado.respuestas[i] !== null ? 1 : 0), 0) / N * 100;
    barra.style.width = pct + "%";
    barra.parentNode.setAttribute("aria-valuenow", String(respondidas));
    var ok = estado.respuestas[i] !== null;
    btnSig.disabled = !ok;
    var ultima = i === N - 1;
    sigTxt.textContent = estado.editando ? "Ver diagnóstico actualizado" : (ultima ? "Analizar mis respuestas" : "Siguiente");
  }

  function siguiente() {
    if (estado.respuestas[estado.q] === null) return;
    if (estado.editando || estado.q === N - 1) {
      var pendiente = estado.respuestas.indexOf(null);
      if (pendiente !== -1) { estado.editando = false; estado.q = pendiente; ir("pregunta"); return; }
      analizar();
      return;
    }
    estado.q += 1;
    ir("pregunta");
  }

  function anterior() {
    if (estado.editando) { estado.editando = false; ir("resultado"); return; }
    if (estado.q === 0) { ir("intro"); return; }
    estado.q -= 1;
    ir("pregunta");
  }

  // Enter avanza cuando hay respuesta
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && estado.etapa === "pregunta" && !vApp.hidden && !btnSig.disabled && e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
      e.preventDefault(); siguiente();
    }
  });

  /* =========================================================
     Análisis
     ========================================================= */
  function analizar() {
    estado.editando = false;
    estado.resultado = M.calcular(estado.respuestas.slice(), { sector: estado.sector, tamano: estado.tamano });
    if (!estado.enviado) estado.idEnvio = nuevoId();
    // Pantalla intermedia breve (no entra en el historial)
    Object.keys(etapas).forEach(function (k) { etapas[k].hidden = k !== "analisis"; });
    estado.etapa = "analisis";
    progreso.hidden = true; etiqueta.textContent = "Analizando";
    win.scrollTo(0, 0);
    var items = $$("[data-checklist] li");
    items.forEach(function (li) { li.classList.remove("is-done"); });
    var paso = reduce ? 60 : 420;
    items.forEach(function (li, k) { setTimeout(function () { li.classList.add("is-done"); }, paso * (k + 1)); });
    setTimeout(function () { ir("resultado"); }, paso * (items.length + 1) + (reduce ? 0 : 200));
  }

  /* =========================================================
     Resultado
     ========================================================= */
  var fmtFecha = function (d) {
    try { return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return d.toISOString().slice(0, 10); }
  };

  function pintarResultado(animar) {
    var r = estado.resultado; if (!r) return;
    $("[data-r-meta]").textContent = fmtFecha(new Date()) + " · Ref. " + estado.idEnvio.slice(0, 8).toUpperCase();

    // Nivel
    var idxNivel = D.niveles.findIndex(function (n) { return n.id === r.nivel.id; });
    var pill = $("[data-r-nivel-pill]");
    pill.innerHTML = "<i aria-hidden=\"true\">" + D.niveles.map(function (_, k) { return "<span class=\"" + (k <= idxNivel ? "on" : "") + "\"></span>"; }).join("") + "</i>";
    pill.appendChild(doc.createTextNode("Nivel " + (idxNivel + 1) + " de " + D.niveles.length));
    $("[data-r-nivel]").textContent = r.nivel.titulo;
    $("[data-r-desc]").textContent = r.nivel.descripcion;
    $("[data-r-total]").textContent = r.total;

    // Indicador
    pintarTicks();
    var fill = $("[data-gauge-fill]"), numEl = $("[data-gauge-num]");
    if (animar && !reduce) {
      fill.style.transition = "none"; fill.style.strokeDashoffset = "100"; void fill.getBoundingClientRect();
      fill.style.transition = "";
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.strokeDashoffset = String(100 - Math.max(r.porcentaje, 0.5)); }); });
      contar(numEl, r.porcentaje, 1500);
    } else {
      fill.style.strokeDashoffset = String(100 - Math.max(r.porcentaje, 0.5));
      numEl.textContent = r.porcentaje;
    }

    // Dimensiones
    var ul = $("[data-dims]"); ul.innerHTML = "";
    r.dimensiones.forEach(function (d) {
      var li = doc.createElement("li");
      li.className = "dg-dim" + (d.prioritaria ? " is-prio" : "");
      li.innerHTML = '<div class="dg-dim__top"><span class="dg-dim__n"></span><span class="dg-dim__v">' + d.porcentaje + '</span></div>' +
        '<div class="dg-dim__track" role="img" aria-label="' + d.nombre + ": " + d.porcentaje + ' de 100"><div class="dg-dim__fill"></div></div>' +
        '<p class="dg-dim__pts">' + d.puntos + " de " + d.max + " puntos</p>";
      var n = li.querySelector(".dg-dim__n"); n.textContent = d.nombre;
      if (d.prioritaria) { var b = doc.createElement("span"); b.className = "dg-prio"; b.textContent = "Prioridad"; n.appendChild(b); }
      ul.appendChild(li);
      var f = li.querySelector(".dg-dim__fill");
      if (animar && !reduce) setTimeout(function () { f.style.width = d.porcentaje + "%"; }, 350);
      else f.style.width = d.porcentaje + "%";
    });

    // Oportunidad(es)
    var opps = $("[data-opps]"); opps.innerHTML = "";
    opps.classList.toggle("is-two", r.oportunidades.length > 1);
    $("[data-opp-h]").textContent = r.oportunidades.length > 1 ? "Oportunidades prioritarias detectadas" : "Principal oportunidad detectada";
    r.oportunidades.forEach(function (o) {
      var dim = o.dimension ? D.dimensiones.filter(function (d) { return d.id === o.dimension; })[0] : null;
      var c = doc.createElement("div"); c.className = "dg-oppcard";
      c.innerHTML = "<small></small><h4></h4><p></p>";
      c.querySelector("small").textContent = dim ? dim.nombreLargo : "Sin un área prioritaria";
      c.querySelector("h4").textContent = o.titulo;
      c.querySelector("p").textContent = o.texto;
      opps.appendChild(c);
    });
    var frases = [];
    if (r.contexto.sector && r.contexto.sector.frase && !r.sinPrioridad) frases.push(r.contexto.sector.frase);
    if (r.contexto.tamano && r.contexto.tamano.frase) frases.push(r.contexto.tamano.frase);
    var ctx = $("[data-ctx-frase]");
    ctx.hidden = !frases.length; ctx.textContent = frases.join(" ");

    // Soluciones
    var ol = $("[data-sols]"); ol.innerHTML = "";
    r.recomendaciones.forEach(function (s, k) {
      var li = doc.createElement("li");
      li.innerHTML = '<span class="dg-sol__n">' + String(k + 1).padStart(2, "0") + "</span><h4></h4><p></p>";
      li.querySelector("h4").textContent = s.titulo;
      li.querySelector("p").textContent = s.texto;
      ol.appendChild(li);
    });

    // Repaso de respuestas
    var rl = $("[data-review-list]"); rl.innerHTML = "";
    r.respuestas.forEach(function (x, k) {
      var li = doc.createElement("li");
      li.innerHTML = '<span class="dg-sol__n">' + String(k + 1).padStart(2, "0") + '</span><small></small><p><b></b><span></span></p><button type="button" class="dg-link">Cambiar</button>';
      li.querySelector("small").textContent = x.tema;
      li.querySelector("b").textContent = x.letra;
      li.querySelector("p span").textContent = x.texto;
      var btn = li.querySelector("button");
      btn.setAttribute("aria-label", "Cambiar la respuesta de la pregunta " + (k + 1));
      btn.addEventListener("click", function () { estado.editando = true; estado.q = k; ir("pregunta"); });
      rl.appendChild(li);
    });
  }

  var ticksPintados = false;
  function pintarTicks() {
    if (ticksPintados) return; ticksPintados = true;
    var g = $(".dg-gauge__ticks"), ns = "http://www.w3.org/2000/svg";
    for (var k = 0; k <= 10; k++) {
      var a = Math.PI - (Math.PI * k / 10);
      var r1 = 70, r2 = k % 5 === 0 ? 62 : 65;
      var l = doc.createElementNS(ns, "line");
      l.setAttribute("x1", (110 + r1 * Math.cos(a)).toFixed(2)); l.setAttribute("y1", (112 - r1 * Math.sin(a)).toFixed(2));
      l.setAttribute("x2", (110 + r2 * Math.cos(a)).toFixed(2)); l.setAttribute("y2", (112 - r2 * Math.sin(a)).toFixed(2));
      g.appendChild(l);
    }
  }

  function contar(el, hasta, ms) {
    var t0 = null;
    function paso(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / ms, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(hasta * e);
      if (p < 1) requestAnimationFrame(paso);
    }
    el.textContent = "0";
    requestAnimationFrame(paso);
  }

  /* =========================================================
     Solicitud de revisión (captación)
     ========================================================= */
  function pintarSolicitud() {
    var r = estado.resultado; if (!r) return;
    $("[data-s-pct]").textContent = r.porcentaje + "%";
    $("[data-s-nivel]").textContent = r.nivel.titulo;
    $("[data-s-opp]").textContent = r.oportunidades.map(function (o) { return o.titulo; }).join(" · ");
    var ul = $("[data-s-dims]"); ul.innerHTML = "";
    r.dimensiones.forEach(function (d) {
      var li = doc.createElement("li"); if (d.prioritaria) li.className = "is-prio";
      li.innerHTML = "<div><span></span><b>" + d.porcentaje + '</b></div><i aria-hidden="true"><span style="width:' + d.porcentaje + '%"></span></i>';
      li.querySelector("div span").textContent = d.nombre;
      ul.appendChild(li);
    });
    var err = $("[data-form-error]");
    if (estado.enviado) {
      err.hidden = false;
      err.textContent = "Ya hemos recibido tu solicitud. No hace falta enviarla de nuevo.";
    }
  }

  var reglas = {
    nombre: function (v) { return v.trim().length >= 2 ? "" : "Indica tu nombre y apellidos."; },
    correo: function (v) {
      v = v.trim();
      if (!v) return "Indica tu correo electrónico.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Revisa el formato del correo (por ejemplo, nombre@empresa.com).";
    },
    empresa: function (v) { return v.trim().length >= 2 ? "" : "Indica el nombre de tu empresa."; },
    telefono: function (v) {
      v = v.trim(); if (!v) return "";
      return /^\+?[0-9\s().-]{9,20}$/.test(v) ? "" : "Revisa el teléfono o déjalo en blanco.";
    }
  };

  function validarCampo(nombre) {
    var input = form.elements[nombre], fn = reglas[nombre];
    if (!input || !fn) return true;
    var msg = fn(input.value), err = $("#e-" + nombre);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; err.hidden = !msg; if (msg) input.setAttribute("aria-describedby", err.id); else input.removeAttribute("aria-describedby"); }
    return !msg;
  }
  Object.keys(reglas).forEach(function (n) {
    var input = form.elements[n];
    input.addEventListener("blur", function () { if (input.value || input.getAttribute("aria-invalid") === "true") validarCampo(n); });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") validarCampo(n);
      var err = $("[data-form-error]");
      if (!err.hidden && !estado.enviado && !$$('.dg-form [aria-invalid="true"]').length) err.hidden = true;
    });
  });

  /** Rellena los campos ocultos con el diagnóstico y devuelve el cuerpo a enviar. */
  function prepararEnvio() {
    var r = estado.resultado, ahora = new Date();
    var acepta = form.elements.acepto_comunicaciones.checked;
    var textoConsent = $('label[for="f-com"]').childNodes[0].textContent.trim();
    var dimTxt = function (id) { var d = r.dimensiones.filter(function (x) { return x.id === id; })[0]; return d.puntos + "/" + d.max + " (" + d.porcentaje + " %)" + (d.prioritaria ? " · prioritaria" : ""); };
    var utm = estado.origen.utm;
    var valores = {
      id_envio: estado.idEnvio,
      fecha_envio: ahora.toISOString(),
      sector: r.contexto.sector ? r.contexto.sector.nombre : "No indicado",
      tamano_equipo: r.contexto.tamano ? r.contexto.tamano.nombre : "No indicado",
      puntuacion_total: r.total + "/" + r.max,
      indice_porcentaje: r.porcentaje + " %",
      nivel: r.nivel.titulo,
      dim_solicitudes: dimTxt("solicitudes"),
      dim_presupuestos: dimTxt("presupuestos"),
      dim_seguimiento: dimTxt("seguimiento"),
      dim_informacion: dimTxt("informacion"),
      oportunidad_principal: r.oportunidades.map(function (o) { return o.titulo; }).join(" + "),
      recomendaciones: r.recomendaciones.map(function (s) { return s.titulo; }).join(" | "),
      respuestas: r.respuestas.map(function (x) { return "P" + x.pregunta + " · " + x.tema + ": " + x.letra + " (" + x.puntos + ") " + x.texto; }).join("\n"),
      url_origen: estado.origen.url,
      campana: Object.keys(utm).map(function (k) { return k + "=" + utm[k]; }).join(" · ") || "Sin campaña",
      referente: estado.origen.referente || "Directo",
      comunicaciones_comerciales: acepta ? "Sí" : "No",
      consentimiento_registro: acepta
        ? "Otorgado el " + ahora.toISOString() + " mediante casilla no premarcada. Texto: «" + textoConsent + "». Política: " + POLITICA_VERSION + "."
        : "No otorgado"
    };
    valores.datos_json = JSON.stringify({
      version: r.version, id: estado.idEnvio, fecha: valores.fecha_envio,
      contexto: { sector: r.contexto.sector && r.contexto.sector.id, tamano: r.contexto.tamano && r.contexto.tamano.id },
      total: r.total, max: r.max, porcentaje: r.porcentaje, nivel: r.nivel.id,
      dimensiones: r.dimensiones.map(function (d) { return { id: d.id, puntos: d.puntos, porcentaje: d.porcentaje, prioritaria: d.prioritaria }; }),
      prioritarias: r.prioritarias, empate: r.empate,
      respuestas: r.respuestas.map(function (x) { return { p: x.pregunta, letra: x.letra, puntos: x.puntos }; }),
      oportunidades: r.oportunidades.map(function (o) { return o.dimension || "ninguna"; }),
      recomendaciones: r.recomendaciones.map(function (s) { return s.id; }),
      origen: estado.origen,
      comunicaciones: { aceptado: acepta, fecha: acepta ? valores.fecha_envio : null, politica: POLITICA_VERSION }
    });
    Object.keys(valores).forEach(function (k) { if (form.elements[k]) form.elements[k].value = valores[k]; });

    var datos = new FormData(form), cuerpo = new URLSearchParams();
    datos.forEach(function (v, k) { cuerpo.append(k, typeof v === "string" ? v.trim() : v); });
    if (!acepta) cuerpo.set("acepto_comunicaciones", "no");
    return cuerpo;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("[data-form-error]"), btn = $("[data-submit]");
    if (estado.enviando) return;
    if (estado.enviado) { ir("confirmacion"); return; }   // sin reenvíos duplicados

    var primero = null;
    Object.keys(reglas).forEach(function (n) { if (!validarCampo(n) && !primero) primero = form.elements[n]; });
    if (primero) { err.hidden = false; err.textContent = "Revisa los campos marcados."; primero.focus(); return; }
    err.hidden = true;

    // Honeypot: si un bot lo rellena, fingimos éxito sin enviar nada.
    if (form.elements["bot-field"].value) { estado.enviado = true; ir("confirmacion"); return; }

    var cuerpo = prepararEnvio();
    estado.enviando = true;
    btn.setAttribute("aria-busy", "true"); btn.disabled = true;
    var txtOriginal = btn.firstChild.textContent;
    btn.firstChild.textContent = "Enviando… ";

    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: cuerpo.toString() })
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); })
      .then(function () {
        estado.enviado = true;
        ir("confirmacion");
      })
      .catch(function () {
        err.hidden = false;
        err.innerHTML = "";
        err.appendChild(doc.createTextNode("No hemos podido enviar la solicitud. Inténtalo de nuevo en unos segundos o escríbenos a "));
        var a = doc.createElement("a"); a.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Revisión de mi diagnóstico de automatización"); a.textContent = EMAIL;
        err.appendChild(a); err.appendChild(doc.createTextNode("."));
      })
      .then(function () {
        estado.enviando = false;
        btn.removeAttribute("aria-busy"); btn.disabled = false;
        btn.firstChild.textContent = txtOriginal;
      });
  });

  /* =========================================================
     Acciones (delegación)
     ========================================================= */
  doc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-accion]"); if (!b) return;
    var a = b.getAttribute("data-accion");
    if (a === "comenzar") { e.preventDefault(); ir(estado.resultado ? "resultado" : "intro"); }
    else if (a === "empezar") { estado.q = Math.max(0, estado.respuestas.indexOf(null)); ir("pregunta"); }
    else if (a === "siguiente") siguiente();
    else if (a === "anterior") anterior();
    else if (a === "salir") { e.preventDefault(); estado.editando = false; ir("inicio"); }
    else if (a === "solicitar") ir("solicitud");
    else if (a === "ver-resultado") ir("resultado");
    else if (a === "revisar") {
      var rv = $("[data-review]"); rv.hidden = false;
      rv.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var h = $("#t-review"); setTimeout(function () { try { h.focus({ preventScroll: true }); } catch (x) {} }, reduce ? 0 : 400);
    }
  });

  /* =========================================================
     Portada: cabecera, aparición al hacer scroll y panel de flujo
     ========================================================= */
  var nav = $(".dg-nav");
  var onScroll = function () { nav.classList.toggle("is-scrolled", win.scrollY > 8); };
  win.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var rs = $$("[data-r]");
  if ("IntersectionObserver" in win && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rs.forEach(function (el) { io.observe(el); });
  } else rs.forEach(function (el) { el.classList.add("is-in"); });

  (function flujo() {
    var root = $("[data-flow]"); if (!root) return;
    var pasos = $$(".dg-fstep", root), links = $$(".dg-flink", root), toast = $("[data-flow-toast]");
    var stats = $$("[data-flow-stat]");
    var chip = { esp: "En espera", act: "Procesando", ok: "Completado" };
    var statVal = [["Registrada · 09:12"], ["Comercial asignado"], ["Llamar mañana · 10:00"]];
    function set(i) {
      pasos.forEach(function (p, k) {
        p.classList.toggle("is-done", k < i);
        p.classList.toggle("is-active", k === i);
        p.querySelector("[data-chip]").textContent = k < i ? chip.ok : k === i ? chip.act : chip.esp;
      });
      links.forEach(function (l, k) { l.classList.toggle("is-on", k < i); });
      stats.forEach(function (s, k) {
        var v = k < i ? statVal[k][0] : "—";
        if (s.textContent !== v) { s.textContent = v; s.classList.toggle("is-new", v !== "—"); }
      });
      toast.classList.toggle("is-in", i >= 4);
    }
    if (reduce) { set(4); return; }
    var i = 0, timer = null, visible = true;
    function tick() {
      if (i > 0 && i <= 3) { var l = links[i - 1]; l.classList.remove("is-run"); void l.offsetWidth; l.classList.add("is-run"); }
      set(i);
      var espera = i === 4 ? 3400 : 1500;
      i = i >= 4 ? 0 : i + 1;
      timer = setTimeout(function () { if (visible && !doc.hidden) tick(); else timer = null; }, espera);
    }
    function reanudar() { if (!timer && visible && !doc.hidden) tick(); }
    if ("IntersectionObserver" in win) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; reanudar(); }).observe(root);
    }
    doc.addEventListener("visibilitychange", reanudar);
    setTimeout(tick, 700);
  })();

  /* =========================================================
     Galería ampliada
     ========================================================= */
  (function galeria() {
    var dlg = $("[data-lightbox]"); if (!dlg || typeof dlg.showModal !== "function") return;
    var items = [
      { src: "/diagnostico/img/sistema-pipeline.jpg", w: 1536, h: 777, alt: "Pipeline comercial: solicitudes organizadas por fases con avisos de plazo", cap: "Pipeline comercial · sistema para una empresa de suministro industrial" },
      { src: "/diagnostico/img/sistema-panel.jpg", w: 1536, h: 767, alt: "Panel comercial diario con llamadas, objetivo semanal, agenda y siguientes llamadas", cap: "Panel comercial · actividad diaria del equipo" },
      { src: "/img/taxi25-acceso.jpg", w: 706, h: 1536, alt: "Pantalla de acceso de la aplicación de gestión", cap: "Touchy · pantalla de acceso" },
      { src: "/img/taxi25-administracion.jpg", w: 706, h: 1536, alt: "Pantalla de administración con facturación del día y resumen por conductor", cap: "Touchy · panel de administración (importes de ejemplo)" }
    ];
    var img = $("[data-lb-img]"), cap = $("[data-lb-cap]"), cnt = $("[data-lb-count]"), actual = 0, origen = null;
    function mostrar(i) {
      actual = (i + items.length) % items.length;
      var it = items[actual];
      img.src = it.src; img.alt = it.alt; img.width = it.w; img.height = it.h;
      cap.textContent = it.cap; cnt.textContent = (actual + 1) + " / " + items.length;
    }
    $$("[data-zoom]").forEach(function (b) {
      b.addEventListener("click", function () { origen = b; mostrar(+b.getAttribute("data-zoom")); dlg.showModal(); doc.body.style.overflow = "hidden"; });
    });
    dlg.addEventListener("click", function (e) {
      var a = e.target.closest("[data-lb]");
      if (a) { var t = a.getAttribute("data-lb"); if (t === "cerrar") dlg.close(); else mostrar(actual + (t === "next" ? 1 : -1)); return; }
      if (e.target === dlg || e.target.classList.contains("dg-lightbox__in")) dlg.close();
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") mostrar(actual + 1);
      if (e.key === "ArrowLeft") mostrar(actual - 1);
    });
    dlg.addEventListener("close", function () { doc.body.style.overflow = ""; if (origen) origen.focus(); });
  })();
})();
