"""ENGRANA | LO QUE ESTÁ CAMBIANDO — Ep. 01 — motor de composición.

Uso: python3 render.py v|h [--from T] [--to T] [--out FILE] [--layer FILE] [--nosubs] [--stills t1,t2]
  v = vertical 1080x1920, h = horizontal 1920x1080
Compone: metraje (Ken Burns + etalonaje + viñeta) · motion graphics vectoriales (Skia) ·
rótulos · subtítulos · grano. Escribe vídeo sin audio (el audio lo mezcla mix_audio.py).
--layer escribe además la capa de grafismo con alfa (QuickTime Animation) para Premiere.
"""
import sys, os, math, subprocess, argparse
import numpy as np, cv2, skia
sys.path.insert(0, os.path.dirname(__file__))
from timeline import *

ap = argparse.ArgumentParser()
ap.add_argument('fmt')
ap.add_argument('--from', dest='t_from', type=float, default=0.0)
ap.add_argument('--to', dest='t_to', type=float, default=DURATION)
ap.add_argument('--out')
ap.add_argument('--layer')
ap.add_argument('--nosubs', action='store_true')
ap.add_argument('--layeronly', action='store_true')
ap.add_argument('--stills')
A = ap.parse_args()

V = A.fmt == 'v'
W, H = (1080, 1920) if V else (1920, 1080)
FONTS = os.path.join(ROOT, 'MOTION_GRAPHICS', 'fuentes')
MG = os.path.join(ROOT, 'MOTION_GRAPHICS')

# ---------------------------------------------------------------- paleta Engrana
DEEP = (8, 40, 32)      # #082820
GREEN = (16, 61, 51)    # #103D33
GOLD = (229, 165, 47)   # #E5A52F
CREAM = (245, 243, 236)  # #F5F3EC
INK = (6, 22, 18)


def C(rgb, a=1.0):
    return skia.Color4f(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, max(0.0, min(1.0, a)))


def CI(rgb, a=1.0):
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), *rgb)


def P(rgb, a=1.0, stroke=None, cap=None):
    p = skia.Paint(AntiAlias=True)
    p.setColor4f(C(rgb, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(cap or skia.Paint.kRound_Cap)
    return p


_tf = {}


def F(name, size):
    if name not in _tf:
        _tf[name] = skia.Typeface.MakeFromFile(os.path.join(FONTS, name))
    f = skia.Font(_tf[name], size)
    f.setSubpixel(True)
    f.setEdging(skia.Font.Edging.kAntiAlias)
    return f


def HEAD(s): return F('BricolageGrotesque-Bold.ttf', s)
def SEMI(s): return F('Inter-SemiBold.otf', s)
def MED(s): return F('Inter-Medium.otf', s)
def REG(s): return F('Inter-Regular.otf', s)
def BOLD(s): return F('Inter-Bold.otf', s)


def clamp(x, a=0.0, b=1.0): return a if x < a else b if x > b else x
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def prog(t, t0, d): return clamp((t - t0) / d) if d > 0 else float(t >= t0)


def vis(t, tin, tout, din=0.55, dout=0.4):
    """alpha de aparición/desaparición y progreso de entrada (para desplazamientos)."""
    if t < tin or t > tout + dout:
        return 0.0, 0.0
    pin = eo(prog(t, tin, din))
    pout = 1 - eio(prog(t, tout, dout))
    return pin * pout, pin


def tw(font, s, tracking=0.0):
    return font.measureText(s) + tracking * max(0, len(s) - 1)


def text(c, s, x, y, font, rgb=CREAM, a=1.0, align='l', tracking=0.0, shadow=0):
    if a <= 0.003 or not s:
        return
    w = tw(font, s, tracking)
    if align == 'c': x -= w / 2
    elif align == 'r': x -= w
    p = P(rgb, a)
    if shadow:
        p.setImageFilter(skia.ImageFilters.DropShadow(0, shadow * .35, shadow, shadow, CI((0, 0, 0), .55 * a)))
    if tracking == 0:
        c.drawString(s, x, y, font, p)
    else:
        for ch in s:
            c.drawString(ch, x, y, font, p)
            x += font.measureText(ch) + tracking


def kicker(c, s, x, y, a=1.0, size=None, rgb=GOLD, rule=True, align='l', shadow=0):
    size = size or (25 if V else 21)
    f = SEMI(size)
    tr = size * 0.16
    if rule and align == 'l':
        pl = P(rgb, a, stroke=2.2)
        if shadow:
            pl.setImageFilter(skia.ImageFilters.DropShadow(0, 1, 6, 6, CI((0, 0, 0), .6 * a)))
        c.drawLine(x, y - size * .36, x + size * 1.3, y - size * .36, pl)
        x += size * 1.9
    text(c, s, x, y, f, rgb, a, align=align, tracking=tr, shadow=shadow)


def rrect(c, x, y, w, h, r, fill=None, fa=1.0, stroke=None, sa=1.0, sw=1.5):
    rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)
    if fill is not None and fa > 0:
        c.drawRRect(rr, P(fill, fa))
    if stroke is not None and sa > 0:
        c.drawRRect(rr, P(stroke, sa, stroke=sw))


def wrap(font, s, maxw):
    words, lines, cur = s.split(' '), [], ''
    for w_ in words:
        cand = (cur + ' ' + w_).strip()
        if font.measureText(cand) <= maxw or not cur:
            cur = cand
        else:
            lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines


def load_img(path):
    return skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(path))


GEAR = load_img(os.path.join(MG, 'logo_engranaje.png'))
WORD = load_img(os.path.join(MG, 'logo_wordmark.png'))
SAMP = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)


def draw_img(c, img, x, y, w, h, a=1.0):
    p = skia.Paint(AntiAlias=True); p.setAlphaf(clamp(a))
    c.drawImageRect(img, skia.Rect.MakeXYWH(x, y, w, h), SAMP, p)


def gear(c, cx, cy, size, rot=0.0, a=1.0):
    c.save(); c.translate(cx, cy); c.rotate(rot)
    draw_img(c, GEAR, -size / 2, -size / 2, size, size, a)
    c.restore()


# ---------------------------------------------------------------- iconos vectoriales
def ic_check(c, cx, cy, s, rgb=GOLD, a=1.0, p=1.0, sw=None):
    pts = [(cx - s * .42, cy + s * .02), (cx - s * .12, cy + s * .32), (cx + s * .45, cy - s * .32)]
    l1 = math.dist(pts[0], pts[1]); l2 = math.dist(pts[1], pts[2]); L = (l1 + l2) * clamp(p)
    pa = P(rgb, a, stroke=sw or s * .16)
    if L <= 0: return
    if L <= l1:
        k = L / l1; c.drawLine(*pts[0], pts[0][0] + (pts[1][0] - pts[0][0]) * k, pts[0][1] + (pts[1][1] - pts[0][1]) * k, pa)
    else:
        c.drawLine(*pts[0], *pts[1], pa); k = (L - l1) / l2
        c.drawLine(*pts[1], pts[1][0] + (pts[2][0] - pts[1][0]) * k, pts[1][1] + (pts[2][1] - pts[1][1]) * k, pa)


def ic_mail(c, x, y, s, rgb=CREAM, a=1.0):
    w, h = s, s * .72
    rrect(c, x, y, w, h, s * .1, stroke=rgb, sa=a, sw=s * .075)
    pa = P(rgb, a, stroke=s * .075)
    c.drawLine(x + s * .08, y + s * .1, x + w / 2, y + h * .58, pa)
    c.drawLine(x + w - s * .08, y + s * .1, x + w / 2, y + h * .58, pa)


