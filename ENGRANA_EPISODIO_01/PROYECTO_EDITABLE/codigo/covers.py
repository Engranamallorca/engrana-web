"""Portadas del episodio: 1080x1920 (Reels/Shorts/TikTok), 1080x1350 (feed 4:5), 1920x1080 (YouTube/LinkedIn)."""
import os, sys, subprocess
import numpy as np, cv2, skia
sys.path.insert(0, os.path.dirname(__file__))
from timeline import ROOT, clip_path

FONTS = os.path.join(ROOT, 'MOTION_GRAPHICS', 'fuentes')
MG = os.path.join(ROOT, 'MOTION_GRAPHICS')
OUT = os.path.join(ROOT, 'PORTADAS')
GOLD, CREAM, DEEP = (229, 165, 47), (245, 243, 236), (8, 40, 32)


def CI(rgb, a=1.0): return skia.ColorSetARGB(int(a * 255), *rgb)


def font(n, s): return skia.Font(skia.Typeface.MakeFromFile(os.path.join(FONTS, n)), s)


def frame(cid, t, W, H, fx=.5):
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(t), '-i', clip_path(cid), '-frames:v', '1',
           '-vf', f'scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}:(iw-{W})*{fx}:(ih-{H})/2,'
                  'eq=contrast=1.05:saturation=0.85:gamma=0.97,colorbalance=rs=0.02:bs=-0.03,format=rgba',
           '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 4).copy()


def cover(W, H, name):
    img = frame('520299893', 9.0, W, H, .5)
    s = skia.Surface(img); c = s.getCanvas()
    # velo de color de marca + degradado para legibilidad
    p = skia.Paint(); p.setColor(CI(DEEP, .38)); c.drawRect(skia.Rect.MakeWH(W, H), p)
    p = skia.Paint()
    p.setShader(skia.GradientShader.MakeLinear([(0, H * .25), (0, H)], [CI((4, 18, 14), 0), CI((4, 18, 14), .92)]))
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    vert = H > W
    m = 90 if vert else 130
    big = (104 if H / W > 1.6 else 96) if vert else 96
    if H / W > 1.6:   # 9:16 — texto dentro de la zona segura del recorte 4:5 del perfil
        y = H * .53
    elif vert:
        y = H * .30
    else:
        y = H * .43
    k = font('Inter-SemiBold.otf', 30 if vert else 26)
    pk = skia.Paint(AntiAlias=True); pk.setColor(CI(GOLD))
    c.drawLine(m, y - 11, m + 40, y - 11, skia.Paint(AntiAlias=True, Color=CI(GOLD), StrokeWidth=2.5, Style=skia.Paint.kStroke_Style))
    x = m + 58
    for ch in 'LO QUE ESTÁ CAMBIANDO  ·  EP. 01':
        c.drawString(ch, x, y, k, pk); x += k.measureText(ch) + 4.5
    hf = font('BricolageGrotesque-Bold.ttf', big)
    lines = ([('La inteligencia', CREAM), ('artificial ya no', CREAM), ('solo responde.', CREAM), ('Ahora empieza', GOLD), ('a trabajar.', GOLD)]
             if vert else [('La IA ya no solo responde.', CREAM), ('Ahora empieza a trabajar.', GOLD)])
    yy = y + big * 1.15
    for i, (ln, col) in enumerate(lines):
        pp = skia.Paint(AntiAlias=True); pp.setColor(CI(col))
        pp.setImageFilter(skia.ImageFilters.DropShadow(0, 4, 18, 18, CI((0, 0, 0), .45)))
        if col == GOLD and lines[i - 1][1] == CREAM: yy += big * .18
        c.drawString(ln, m, yy, hf, pp)
        yy += big * 1.02
    # firma: logotipo original
    logo = skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(os.path.join(MG, 'logo_engrana_blanco_limpio.png')))
    lw = 300 if vert else 280
    lh = lw * logo.height() / logo.width()
    ly = (H * .86 if H / W > 1.6 else H - lh - 70) if vert else H - lh - 64
    c.drawImageRect(logo, skia.Rect.MakeXYWH(m, ly, lw, lh), skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear))
    os.makedirs(OUT, exist_ok=True)
    cv2.imwrite(os.path.join(OUT, name), cv2.cvtColor(img, cv2.COLOR_RGBA2BGR), [cv2.IMWRITE_JPEG_QUALITY, 94])
    print(name)


cover(1080, 1920, 'portada_EP01_vertical_1080x1920.jpg')
cover(1080, 1350, 'portada_EP01_feed_1080x1350.jpg')
cover(1920, 1080, 'portada_EP01_horizontal_1920x1080.jpg')
