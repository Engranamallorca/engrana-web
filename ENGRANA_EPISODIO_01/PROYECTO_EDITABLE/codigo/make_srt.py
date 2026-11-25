"""Genera los subtítulos SRT (mismos cortes que los subtítulos quemados en el vídeo)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from timeline import *

WORDS = load_words()


NOBREAK = {'inteligencia', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'a', 'en', 'y', 'o', 'que', 'por', 'para',
           'con', 'del', 'al', 'qué', 'más', 'sin', 'tener', 'cuánto', 'es', 'esto', 'lo', 'su', 'mucha', 'trabajo', 'otros',
           'diferentes', 'esa', 'agente', 'va', 'vamos', 'no', 'ya', 'otras', 'puede', 'debe', 'pregunta'}


def _free(i):
    """¿Se puede cortar después de la palabra i?"""
    return WORDS[i]['text'].lower().strip(',.…:') not in NOBREAK or WORDS[i]['text'][-1] in ',.…:'


def build_cue_idx():
    cues, cur = [], []
    for i, w in enumerate(WORDS):
        txt = ' '.join(WORDS[j]['text'] for j in cur + [i])
        if cur and len(txt) > 58 and _free(cur[-1]):
            cues.append(cur); cur = []
        cur.append(i)
        txt = ' '.join(WORDS[j]['text'] for j in cur)
        last = w['text'][-1]
        gap = WORDS[i + 1]['start'] - w['end'] if i + 1 < len(WORDS) else 9
        if last in '.?!:' or (last in ',;…' and len(txt) >= 24) or (_free(i) and ((gap > .5 and len(txt) >= 16) or len(txt) >= 46)):
            cues.append(cur); cur = []
    if cur: cues.append(cur)
    res = []
    for k, cu in enumerate(cues):
        st = WORDS[cu[0]]['start'] - .06
        en = WORDS[cu[-1]]['end'] + .4
        if k + 1 < len(cues):
            en = min(en, WORDS[cues[k + 1][0]]['start'] - .08)
        res.append(dict(idx=cu, start=st, end=en))
    return res


def build_cues():
    return [(c['start'], c['end'], [WORDS[j]['text'] for j in c['idx']]) for c in build_cue_idx()]


def two_lines(toks, maxc=38):
    s = ' '.join(toks)
    if len(s) <= maxc:
        return s
    best, bi = 1e9, 1
    for k in range(1, len(toks)):
        a, b = len(' '.join(toks[:k])), len(' '.join(toks[k:]))
        pen = 0 if toks[k - 1].lower().strip(',.…:') not in NOBREAK else 12
        if max(a, b) + pen < best:
            best, bi = max(a, b) + pen, k
    return ' '.join(toks[:bi]) + '\n' + ' '.join(toks[bi:])


def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}'


if __name__ == '__main__':
    out = os.path.join(ROOT, 'SUBTITULOS', 'ENGRANA_EP01_subtitulos_es-ES.srt')
    cues = build_cues()
    with open(out, 'w', encoding='utf-8') as f:
        for i, (st, en, toks) in enumerate(cues, 1):
            f.write(f'{i}\n{ts(st)} --> {ts(en)}\n{two_lines(toks)}\n\n')
    # versión de la locución sola (sin el desfase de la cabecera) para usar con el audio original
    out2 = os.path.join(ROOT, 'SUBTITULOS', 'locucion_original_sin_desfase.srt')
    with open(out2, 'w', encoding='utf-8') as f:
        for i, (st, en, toks) in enumerate(cues, 1):
            f.write(f'{i}\n{ts(st - NARR_OFFSET)} --> {ts(en - NARR_OFFSET)}\n{two_lines(toks)}\n\n')
    print(len(cues), 'cues ->', out)