def ic_person(c, cx, cy, s, rgb=CREAM, a=1.0):
    c.drawCircle(cx, cy - s * .2, s * .19, P(rgb, a, stroke=s * .08))
    path = skia.Path(); path.addArc(skia.Rect.MakeXYWH(cx - s * .36, cy + s * .08, s * .72, s * .6), 180, 180)
    c.drawPath(path, P(rgb, a, stroke=s * .08))


def dot(c, cx, cy, r, rgb=GOLD, a=1.0, glow=0.0):
    if glow > 0:
        p = skia.Paint(AntiAlias=True)
        p.setShader(skia.GradientShader.MakeRadial((cx, cy), r * 4, [CI(rgb, .45 * glow * a), CI(rgb, 0)]))
        c.drawCircle(cx, cy, r * 4, p)
    c.drawCircle(cx, cy, r, P(rgb, a))


# ---------------------------------------------------------------- fondo de grafismo
def make_bg():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * .5, H * .42
    d = np.sqrt(((xx - cx) / W) ** 2 + ((yy - cy) / H) ** 2) * 1.6
    k = np.clip(d, 0, 1)[..., None]
    col = (np.array(GREEN, np.float32) * (1 - k) * 0.92 + np.array(DEEP, np.float32) * k * 0.95 + np.array(INK, np.float32) * k * 0.05)
    img = np.dstack([col, np.full((H, W, 1), 255, np.float32)]).astype(np.uint8)
    # retícula de puntos muy sutil
    step = 54
    for y in range(step // 2, H, step):
        for x in range(step // 2, W, step):
            cv2.circle(img, (x, y), 1, (60, 96, 86, 255), -1, cv2.LINE_AA)
    return skia.Image.fromarray(np.ascontiguousarray(img))


BG = make_bg()


def gfx_bg(c, t, a=1.0):
    p = skia.Paint(); p.setAlphaf(a)
    c.drawImage(BG, 0, 0, SAMP, p)
    # luz dorada muy tenue que deriva lentamente
    gx = W * (.5 + .22 * math.sin(t * .23)); gy = H * (.3 + .1 * math.cos(t * .17))
    g = skia.Paint(AntiAlias=True)
    g.setShader(skia.GradientShader.MakeRadial((gx, gy), max(W, H) * .55, [CI(GOLD, .055 * a), CI(GOLD, 0)]))
    c.drawRect(skia.Rect.MakeWH(W, H), g)


# ================================================================ ESCENAS DE GRAFISMO
def sc_intro(c, t, tl, seg):
    gfx_bg(c, t)
    cx, cy = W / 2, H / 2 - (40 if V else 20)
    a = eo(prog(t, .15, .6))
    rot = -30 * (1 - eio(prog(t, .25, 1.1)))          # el engranaje avanza un diente (12 dientes = 30º)
    sz = 120 if V else 104
    gear(c, cx, cy - sz * .62, sz, rot, a)
    a2 = eo(prog(t, .75, .6))
    kicker(c, 'LO QUE ESTÁ CAMBIANDO', cx, cy + sz * .55, a2, size=26 if V else 22, rule=False, align='c')
    text(c, 'Episodio 01', cx, cy + sz * .55 + (48 if V else 40), MED(24 if V else 20), CREAM, a2 * .6, align='c')


def sc_responder_ejecutar(c, t, tl, seg):
    gfx_bg(c, t)
    t0 = seg['t0']
    ka, _ = vis(t, t0 + .2, 999)
    if V:
        kx, ky = 110, 330
        A1 = (110, 410, 860, 330); A2 = (110, 860, 860, 470)
    else:
        kx, ky = 150, 190
        A1 = (150, 300, 700, 430); A2 = (1070, 300, 700, 430)
    kicker(c, 'EL CAMBIO', kx, ky, ka)
    # tarjeta 1: responde
    a1, p1 = vis(t, t0 + .35, 999)
    swap = eo(prog(t, N(21.9), .6))
    x, y, w, h = A1
    y += (1 - p1) * 30
    rrect(c, x, y, w, h, 18, fill=DEEP, fa=.85 * a1, stroke=CREAM, sa=.14 * a1 * (1 - swap * .5))
    text(c, 'Responde', x + 40, y + 70, HEAD(46 if V else 44), CREAM, a1 * (1 - .45 * swap))
    text(c, 'Le haces una pregunta. Te devuelve un texto.', x + 40, y + 112, REG(26 if V else 23), CREAM, a1 * .62 * (1 - .4 * swap))
    # burbujas de conversación
    by = y + (160 if V else 170)
    bw = w - 80
    rrect(c, x + 40 + bw * .3, by, bw * .7, 58, 29, fill=CREAM, fa=.9 * a1 * (1 - .4 * swap))
    text(c, '¿Me resumes este documento?', x + 40 + bw * .3 + 26, by + 38, MED(23 if V else 21), DEEP, a1 * (1 - .4 * swap))
    ty = by + 80
    rrect(c, x + 40, ty, bw * .78, (90 if V else 100), 18, fill=GREEN, fa=.9 * a1 * (1 - .4 * swap), stroke=CREAM, sa=.1 * a1)
    for i, lw in enumerate([.66, .58, .4] if not V else [.66, .5]):
        rrect(c, x + 66, ty + 26 + i * 26, bw * lw, 9, 4.5, fill=CREAM, fa=.35 * a1 * (1 - .4 * swap))
    # flecha
    ar_a = eo(prog(t, N(21.9), .5))
    if V:
        ax, ay0, ay1 = W / 2, A1[1] + A1[3] + 22, A2[1] - 22
        c.drawLine(ax, ay0, ax, ay0 + (ay1 - ay0) * ar_a, P(GOLD, ar_a, stroke=3))
        if ar_a > .95:
            c.drawLine(ax, ay1, ax - 14, ay1 - 16, P(GOLD, 1, stroke=3)); c.drawLine(ax, ay1, ax + 14, ay1 - 16, P(GOLD, 1, stroke=3))
    else:
        ay, ax0, ax1 = A1[1] + A1[3] / 2, A1[0] + A1[2] + 30, A2[0] - 30
        c.drawLine(ax0, ay, ax0 + (ax1 - ax0) * ar_a, ay, P(GOLD, ar_a, stroke=3))
        if ar_a > .95:
            c.drawLine(ax1, ay, ax1 - 16, ay - 14, P(GOLD, 1, stroke=3)); c.drawLine(ax1, ay, ax1 - 16, ay + 14, P(GOLD, 1, stroke=3))
    # tarjeta 2: ejecuta
    a2, p2 = vis(t, N(22.1), 999)
    x, y, w, h = A2
    y += (1 - p2) * 30
    rrect(c, x, y, w, h, 18, fill=DEEP, fa=.9 * a2, stroke=GOLD, sa=.75 * a2, sw=2)
    text(c, 'Ejecuta', x + 40, y + 70, HEAD(46 if V else 44), GOLD, a2)
    text(c, 'Le encargas una tarea. Usa herramientas.', x + 40, y + 112, REG(26 if V else 23), CREAM, a2 * .7)
    tasks = ['Lee el correo del cliente', 'Consulta el stock disponible', 'Registra la solicitud', 'Prepara una tarea']
    for i, s in enumerate(tasks):
        ti = N(22.55) + i * .42
        ai, pi = vis(t, ti, 999, .4)
        yy = y + (170 if V else 175) + i * (68 if V else 62)
        c.drawCircle(x + 62, yy - 9, 17, P(GOLD, .9 * ai, stroke=2))
        ic_check(c, x + 62, yy - 9, 22, GOLD, ai, eo(prog(t, ti + .2, .35)), sw=3)
        text(c, s, x + 100 + (1 - pi) * 12, yy, MED(28 if V else 25), CREAM, ai)


AG_NODES = [
    ('CORREO RECIBIDO', 'Un cliente solicita un presupuesto', 50.15),
    ('ANÁLISIS DE IA', 'Detecta la intención: petición de presupuesto', N(52.06)),
    ('IDENTIFICACIÓN DEL CLIENTE', 'Cliente existente · ficha localizada', N(53.75)),
    ('CONSULTA DE INFORMACIÓN', 'Stock, tarifas y plazos en otros sistemas', N(58.22)),
    ('REGISTRO EN CRM', 'Solicitud registrada con todos los datos', N(63.97)),
    ('TAREA PARA EL COMERCIAL', 'Revisar y enviar el presupuesto', N(66.73)),
    ('APROBACIÓN HUMANA', 'Pendiente de revisión', N(67.9)),
]


def sc_agente(c, t, tl, seg):
    gfx_bg(c, t)
    t0 = seg['t0']
    ka, kp = vis(t, t0 + .25, 999)
    if V:
        hx, hy = 110, 300
        nx, ny0, nw, nh, gap = 110, 470, 860, 104, 127
    else:
        hx, hy = 140, 150
        nx, ny0, nw, nh, gap = 140, 268, 860, 80, 98
    kicker(c, 'AGENTE DE INTELIGENCIA ARTIFICIAL', hx, hy, ka)
    text(c, 'Así podría trabajar un agente', hx, hy + (72 if V else 62), HEAD(58 if V else 50), CREAM, ka)
    text(c, 'Ejemplo ilustrativo · empresa de distribución industrial', hx, hy + (112 if V else 98), REG(24 if V else 20), CREAM, ka * .55)
    # columna de conexión
    lx = nx + 46
    reveal = [n[2] for n in AG_NODES]
    for i, (title, det, ti) in enumerate(AG_NODES):
        y = ny0 + i * gap
        a, p = vis(t, ti, 999, .5)
        if a <= 0:
            continue
        # tramo de línea hacia el nodo siguiente
        if i < len(AG_NODES) - 1:
            tn = reveal[i + 1]
            lp = eio(prog(t, tn - .45, .45))
            if lp > 0:
                y0_, y1_ = y + nh / 2 + 22, y + gap + nh / 2 - 22
                c.drawLine(lx, y0_, lx, y0_ + (y1_ - y0_) * lp, P(GOLD, .55, stroke=2.2))
        active = (i == len(AG_NODES) - 1) or t < reveal[i + 1] if i < len(AG_NODES) - 1 else True
        last = i == len(AG_NODES) - 1
        xo = (1 - p) * 26
        rrect(c, nx + xo, y, nw, nh, 16, fill=DEEP, fa=.88 * a,
              stroke=GOLD if (active or last) else CREAM, sa=(.85 if (active or last) else .13) * a, sw=2 if active else 1.4)
        # icono/indicador
        cx_, cy_ = lx + xo, y + nh / 2
        if last:
            pulse = .5 + .5 * math.sin((t - ti) * 4.2)
            c.drawCircle(cx_, cy_, 22, P(GOLD, a * (.25 + .25 * pulse)))
            ic_person(c, cx_, cy_ + 2, 30, GOLD, a)
        else:
            done = (t > reveal[i + 1] + .1)
            if done:
                c.drawCircle(cx_, cy_, 20, P(GOLD, a))
                ic_check(c, cx_, cy_, 22, DEEP, a, eo(prog(t, reveal[i + 1] + .1, .3)), sw=3.2)
            else:
                spin = (t - ti) * 240
                c.drawCircle(cx_, cy_, 20, P(GOLD, .25 * a, stroke=2.4))
                arc = skia.Path(); arc.addArc(skia.Rect.MakeXYWH(cx_ - 20, cy_ - 20, 40, 40), spin, 100)
                c.drawPath(arc, P(GOLD, a, stroke=2.6))
        num = f'{i + 1:02d}'
        tx = nx + 100 + xo
        if V:
            text(c, num, tx, y + 44, SEMI(22), GOLD, a * .9)
            text(c, title, tx + 44, y + 44, BOLD(29), CREAM, a, tracking=1.0)
            d = det
            if i == 2 and t > N(56.53):
                d = 'Producto · cantidad · fecha de entrega'
            if i == 3 and t > N(61.4):
                d = 'Datos consultados · respuesta preparada'
            text(c, d, tx + 44, y + 80, REG(24), GOLD if (last or (i in (2, 3) and d != det)) else CREAM, a * .78)
        else:
            text(c, num, tx, y + 35, SEMI(19), GOLD, a * .9)
            text(c, title, tx + 38, y + 35, BOLD(24), CREAM, a, tracking=.8)
            text(c, det, tx + 38, y + 64, REG(20), GOLD if last else CREAM, a * .72)
    if not V:
        ag_panel(c, t)


def ag_panel(c, t):
    """Panel derecho (solo 16:9): el correo y lo que el agente extrae / prepara."""
    x, y, w = 1080, 268, 700
    a, p = vis(t, 50.4, 999, .6)
    if a <= 0: return
    y += (1 - p) * 24
    h = 380
    rrect(c, x, y, w, h, 18, fill=CREAM, fa=.95 * a)
    ic_mail(c, x + 34, y + 34, 34, DEEP, a)
    text(c, 'Nuevo correo', x + 84, y + 58, SEMI(21), DEEP, a)
    text(c, 'De: compras@cliente.es', x + 34, y + 112, REG(19), (60, 80, 74), a)
    text(c, 'Asunto: Solicitud de presupuesto', x + 34, y + 140, SEMI(19), DEEP, a)
    lines = ['Buenos días: necesitamos 200 unidades',
             'del rodamiento 6204-2RS con entrega',
             'antes del día 15. ¿Nos podéis enviar',
             'precio y plazo? Gracias.']
    hl = eo(prog(t, N(56.53), .6))
    for i, s in enumerate(lines):
        text(c, s, x + 34, y + 196 + i * 34, REG(21), (30, 46, 40), a)
    if hl > 0:  # subrayados de datos extraídos
        f = REG(21)
        for (li, frag, pre) in [(0, '200 unidades', 'Buenos días: necesitamos '), (1, 'rodamiento 6204-2RS', 'del '), (2, 'antes del día 15', '')]:
            x0 = x + 34 + f.measureText(pre)
            if li == 2: x0 = x + 34
            if li == 1: x0 = x + 34 + f.measureText('del ')
            ww = f.measureText(frag) if li != 2 else f.measureText('antes del día 15')
            if li == 1: ww = f.measureText('rodamiento 6204-2RS')
            yy = y + 196 + li * 34 + 7
            rrect(c, x0 - 3, yy - 30, (ww + 6) * hl, 34, 5, fill=GOLD, fa=.28 * a)
            c.drawLine(x0, yy, x0 + ww * hl, yy, P(GOLD, a, stroke=2.4))
    # chips de datos extraídos
    if t > N(56.53):
        chips = [('Producto', 'Rodamiento 6204-2RS'), ('Cantidad', '200 uds.'), ('Entrega', 'Antes del día 15')]
        for i, (k, v) in enumerate(chips):
            ai, pi = vis(t, N(56.75) + i * .25, 999, .4)
            cy = y + h + 26 + i * 52
            rrect(c, x, cy, w * .62, 42, 21, fill=DEEP, fa=.92 * ai, stroke=GOLD, sa=.6 * ai)
            text(c, k.upper(), x + 22, cy + 28, SEMI(15), GOLD, ai, tracking=2)
            text(c, v, x + 150, cy + 28, MED(19), CREAM, ai)
    # borrador de respuesta
    ab, pb = vis(t, N(61.6), 999, .5)
    if ab > 0:
        bx, by = x + w * .66, y + h + 26
        rrect(c, bx, by, w * .34, 146, 14, fill=GREEN, fa=.95 * ab, stroke=GOLD, sa=.8 * ab, sw=1.8)
        text(c, 'BORRADOR', bx + 20, by + 34, SEMI(15), GOLD, ab, tracking=2)
        text(c, 'de respuesta', bx + 20, by + 60, MED(19), CREAM, ab)
        for i in range(3):
            rrect(c, bx + 20, by + 84 + i * 18, (w * .34 - 40) * (.9 - i * .2) * eo(prog(t, N(61.8) + i * .15, .4)), 7, 3.5, fill=CREAM, fa=.4 * ab)


def sc_herramientas(c, t, tl, seg):
    gfx_bg(c, t)
    t0 = seg['t0']
    ka, _ = vis(t, t0 + .2, 999)
    if V:
        kicker(c, 'CONECTAR HERRAMIENTAS', 110, 330, ka)
        cx, cy, R = W / 2, 820, 330
    else:
        kicker(c, 'CONECTAR HERRAMIENTAS', 150, 170, ka)
        cx, cy, R = W / 2, 520, 300
    tools = ['Correo', 'ERP', 'Inventario', 'CRM', 'Calendario', 'Documentos']
    tc = N(74.92)
    pts = []
    for i, name in enumerate(tools):
        ang = -90 + i * 60
        px, py = cx + R * math.cos(math.radians(ang)), cy + R * math.sin(math.radians(ang)) * (1.0 if V else .78)
        pts.append((px, py))
    # líneas
    for i, (px, py) in enumerate(pts):
        lp = eio(prog(t, tc + i * .16, .55))
        if lp > 0:
            c.drawLine(cx, cy, cx + (px - cx) * lp, cy + (py - cy) * lp, P(GOLD, .5, stroke=2))
    # anillo exterior que recorre el proceso "de principio a fin"
    rp = eio(prog(t, N(78.4), 1.3))
    if rp > 0:
        path = skia.Path()
        path.moveTo(*pts[0])
        segs = int(rp * 6)
        for i in range(1, segs + 1):
            path.lineTo(*pts[i % 6])
        frac = rp * 6 - segs
        if segs < 6:
            a_ = pts[segs % 6]; b_ = pts[(segs + 1) % 6]
            path.lineTo(a_[0] + (b_[0] - a_[0]) * frac, a_[1] + (b_[1] - a_[1]) * frac)
        c.drawPath(path, P(GOLD, .9, stroke=3))
    # nodos
    for i, ((px, py), name) in enumerate(zip(pts, tools)):
        a, p = vis(t, t0 + .3 + i * .1, 999, .45)
        lit = prog(t, tc + i * .16 + .4, .3)
        f = SEMI(28 if V else 24)
        wdt = tw(f, name) + 56
        hh = 64 if V else 56
        rrect(c, px - wdt / 2, py - hh / 2, wdt, hh, hh / 2, fill=DEEP, fa=.92 * a, stroke=GOLD if lit > 0 else CREAM, sa=(.25 + .6 * lit) * a, sw=1.8)
        text(c, name, px, py + (10 if V else 8), f, CREAM, a, align='c')
    # centro: agente (punto dorado, eco del logotipo)
    ca, cp = vis(t, t0 + .1, 999, .5)
    pulse = .5 + .5 * math.sin(t * 3)
    c.drawCircle(cx, cy, 74 * cp, P(DEEP, .95 * ca))
    c.drawCircle(cx, cy, 74 * cp, P(GOLD, .7 * ca, stroke=2))
    c.drawCircle(cx, cy, (90 + 10 * pulse) * cp, P(GOLD, .18 * ca, stroke=1.5))
    dot(c, cx, cy - 12, 15 * cp, GOLD, ca, glow=.8)
    text(c, 'Agente', cx, cy + 34, SEMI(22 if V else 20), CREAM, ca, align='c')


def sc_niveles(c, t, tl, seg):
    gfx_bg(c, t)
    t0 = seg['t0']
    ka, _ = vis(t, t0 + .2, 999)
    items = [('Ejecuta por sí misma', 'Clasificar correos · extraer datos · registrar en el CRM', N(105.66), False),
             ('Prepara', 'Borradores de respuesta · propuestas de presupuesto', N(107.29), False),
             ('Necesita aprobación', 'Precios · pedidos · pagos · compromisos', N(108.68), True)]
    if V:
        kicker(c, 'LA CLAVE', 110, 330, ka)
        text(c, 'Qué hace, qué prepara', 110, 405, HEAD(58), CREAM, ka)
        text(c, 'y qué decide una persona', 110, 470, HEAD(58), CREAM, ka)
        boxes = [(110, 560 + i * 245, 860, 215) for i in range(3)]
    else:
        kicker(c, 'LA CLAVE', 150, 170, ka)
        text(c, 'Qué hace, qué prepara y qué decide una persona', 150, 240, HEAD(52), CREAM, ka)
        boxes = [(150 + i * 555, 330, 510, 470) for i in range(3)]
    for i, ((tt, dd, ti, gold), (x, y, w, h)) in enumerate(zip(items, boxes)):
        a, p = vis(t, ti, 999, .5)
        if a <= 0: continue
        y += (1 - p) * 26
        rrect(c, x, y, w, h, 18, fill=GREEN if gold else DEEP, fa=.92 * a, stroke=GOLD if gold else CREAM, sa=(.9 if gold else .14) * a, sw=2.2 if gold else 1.4)
        text(c, f'{i + 1:02d}', x + 36, y + (58 if V else 70), SEMI(24), GOLD, a)
        text(c, tt, x + (90 if V else 36), y + (58 if V else 150), HEAD(44 if V else 42), GOLD if gold else CREAM, a)
        lines = wrap(REG(25 if V else 23), dd, w - (130 if V else 72))
        for j, ln in enumerate(lines):
            text(c, ln, x + (90 if V else 36), y + (106 if V else 205) + j * (36 if V else 34), REG(25 if V else 23), CREAM, a * .75)
        if gold:
            ix, iy = (x + w - 80, y + 60) if V else (x + w - 70, y + h - 80)
            c.drawCircle(ix, iy, 36, P(GOLD, a * .95))
            ic_person(c, ix, iy + 2, 44, DEEP, a)
            ck = eo(prog(t, N(109.9), .5))
            if ck > 0:
                c.drawCircle(ix + 28, iy + 26, 16, P(DEEP, a))
                ic_check(c, ix + 28, iy + 26, 17, GOLD, a, ck, sw=3)


def sc_evolucion(c, t, tl, seg):
    gfx_bg(c, t)
    t0 = seg['t0']
    ka, _ = vis(t, t0 + .2, 999)
    st = [('Registrar', 'Programas para guardar la información', N(117.05), False),
          ('Organizar', 'Herramientas para ordenar el trabajo', N(119.26), False),
          ('Actuar', 'Sistemas capaces de usar esa información para actuar', N(122.04), True)]
    glow = eo(prog(t, N(125.46), .8))
    if V:
        kicker(c, 'EL VERDADERO CAMBIO', 110, 330, ka)
        pos = [(110, 470 + i * 270) for i in range(3)]
        bw, bh = 860, 220
    else:
        kicker(c, 'EL VERDADERO CAMBIO', 150, 170, ka)
        pos = [(150 + i * 555, 330) for i in range(3)]
        bw, bh = 510, 420
    # etiquetas antes / ahora
    la, _ = vis(t, st[0][2] - .2, 999)
    lb, _ = vis(t, st[2][2], 999)
    if V:
        text(c, 'DURANTE AÑOS', 110, 440, SEMI(20), CREAM, la * .55, tracking=3)
        text(c, 'AHORA', 110, pos[2][1] - 30, SEMI(20), GOLD, lb, tracking=3)
    else:
        text(c, 'DURANTE AÑOS', 150, 300, SEMI(18), CREAM, la * .55, tracking=3)
        text(c, 'AHORA', pos[2][0], 300, SEMI(18), GOLD, lb, tracking=3)
    for i, ((tt, dd, ti, gold), (x, y)) in enumerate(zip(st, pos)):
        a, p = vis(t, ti, 999, .55)
        if a <= 0: continue
        if i > 0:
            lp = eio(prog(t, ti - .1, .5))
            if V:
                x0, y0 = x + 60, pos[i - 1][1] + bh
                c.drawLine(x0, y0, x0, y0 + (y - y0) * lp, P(GOLD if gold else CREAM, .5, stroke=2))
            else:
                x0, y0 = pos[i - 1][0] + bw, y + bh / 2
                c.drawLine(x0, y0, x0 + (x - x0) * lp, y0, P(GOLD if gold else CREAM, .5, stroke=2))
        y += (1 - p) * 24
        if gold and glow > 0:
            g = skia.Paint(AntiAlias=True)
            g.setShader(skia.GradientShader.MakeRadial((x + bw / 2, y + bh / 2), max(bw, bh) * .8, [CI(GOLD, .22 * glow * a), CI(GOLD, 0)]))
            c.drawRect(skia.Rect.MakeXYWH(x - bw * .3, y - bh * .3, bw * 1.6, bh * 1.6), g)
        rrect(c, x, y, bw, bh, 18, fill=GREEN if gold else DEEP, fa=.92 * a,
              stroke=GOLD if gold else CREAM, sa=((.4 + .5 * glow) if gold else .14) * a, sw=2.2 if gold else 1.4)
        text(c, tt, x + 40, y + (92 if V else 120), HEAD(64 if V else 60), GOLD if gold else CREAM, a * (1 if gold else .85))
        lines = wrap(REG(26 if V else 24), dd, bw - 80)
        for j, ln in enumerate(lines):
            text(c, ln, x + 40, y + (140 if V else 180) + j * 36, REG(26 if V else 24), CREAM, a * .72)


def sc_cierre(c, t, tl, seg):
    gfx_bg(c, t)
    # logotipo original reconstruido con sus proporciones exactas (engranaje + wordmark)
    S = (0.64 if V else 0.62)
    LW = 1044 * S
    ox = W / 2 - LW / 2 + 5 * S
    oy = H / 2 - (230 if V else 175)
    gcx, gcy, gsz = ox + (140.5 - 5) * S, oy + 164 * S, 278 * S
    ta = seg['t0'] + .25
    a = eo(prog(t, ta, .7))
    rot = -30 * (1 - eio(prog(t, ta, 1.6)))
    gear(c, gcx, gcy, gsz, rot, a)
    # wordmark con barrido de máscara (sin deformar)
    wp = eio(prog(t, ta + .55, 1.0))
    wx, wy, ww, wh = ox + (365 - 5) * S, oy + 122 * S, WORD.width() * S, WORD.height() * S
    if wp > 0:
        c.save(); c.clipRect(skia.Rect.MakeXYWH(wx, wy - 4, ww * wp, wh + 8))
        draw_img(c, WORD, wx, wy, ww, wh, 1.0)
        c.restore()
    # filete dorado + nombre de la sección
    rp = eio(prog(t, ta + 1.45, .9))
    ry = oy + 300 * S + (80 if V else 64)
    c.drawLine(W / 2 - 160 * rp, ry, W / 2 + 160 * rp, ry, P(GOLD, .9, stroke=2))
    sa = eo(prog(t, ta + 1.8, .8))
    text(c, 'LO QUE ESTÁ CAMBIANDO', W / 2, ry + (68 if V else 58), SEMI(34 if V else 30), CREAM, sa, align='c', tracking=7)
    ua = eo(prog(t, ta + 2.6, .8))
    text(c, 'engrana-mallorca.com', W / 2, ry + (128 if V else 108), REG(24 if V else 21), CREAM, ua * .55, align='c')


SCENES = dict(intro=sc_intro, responder_ejecutar=sc_responder_ejecutar, agente=sc_agente,
              herramientas=sc_herramientas, niveles=sc_niveles, evolucion=sc_evolucion, cierre=sc_cierre)

# ================================================================ RÓTULOS SOBRE METRAJE
GLASS = []  # rectángulos (x,y,w,h,r,a) donde el metraje se desenfoca bajo las tarjetas


def glass(c, x, y, w, h, r, a, fill=DEEP, fa=.62, stroke=CREAM, sa=.16):
    GLASS.append((x, y, w, h, r, a))
    rrect(c, x, y, w, h, r, fill=fill, fa=fa * a, stroke=stroke, sa=sa * a)


def watermark(c, t):
    # engranaje discreto en esquina durante el metraje
    a = 0.0
    for s in SEGMENTS:
        if s['kind'] == 'clip' and s['t0'] <= t < s['t1']:
            a = 1.0
    if a == 0: return
    if V:
        gear(c, 92, 132, 54, (t * 2) % 360, .55)
    else:
        gear(c, 86, 80, 46, (t * 2) % 360, .55)


def scrim(c, a, side='left', amount=.55):
    if a <= 0: return
    p = skia.Paint()
    if V:
        p.setShader(skia.GradientShader.MakeLinear([(0, 0), (0, H * .62)], [CI((0, 0, 0), amount * a), CI((0, 0, 0), 0)]))
        c.drawRect(skia.Rect.MakeWH(W, H * .62), p)
    elif side == 'left':
        p.setShader(skia.GradientShader.MakeLinear([(0, 0), (W * .68, 0)], [CI((0, 0, 0), amount * a), CI((0, 0, 0), 0)]))
        c.drawRect(skia.Rect.MakeWH(W * .68, H), p)
    else:
        p.setShader(skia.GradientShader.MakeLinear([(W, 0), (W * .45, 0)], [CI((0, 0, 0), amount * a), CI((0, 0, 0), 0)]))
        c.drawRect(skia.Rect.MakeXYWH(W * .45, 0, W * .55, H), p)


def ov_scrims(c, t):
    for (a0, a1, side) in [(2.7, 6.5, 'left'), (27.0, 31.8, 'left'), (32.6, 38.9, 'right'), (38.6, 48.5, 'left'),
                           (82.6, 89.6, 'left'), (98.4, 105.4, 'left'), (112.7, 115.0, 'left'), (133.7, 140.4, 'left'),
                           (7.3, 14.0, 'right')]:
        a, _ = vis(t, a0, a1, .6, .5)
        scrim(c, a, side)


def ov_titulo(c, t):
    a, p = vis(t, 2.9, 6.35, .8, .45)
    if a <= 0: return
    if V:
        x, y = 90, 360
        kicker(c, 'LO QUE ESTÁ CAMBIANDO  —  EP. 01', x, y, a, shadow=10)
        f = HEAD(84)
        l1 = ['La inteligencia', 'artificial ya no', 'solo responde.']
        for i, s in enumerate(l1):
            text(c, s, x, y + 110 + i * 92 + (1 - p) * 20, f, CREAM, a, shadow=18)
        b = eo(prog(t, 3.9, .7)) * a
        for i, s in enumerate(['Ahora empieza', 'a trabajar.']):
            text(c, s, x, y + 110 + (3 + i) * 92 + 14 + (1 - b) * 16, f, GOLD, b, shadow=18)
    else:
        x, y = 150, 300
        kicker(c, 'LO QUE ESTÁ CAMBIANDO  —  EP. 01', x, y, a, shadow=10)
        f = HEAD(80)
        for i, s in enumerate(['La inteligencia artificial', 'ya no solo responde.']):
            text(c, s, x, y + 104 + i * 88 + (1 - p) * 20, f, CREAM, a, shadow=18)
        b = eo(prog(t, 3.9, .7)) * a
        text(c, 'Ahora empieza a trabajar.', x, y + 104 + 2 * 88 + 14 + (1 - b) * 16, f, GOLD, b, shadow=18)


def ov_prompts(c, t):
    items = [('Escríbeme un correo para un cliente', N(5.54)), ('Resúmeme este documento', N(6.72)),
             ('Ayúdame con este Excel', N(8.17)), ('Explícame qué significa esto', N(10.19))]
    tout = 13.85
    f = MED(30 if V else 26)
    for i, (s, ti) in enumerate(items):
        a, p = vis(t, ti, tout, .45, .4)
        if a <= 0: continue
        w = tw(f, s) + 64
        h = 70 if V else 60
        if V:
            x = W - 90 - w; y = 300 + i * 104
        else:
            x = W - 140 - w; y = 220 + i * 88
        x += (1 - p) * 30
        GLASS.append((x, y, w, h, h / 2, a))
        rrect(c, x, y, w, h, h / 2, fill=CREAM, fa=.9 * a)
        text(c, s, x + 32, y + h / 2 + (11 if V else 9), f, DEEP, a)
        # indicador de respuesta (el asistente contesta)
        ra = a * eo(prog(t, ti + .45, .4))
        if ra > 0:
            for k in range(3):
                ph = .5 + .5 * math.sin((t - ti) * 7 - k * .8)
                c.drawCircle(x - 36 + k * 14 - 20, y + h / 2, 4.5, P(CREAM, ra * (.35 + .5 * ph)))


def ov_caso(c, t):
    a, p = vis(t, 27.2, 31.7, .6, .45)
    if a <= 0: return
    if V:
        x, y = 90, 330
    else:
        x, y = 150, 170
    kicker(c, 'EJEMPLO', x + (1 - p) * 20, y, a, shadow=10)
    text(c, 'Una empresa de', x + (1 - p) * 20, y + (78 if V else 70), HEAD(64 if V else 58), CREAM, a, shadow=16)
    text(c, 'distribución industrial', x + (1 - p) * 20, y + (148 if V else 134), HEAD(64 if V else 58), CREAM, a, shadow=16)


def ov_inbox(c, t):
    items = [('Solicitud de presupuesto', '09:12', N(30.96)), ('Consulta sobre un producto', '09:14', N(32.02)),
             ('¿Plazo de entrega?', '09:21', N(33.60)), ('Reclamación de un pedido', '09:26', N(35.74))]
    tout = 38.75
    ka, _ = vis(t, items[0][2] - .3, tout)
    if ka <= 0: return
    if V:
        x, y0, w, h, gap = 90, 360, 900, 112, 128
        kicker(c, 'BANDEJA DE ENTRADA', x, y0 - 40, ka, shadow=10)
    else:
        x, y0, w, h, gap = 1140, 200, 640, 92, 106
        kicker(c, 'BANDEJA DE ENTRADA', x, y0 - 36, ka, shadow=10)
    n = sum(1 for it in items if t >= it[2])
    for i, (s, hh, ti) in enumerate(items):
        a, p = vis(t, ti, tout, .45, .4)
        if a <= 0: continue
        # los nuevos entran arriba y empujan a los anteriores
        slot = (n - 1 - i)
        y = y0 + slot * gap - (1 - p) * 40
        glass(c, x, y, w, h, 16, a)
        ic_mail(c, x + 30, y + h / 2 - 16, 44 if V else 38, GOLD, a)
        text(c, s, x + (100 if V else 90), y + h / 2 + (2 if V else 0), SEMI(32 if V else 26), CREAM, a)
        text(c, 'Cliente · ' + hh, x + (100 if V else 90), y + h / 2 + (36 if V else 30), REG(22 if V else 19), CREAM, a * .6)
        dot(c, x + w - 34, y + h / 2, 7, GOLD, a)


def ov_manual(c, t):
    items = [('Abrir los correos', N(37.95)), ('Identificar al cliente', N(39.13)), ('Entender qué necesita', N(40.84)),
             ('Buscar la información', N(42.48)), ('Registrar la solicitud', N(43.76)), ('Hacer el seguimiento', N(45.50))]
    tout = 48.45
    ka, kp = vis(t, items[0][1] - .3, tout)
    if ka <= 0: return
    if V:
        x, y0, w, gap = 90, 330, 720, 86
    else:
        x, y0, w, gap = 140, 190, 600, 74
    ph = gap * len(items) + 90
    glass(c, x - 30, y0 - 70, w + 60, ph, 20, ka, fa=.66)
    kicker(c, 'TRABAJO MANUAL', x, y0 - 18, ka)
    for i, (s, ti) in enumerate(items):
        a, p = vis(t, ti, tout, .4, .4)
        if a <= 0: continue
        y = y0 + 40 + i * gap
        text(c, f'{i + 1:02d}', x, y + (1 - p) * 10, SEMI(24 if V else 21), GOLD, a)
        text(c, s, x + (60 if V else 52), y + (1 - p) * 10, MED(34 if V else 29), CREAM, a)
        if i < len(items) - 1:
            c.drawLine(x + (60 if V else 52), y + gap * .45, x + w - 20, y + gap * .45, P(CREAM, .12 * a, stroke=1))


def ov_texto(c, t):
    a, p = vis(t, 72.0, 75.45, .55, .4)
    if a <= 0: return
    f = HEAD(84 if V else 76)
    s = 'Generar un texto'
    cx, cy = W / 2, (540 if V else 300)
    text(c, s, cx, cy + (1 - p) * 16, f, CREAM, a, align='c', shadow=20)
    sp = eio(prog(t, N(73.15), .5))
    if sp > 0:
        w = tw(f, s)
        c.drawLine(cx - w / 2 - 10, cy - 26, cx - w / 2 - 10 + (w + 20) * sp, cy - 26, P(GOLD, a, stroke=7))
    sa = eo(prog(t, N(73.9) - .3, .4)) * a
    text(c, 'no es lo importante', cx, cy + (90 if V else 80), MED(36 if V else 32), GOLD, sa, align='c', shadow=12)


def ov_sectores(c, t):
    items = [('Inmobiliarias', N(82.19)), ('Empresas de suministros', N(83.43)), ('Asesorías', N(85.16)), ('Departamentos comerciales', N(86.17))]
    tout = 89.55
    ka, _ = vis(t, items[0][1] - .5, tout)
    if ka <= 0: return
    if V:
        x, y0, gap, fs = 90, 360, 92, 46
    else:
        x, y0, gap, fs = 150, 230, 80, 42
    kicker(c, 'TAMBIÉN SE PUEDE APLICAR EN', x, y0 - 50, ka, shadow=10)
    for i, (s, ti) in enumerate(items):
        a, p = vis(t, ti, tout, .45, .4)
        if a <= 0: continue
        y = y0 + 40 + i * gap
        f = HEAD(fs)
        w = tw(f, s) + 56
        glass(c, x - 4 + (1 - p) * 20, y - fs - 8, w, fs + 34, 14, a, fa=.6)
        text(c, s, x + 24 + (1 - p) * 20, y + 4, f, CREAM, a)


def ov_revision(c, t):
    items = [('Precios', N(100.07)), ('Pedidos', N(100.66)), ('Pagos', N(101.31)), ('Compromisos con clientes', N(101.88))]
    tout = 105.3
    ka, kp = vis(t, N(97.2), tout)
    if ka <= 0: return
    if V:
        x, y = 90, 360
    else:
        x, y = 150, 200
    kicker(c, 'REQUIEREN REVISIÓN HUMANA', x, y, ka, shadow=10)
    cx = x
    cy = y + 40
    f = SEMI(32 if V else 28)
    for i, (s, ti) in enumerate(items):
        a, p = vis(t, ti, tout, .4, .4)
        if a <= 0: continue
        w = tw(f, s) + 84
        h = 66 if V else 58
        if V:
            px, py = x, cy + i * (h + 18)
        else:
            px, py = x, cy + i * (h + 16)
        px += (1 - p) * 18
        glass(c, px, py, w, h, h / 2, a, fa=.7, stroke=GOLD, sa=.7)
        c.drawCircle(px + 34, py + h / 2, 13, P(GOLD, a))
        ic_check(c, px + 34, py + h / 2, 14, DEEP, a, eo(prog(t, ti + .15, .3)), sw=2.6)
        text(c, s, px + 62, py + h / 2 + 11, f, CREAM, a)


def ov_cambio(c, t):
    a, p = vis(t, 112.9, 114.95, .5, .3)
    if a <= 0: return
    x, y = (90, 380) if V else (150, 230)
    kicker(c, 'EL VERDADERO CAMBIO', x + (1 - p) * 16, y, a, shadow=10)


def ov_pregunta(c, t):
    a, p = vis(t, 133.9, 140.2, .7, .45)
    if a <= 0: return
    if V:
        x, y, fs, lines = 90, 380, 76, ['¿Cuánto trabajo', 'repetitivo seguimos', 'haciendo a mano?']
    else:
        x, y, fs, lines = 150, 250, 74, ['¿Cuánto trabajo repetitivo', 'seguimos haciendo a mano?']
    kicker(c, 'LA PREGUNTA', x, y, a, shadow=10)
    for i, s in enumerate(lines):
        text(c, s, x, y + 100 + i * (fs + 10) + (1 - p) * 18, HEAD(fs), GOLD if i == len(lines) - 1 else CREAM, a, shadow=20)


OVERLAYS = [ov_scrims, ov_titulo, ov_prompts, ov_caso, ov_inbox, ov_manual, ov_texto, ov_sectores, ov_revision, ov_cambio, ov_pregunta]

# ================================================================ SUBTÍTULOS
WORDS = load_words()


def norm(s):
    return ''.join(ch for ch in s.lower() if ch.isalnum())


def gold_set():
    toks = [norm(w['text']) for w in WORDS]
    out = set()
    for phrase, after in GOLD_WORDS:
        ph = [norm(x) for x in phrase.split()]
        for i in range(len(toks) - len(ph) + 1):
            if toks[i:i + len(ph)] == ph and WORDS[i]['start'] >= N(after):
                out.update(range(i, i + len(ph)))
                break
    return out


GOLDW = gold_set()


from make_srt import build_cue_idx, NOBREAK


CUES = build_cue_idx()


def sub_lines(idx, font, maxw):
    toks = []
    for j in idx:
        s = WORDS[j]['text']
        toks.append((s, j in GOLDW))
    # quitar punto final para un acabado editorial
    if toks and toks[-1][0].endswith('.') and not toks[-1][0].endswith('..'):
        toks[-1] = (toks[-1][0][:-1], toks[-1][1])
    full = font.measureText(' '.join(s for s, _ in toks))
    if full <= maxw and len(toks) < 8:
        return [toks]
    best, bi = 1e9, 1
    for k in range(1, len(toks)):
        a = font.measureText(' '.join(s for s, _ in toks[:k])); b = font.measureText(' '.join(s for s, _ in toks[k:]))
        sc = max(a, b) + (0 if a <= b * 1.15 else 8) + (0 if toks[k - 1][0].lower().strip(',.…:') not in NOBREAK else 90)
        if sc < best and max(a, b) <= maxw * 1.02:
            best, bi = sc, k
    return [toks[:bi], toks[bi:]]


def draw_subs(c, t):
    fs = 50 if V else 44
    f = SEMI(fs)
    maxw = 880 if V else 1400
    base = (1440 if V else 985)
    lh = fs * 1.28
    for cue in CUES:
        if cue['start'] <= t <= cue['end']:
            a = min(eo(prog(t, cue['start'], .12)), 1 - prog(t, cue['end'] - .1, .1))
            lines = sub_lines(cue['idx'], f, maxw)
            y = base - (len(lines) - 1) * lh
            bw = max(f.measureText(' '.join(s for s, _ in ln)) for ln in lines)
            pv = skia.Paint(AntiAlias=True); pv.setColor(CI((0, 0, 0), .34 * a))
            pv.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 28))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(W / 2 - bw / 2 - 30, y - fs - 14, bw + 60, lh * len(lines) + 22), 30, 30), pv)
            for ln in lines:
                total = f.measureText(' '.join(s for s, _ in ln))
                x = W / 2 - total / 2
                for s, g in ln:
                    text(c, s, x, y, f, GOLD if g else CREAM, a, shadow=14)
                    x += f.measureText(s + ' ')
                y += lh


