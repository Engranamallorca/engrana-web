"""Genera secuencias editables para Adobe Premiere Pro en formato Final Cut Pro 7 XML (xmeml v4),
que Premiere importa de forma nativa (Archivo > Importar).

Pistas:
  V1  Metraje Adobe Stock original (4K) con sus puntos de entrada/salida y velocidad
  V2  Capa de grafismo + rótulos con canal alfa (MOTION_GRAPHICS/capa_grafismo_*.mov)
  A1  Locución procesada (Jaume Castellá)     A2  Música con ducking     A3  Diseño sonoro
Los subtítulos se importan aparte: SUBTITULOS/ENGRANA_EP01_subtitulos_es-ES.srt
"""
import os, sys, subprocess, json
from xml.sax.saxutils import escape
sys.path.insert(0, os.path.dirname(__file__))
from timeline import *

OUT = os.path.join(ROOT, 'PROYECTO_EDITABLE')
BASE = 'file://localhost/ENGRANA_EPISODIO_01/'   # Premiere pedirá «Vincular»: apunta a la carpeta y vincula el resto


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration',
                        '-of', 'json', path], capture_output=True, text=True)
    return json.loads(r.stdout)


def fr(t): return int(round(t * FPS))


def rate(): return f'<rate><timebase>{FPS}</timebase><ntsc>FALSE</ntsc></rate>'


def file_el(fid, rel, dur_s, w=None, h=None, video=True, audio=False, defined=set()):
    if fid in defined:
        return f'<file id="{fid}"/>'
    defined.add(fid)
    media = ''
    if video:
        media += f'<video><samplecharacteristics>{rate()}<width>{w}</width><height>{h}</height></samplecharacteristics></video>'
    if audio:
        media += '<audio><samplecharacteristics><depth>24</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio>'
    name = os.path.basename(rel)
    return (f'<file id="{fid}"><name>{escape(name)}</name><pathurl>{BASE}{escape(rel)}</pathurl>{rate()}'
            f'<duration>{fr(dur_s)}</duration><media>{media}</media></file>')


def build(fmt):
    W, H = (1080, 1920) if fmt == 'v' else (1920, 1080)
    defined = set()
    v1 = []
    for i, s in enumerate(SEGMENTS):
        if s['kind'] != 'clip':
            continue
        path = clip_path(s['id'])
        rel = os.path.relpath(path, ROOT)
        info = probe(path)
        vs = [x for x in info['streams'] if x['codec_type'] == 'video'][0]
        sw, sh = vs['width'], vs['height']
        dur = float(info['format']['duration'])
        sp = s.get('speed', 1.0)
        start, end = fr(s['t0']), fr(s['t1'])
        cin = fr(s['src_in']); cout = cin + int(round((end - start) * sp))
        scale = max(W / sw, H / sh) * 100 * 1.03
        cx = (0.5 - s.get('fx', .5)) * (sw * scale / 100 - W) / W * 2  # desplazamiento horizontal normalizado
        speed_fx = ''
        if abs(sp - 1) > 1e-3:
            speed_fx = (f'<filter><effect><name>Time Remap</name><effectid>timeremap</effectid><effectcategory>motion</effectcategory>'
                        f'<effecttype>motion</effecttype><mediatype>video</mediatype>'
                        f'<parameter><parameterid>speed</parameterid><name>speed</name><value>{sp * 100:.1f}</value></parameter>'
                        f'<parameter><parameterid>variablespeed</parameterid><name>variablespeed</name><value>0</value></parameter></effect></filter>')
        v1.append(
            f'<clipitem id="v1-{i}"><name>AdobeStock_{s["id"]}</name><enabled>TRUE</enabled><duration>{fr(dur)}</duration>{rate()}'
            f'<start>{start}</start><end>{end}</end><in>{cin}</in><out>{cout}</out>'
            f'{file_el("f" + s["id"], rel, dur, sw, sh, True, False, defined)}'
            f'<filter><effect><name>Basic Motion</name><effectid>basic</effectid><effectcategory>motion</effectcategory>'
            f'<effecttype>motion</effecttype><mediatype>video</mediatype>'
            f'<parameter><parameterid>scale</parameterid><name>Scale</name><value>{scale:.2f}</value></parameter>'
            f'<parameter><parameterid>center</parameterid><name>Center</name><value><horiz>{cx:.4f}</horiz><vert>0</vert></value></parameter>'
            f'</effect></filter>{speed_fx}'
            f'<comments><mastercomment1>Movimiento de cámara en el máster: {s.get("move")}</mastercomment1></comments></clipitem>')
    end_all = fr(DURATION)
    layer_rel = f'MOTION_GRAPHICS/capa_grafismo_{"vertical" if fmt == "v" else "horizontal"}.mov'
    v2 = (f'<clipitem id="v2-0"><name>Capa de grafismo (alfa)</name><enabled>TRUE</enabled><duration>{end_all}</duration>{rate()}'
          f'<start>0</start><end>{end_all}</end><in>0</in><out>{end_all}</out>'
          f'{file_el("flayer", layer_rel, DURATION, W, H, True, False, defined)}'
          f'<compositemode>normal</compositemode></clipitem>')

    def aud(tid, name, rel):
        return (f'<clipitem id="{tid}"><name>{name}</name><enabled>TRUE</enabled><duration>{end_all}</duration>{rate()}'
                f'<start>0</start><end>{end_all}</end><in>0</in><out>{end_all}</out>'
                f'{file_el("f" + tid, rel, DURATION, video=False, audio=True, defined=defined)}'
                f'<sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack></clipitem>')

    a = [aud('a1', 'Locución — Jaume Castellá', 'AUDIO/stems/A1_locucion_procesada.wav'),
         aud('a2', 'Música — Adobe Stock 462873926 (ducking)', 'AUDIO/stems/A2_musica_con_ducking.wav'),
         aud('a3', 'Diseño sonoro', 'AUDIO/stems/A3_diseno_sonoro.wav')]
    name = f'ENGRANA EP01 — {"Vertical 9x16" if fmt == "v" else "Horizontal 16x9"}'
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4"><sequence id="seq">'
           f'<name>{escape(name)}</name><duration>{end_all}</duration>{rate()}'
           '<media><video><format><samplecharacteristics>'
           f'{rate()}<width>{W}</width><height>{H}</height><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance>'
           '</samplecharacteristics></format>'
           f'<track>{"".join(v1)}</track><track>{v2}</track></video>'
           '<audio><numOutputChannels>2</numOutputChannels>'
           + ''.join(f'<track>{x}</track>' for x in a) +
           '</audio></media></sequence></xmeml>\n')
    out = os.path.join(OUT, f'ENGRANA_EP01_{"vertical" if fmt == "v" else "horizontal"}_PremierePro.xml')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(xml)
    print(out)


build('v'); build('h')
