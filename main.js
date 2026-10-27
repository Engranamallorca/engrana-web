/* =========================================================
   ENGRANA · Ajustes comunes de toda la web
   ========================================================= */

// 1) Tu correo de contacto. Cámbialo aquí y se actualiza en todas las páginas.
const EMAIL = "info@engrana-mallorca.com";

// 2) Texto que aparece ya escrito cuando alguien pulsa "Escribir un correo".
const ASUNTO = "Diagnóstico gratis para mi negocio";
const MENSAJE = "Hola, me dedico a: \nMi web o ficha de Google: \nMe gustaría mejorar: \n";

/* ---- A partir de aquí no hace falta tocar nada ---- */
const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(ASUNTO)}&body=${encodeURIComponent(MENSAJE)}`;
document.querySelectorAll("[data-email]").forEach(el => el.textContent = EMAIL);
document.querySelectorAll("[data-mailto]").forEach(el => el.href = mailto);
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

document.querySelectorAll("[data-copy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(EMAIL); btn.textContent = "Copiado"; }
    catch { btn.textContent = "Selecciónalo y cópialo"; }
    setTimeout(() => btn.textContent = "Copiar", 2000);
  });
});

// Menú en el móvil
const burger = document.querySelector(".burger");
const menu = document.querySelector(".menu");
if (burger && menu) {
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
}
