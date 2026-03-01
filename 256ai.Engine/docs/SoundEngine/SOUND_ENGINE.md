# Sound Engine

> **AI-powered local audio generation — voice, sound effects, and music. No third-party services.**

**See also:** [03_EXECUTION_NODES.md](../Worker/03_EXECUTION_NODES.md) — Worker provider details | [API_REFERENCE.md](../ControlPlane/API_REFERENCE.md) — Task submission

---

## Overview

The Sound Engine generates original audio locally on Dragon (10.0.1.147) using open-source AI models. It integrates with the 256ai.Engine as a worker provider (`sound-gen`), so the lead agent can dispatch sound tasks alongside code tasks.

**Two components:**
1. **Sound API Server** — Python/FastAPI service (port 5200) that loads AI models and generates audio
2. **Sound Worker** — Engine.Worker instance with `Provider: sound-gen` that bridges the Control Plane to the Sound API

---

## Architecture

```
                  Control Plane (:5100)
                         |
          +--------------+--------------+
          |                             |
    Code Workers                Sound Worker
    (claude-code / ollama)      (worker-dragon-sound-001)
                                Provider: sound-gen
                                        |
                                Sound API Server
                                Python / FastAPI
                                Port 5200
                                        |
                          +-------------+-------------+
                          |             |             |
                      Kokoro-82M    MusicGen     MusicGen
                      (Voice/TTS)   (SFX)       (Music)
                      CPU only      CPU          CPU
```

---

## AI Models

| Model | Purpose | License | Compute | Sample Rate |
|-------|---------|---------|---------|-------------|
| **Kokoro-82M** | Voice/TTS — text to speech | Apache 2.0 | CPU only (82M params) | 24 kHz |
| **MusicGen-small** | Sound effects — text to audio | MIT | CPU (300M params) | 32 kHz |
| **MusicGen-small** | Music — tags/description to song | MIT | CPU (shared with SFX) | 32 kHz |

Models are lazy-loaded on first request and cached in memory. MusicGen auto-unloads after 5 minutes idle to free RAM.

**Model storage:** HuggingFace cache at `C:\Users\h1naz.DRAGON\.cache\huggingface\hub\`

---

## Sound API Endpoints

**Base URL:** `http://localhost:5200` (Dragon only) or `http://10.0.1.147:5200` (network)

### Health

```
GET /health
```
Returns: `{ status, device, models: { kokoro_loaded, audiogen_loaded }, output_dir }`

### Voice/TTS

```
POST /generate/voice
{
  "text": "Hello, welcome to 256 AI",
  "voice": "af_heart",    // optional, default: af_heart
  "speed": 1.0,           // optional, default: 1.0
  "category": "voice"     // optional, auto-detected if omitted
}
```
Returns: `{ file_path, file_name, category, duration, sample_rate, type: "voice" }`

**Available voices:** `af_heart`, `af_bella`, `af_nicole`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bm_george` (Kokoro built-in, American/British English)

### Sound Effects

```
POST /generate/sfx
{
  "prompt": "ocean waves crashing on rocks",
  "duration_seconds": 5.0,   // 0.5 - 300 seconds (auto-stitched beyond 30s)
  "category": "water"        // optional, auto-detected from prompt if omitted
}
```
Returns: `{ file_path, file_name, category, duration, sample_rate, type: "sfx" }`

**Good prompts:** Be descriptive. "crickets chirping at night in a forest" works better than just "crickets".

### Music

```
POST /generate/music
{
  "tags": "calm ambient piano, peaceful nature",
  "lyrics": "[instrumental]",     // or actual lyrics
  "duration_seconds": 10.0,
  "category": "music"            // optional, defaults to "music"
}
```
Returns: `{ file_path, file_name, category, duration, sample_rate, type: "music" }`

### Audio Files

```
GET /audio/{category}/{file_name}          # Stream from static mount (e.g. /audio/nature/sfx_abc.wav)
GET /audio-file/{file_name}                # Serve by name (searches all categories)
GET /audio-file/{category}/{file_name}     # Serve from specific category
GET /audio-list                            # List all files across all categories
GET /audio-categories                      # List categories with file counts
```

---

## Audio Output Structure

Generated audio is auto-categorized into subfolders based on prompt content. The `category` field can also be set explicitly in the request.

```
output/audio/
├── voice/          # All TTS/speech output
├── music/          # Generated music
├── nature/         # Rivers, forests, birds, campfire, insects
├── water/          # Ocean, rain, waves, splashing, fountains
├── city/           # Traffic, sirens, crowds, construction
├── ambiance/       # Ambient backgrounds, cafes, offices, white noise
├── space/          # Sci-fi, cosmic, lasers, spaceships
├── weather/        # Thunder, storms, wind, rain, snow
├── animals/        # Dogs, cats, wolves, birds, wildlife
├── mechanical/     # Machines, gears, clocks, robots, motors
├── industrial/     # Factories, warehouses, generators
├── ui/             # UI sounds, beeps, clicks, notifications, game SFX
└── misc/           # Anything that doesn't match a category
```

**Auto-detection rules:** The Sound API scans the prompt for keywords and scores each category. The highest-scoring category wins. Examples:
- "running river flowing over rocks" → **nature** (river, stream)
- "ocean waves crashing" → **water** (ocean, wave)
- "city traffic at rush hour" → **city** (city, traffic)
- "thunderstorm with heavy rain" → **weather** (thunder, storm)
- "dog barking in the distance" → **animals** (dog, bark)
- "spaceship engine powering up" → **space** (spaceship)
- "button click notification" → **ui** (click, notification)

**Override:** Pass `"category": "nature"` (or any folder name) in the request to skip auto-detection.

---

## Worker Configuration

The sound worker uses provider `sound-gen` and connects to the Sound API.

**Config file:** `publish/dragon-sound-worker-appsettings.json`

```json
{
  "Worker": {
    "WorkerId": "worker-dragon-sound-001",
    "Domains": ["sound", "audio", "sfx", "voice", "music", "tts"],
    "MaxConcurrentTasks": 1,
    "Role": "sound-gen",
    "Provider": "sound-gen",
    "SoundApiUrl": "http://localhost:5200",
    "DefaultTimeoutSeconds": 600
  }
}
```

**How type detection works:** The worker auto-detects audio type from the task objective:
- Contains "voice", "speak", "say", "tts", "narrat" → **voice**
- Contains "music", "song", "melody", "beat" → **music**
- Everything else → **sfx** (default)
- Override: pass `inputs.type` = `"voice"` | `"sfx"` | `"music"`

---

## Submitting Sound Tasks

Via the Control Plane API:

```bash
# Sound effect
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Generate ocean waves crashing", "domain": "sound", "expectedOutputs": "WAV audio file"}'

