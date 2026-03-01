"""
256ai Sound Engine — FastAPI server for AI-powered audio generation.
Runs on Dragon (10.0.1.147), port 5200.

Endpoints:
  /health           — server status, loaded models, memory
  /generate/voice   — text-to-speech via Kokoro-82M (CPU)
  /generate/sfx     — sound effects via AudioGen (GPU/CPU)
  /generate/music   — music via ACE-Step 1.5 (GPU/CPU)
"""

import json
import os
import time
import uuid
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Config ──────────────────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / "appsettings.json"
with open(CONFIG_PATH) as f:
    CONFIG = json.load(f)

OUTPUT_DIR = Path(CONFIG.get("OutputDirectory", "C:/Projects/256ai.Engine/output/audio"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PORT = CONFIG.get("Port", 5200)
IDLE_UNLOAD_SECONDS = CONFIG.get("IdleUnloadSeconds", 300)
AUTHOR = CONFIG.get("Author", "256ai.xyz")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SoundEngine")

# ── Device detection ────────────────────────────────────────────────────

def get_device():
    """Pick best available device: CUDA > DirectML > CPU."""
    if torch.cuda.is_available():
        logger.info("Using CUDA GPU")
        return torch.device("cuda")
    try:
        import torch_directml
        dml = torch_directml.device()
        logger.info("Using DirectML (AMD GPU)")
        return dml
    except ImportError:
        pass
    logger.info("Using CPU")
    return torch.device("cpu")

DEVICE = get_device()

# ── Model managers ──────────────────────────────────────────────────────

class ModelManager:
    """Lazy-load models, auto-unload after idle timeout to free memory."""

    def __init__(self):
        self._kokoro_pipeline = None
        self._audiogen_model = None
        self._last_used = {}

    def get_kokoro(self):
        """Load Kokoro TTS pipeline (CPU-only, 82M params)."""
        if self._kokoro_pipeline is None:
            logger.info("Loading Kokoro-82M TTS model...")
            start = time.time()
            from kokoro import KPipeline
            self._kokoro_pipeline = KPipeline(lang_code="a")  # 'a' = American English
            logger.info(f"Kokoro loaded in {time.time()-start:.1f}s")
        self._last_used["kokoro"] = time.time()
        return self._kokoro_pipeline

    def get_audiogen(self):
        """Load MusicGen model for sound effects and audio via transformers."""
        if self._audiogen_model is None:
            logger.info("Loading MusicGen model (facebook/musicgen-small) via transformers...")
            start = time.time()
            from transformers import AutoProcessor, MusicgenForConditionalGeneration
            processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
            model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
            # Override default max_length — MusicGen ships with a low cap that
            # silently truncates output. 3000 tokens = ~60s at 50 tokens/sec.
            old_max = getattr(model.generation_config, 'max_length', None)
            model.generation_config.max_length = 3000
            logger.info(f"MusicGen generation_config.max_length: {old_max} -> 3000")
            self._audiogen_model = {"model": model, "processor": processor}
            logger.info(f"MusicGen loaded in {time.time()-start:.1f}s")
        self._last_used["audiogen"] = time.time()
        return self._audiogen_model

    def unload_idle(self):
        """Unload GPU models that haven't been used recently."""
        now = time.time()
        if self._audiogen_model and now - self._last_used.get("audiogen", 0) > IDLE_UNLOAD_SECONDS:
            logger.info("Unloading AudioGen (idle timeout)")
            del self._audiogen_model
            self._audiogen_model = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

    def status(self):
        return {
            "kokoro_loaded": self._kokoro_pipeline is not None,
            "audiogen_loaded": self._audiogen_model is not None,
        }

models = ModelManager()

# ── Request/Response models ─────────────────────────────────────────────

class VoiceRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0
    category: Optional[str] = None

class SfxRequest(BaseModel):
    prompt: str
    duration_seconds: float = 5.0
    category: Optional[str] = None

class MusicRequest(BaseModel):
    tags: str = "ambient, calm"
    lyrics: str = "[instrumental]"
    duration_seconds: float = 30.0
    category: Optional[str] = None

class AudioResponse(BaseModel):
    file_path: str
    file_name: str
    category: str
    duration: float
    sample_rate: int
    type: str

# ── Auto-categorization ─────────────────────────────────────────────

CATEGORY_KEYWORDS = {
    "nature": ["river", "stream", "forest", "tree", "bird", "wind", "leaf", "grass", "mountain",
               "waterfall", "creek", "meadow", "jungle", "wilderness", "field", "garden", "insect",
               "cricket", "cicada", "frog", "campfire", "bonfire"],
    "water": ["ocean", "wave", "rain", "drip", "splash", "underwater", "lake", "pond", "fountain",
              "bubbl", "puddle", "pour", "flood", "tide", "surf", "droplet"],
    "city": ["traffic", "car", "horn", "siren", "street", "city", "urban", "bus", "subway",
             "train", "ambulance", "crowd", "construction", "jackhammer", "engine", "motorcycle",
             "bicycle", "pedestrian", "crosswalk", "highway"],
    "weather": ["thunder", "lightning", "storm", "hail", "blizzard", "tornado", "hurricane",
                "drizzle", "downpour", "snow", "ice"],
    "space": ["space", "cosmic", "alien", "laser", "sci-fi", "scifi", "rocket", "spaceship",
              "warp", "asteroid", "nebula", "galaxy", "planet", "star", "orbit", "shuttle",
              "futuristic", "synthesizer", "electronic pulse"],
    "animals": ["dog", "cat", "wolf", "howl", "bark", "meow", "roar", "lion", "elephant",
                "horse", "cow", "chicken", "owl", "eagle", "whale", "dolphin", "snake",
                "monkey", "bear", "pig", "sheep", "goat"],
    "mechanical": ["machine", "gear", "clock", "tick", "robot", "motor", "factory", "steam",
                   "piston", "hydraulic", "conveyor", "drill", "saw", "hammer", "wrench",
                   "bolt", "metal", "clank", "grind"],
    "industrial": ["warehouse", "loading", "forklift", "crane", "weld", "furnace", "pipe",
                   "valve", "pump", "generator", "compressor", "exhaust"],
    "ambiance": ["ambient", "atmosphere", "background", "cafe", "restaurant", "office",
                 "library", "church", "temple", "market", "mall", "airport", "station",
                 "hospital", "school", "park", "room tone", "white noise", "pink noise"],
    "ui": ["click", "beep", "notification", "alert", "chime", "ding", "pop", "swoosh",
           "swipe", "tap", "toggle", "button", "interface", "menu", "error sound",
           "success", "level up", "game over", "power up", "coin"],
}

def write_wav_with_metadata(file_path: str, audio_data, sample_rate: int,
                            title: str = "", audio_type: str = ""):
    """Write WAV file with 256ai.xyz author metadata."""
    sf.write(file_path, audio_data, sample_rate)
    # Embed metadata via libsndfile INFO chunk
    with sf.SoundFile(file_path, mode='r+') as f:
        f.title = title[:128] if title else audio_type
        f.artist = AUTHOR
        f.comment = f"Generated by 256ai Sound Engine | Type: {audio_type}"
        f.software = "256ai Sound Engine v1.0"
        f.date = time.strftime("%Y-%m-%d")

def categorize_prompt(prompt: str, audio_type: str) -> str:
    """Auto-detect category from prompt text. Returns folder name."""
    if audio_type == "voice":
        return "voice"
    if audio_type == "music":
        return "music"

    prompt_lower = prompt.lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in prompt_lower)
        if score > 0:
            scores[category] = score

    if scores:
        return max(scores, key=scores.get)
    return "misc"

# ── Long audio: segment stitching with crossfade ───────────────────────

SEGMENT_DURATION = 25       # seconds per generated chunk
CROSSFADE_DURATION = 2      # seconds of overlap between chunks
MAX_DURATION = 300           # 5 minutes max

def crossfade_segments(segments: list, sample_rate: int, crossfade_sec: float = CROSSFADE_DURATION) -> np.ndarray:
    """Crossfade and concatenate audio segments into one continuous array."""
    if len(segments) == 1:
        return segments[0]

    crossfade_samples = int(crossfade_sec * sample_rate)
    result = segments[0]

    for seg in segments[1:]:
        overlap = min(crossfade_samples, len(result), len(seg))
        if overlap <= 0:
            result = np.concatenate([result, seg])
            continue

        # Linear crossfade in the overlap region
        fade_out = np.linspace(1.0, 0.0, overlap, dtype=np.float32)
        fade_in = np.linspace(0.0, 1.0, overlap, dtype=np.float32)

        # Blend the tail of result with the head of seg
        blended = result[-overlap:] * fade_out + seg[:overlap] * fade_in
        result = np.concatenate([result[:-overlap], blended, seg[overlap:]])

    return result

def generate_long_audio(model, processor, prompt: str, total_duration: float,
                        tokens_per_second: int = 50) -> tuple:
    """Generate audio longer than 30s by stitching multiple segments."""
    segments = []
    remaining = total_duration

    seg_num = 0
    while remaining > 0:
        seg_dur = min(SEGMENT_DURATION, remaining)
        # Don't generate tiny trailing segments — merge with previous
        if seg_dur < 3.0 and segments:
            break
        seg_num += 1
        logger.info(f"  Generating segment {seg_num}: {seg_dur:.1f}s (remaining: {remaining:.1f}s)")

        max_tokens = int(seg_dur * tokens_per_second)
        inputs = processor(text=[prompt], padding=True, return_tensors="pt")
        audio_values = model.generate(**inputs, max_new_tokens=max_tokens)
        seg_audio = audio_values[0, 0].cpu().numpy()
        segments.append(seg_audio)

        remaining -= seg_dur

    sample_rate = model.config.audio_encoder.sampling_rate
    final_audio = crossfade_segments(segments, sample_rate)
    return final_audio, sample_rate

# ── Lifespan (startup/shutdown) ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Sound Engine starting on port {PORT}")
    logger.info(f"Output directory: {OUTPUT_DIR}")
    logger.info(f"Compute device: {DEVICE}")
    yield
    logger.info("Sound Engine shutting down")

# ── FastAPI app ─────────────────────────────────────────────────────────

app = FastAPI(
    title="256ai Sound Engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static audio file serving ───────────────────────────────────────────

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app.mount("/audio", StaticFiles(directory=str(OUTPUT_DIR)), name="audio")

@app.get("/audio-file/{file_name}")
def get_audio_file(file_name: str):
    """Serve a specific audio file by name (searches all category subfolders)."""
    # Check root dir first (legacy files)
    file_path = OUTPUT_DIR / file_name
    if file_path.exists():
        return FileResponse(str(file_path), media_type="audio/wav")
    # Search subfolders
    for f in OUTPUT_DIR.rglob(file_name):
        return FileResponse(str(f), media_type="audio/wav")
    raise HTTPException(404, f"Audio file not found: {file_name}")

@app.get("/audio-file/{category}/{file_name}")
def get_audio_file_by_category(category: str, file_name: str):
    """Serve a specific audio file from a category folder."""
    file_path = OUTPUT_DIR / category / file_name
    if not file_path.exists():
        raise HTTPException(404, f"Audio file not found: {category}/{file_name}")
    return FileResponse(str(file_path), media_type="audio/wav")

@app.get("/audio-list")
def list_audio_files():
    """List all generated audio files across all categories."""
    files = sorted(OUTPUT_DIR.rglob("*.wav"), key=lambda f: f.stat().st_mtime, reverse=True)
    return [{
        "name": f.name,
        "category": f.parent.name if f.parent != OUTPUT_DIR else "uncategorized",
        "size": f.stat().st_size,
        "modified": f.stat().st_mtime
    } for f in files]

@app.get("/audio-categories")
def list_categories():
    """List all audio categories with file counts."""
    categories = {}
    for d in sorted(OUTPUT_DIR.iterdir()):
        if d.is_dir():
            wavs = list(d.glob("*.wav"))
            categories[d.name] = len(wavs)
    return categories

# ── Health ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "models": models.status(),
        "output_dir": str(OUTPUT_DIR),
    }

# ── Voice/TTS ───────────────────────────────────────────────────────────

@app.post("/generate/voice", response_model=AudioResponse)
def generate_voice(req: VoiceRequest):
    """Generate speech from text using Kokoro-82M (CPU)."""
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    logger.info(f"Generating voice: '{req.text[:80]}...' voice={req.voice} speed={req.speed}")
    start = time.time()

    try:
        pipeline = models.get_kokoro()
        # Kokoro generates audio chunks via generator — fixed 24kHz sample rate
        audio_chunks = []
        sample_rate = 24000
        for chunk in pipeline(req.text, voice=req.voice, speed=req.speed):
            audio_chunks.append(chunk.audio.numpy())

        if not audio_chunks:
            raise HTTPException(500, "No audio generated")

        # Concatenate all chunks
        full_audio = np.concatenate(audio_chunks)

        # Save to category subfolder
        category = req.category or "voice"
        cat_dir = OUTPUT_DIR / category
        cat_dir.mkdir(parents=True, exist_ok=True)
        file_name = f"voice_{uuid.uuid4().hex[:8]}.wav"
        file_path = cat_dir / file_name
        write_wav_with_metadata(str(file_path), full_audio, sample_rate,
                                title=req.text[:128], audio_type="voice")

        duration = len(full_audio) / sample_rate
        elapsed = time.time() - start
        logger.info(f"Voice generated: {duration:.1f}s audio in {elapsed:.1f}s, saved to {category}/{file_name}")

        return AudioResponse(
            file_path=str(file_path),
            file_name=file_name,
            category=category,
            duration=round(duration, 2),
            sample_rate=sample_rate,
            type="voice",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice generation failed: {e}")
        raise HTTPException(500, f"Voice generation failed: {str(e)}")

# ── Sound Effects ───────────────────────────────────────────────────────

@app.post("/generate/sfx", response_model=AudioResponse)
def generate_sfx(req: SfxRequest):
    """Generate sound effects from text description using AudioGen."""
    if not req.prompt.strip():
        raise HTTPException(400, "Prompt cannot be empty")
    if req.duration_seconds < 0.5 or req.duration_seconds > MAX_DURATION:
        raise HTTPException(400, f"Duration must be between 0.5 and {MAX_DURATION} seconds")

    logger.info(f"Generating SFX: '{req.prompt}' duration={req.duration_seconds}s")
    start = time.time()

    try:
        ag = models.get_audiogen()
        model = ag["model"]
        processor = ag["processor"]
        tokens_per_second = 50

        if req.duration_seconds > 30:
            # Long audio — generate segments and crossfade
            logger.info(f"Long SFX: stitching ~{int(req.duration_seconds / SEGMENT_DURATION) + 1} segments")
            audio_data, sample_rate = generate_long_audio(
                model, processor, req.prompt, req.duration_seconds, tokens_per_second)
        else:
            # Single segment
            inputs = processor(text=[req.prompt], padding=True, return_tensors="pt")
            max_tokens = int(req.duration_seconds * tokens_per_second)
            audio_values = model.generate(**inputs, max_new_tokens=max_tokens)
            audio_data = audio_values[0, 0].cpu().numpy()
            sample_rate = model.config.audio_encoder.sampling_rate

        # Save to auto-detected or explicit category subfolder
        category = req.category or categorize_prompt(req.prompt, "sfx")
        cat_dir = OUTPUT_DIR / category
        cat_dir.mkdir(parents=True, exist_ok=True)
        file_name = f"sfx_{uuid.uuid4().hex[:8]}.wav"
        file_path = cat_dir / file_name
        write_wav_with_metadata(str(file_path), audio_data, sample_rate,
                                title=req.prompt[:128], audio_type="sfx")

        duration = len(audio_data) / sample_rate
        elapsed = time.time() - start
        logger.info(f"SFX generated: {duration:.1f}s audio in {elapsed:.1f}s, saved to {category}/{file_name}")

        return AudioResponse(
            file_path=str(file_path),
            file_name=file_name,
            category=category,
            duration=round(duration, 2),
            sample_rate=sample_rate,
            type="sfx",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SFX generation failed: {e}")
        raise HTTPException(500, f"SFX generation failed: {str(e)}")

# ── Music ────────────────────────────────────────────────────────────────

@app.post("/generate/music", response_model=AudioResponse)
def generate_music(req: MusicRequest):
    """Generate music from tags/description using MusicGen."""
    if req.duration_seconds < 0.5 or req.duration_seconds > MAX_DURATION:
        raise HTTPException(400, f"Duration must be between 0.5 and {MAX_DURATION} seconds")

    logger.info(f"Generating music: tags='{req.tags}' duration={req.duration_seconds}s")
    start = time.time()

    try:
        ag = models.get_audiogen()
        model = ag["model"]
        processor = ag["processor"]

        # Build prompt from tags and lyrics
        prompt = req.tags
        if req.lyrics and req.lyrics != "[instrumental]":
            prompt += f", vocal: {req.lyrics}"

        tokens_per_second = 50

        if req.duration_seconds > 30:
            # Long audio — generate segments and crossfade
            logger.info(f"Long music: stitching ~{int(req.duration_seconds / SEGMENT_DURATION) + 1} segments")
            audio_data, sample_rate = generate_long_audio(
                model, processor, prompt, req.duration_seconds, tokens_per_second)
        else:
            # Single segment
            inputs = processor(text=[prompt], padding=True, return_tensors="pt")
            max_tokens = int(req.duration_seconds * tokens_per_second)
            audio_values = model.generate(**inputs, max_new_tokens=max_tokens)
            audio_data = audio_values[0, 0].cpu().numpy()
            sample_rate = model.config.audio_encoder.sampling_rate

        # Save to category subfolder
        category = req.category or "music"
        cat_dir = OUTPUT_DIR / category
        cat_dir.mkdir(parents=True, exist_ok=True)
        file_name = f"music_{uuid.uuid4().hex[:8]}.wav"
        file_path = cat_dir / file_name
        write_wav_with_metadata(str(file_path), audio_data, sample_rate,
                                title=req.tags[:128], audio_type="music")

        duration = len(audio_data) / sample_rate
        elapsed = time.time() - start
        logger.info(f"Music generated: {duration:.1f}s audio in {elapsed:.1f}s, saved to {category}/{file_name}")

        return AudioResponse(
            file_path=str(file_path),
            file_name=file_name,
            category=category,
            duration=round(duration, 2),
            sample_rate=sample_rate,
            type="music",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Music generation failed: {e}")
        raise HTTPException(500, f"Music generation failed: {str(e)}")

# ── Run ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
