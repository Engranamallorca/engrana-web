# Design: Engrana

El sistema bloqueado de la web. Toda página nueva lo lee primero y las páginas lo comparten. Cambiarlo es una decisión; este archivo es la regla.

## Sistema
- Genre: modern-minimal
- Shape of the first page: Conversational FAQ (la portada es una entrevista: cada sección es una pregunta con su respuesta y su prueba)
- Theme: brand (marca de Engrana en tonos claros, con el blanco como papel)
- Axes: light/grotesk-sans/chromatic-gold · posture: full palette (papel blanco, campo salvia, verde de marca, señal dorada)

## Tokens
`tokens.css` es la fuente de verdad. Los papeles:
```css
:root {
  --color-paper: oklch(99.2% 0.004 120);  --color-paper-2: oklch(97% 0.011 96);  --color-paper-3: oklch(94.5% 0.016 94);
  --color-ink: oklch(28% 0.035 172);  --color-ink-2: oklch(40% 0.03 172);  --color-muted: oklch(52% 0.02 170);  --color-rule: oklch(88% 0.015 150);
  --color-accent: oklch(84% 0.13 82);  --color-accent-ink: oklch(28% 0.035 172);  --color-accent-text: oklch(55% 0.11 76);  --color-focus: oklch(50% 0.12 72);
  --color-brand: oklch(48% 0.085 172);  --color-brand-2: oklch(42% 0.08 172);  --color-on-brand: oklch(99.2% 0.004 120);
  --color-field: oklch(95.5% 0.022 166);  --color-field-2: oklch(91.5% 0.032 168);  --color-field-rule: oklch(84% 0.03 168);
  --font-display: "Bricolage Grotesque";  --font-body: "Instrument Sans";
  --radius-card: 6px;  --radius-input: 6px;  --rule-hair: 1px;  --shadow-card: 0 1px 2px var(--color-shadow);
}
```
La escala de espacios, la de texto, las curvas y las duraciones son las del andamiaje y viven en `tokens.css`. `base.css` fija lo que el suelo ya decidió.

## Superficies
- Papel blanco por defecto; `band--cream` (papel cálido) y `band` (salvia) para alternar secciones; `band--deep` y el pie en salvia más intensa.
- Sin fondos oscuros: el verde de marca solo rellena el botón principal y el centro del esquema de pedidos.
- Capturas reales en `.shot` (radio 6px, contorno interior al 10 %), nunca dentro de un navegador o un móvil dibujados.

## Controles
- Principal: relleno verde de marca · texto blanco · radio 6px · 48px de alto · uno por pantalla
- Secundario: `.btn--quiet` (papel con filete salvia) o `.link` (texto subrayado en dorado) · mismo alto

## Tipografía
- Titulares en Bricolage Grotesque 600 (la familia del logotipo); texto en Instrument Sans 400 y 600. Nada de monoespaciada.
- Sin etiquetas sobre los titulares, sin mayúsculas espaciadas, sin cadenas con puntos medios y sin una segunda mitad del titular en otro color.

## Movimiento
- Carácter: tranquilo. Una sola aparición por página (`data-reveal`) y el engranaje del logotipo que avanza un diente al desplazarse. Con movimiento reducido todo aparece al instante; sin JavaScript todo es visible.

## Exports
`tokens.css` en este proyecto. Los bloques de Tailwind, DTCG o shadcn se añaden aquí si se piden.
