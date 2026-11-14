/* =========================================================
   ENGRANA · Ajustes comunes de toda la web
   ========================================================= */

// 1) Tu correo de contacto. Cámbialo aquí y se actualiza en todas las páginas.
const EMAIL = "info@engrana-mallorca.com";

// 2) Texto que aparece ya escrito cuando alguien pulsa "Escribir un correo".
const ASUNTO = "Valoración para mi empresa";
const MENSAJE = "Hola, me dedico a: \nCómo trabajamos hoy: \nMe gustaría mejorar: \n";

// 3) Google Analytics 4: pega aquí tu ID (empieza por G-). Vacío = desactivado.
const GA4_ID = "";

/* ---- A partir de aquí no hace falta tocar nada ---- */
(function () {
  "use strict";
  var d = document, w = window, root = d.documentElement;
  root.classList.add("js");
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = w.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var small = w.matchMedia("(max-width: 980px)");

  // Analítica: GA4 (si hay ID) y eventos de conversión
  if (GA4_ID && w.gtag) gtag("config", GA4_ID);
  function track(name, params) { try { if (w.gtag) gtag("event", name, Object.assign({ page_path: location.pathname }, params || {})); } catch (e) {} }

  // Correo, año y copiar
  var mailto = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(ASUNTO) + "&body=" + encodeURIComponent(MENSAJE);
  d.querySelectorAll("[data-email]").forEach(function (el) { el.textContent = EMAIL; if (el.tagName === "A") el.href = "mailto:" + EMAIL; });
  d.querySelectorAll("[data-mailto]").forEach(function (el) { el.href = mailto; });
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
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

  // Menú: submenús accesibles (clic, teclado y Escape) y panel en el móvil
  var burger = d.querySelector(".burger"), menu = d.querySelector(".menu");
  var subs = d.querySelectorAll(".menu > li.has-sub");
  function closeSubs(except) {
    subs.forEach(function (li) { if (li !== except) { li.classList.remove("is-open"); var b = li.querySelector("button"); if (b) b.setAttribute("aria-expanded", "false"); } });
  }
  subs.forEach(function (li) {
    var b = li.querySelector("button"), t = null;
    b.addEventListener("click", function () {
      var open = !li.classList.contains("is-open");
      closeSubs(li); li.classList.toggle("is-open", open); b.setAttribute("aria-expanded", open);
    });
    if (fine) {
      li.addEventListener("pointerenter", function () { if (small.matches) return; clearTimeout(t); closeSubs(li); li.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); });
      li.addEventListener("pointerleave", function () { if (small.matches) return; t = setTimeout(function () { li.classList.remove("is-open"); b.setAttribute("aria-expanded", "false"); }, 160); });
    }
    li.addEventListener("focusout", function (e) { if (!small.matches && !li.contains(e.relatedTarget)) { li.classList.remove("is-open"); b.setAttribute("aria-expanded", "false"); } });
  });
  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    d.body.classList.toggle("menu-open", open);
    if (!open) closeSubs();
  }
  if (burger && menu) {
    menu.querySelectorAll(":scope > li").forEach(function (li, i) { li.style.setProperty("--i", i); });
    burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a") && menu.classList.contains("open")) setMenu(false); });
  }
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSubs(); if (menu && menu.classList.contains("open")) { setMenu(false); burger.focus(); } } });
  d.addEventListener("click", function (e) { if (!e.target.closest(".menu")) closeSubs(); });

  // Entrada de la primera pantalla
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-ready"); }); });

  // Cabecera al hacer scroll + engranajes que avanzan diente a diente (30°)
  var header = d.querySelector(".site-header"), gears = d.querySelectorAll(".logo .gear, .cta-gear .g");
  var depth = (!reduce && fine) ? d.querySelectorAll("[data-depth]") : [];
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = w.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      header.classList.toggle("is-hidden", y > 520 && y > lastY + 4 && !d.body.classList.contains("menu-open") && !d.querySelector(".menu li.is-open"));
      if (y < lastY - 4) header.classList.remove("is-hidden");
    }
    if (!reduce) {
      var notch = Math.round(y / 160) * 30;
      gears.forEach(function (g) { g.style.setProperty("--spin", notch + "deg"); });
      depth.forEach(function (el) {
        var r = el.getBoundingClientRect(), k = parseFloat(el.getAttribute("data-depth")) || 0.08;
        el.style.transform = "translate3d(0," + ((r.top + r.height / 2 - w.innerHeight / 2) * -k).toFixed(1) + "px,0)";
      });
    }
    lastY = y; ticking = false;
  }
  w.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Aparición al desplazarse
  var reveal = d.querySelectorAll("[data-r],.reveal-img");
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else reveal.forEach(function (el) { el.classList.add("is-in"); });

  // Método: el engranaje gira un diente por cada paso que se lee
  d.querySelectorAll("[data-method]").forEach(function (m) {
    var steps = m.querySelectorAll(".steps li"), gear = m.querySelector(".method-gear");
    if (reduce || !("IntersectionObserver" in w)) { m.querySelector(".steps").classList.add("is-static"); return; }
    var mo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = Array.prototype.indexOf.call(steps, e.target);
        steps.forEach(function (s, k) { s.classList.toggle("is-active", k <= n); });
        if (gear) gear.style.setProperty("--turn", (n + 1) * 60 + "deg");
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(function (s) { mo.observe(s); });
  });

  // Inclinación suave con el ratón (solo ordenador)
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

  // Demostración de una solicitud que avanza (datos de ejemplo)
  d.querySelectorAll("[data-flow]").forEach(function (flow) {
    var steps = flow.querySelectorAll(".flow-step"), bar = flow.querySelector(".flow-progress");
    var i = -1, t = null;
    function paint(n) {
      steps.forEach(function (s, k) {
        s.classList.toggle("is-done", k < n);
        s.classList.toggle("is-on", k === n);
        var st = s.querySelector(".st"); if (st) st.textContent = k < n ? "Hecho" : (k === n ? "En curso" : "En espera");
      });
      if (bar && steps[n]) bar.style.height = (steps[n].offsetTop + 12) + "px";
    }
    function tick() {
      i++;
      if (i >= steps.length) { i = -1; steps.forEach(function (s) { s.classList.remove("is-on", "is-done"); var st = s.querySelector(".st"); if (st) st.textContent = "En espera"; }); if (bar) bar.style.height = 0; t = setTimeout(tick, 900); return; }
      paint(i); t = setTimeout(tick, i === steps.length - 1 ? 3400 : 1900);
    }
    if (reduce) { paint(steps.length - 1); return; }
    whenVisible(flow, function () { if (!t) tick(); }, function () { clearTimeout(t); t = null; });
  });

  // Formularios: validación clara antes de enviar, origen del contacto y evento de conversión
  d.querySelectorAll("form[data-netlify]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    var qs = new URLSearchParams(location.search);
    var srv = form.querySelector('[name="servicio"]'), org = form.querySelector('[name="pagina-origen"]');
    if (srv) srv.value = qs.get("servicio") || "";
    if (org) { try { org.value = d.referrer ? new URL(d.referrer).pathname : "directo"; } catch (e) { org.value = ""; } }
    var msgs = { valueMissing: "Este campo es necesario.", typeMismatch: "Revisa el formato (por ejemplo, nombre@empresa.com).", tooShort: "Cuéntanos un poco más, por favor." };
    function check(f) {
      var old = f.parentNode.querySelector(".err"); if (old) old.remove();
      f.classList.remove("is-invalid"); f.removeAttribute("aria-invalid");
      if (f.validity.valid) return true;
      var key = Object.keys(msgs).filter(function (k) { return f.validity[k]; })[0];
      var e = d.createElement("span"); e.className = "err"; e.id = (f.id || f.name) + "-err"; e.textContent = msgs[key] || "Revisa este campo.";
      f.classList.add("is-invalid"); f.setAttribute("aria-invalid", "true"); f.setAttribute("aria-describedby", e.id);
      (f.type === "checkbox" ? f.closest("label") : f).insertAdjacentElement("afterend", e);
      return false;
    }
    form.querySelectorAll("input,select,textarea").forEach(function (f) {
      if (f.type === "hidden" || f.closest(".hp")) return;
      f.addEventListener("blur", function () { if (f.value || f.classList.contains("is-invalid")) check(f); });
      f.addEventListener("input", function () { if (f.classList.contains("is-invalid")) check(f); });
    });
    form.addEventListener("submit", function (ev) {
      var bad = null;
      form.querySelectorAll("input,select,textarea").forEach(function (f) { if (f.type === "hidden" || f.closest(".hp")) return; if (!check(f) && !bad) bad = f; });
      if (bad) { ev.preventDefault(); bad.focus(); return; }
      var b = form.querySelector('[type="submit"]'); if (b) b.setAttribute("aria-busy", "true");
      track("generate_lead", { form_name: form.getAttribute("name"), servicio: srv ? srv.value : "", transport_type: "beacon" });
    });
  });

  // Aviso de cookies (necesario para la etiqueta de Google Ads)
  (function () {
    var elegido = null;
    try { elegido = localStorage.getItem("cookies-engrana"); } catch (e) {}
    if (elegido) return;
    var aviso = d.createElement("div");
    aviso.className = "cookies";
    aviso.setAttribute("role", "region");
    aviso.setAttribute("aria-label", "Aviso de cookies");
    aviso.innerHTML = '<p>Usamos cookies de Google para medir qué anuncios funcionan. Solo se activan si las aceptas.</p>' +
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
