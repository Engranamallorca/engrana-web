/* Taxi 25 Muro · móvil 3D con dos pantallas (sin librerías) */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Aparición al hacer scroll
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add("is-in"); });

  var stage = document.querySelector("[data-tx-stage]");
  if (!stage) return;
  var shots = stage.querySelectorAll(".tx-shot");
  var tabs = stage.querySelectorAll("[data-go]");
  var tilt = stage.querySelector("[data-tx-tilt]");
  var TIME = 5500, cur = 0, timer = null;

  function show(i) {
    cur = i;
    shots.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
    tabs.forEach(function (t, k) {
      t.classList.remove("is-on"); t.setAttribute("aria-selected", k === i);
      if (k === i) { void t.offsetWidth; t.classList.add("is-on"); }
    });
  }
  function play() { stop(); if (!reduce) timer = setInterval(function () { show((cur + 1) % shots.length); }, TIME); }
  function stop() { clearInterval(timer); }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { show(+t.dataset.go); play(); });
  });
  stage.style.setProperty("--tx-time", TIME / 1000 + "s");

  // Pausa cuando no se ve
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? (stage.classList.remove("is-paused"), play()) : (stage.classList.add("is-paused"), stop()); });
    }).observe(stage);
  } else play();

  // Inclinación con el ratón (solo ordenador)
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches && tilt) {
    var hero = stage.closest(".tx-hero");
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.setProperty("--ry", (-16 + x * 14).toFixed(2) + "deg");
      tilt.style.setProperty("--rx", (6 - y * 10).toFixed(2) + "deg");
    });
    hero.addEventListener("pointerleave", function () { tilt.style.removeProperty("--ry"); tilt.style.removeProperty("--rx"); });
  }
})();