# ================================================================ METRAJE
GRADE = ('eq=contrast=1.045:saturation=0.9:gamma=0.985,'
         'colorbalance=rs=0.018:bs=-0.028:rm=0.012:bm=-0.018:rh=0.02:bh=-0.03,format=rgb24')
PW, PH = int(W * 1.08) // 2 * 2, int(H * 1.08) // 2 * 2


class ClipReader:
    def __init__(self, seg, t_start):
        self.seg = seg
        sp = seg.get('speed', 1.0)
        self.t_begin = seg['t0'] - seg.get('xf', 0)
        nxt_xf = seg.get('_tail', 0)
        self.t_end = seg['t1'] + nxt_xf
        skip = max(0.0, t_start - seg['t0'])
        src_in = seg['src_in'] + skip * sp
        dur = (self.t_end - max(t_start, seg['t0'])) + 0.5
        fx, fy = seg.get('fx', .5), seg.get('fy', .5)
        vf = (f"setpts=(PTS-STARTPTS)/{sp},fps={FPS},scale={PW}:{PH}:force_original_aspect_ratio=increase:flags=lanczos,"
              f"crop={PW}:{PH}:(iw-{PW})*{fx}:(ih-{PH})*{fy},{GRADE}")
        # el fundido de entrada usa fotogramas anteriores al corte: arrancamos antes si hay xf
        pre = min(seg.get('xf', 0), max(0.0, t_start - self.t_begin)) if t_start < seg['t0'] else 0
        self.local0 = max(t_start, self.t_begin)
        src_in = max(0.0, seg['src_in'] + (self.local0 - seg['t0']) * sp)
        cmd = ['ffmpeg', '-v', 'error', '-ss', f'{src_in:.3f}', '-i', clip_path(seg['id']), '-an', '-vf', vf,
               '-t', f'{dur + 1:.3f}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
        self.p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=PW * PH * 3 * 2)
        self.last = None
        self.n = 0

    def frame(self):
        buf = self.p.stdout.read(PW * PH * 3)
        if len(buf) == PW * PH * 3:
            self.last = np.frombuffer(buf, np.uint8).reshape(PH, PW, 3)
        elif self.last is None:
            self.last = np.zeros((PH, PW, 3), np.uint8)
        self.n += 1
        return self.last

    def close(self):
        try:
            self.p.stdout.close(); self.p.kill(); self.p.wait()
        except Exception:
            pass