# Voice/TTS
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Say welcome to the platform", "domain": "voice", "expectedOutputs": "WAV audio file", "inputs": {"type": "voice", "text": "Welcome to the 256 AI platform.", "voice": "af_heart"}}'

# Music
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Generate calm ambient music", "domain": "music", "expectedOutputs": "WAV audio file", "inputs": {"type": "music", "tags": "calm ambient piano", "duration": "15"}}'
```

---

## File Locations

| What | Path |
|------|------|
| Sound API source | `src/Engine.SoundApi/main.py` |
| Sound API config | `src/Engine.SoundApi/appsettings.json` |
| Python venv | `src/Engine.SoundApi/.venv/` |
| Sound worker config | `publish/dragon-sound-worker-appsettings.json` |
| Sound worker binary | `publish/sound-worker-win-x64/` |
| Generated audio output | `C:\Projects\256ai.Engine\output\audio\{category}\` |
| Start script (API) | `publish/start-sound-api.bat` |
| Start script (Worker) | `publish/start-sound-worker.bat` |

---

## Running Manually

```bash
# 1. Start the Sound API server
cd C:\Projects\256ai.Engine\src\Engine.SoundApi
.venv\Scripts\python.exe main.py
# Runs on http://0.0.0.0:5200

# 2. Start the Sound Worker
cd C:\Projects\256ai.Engine\publish\sound-worker-win-x64
Engine.Worker.exe
# Polls Control Plane for sound tasks
```

Both are in Dragon's Windows Startup folder for auto-start on reboot.

---

## Dashboard Integration

When viewing a completed sound task in the dashboard, an embedded audio player appears below the output JSON. The player streams audio from the Sound API's static file endpoint (`http://{host}:5200/audio/{file_name}`).

---

## Duration Limits & Long Audio

| Type | Min | Max per segment | Max total | How |
|------|-----|-----------------|-----------|-----|
| **Voice/TTS** | — | unlimited | unlimited | Kokoro streams chunks natively |
| **Sound Effects** | 0.5s | 25s | **300s (5 min)** | Auto-stitched with 2s crossfade |
| **Music** | 0.5s | 25s | **300s (5 min)** | Auto-stitched with 2s crossfade |

**How stitching works:** For requests > 30 seconds, the API generates multiple ~25-second segments using the same prompt and crossfades them with a 2-second linear blend at each junction. This produces seamless long-form audio from a model that natively maxes out around 30 seconds per generation.

---

## Performance (CPU-only on Dragon)

| Type | Generation Time | Audio Duration | Notes |
|------|----------------|----------------|-------|
| Voice/TTS | ~5s | ~7s | Faster than real-time |
| Sound Effects | ~15s | ~5s | MusicGen model load ~30s first time |
| Music | ~20s | ~10s | Shares MusicGen model with SFX |
| Long SFX/Music | ~15s per segment | 25s per segment | e.g. 75s = 3 segments = ~45s gen time |

---

## Future: Visual Models

The same architecture (Python API server + engine provider) extends to visual generation:
- Add `visual-gen` provider to Engine.Worker
- Add `/generate/image` and `/generate/video` endpoints
- Same lazy-load + auto-unload pattern for GPU memory

---

*Last updated: 2026-02-23*
