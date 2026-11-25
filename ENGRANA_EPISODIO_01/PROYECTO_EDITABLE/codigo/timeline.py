"""ENGRANA | LO QUE ESTÁ CAMBIANDO — Episodio 01
Línea de tiempo maestra. Todos los tiempos en segundos de la LÍNEA DE TIEMPO FINAL.
La locución empieza en NARR_OFFSET; los tiempos de palabra vienen de la transcripción
(ElevenLabs Scribe) de la locución original de Jaume Castellá.
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FPS = 30
NARR_OFFSET = 2.0
DURATION = 155.0

CLIPS4K = os.path.join(ROOT, 'VIDEO_CLIPS', '4K')
CLIPSHD = os.path.join(ROOT, 'VIDEO_CLIPS')


def clip_path(cid):
    p4 = os.path.join(CLIPS4K, f'AdobeStock_{cid}_4K.mov')
    return p4 if os.path.exists(p4) else os.path.join(CLIPSHD, f'AdobeStock_{cid}.mov')


def load_words():
    with open(os.path.join(ROOT, 'SUBTITULOS', 'words_timing.json')) as f:
        d = json.load(f)
    ws = [w for w in d['words'] if w.get('type', 'word') == 'word']
    for w in ws:
        w['start'] += NARR_OFFSET
        w['end'] += NARR_OFFSET
    return ws


def N(t):
    """Convierte un tiempo de la locución en tiempo de la línea final."""
    return t + NARR_OFFSET


# ---------------------------------------------------------------------------
# Segmentos de imagen. kind = clip | gfx
#   clip: id, src_in (s), speed, move (in|out|left|right|up), fx/fy foco (0..1) para el recorte
#   xf  : fundido cruzado con el segmento anterior (s)
# ---------------------------------------------------------------------------
SEGMENTS = [
    dict(kind='gfx', t0=0.0, t1=2.55, fn='intro'),
    # ESCENA 1 — el trabajo tradicional
    dict(kind='clip', t0=2.55, t1=6.75, id='600233465', src_in=1.0, move='in', fx=0.55, xf=0.45),
    dict(kind='clip', t0=6.75, t1=10.45, id='960578125', src_in=0.3, move='left', fx=0.42),
    dict(kind='clip', t0=10.45, t1=14.15, id='383416021', src_in=0.5, move='in', fx=0.62),
    # ESCENA 2 — el cambio
    dict(kind='clip', t0=14.15, t1=19.85, id='1993027167', src_in=0.2, move='in', fx=0.45),
    dict(kind='gfx', t0=19.85, t1=26.3, fn='responder_ejecutar', xf=0.4),
    # ESCENA 3 — distribución industrial
    dict(kind='clip', t0=26.3, t1=30.25, id='176686291', src_in=0.0, move='in', fx=0.5, xf=0.4),
    dict(kind='clip', t0=30.25, t1=34.35, id='520299893', src_in=1.5, move='right', fx=0.5),
    dict(kind='clip', t0=34.35, t1=39.1, id='80565605', src_in=1.0, move='in', fx=0.45),
    # ESCENA 4 — el problema
    dict(kind='clip', t0=39.1, t1=43.7, id='473123851', src_in=0.2, move='in', fx=0.5, speed=0.85),
    dict(kind='clip', t0=43.7, t1=48.75, id='178896307', src_in=6.0, move='left', fx=0.42),
    # ESCENA 5 — el agente de IA
    dict(kind='gfx', t0=48.75, t1=71.2, fn='agente', xf=0.5),
    dict(kind='clip', t0=71.2, t1=75.85, id='516295181', src_in=3.0, move='in', fx=0.45, xf=0.5),
    dict(kind='gfx', t0=75.85, t1=81.75, fn='herramientas', xf=0.4),
    dict(kind='clip', t0=81.75, t1=89.85, id='1933231368', src_in=0.5, move='right', fx=0.5, xf=0.4),
    # ESCENA 6 — supervisión humana
    dict(kind='clip', t0=89.85, t1=97.35, id='425001289', src_in=0.4, move='in', fx=0.5, speed=0.78),
    dict(kind='clip', t0=97.35, t1=105.6, id='503988324', src_in=0.0, move='in', fx=0.55, speed=0.88),
    dict(kind='gfx', t0=105.6, t1=112.55, fn='niveles', xf=0.4),
    # ESCENA 7 — el futuro
    dict(kind='clip', t0=112.55, t1=115.15, id='298166757', src_in=0.0, move='in', fx=0.5, xf=0.4),
    dict(kind='gfx', t0=115.15, t1=128.2, fn='evolucion', xf=0.4),
    dict(kind='clip', t0=128.2, t1=133.1, id='1993027167', src_in=5.6, move='out', fx=0.45, xf=0.4),
    dict(kind='clip', t0=133.1, t1=140.55, id='960578125', src_in=4.2, move='in', fx=0.42),
    dict(kind='clip', t0=140.55, t1=147.55, id='298166757', src_in=2.7, move='right', fx=0.5, speed=0.98),
    # ESCENA 8 — cierre
    dict(kind='gfx', t0=147.55, t1=DURATION, fn='cierre', xf=0.6),
]

# Palabras destacadas en dorado en los subtítulos (secuencias exactas, primera aparición
# posterior a 'after').
GOLD_WORDS = [
    ('preguntas', 0), ('está cambiando', 0), ('ejecutar tareas', 0),
    ('distribución industrial', 0), ('agente de inteligencia artificial', 0),
    ('CRM', 0), ('comercial', 60), ('conectar diferentes herramientas', 0),
    ('de principio a fin', 0), ('sin control', 0), ('revisión humana', 0),
    ('aprobación', 100), ('verdadero cambio', 0), ('actuar', 120),
    ('trabajo repetitivo', 0), ('trabajar mejor', 0), ('Engrana', 0),
]
