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
  var small = w.matchMedia("(max-width: 60rem)");

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

  // Menú: submenús por clic, teclado y Escape; panel plegable en el móvil
  var burger = d.querySelector(".burger"), nav = d.querySelector(".mast-nav");
  var subs = d.querySelectorAll(".menu > li.has-sub");
  function closeSubs(except) {
    subs.forEach(function (li) { if (li !== except) { li.classList.remove("is-open"); var b = li.querySelector("button"); if (b) b.setAttribute("aria-expanded", "false"); } });
  }
  subs.forEach(function (li) {
    var b = li.querySelector("button");
    b.addEventListener("click", function () {
      var open = !li.classList.contains("is-open");
      closeSubs(li); li.classList.toggle("is-open", open); b.setAttribute("aria-expanded", open);
    });
    li.addEventListener("focusout", function (e) { if (!small.matches && !li.contains(e.relatedTarget)) { li.classList.remove("is-open"); b.setAttribute("aria-expanded", "false"); } });
  });
  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.textContent = open ? "Cerrar" : "Menú";
    if (!open) closeSubs();
  }
  if (burger && nav) burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSubs(); if (nav && nav.classList.contains("open")) { setMenu(false); burger.focus(); } } });
  d.addEventListener("click", function (e) { if (!e.target.closest(".menu")) closeSubs(); });

  // El engranaje del logotipo avanza un diente (30°) cada cierto recorrido
  var gears = d.querySelectorAll(".logo .gear"), ticking = false;
  if (!reduce && gears.length) {
    w.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { var n = Math.round(w.scrollY / 220) * 30; gears.forEach(function (g) { g.style.setProperty("--spin", n + "deg"); }); ticking = false; });
    }, { passive: true });
  }

  // Una aparición al desplazarse; el contenido es visible sin script
  var reveal = d.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    reveal.forEach(function (el) { io.observe(el); });
  } else reveal.forEach(function (el) { el.classList.add("is-in"); });

  // Formularios: validación clara antes de enviar, origen del contacto y evento de conversión
  d.querySelectorAll("form[data-netlify]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    var qs = new URLSearchParams(location.search);
    var srv = form.querySelector('[name="servicio"]'), org = form.querySelector('[name="pagina-origen"]');
    if (srv) srv.value = qs.get("servicio") || "";
    if (org) { try { org.value = d.referrer ? new URL(d.referrer).pathname : "directo"; } catch (e) { org.value = ""; } }
    var msgs = { valueMissing: "Este campo es necesario.", typeMismatch: "Revisa el formato, por ejemplo nombre@empresa.com.", tooShort: "Cuéntanos un poco más, por favor.", patternMismatch: "Revisa el número." };
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
      '<div><button class="btn btn--quiet" type="button" data-c="no">Rechazar</button><button class="btn" type="button" data-c="si">Aceptar</button></div>';
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
