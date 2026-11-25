# ENGRANA | LO QUE ESTÁ CAMBIANDO — Episodio 01

**La inteligencia artificial ya no solo responde. Ahora empieza a trabajar.**

Duración final: **2:35** (155 s). La locución de Jaume Castellá dura 2:28 a ritmo natural; se mantuvo sin acelerar
para no perder naturalidad (el objetivo era 2:20). Cabecera de 2 s + cierre de marca de 7 s.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `VIDEO_FINAL/` | Máster vertical 1080×1920 y horizontal 1920×1080 (H.264, 30 fps, AAC 48 kHz, −14 LUFS) |
| `AUDIO/` | Locución original ElevenLabs (`locucion_jaume_castella_original.mp3`), guion, mezcla final WAV 24 bit, `stems/` (voz, música, efectos), `musica/` (Adobe Stock) |
| `SUBTITULOS/` | SRT castellano sincronizado con el máster, SRT de la locución sin desfase, tiempos por palabra (JSON) |
| `VIDEO_CLIPS/` | Clips Adobe Stock con licencia (HD y `4K/` originales usados en el montaje) |
| `MOTION_GRAPHICS/` | Escenas de grafismo exportadas, capa de grafismo con alfa, logotipo preparado, fuentes |
| `IMAGENES/` | Fotogramas de control de calidad |
| `PORTADAS/` | Portadas 9:16, 4:5 y 16:9 |
| `PUBLICACIONES/` | Textos para Instagram, LinkedIn y Facebook + fuentes verificadas |
| `PROYECTO_EDITABLE/` | Secuencias para Premiere Pro (XML) + código que genera todo el episodio |

## Cómo abrir el proyecto en Premiere Pro

1. Archivo → Importar → `PROYECTO_EDITABLE/ENGRANA_EP01_horizontal_PremierePro.xml` (o el vertical).
2. Premiere mostrará los medios sin conexión: «Vincular medios» → seleccionar el primer clip dentro de esta carpeta;
   el resto se vincula solo.
3. Pistas: V1 metraje 4K original · V2 capa de grafismo con alfa · A1 locución · A2 música · A3 diseño sonoro.
4. Subtítulos: Archivo → Importar → `SUBTITULOS/ENGRANA_EP01_subtitulos_es-ES.srt` y arrastrar a la secuencia.

El movimiento de cámara (Ken Burns), el etalonaje y el grano están aplicados en el máster; en el XML el metraje va
escalado a cuadro sin esos efectos para que el editor pueda decidir.

## Herramientas utilizadas (y por qué)

| Herramienta | Uso real en esta producción |
|---|---|
| **ElevenLabs** (conector) | Locución completa con la voz clonada **Jaume Castellá** (`eleven_multilingual_v2`, estabilidad 0,55, similitud 0,85, estilo 0,10, *speaker boost*). 1 sola toma, 2.476 créditos. Transcripción Scribe (0 créditos) para sincronizar palabra a palabra y verificar pronunciación: 364/364 palabras coinciden con el guion. |
| **Adobe Stock** (conector Adobe) | 14 clips de vídeo y 3 pistas musicales del catálogo con licencia gratuita incluida («free»), descargados en 4K. |
| **Motor propio (Python + Skia + OpenCV + FFmpeg)** | Sustituye a After Effects/Premiere, que no tienen integración directa en este entorno: motion graphics vectoriales, Ken Burns, etalonaje, subtítulos, composición y exportación. Todo el código está en `PROYECTO_EDITABLE/codigo/`. |
| Adobe Firefly / Runway / generación de vídeo IA | **No utilizados.** El metraje real de Adobe Stock cubría todas las escenas con más credibilidad documental y sin coste; los créditos de ElevenLabs restantes (~1.000) no alcanzaban para ningún clip de vídeo IA. |
| Canva / HyperFrames | No necesarios (HyperFrames rechaza componer desde clientes de línea de comandos). |

## Recursos de terceros y licencias

Vídeo (Adobe Stock, licencia estándar): 600233465, 960578125, 383416021, 1993027167, 176686291, 520299893, 80565605,
473123851, 178896307, 516295181, 1933231368, 425001289, 503988324, 298166757.
Música (Adobe Stock): 462873926 «Inspiration Cinematic Piano» (usada); 495722681 y 513024934 (alternativas descargadas).
Diseño sonoro: sintetizado por código (sin derechos de terceros).
Tipografías: Bricolage Grotesque (familia del logotipo, OFL) e Inter (OFL).
Logotipo: archivo original `logo-light.png` de la web, sin redibujar ni deformar; solo se eliminó una línea de 3 px
que era un artefacto de exportación.

> Los clips y la música de Adobe Stock tienen licencia para usarse dentro de esta obra, **no para redistribuirse sueltos**.
> No subir la carpeta `VIDEO_CLIPS/` ni `AUDIO/musica/` a un repositorio o web pública.

## Regenerar el episodio

```bash
cd PROYECTO_EDITABLE/codigo
python3 mix_audio.py            # mezcla y stems
python3 make_srt.py             # subtítulos
python3 render.py v --out ../../VIDEO_FINAL/_tmp/video_v.mp4
python3 render.py h --out ../../VIDEO_FINAL/_tmp/video_h.mp4
python3 render.py h --layeronly --layer ../../MOTION_GRAPHICS/capa_grafismo_horizontal.mov
python3 covers.py ; python3 premiere_xml.py
```
Toda la sincronía vive en `timeline.py` (segmentos) y en los tiempos por palabra de la locución.
