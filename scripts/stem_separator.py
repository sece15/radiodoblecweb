"""
=====================================================================
RADIO DOBLE C · C-STEMS SOTA AI SEPARATION WORKER
(scripts/stem_separator.py)
=====================================================================
Motor local de Inteligencia Artificial para la separación de audio en 4 pistas:
  - drums.wav   (Batería, percusión, kick, snare, hi-hats)
  - bass.wav    (Línea de bajo y sub-bajo)
  - other.wav   (Melodía, teclados, sintetizadores, vientos, guitarras)
  - vocals.wav  (Voces principales y coros)

Utiliza Meta AI Demucs v4 (htdemucs) con aceleración local en CPU/GPU
y descarga directa con yt-dlp para canciones de YouTube (C-Digger).
"""

import sys
import os
import argparse
import subprocess
import shutil
from pathlib import Path
from typing import Optional

CACHE_DIR = Path(__file__).resolve().parent.parent / "public" / "stems_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def download_youtube_audio(youtube_id: str, output_wav: Path) -> bool:
    """
    Descarga el audio de máxima calidad de YouTube usando yt-dlp y lo convierte a WAV con ffmpeg.
    """
    try:
        import yt_dlp
    except ImportError:
        print("❌ yt-dlp no está instalado. Ejecuta: pip install yt-dlp", file=sys.stderr)
        return False

    temp_template = output_wav.parent / "source_audio.%(ext)s"
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": str(temp_template),
        "noplaylist": True,
        "geo_bypass": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
        "quiet": True,
        "no_warnings": True,
    }

    try:
        print(f"📥 Descargando audio real de YouTube (ID: {youtube_id})...", file=sys.stderr)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={youtube_id}"])

        # Localizar el archivo extraído
        extracted = output_wav.parent / "source_audio.wav"
        if extracted.exists():
            if output_wav.exists():
                output_wav.unlink()
            extracted.rename(output_wav)
            print(f"✅ Audio de YouTube extraído correctamente en: {output_wav}", file=sys.stderr)
            return True
        return False
    except Exception as e:
        print(f"❌ Error al descargar audio de YouTube con yt-dlp: {e}", file=sys.stderr)
        return False


