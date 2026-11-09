/* =========================================================
   ENGRANA · Ajustes comunes de toda la web
   ========================================================= */

// 1) Tu correo de contacto. Cámbialo aquí y se actualiza en todas las páginas.
const EMAIL = "info@engrana-mallorca.com";

// 2) Texto que aparece ya escrito cuando alguien pulsa "Escribir un correo".
const ASUNTO = "Diagnóstico gratis para mi empresa";
const MENSAJE = "Hola, me dedico a: \nMi web o ficha de Google: \nMe gustaría mejorar: \n";

// 3) Google Analytics 4: pega aquí tu ID (empieza por G-). Vacío = desactivado.
const GA4_ID = "";

/* ---- A partir de aquí no hace falta tocar nada ---- */
(function () {
  "use strict";
  var d = document, w = window;
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = w.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var small = w.matchMedia("(max-width: 760px)").matches;

  // Analítica: GA4 (si hay ID) y eventos de conversión
  if (GA4_ID && w.gtag) gtag("config", GA4_ID);
  function track(name, params) { try { if (w.gtag) gtag("event", name, Object.assign({ page_path: location.pathname }, params || {})); } catch (e) {} }

  // Formulario de diagnóstico: servicio de origen y evento al enviar
  var form = d.querySelector('form[name="diagnostico"]');
  if (form) {
    var qs = new URLSearchParams(location.search);
    var srv = form.querySelector('[name="servicio"]'), org = form.querySelector('[name="pagina-origen"]');
    if (srv) srv.value = qs.get("servicio") || "";
    if (org) { try { org.value = d.referrer ? new URL(d.referrer).pathname : "directo"; } catch (e) { org.value = ""; } }
    form.addEventListener("submit", function () {
      track("generate_lead", { form_name: "diagnostico", servicio: srv ? srv.value : "", transport_type: "beacon" });
    });
  }

  // Correo, año y copiar
  var mailto = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(ASUNTO) + "&body=" + encodeURIComponent(MENSAJE);
  d.querySelectorAll("[data-email]").forEach(function (el) { el.textContent = EMAIL; if (el.tagName === "A") el.href = "mailto:" + EMAIL; });
  d.querySelectorAll("[data-mailto]").forEach(function (el) { el.href = mailto; });
  d.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="mailto:"]');
    if (a) track("contact_email_click", { transport_type: "beacon" });
  });
  d.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  d.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      track("contact_email_copy");
      var done = function (t) { btn.textContent = t; setTimeout(function () { btn.textContent = "Copiar"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(function () { done("Copiado"); }, function () { done("Selecciónalo"); });
      else done("Selecciónalo");
    });
  });

  // Menú del móvil
  var burger = d.querySelector(".burger"), menu = d.querySelector(".menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
      d.body.classList.toggle("menu-open", open);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") && menu.classList.contains("open")) {
        menu.classList.remove("open"); burger.setAttribute("aria-expanded", false); d.body.classList.remove("menu-open");
      }
    });
  }

  // Entrada de la primera pantalla
  requestAnimationFrame(function () { requestAnimationFrame(function () { d.documentElement.classList.add("is-ready"); }); });

  // Cabecera al hacer scroll + engranaje del logo que gira
  var header = d.querySelector(".site-header"), gears = d.querySelectorAll(".logo .gear");
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = w.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 30);
      header.classList.toggle("is-hidden", y > 500 && y > lastY && !d.body.classList.contains("menu-open"));
    }
    if (!reduce) gears.forEach(function (g) { g.style.setProperty("--spin", (y * 0.25) + "deg"); });
    parallax(y);
    lastY = y; ticking = false;
  }
  w.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // Profundidad suave (solo ordenador)
  var depth = (!reduce && !small) ? d.querySelectorAll("[data-depth]") : [];
  function parallax(y) {
    depth.forEach(function (el) {
      var k = parseFloat(el.getAttribute("data-depth")) || 0.1;
      el.style.transform = "translate3d(0," + (y * k).toFixed(1) + "px,0)";
    });
  }
  onScroll();

  // Aparición al desplazarse
  var reveal = d.querySelectorAll("[data-r],[data-mask]");
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else reveal.forEach(function (el) { el.classList.add("is-in"); });

  // Inclinación con el ratón
  if (fine && !reduce) {
    d.querySelectorAll("[data-tilt]").forEach(function (el) {
      var area = el.closest("[data-tilt-area]") || el;
      area.addEventListener("pointermove", function (e) {
        var r = area.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
      area.addEventListener("pointerleave", function () { el.style.setProperty("--mx", 0); el.style.setProperty("--my", 0); });
    });
  }

  // Ejecuta una animación solo mientras se ve
  function whenVisible(el, start, stop) {
    if (!("IntersectionObserver" in w)) { start(); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.25 }).observe(el);
  }

  // Demostración de automatización
  d.querySelectorAll("[data-flow]").forEach(function (flow) {
    var steps = flow.querySelectorAll(".flow-step"), bar = flow.querySelector(".flow-progress"), log = d.querySelector(flow.getAttribute("data-log"));
    var i = -1, t = null;
    function paint(n) {
      steps.forEach(function (s, k) {
        s.classList.toggle("is-done", k < n);
        s.classList.toggle("is-on", k === n);
        var st = s.querySelector(".st"); if (st) st.textContent = k < n ? "Completado" : (k === n ? "En curso" : "En espera");
      });
      if (bar && steps[n]) {
        var first = steps[0].offsetTop + 30, cur = steps[n].offsetTop + 30;
        bar.style.top = first + "px"; bar.style.height = Math.max(0, cur - first) + "px";
      }
      if (log && steps[n]) {
        var line = d.createElement("div");
        line.innerHTML = "<b>" + steps[n].querySelector("time").textContent + "</b> · " + steps[n].getAttribute("data-log-line");
        log.appendChild(line);
        while (log.children.length > 4) log.removeChild(log.firstChild);
      }
    }
    function tick() {
      i++;
      if (i >= steps.length) { i = -1; if (log) log.innerHTML = ""; steps.forEach(function (s) { s.classList.remove("is-on", "is-done"); }); if (bar) bar.style.height = 0; t = setTimeout(tick, 900); return; }
      paint(i); t = setTimeout(tick, i === steps.length - 1 ? 3400 : 1900);
    }
    if (reduce) { paint(steps.length - 1); return; }
    whenVisible(flow, function () { if (!t) tick(); }, function () { clearTimeout(t); t = null; });
  });

  // Demostración de IA (clasificar correos)
  d.querySelectorAll("[data-ai]").forEach(function (box) {
    var mails = box.querySelectorAll(".ai-mail"), reply = box.querySelector(".ai-reply"), i = 0, t = null;
    function reset() { mails.forEach(function (m) { m.classList.remove("is-done", "is-busy"); }); if (reply) reply.classList.remove("is-in"); i = 0; }
    function tick() {
      if (i < mails.length) {
        var m = mails[i]; m.classList.add("is-busy");
        t = setTimeout(function () { m.classList.remove("is-busy"); m.classList.add("is-done"); i++; t = setTimeout(tick, 500); }, 1100);
      } else if (reply && !reply.classList.contains("is-in")) { reply.classList.add("is-in"); t = setTimeout(tick, 4200); }
      else { reset(); t = setTimeout(tick, 700); }
    }
    if (reduce) { mails.forEach(function (m) { m.classList.add("is-done"); }); if (reply) reply.classList.add("is-in"); return; }
    whenVisible(box, function () { if (!t) tick(); }, function () { clearTimeout(t); t = null; });
  });

  // Móvil de Taxi 25: dos pantallas que se alternan
  d.querySelectorAll("[data-tx]").forEach(function (stage) {
    var shots = stage.querySelectorAll(".tx-shot"), tabs = stage.querySelectorAll("[data-go]");
    var TIME = 5500, cur = 0, timer = null;
    stage.style.setProperty("--tx-time", TIME / 1000 + "s");
    function show(n) {
      cur = n;
      shots.forEach(function (s, k) { s.classList.toggle("is-on", k === n); });
      tabs.forEach(function (b, k) { b.classList.remove("is-on"); b.setAttribute("aria-selected", k === n); if (k === n) { void b.offsetWidth; b.classList.add("is-on"); } });
    }
    function play() { clearInterval(timer); if (!reduce) timer = setInterval(function () { show((cur + 1) % shots.length); }, TIME); }
    tabs.forEach(function (b) { b.addEventListener("click", function () { show(+b.getAttribute("data-go")); play(); }); });
    whenVisible(stage, function () { stage.classList.remove("is-paused"); play(); }, function () { stage.classList.add("is-paused"); clearInterval(timer); });
  });

  // Aviso de cookies (necesario para la etiqueta de Google Ads)
  (function () {
    var elegido = null;
    try { elegido = localStorage.getItem("cookies-engrana"); } catch (e) {}
    if (elegido) return;
    var aviso = d.createElement("div");
    aviso.className = "cookies";
    aviso.setAttribute("role", "dialog");
    aviso.setAttribute("aria-label", "Aviso de cookies");
    aviso.innerHTML = '<p>Usamos cookies de Google para saber qué anuncios funcionan. ¿Nos dejas?</p>' +
      '<div><button type="button" data-c="no">Rechazar</button><button type="button" data-c="si">Aceptar</button></div>';
    d.body.appendChild(aviso);
    aviso.addEventListener("click", function (e) {
      var c = e.target.getAttribute("data-c");
      if (!c) return;
      try { localStorage.setItem("cookies-engrana", c); } catch (err) {}
      if (c === "si" && w.gtag) gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
      aviso.remove();
    });
  })();
})();
