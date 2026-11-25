"""Mezcla de audio — ENGRANA Ep. 01.
Locución (pista principal) + música Adobe Stock con ducking por palabras + diseño sonoro sintetizado.
Salida: AUDIO/mezcla_final_48k.wav (-14 LUFS, TP -1 dBTP) y stems para Premiere.
"""
import os, sys, subprocess, json, math
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from timeline import *

SR = 48000
AUD = os.path.join(ROOT, 'AUDIO')
STEMS = os.path.join(AUD, 'stems'); os.makedirs(STEMS, exist_ok=True)
NS = int(DURATION * SR)
MUSIC_START = 2.2


def load(path, filters=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path]
    if filters: cmd += ['-af', filters]
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def save(path, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s24le', path], input=x.astype(np.float32).tobytes(), check=True)


def place(buf, x, t, gain=1.0):
    i = int(t * SR)
    n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n] += x[:n] * gain


def db(x): return 10 ** (x / 20)


# ---------------------------------------------------------------- locución
voice_src = os.path.join(AUD, 'locucion_jaume_castella_original.mp3')
voice = load(voice_src, 'highpass=f=70,equalizer=f=220:t=q:w=1.2:g=-1.2,equalizer=f=3200:t=q:w=1.4:g=1.2,'
                        'acompressor=threshold=-22dB:ratio=2.2:attack=8:release=120:makeup=1.5,'
                        'loudnorm=I=-16:TP=-2:LRA=7')
V = np.zeros((NS, 2), np.float32)
place(V, voice, NARR_OFFSET)

# ---------------------------------------------------------------- música + ducking por palabras
music = load(os.path.join(AUD, 'musica', 'AdobeStock_462873926_Inspiration-Cinematic-Piano.wav'))
M = np.zeros((NS, 2), np.float32)
place(M, music, MUSIC_START)
words = load_words()
speech = np.zeros(int(DURATION * 100) + 1, bool)  # resolución 10 ms
for w in words:
    speech[int((w['start'] - .12) * 100):int((w['end'] + .25) * 100)] = True
# rellenar huecos cortos (< 0.7 s) para que la música no "bombee"
idx = np.where(speech)[0]
for a, b in zip(idx[:-1], idx[1:]):
    if 1 < b - a < 70: speech[a:b] = True
target = np.where(speech, -23.0, -15.5)
t100 = np.arange(len(target)) / 100
target[t100 < NARR_OFFSET - .2] = -13.0           # entrada
target[t100 > 147.4] = -12.5                      # cierre
# suavizado asimétrico (ataque 0.25 s, liberación 0.8 s)
g = np.empty_like(target); g[0] = target[0]
for i in range(1, len(target)):
    k = .04 if target[i] < g[i - 1] else .0125
    g[i] = g[i - 1] + (target[i] - g[i - 1]) * k
fade_in = np.clip((t100 - MUSIC_START) / 1.2, 0, 1)
fade_out = np.clip((DURATION - .3 - t100) / 3.0, 0, 1)
lin = db(g) * fade_in * fade_out
env = np.interp(np.arange(NS) / SR, t100, lin).astype(np.float32)
M *= env[:, None]

# ---------------------------------------------------------------- diseño sonoro (sintetizado, libre de derechos)
rng = np.random.default_rng(3)


def tick(f=2100, dur=.09, level=-30):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 60) + .35 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 90)
    s *= db(level)
    return np.stack([s, s], 1).astype(np.float32)


def whoosh(dur=.75, level=-31, up=True):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # filtro paso banda deslizante (aproximación por sumas móviles)
    out = np.zeros(n)
    k0, k1 = (60, 6) if up else (6, 60)
    for i, (a, b) in enumerate([(0, n // 3), (n // 3, 2 * n // 3), (2 * n // 3, n)]):
        k = int(k0 + (k1 - k0) * i / 2)
        seg = np.convolve(noise, np.ones(k) / k, 'same')[a:b]
        out[a:b] = seg
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    s = out * env
    s = s / (np.abs(s).max() + 1e-9) * db(level)
    pan = np.linspace(-.3, .3, n)
    return np.stack([s * (1 - pan), s * (1 + pan)], 1).astype(np.float32)


def gear_click(level=-27):
    out = np.zeros((int(.5 * SR), 2), np.float32)
    for k, dt in enumerate([0, .07, .16]):
        n = int(.03 * SR); t = np.arange(n) / SR
        s = rng.normal(0, 1, n) * np.exp(-t * 180) + .6 * np.sin(2 * np.pi * 900 * t) * np.exp(-t * 120)
        s = np.convolve(s, np.ones(3) / 3, 'same') * db(level - k * 3)
        i = int(dt * SR); out[i:i + n] += np.stack([s, s], 1)
    return out


def chime(level=-24, dur=5.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for f, a in [(220.0, 1), (277.18, .6), (329.63, .7), (440.0, .45), (554.37, .25), (659.25, .2)]:
        s += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (1 - np.exp(-t * 18)) * np.exp(-t * .75)
    s = s / np.abs(s).max() * db(level)
    d = int(.012 * SR)
    return np.stack([s, np.concatenate([np.zeros(d), s[:-d]])], 1).astype(np.float32)


S = np.zeros((NS, 2), np.float32)
place(S, gear_click(-26), .3)
place(S, whoosh(1.1, -33), 1.6)
for tt in [2.9]:
    place(S, whoosh(.9, -34), tt - .3)
# rótulos y nodos
ticks = [N(5.54), N(6.72), N(8.17), N(10.19),                       # prompts
         N(22.55), N(22.97), N(23.39), N(23.81),                    # tareas
         N(30.96), N(32.02), N(33.60), N(35.74),                    # bandeja
         N(37.95), N(39.13), N(40.84), N(42.48), N(43.76), N(45.50),  # trabajo manual
         50.15, N(52.06), N(53.75), N(58.22), N(63.97), N(66.73),   # agente
         N(82.19), N(83.43), N(85.16), N(86.17),                    # sectores
         N(100.07), N(100.66), N(101.31), N(101.88),                # revisión
         N(105.66), N(107.29), N(108.68), N(117.05), N(119.26), N(122.04)]
for i, tt in enumerate(ticks):
    place(S, tick(1900 + (i % 3) * 180, level=-33), tt)
place(S, tick(1500, .25, -29), N(67.9))   # aprobación humana pendiente
place(S, tick(2400, .2, -30), N(109.9))   # aprobación concedida
for tt in [19.85, 48.75, 75.85, 105.6, 115.15]:
    place(S, whoosh(.8, -32), tt - .45)
place(S, whoosh(1.2, -31), 147.55 - .5)
place(S, gear_click(-25), 147.8)
place(S, chime(-23, 6.5), 148.2)

# ---------------------------------------------------------------- stems y mezcla
save(os.path.join(STEMS, 'A1_locucion_procesada.wav'), V)
save(os.path.join(STEMS, 'A2_musica_con_ducking.wav'), M)
save(os.path.join(STEMS, 'A3_diseno_sonoro.wav'), S)
mix = V + M + S
pre = os.path.join(STEMS, '_premix.wav')
save(pre, mix)
# normalización final de dos pasadas
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True).stderr
js = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.0:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
      f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,aresample=48000")
out = os.path.join(AUD, 'mezcla_final_48k.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', af, '-ar', '48000', '-c:a', 'pcm_s24le', out], check=True)
os.remove(pre)
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', out, '-af', 'loudnorm=print_format=summary', '-f', 'null', '-'],
                   capture_output=True, text=True).stderr
print(r[r.index('Input Integrated'):r.index('Input Threshold')])