def separate_audio(input_wav: Path, output_dir: Path, model_name: str = "htdemucs") -> bool:
    """
    Ejecuta Meta Demucs v4 para separar el audio en 4 canales reales:
    drums (batería), bass (bajo), other (melodía), vocals (voz).
    """
    device = "cpu"
    try:
        import torch
        if torch.cuda.is_available():
            device = "cuda"
    except Exception:
        pass

    print(f"\n============================================================", file=sys.stderr)
    print(f"🎛️ INICIANDO SEPARACIÓN NEURONAL DE STEMS (4 CANALES)", file=sys.stderr)
    print(f"Modelo: {model_name} (Meta AI Hybrid Transformer) | Dispositivo: {device}", file=sys.stderr)
    print(f"Entrada: {input_wav}", file=sys.stderr)
    print(f"Salida: {output_dir}", file=sys.stderr)
    print(f"============================================================\n", file=sys.stderr)

    cmd = [
        sys.executable,
        "-m",
        "demucs.separate",
        "-n",
        model_name,
        "-d",
        device,
        "-o",
        str(output_dir),
        str(input_wav),
    ]

    try:
        subprocess.run(cmd, check=True, stdout=sys.stderr, stderr=sys.stderr)
        print(f"\n✅ Separación en 4 canales completada con éxito.", file=sys.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al ejecutar Demucs: {e}", file=sys.stderr)
        return False


def get_stems_for_item(item_dir: Path, base_url: str = "", model_name: str = "htdemucs"):
    """
    Encuentra los 4 stems generados en el directorio y genera sus URLs HTTP o rutas públicas Next.js.
    """
    track_folder = item_dir / model_name / "input"
    if not track_folder.exists():
        candidates = list(item_dir.glob(f"{model_name}/*"))
        if candidates:
            track_folder = candidates[0]

    drums = track_folder / "drums.wav"
    bass = track_folder / "bass.wav"
    other = track_folder / "other.wav"
    vocals = track_folder / "vocals.wav"

    if drums.exists() and bass.exists() and other.exists() and vocals.exists():
        rel_drums = drums.relative_to(CACHE_DIR).as_posix()
        rel_bass = bass.relative_to(CACHE_DIR).as_posix()
        rel_other = other.relative_to(CACHE_DIR).as_posix()
        rel_vocals = vocals.relative_to(CACHE_DIR).as_posix()

        prefix = f"{base_url}/stems" if base_url else "/stems_cache"
        return {
            "drums": f"{prefix}/{rel_drums}",
            "bass": f"{prefix}/{rel_bass}",
            "melody": f"{prefix}/{rel_other}",
            "vocals": f"{prefix}/{rel_vocals}",
        }
    return None


def run_server(port: int = 8010):
    """
    Inicia el servidor FastAPI con soporte para descarga de YouTube, separación y streaming estático.
    """
    from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel
    import uvicorn

    app = FastAPI(title="Radio Doble C - Stems AI Server", version="2.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Montar archivos estáticos para que el navegador descargue los WAVs directamente
    app.mount("/stems", StaticFiles(directory=str(CACHE_DIR)), name="stems")

    class SeparateRequest(BaseModel):
        youtubeId: Optional[str] = None
        audioUrl: Optional[str] = None
        trackTitle: Optional[str] = None

    @app.get("/health")
    def health():
        return {
            "status": "ready",
            "model": "htdemucs",
            "engine": "Meta AI Demucs v4 (FastAPI Local Worker)",
            "cache_dir": str(CACHE_DIR),
        }

    @app.post("/separate")
    async def separate_endpoint(
        request: Request,
        file: Optional[UploadFile] = File(None),
    ):
        base_url = f"http://127.0.0.1:{port}"

        # 1. Verificar si viene JSON o archivo
        content_type = request.headers.get("content-type", "")
        youtube_id = None

        if "application/json" in content_type:
            try:
                body = await request.json()
                youtube_id = body.get("youtubeId")
            except Exception:
                pass

        # 2. PROCESAMIENTO VÍA YOUTUBE ID (C-DIGGER)
        if youtube_id:
            item_dir = CACHE_DIR / f"yt_{youtube_id}"
            item_dir.mkdir(parents=True, exist_ok=True)

            # Verificar si ya está en caché
            cached_stems = get_stems_for_item(item_dir, base_url)
            if cached_stems:
                print(f"⚡ Stems encontrados en caché para {youtube_id}. Retornando inmediatamente.")
                return {"success": True, "cached": True, "stems": cached_stems}

            input_wav = item_dir / "input.wav"
            if not input_wav.exists():
                success_dl = download_youtube_audio(youtube_id, input_wav)
                if not success_dl or not input_wav.exists():
                    raise HTTPException(status_code=500, detail="No se pudo descargar el audio de YouTube")

            success_sep = separate_audio(input_wav, item_dir)
            if not success_sep:
                raise HTTPException(status_code=500, detail="Error durante la separación con Demucs")

            stems = get_stems_for_item(item_dir, base_url)
            if not stems:
                raise HTTPException(status_code=500, detail="No se pudieron localizar los stems generados")

            return {"success": True, "cached": False, "stems": stems}

        # 3. PROCESAMIENTO VÍA ARCHIVO SUBIDO
        if file:
            safe_name = "".join(c for c in file.filename if c.isalnum() or c in "._-")
            item_dir = CACHE_DIR / f"file_{Path(safe_name).stem}"
            item_dir.mkdir(parents=True, exist_ok=True)

            cached_stems = get_stems_for_item(item_dir, base_url)
            if cached_stems:
                return {"success": True, "cached": True, "stems": cached_stems}

            input_wav = item_dir / "input.wav"
            with open(input_wav, "wb") as f:
                shutil.copyfileobj(file.file, f)

            success_sep = separate_audio(input_wav, item_dir)
            if not success_sep:
                raise HTTPException(status_code=500, detail="Error al separar archivo con Demucs")

            stems = get_stems_for_item(item_dir, base_url)
            if not stems:
                raise HTTPException(status_code=500, detail="No se pudieron localizar los stems generados")

            return {"success": True, "cached": False, "stems": stems}

        raise HTTPException(status_code=400, detail="Se requiere youtubeId o un archivo de audio")

    print(f"\n============================================================")
    print(f"🚀 SERVIDOR LOCAL C-STEMS (Meta Demucs v4 + yt-dlp)")
    print(f"URL: http://127.0.0.1:{port}")
    print(f"Caché de Stems: {CACHE_DIR}")
    print(f"============================================================\n")

    uvicorn.run(app, host="127.0.0.1", port=port)


def main():
    import json

    parser = argparse.ArgumentParser(description="Radio Doble C - C-Stems AI Model Separator")
    parser.add_argument("--input", type=str, help="Ruta del archivo de audio a separar")
    parser.add_argument("--youtube-id", type=str, help="ID de YouTube a descargar con yt-dlp y separar en 4 canales")
    parser.add_argument("--output", type=str, default="./stems_output", help="Carpeta de salida")
    parser.add_argument("--model", type=str, default="htdemucs", help="Nombre del modelo (htdemucs, htdemucs_ft)")
    parser.add_argument("--server", action="store_true", help="Iniciar servidor FastAPI local para C-Sampler")
    parser.add_argument("--port", type=int, default=8010, help="Puerto del servidor")
    parser.add_argument("--json", action="store_true", help="Imprimir resultado en formato JSON por stdout")

    args = parser.parse_args()

    if args.server:
        run_server(args.port)
    elif args.youtube_id:
        yt_id = args.youtube_id.strip()
        item_dir = CACHE_DIR / f"yt_{yt_id}"
        item_dir.mkdir(parents=True, exist_ok=True)

        cached = get_stems_for_item(item_dir, base_url="", model_name=args.model)
        if cached:
            if args.json:
                print(json.dumps({"success": True, "cached": True, "stems": cached}))
            else:
                print(f"⚡ Stems en caché: {cached}")
            return

        input_wav = item_dir / "input.wav"
        if not input_wav.exists():
            ok_dl = download_youtube_audio(yt_id, input_wav)
            if not ok_dl or not input_wav.exists():
                if args.json:
                    print(json.dumps({"success": False, "error": "No se pudo descargar el audio de YouTube"}))
                sys.exit(1)

        ok_sep = separate_audio(input_wav, item_dir, args.model)
        if not ok_sep:
            if args.json:
                print(json.dumps({"success": False, "error": "Error durante la separación con Demucs"}))
            sys.exit(1)

        stems = get_stems_for_item(item_dir, base_url="", model_name=args.model)
        if not stems:
            if args.json:
                print(json.dumps({"success": False, "error": "No se encontraron los 4 stems generados"}))
            sys.exit(1)

        if args.json:
            print(json.dumps({"success": True, "cached": False, "stems": stems}))
        else:
            print(f"✅ 4 canales generados: {stems}")
    elif args.input:
        out = Path(args.output)
        out.mkdir(parents=True, exist_ok=True)
        separate_audio(Path(args.input), out, args.model)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