def kenburns(img, seg, t):
    span = (seg['t1'] + seg.get('_tail', 0)) - (seg['t0'] - seg.get('xf', 0))
    p = clamp((t - (seg['t0'] - seg.get('xf', 0))) / span)
    mv = seg.get('move', 'in')
    cx, cy = PW / 2, PH / 2
    if mv == 'in':
        z = 1.0 + .075 * eio(p * .5 + .25) if False else 1.0 + .07 * p
    elif mv == 'out':
        z = 1.07 - .07 * p
    else:
        z = 1.055
    vw = PW / z; vh = vw * H / W
    if mv in ('left', 'right'):
        rng = (PW - vw) / 2 * .9
        d = (1 - 2 * p) if mv == 'left' else (2 * p - 1)
        cx += rng * d
    s = W / vw
    x0, y0 = cx - vw / 2, cy - vh / 2
    M = np.float32([[s, 0, -x0 * s], [0, s, -y0 * s]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def make_vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
    v = 1 - .32 * np.clip((d - .45) / .55, 0, 1) ** 1.6
    return np.dstack([(v * 255).astype(np.uint8)] * 3)


VIG = make_vignette()
rng = np.random.default_rng(7)
GRAIN = []
for _ in range(6):
    g = rng.normal(0, 2.2, (H // 2, W // 2)).astype(np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
    pos = np.clip(g, 0, 255).astype(np.uint8); neg = np.clip(-g, 0, 255).astype(np.uint8)
    GRAIN.append((np.dstack([pos] * 3), np.dstack([neg] * 3)))


def sub_gradient(c):
    p = skia.Paint()
    y0 = H * (.62 if V else .66)
    p.setShader(skia.GradientShader.MakeLinear([(0, y0), (0, H)], [CI((0, 0, 0), 0), CI((0, 0, 0), .64)]))
    c.drawRect(skia.Rect.MakeXYWH(0, y0, W, H - y0), p)


# ================================================================ BUCLE PRINCIPAL
def prepare_segments():
    for i, s in enumerate(SEGMENTS):
        s['_tail'] = SEGMENTS[i + 1].get('xf', 0) if i + 1 < len(SEGMENTS) else 0


def active_segments(t):
    out = []
    for s in SEGMENTS:
        b = s['t0'] - s.get('xf', 0); e = s['t1'] + s.get('_tail', 0)
        if b <= t < e:
            # peso: fundido de entrada en [t0-xf, t0]
            w = 1.0
            if s.get('xf', 0) > 0 and t < s['t0']:
                w = eio((t - b) / s['xf'])
            out.append((s, w))
    return out


def blur_glass(footage):
    for (x, y, w, h, r, a) in GLASS:
        if a <= .02: continue
        x0, y0 = int(max(0, x)), int(max(0, y)); x1, y1 = int(min(W, x + w)), int(min(H, y + h))
        if x1 - x0 < 8 or y1 - y0 < 8: continue
        reg = footage[y0:y1, x0:x1]
        sm = cv2.resize(reg, ((x1 - x0) // 6 + 1, (y1 - y0) // 6 + 1), interpolation=cv2.INTER_AREA)
        sm = cv2.GaussianBlur(sm, (0, 0), 3)
        bl = cv2.resize(sm, (x1 - x0, y1 - y0), interpolation=cv2.INTER_LINEAR)
        mask = np.zeros((y1 - y0, x1 - x0), np.uint8)
        rr = int(min(r, (x1 - x0) / 2, (y1 - y0) / 2))
        cv2.rectangle(mask, (rr, 0), (x1 - x0 - rr, y1 - y0), 255, -1)
        cv2.rectangle(mask, (0, rr), (x1 - x0, y1 - y0 - rr), 255, -1)
        for (cx_, cy_) in [(rr, rr), (x1 - x0 - rr - 1, rr), (rr, y1 - y0 - rr - 1), (x1 - x0 - rr - 1, y1 - y0 - rr - 1)]:
            cv2.circle(mask, (cx_, cy_), rr, 255, -1, cv2.LINE_AA)
        m = (mask.astype(np.float32) * (a / 255.0))[..., None]
        footage[y0:y1, x0:x1] = (bl * m + reg * (1 - m)).astype(np.uint8)


def main():
    prepare_segments()
    t_from, t_to = A.t_from, A.t_to
    n0, n1 = int(round(t_from * FPS)), int(round(t_to * FPS))
    out = A.out or os.path.join(ROOT, 'VIDEO_FINAL', f'_video_{A.fmt}.mp4')
    stills = [float(x) for x in A.stills.split(',')] if A.stills else None
    enc = None
    if not stills and not A.layeronly:
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                                '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
                                '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-profile:v', 'high', '-tune', 'film',
                                '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
                                '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    lay = None
    if A.layer:
        lay = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                                '-c:v', 'qtrle', '-pix_fmt', 'argb', A.layer], stdin=subprocess.PIPE)
    readers = {}
    frames = [int(round(s * FPS)) for s in stills] if stills else range(n0, n1)
    final = np.zeros((H, W, 4), np.uint8)
    layer = np.zeros((H, W, 4), np.uint8)
    fsurf = skia.Surface(final); fc = fsurf.getCanvas()
    lsurf = skia.Surface(layer); lc = lsurf.getCanvas()
    for fi in frames:
        t = fi / FPS
        GLASS.clear()
        act = active_segments(t)
        # --- metraje
        footage = None
        for s, w in act:
            if s['kind'] != 'clip' or A.layeronly: continue
            key = id(s)
            if key not in readers or stills:
                if key in readers: readers[key].close()
                readers[key] = ClipReader(s, t)
            img = kenburns(readers[key].frame(), s, t)
            if footage is None or w >= 1.0:
                footage = img if footage is None else cv2.addWeighted(footage, 1 - w, img, w, 0) if w < 1 else img
            else:
                footage = cv2.addWeighted(footage, 1 - w, img, w, 0)
        # cerrar lectores que ya no se usan
        for k in list(readers.keys()):
            if all(id(s) != k for s, _ in act):
                readers[k].close(); del readers[k]
        if footage is None:
            footage = np.zeros((H, W, 3), np.uint8)
        else:
            footage = cv2.multiply(footage, VIG, scale=1 / 255)
        # --- capa de grafismo (premultiplicada)
        layer[:] = 0
        for s, w in act:
            if s['kind'] != 'gfx': continue
            clip_under = any(o['kind'] == 'clip' for o, _ in act)
            ga = w if clip_under else 1.0
            if t >= s['t1']:  # cola: el segmento siguiente entra en fundido por encima
                nxt = [ww for o, ww in act if o is not s and o['t0'] >= s['t1'] - 1e-6]
                if nxt and clip_under:
                    ga = min(ga, 1 - nxt[0])
            if ga <= 0.002:
                continue
            if ga < 1:
                lc.saveLayerAlpha(None, int(ga * 255))
            # movimiento de cámara lento y continuo en todo el grafismo
            pz = clamp((t - s['t0']) / max(.1, s['t1'] - s['t0']))
            z = 1.0 + .035 * pz
            lc.save(); lc.translate(W / 2, H / 2); lc.scale(z, z); lc.translate(-W / 2, -H / 2)
            SCENES[s['fn']](lc, t, t - s['t0'], s)
            lc.restore()
            if ga < 1:
                lc.restore()
        watermark(lc, t)
        for ov in OVERLAYS:
            ov(lc, t)
        if lay:
            a = layer[..., 3:4].astype(np.float32)
            un = np.where(a > 0, layer[..., :3].astype(np.float32) * 255 / np.maximum(a, 1), 0).astype(np.uint8)
            lay.stdin.write(np.dstack([un, layer[..., 3]]).tobytes())
        if A.layeronly:
            if fi % 150 == 0: print(f'layer {A.fmt} t={t:6.1f}s', flush=True)
            continue
        blur_glass(footage)
        inv = 255 - layer[..., 3]
        comp = cv2.add(layer[..., :3], cv2.multiply(footage, np.dstack([inv] * 3), scale=1 / 255))
        final[..., :3] = comp; final[..., 3] = 255
        if not A.nosubs:
            sub_gradient(fc)
            draw_subs(fc, t)
        gp, gn = GRAIN[fi % len(GRAIN)]
        rgb = final[..., :3]
        rgb = cv2.subtract(cv2.add(rgb, gp), gn)
        final[..., :3] = rgb
        if stills:
            os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
            cv2.imwrite(out.replace('.mp4', '') + f'_{t:07.2f}.jpg', cv2.cvtColor(final[..., :3], cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
        else:
            enc.stdin.write(final.tobytes())
        if fi % 150 == 0:
            print(f'{A.fmt} t={t:6.1f}s', flush=True)
    for r in readers.values(): r.close()
    if enc:
        enc.stdin.close(); enc.wait()
    if lay:
        lay.stdin.close(); lay.wait()


if __name__ == '__main__':
    main()
