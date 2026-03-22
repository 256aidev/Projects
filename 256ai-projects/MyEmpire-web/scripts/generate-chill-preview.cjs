/**
 * Generate a 3-minute chill lo-fi track for preview.
 * 85 BPM, Am/F/C/G progression, vinyl warmth, tape wobble.
 * Run: node scripts/generate-chill-preview.cjs
 * Output: public/sounds/chill_sunset_preview.wav
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 180; // 3 minutes
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION;

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ ${path.basename(filePath)} (${(buffer.length / 1024 / 1024).toFixed(1)} MB, ${DURATION}s)`);
}

// ── Oscillators ──
function sine(t, freq) { return Math.sin(2 * Math.PI * freq * t); }
function saw(t, freq) { return 2 * ((t * freq) % 1) - 1; }
function triangle(t, freq) { return 2 * Math.abs(2 * ((t * freq) % 1) - 1) - 1; }
function noise() { return Math.random() * 2 - 1; }

function adsr(t, a, d, s, r, dur) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  if (t < dur) return s * (1 - (t - (dur - r)) / r);
  return 0;
}

function kick(t) {
  if (t < 0 || t > 0.35) return 0;
  const freq = 120 * Math.exp(-t * 25) + 38;
  return sine(t, freq) * Math.exp(-t * 6) * 0.75;
}

function snare(t) {
  if (t < 0 || t > 0.18) return 0;
  return (sine(t, 180) * 0.25 + noise() * 0.6) * Math.exp(-t * 18) * 0.35;
}

function hihat(t, open) {
  if (t < 0 || t > (open ? 0.12 : 0.04)) return 0;
  return noise() * Math.exp(-t * (open ? 25 : 90)) * 0.2;
}

function lowpass(samples, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const out = new Float64Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  }
  return out;
}

// ── Rhodes-like electric piano ──
function rhodes(t, freq, dur) {
  if (t < 0 || t > dur) return 0;
  const env = adsr(t, 0.005, 0.3, 0.35, 0.4, dur);
  // Rhodes = sine + bell harmonics + slight tremolo
  const tremolo = 1 + 0.03 * sine(t, 5.2);
  return (
    sine(t, freq) * 0.6 +
    sine(t, freq * 2) * 0.15 * Math.exp(-t * 4) + // bell
    sine(t, freq * 3) * 0.05 * Math.exp(-t * 6) +
    sine(t, freq * 0.998) * 0.1 // slight detune for warmth
  ) * env * tremolo;
}

// ── Tape wobble (pitch/volume drift) ──
function tapeWobble(t) {
  return 1 + 0.002 * sine(t, 0.3) + 0.001 * sine(t, 0.7) + 0.0005 * sine(t, 1.3);
}

console.log('Generating "Chill Sunset" preview (3 min, 85 BPM)...\n');

const bpm = 85;
const beatLen = 60 / bpm;
const samples = new Float64Array(TOTAL_SAMPLES);

// Am7 → Fmaj7 → Cmaj7 → G7 (classic lo-fi progression)
const chordProgressions = [
  // Am7: A C E G
  { bass: 55.00, notes: [220.00, 261.63, 329.63, 392.00] },
  // Fmaj7: F A C E
  { bass: 43.65, notes: [174.61, 220.00, 261.63, 329.63] },
  // Cmaj7: C E G B
  { bass: 65.41, notes: [261.63, 329.63, 392.00, 493.88] },
  // G7: G B D F
  { bass: 49.00, notes: [196.00, 246.94, 293.66, 349.23] },
];

// Melody fragments (pentatonic A minor: A C D E G)
const melodyNotes = [440, 523.25, 587.33, 659.25, 783.99, 880, 659.25, 523.25];
const melodyPattern = [
  // Each entry: [beatOffset, noteIndex, durationBeats]
  [0, 0, 1], [1.5, 2, 0.5], [2, 4, 1.5],
  [4, 3, 1], [5, 1, 0.5], [5.5, 2, 0.5], [6, 0, 2],
  [8, 5, 1], [9, 4, 1], [10, 3, 1], [11, 1, 1],
  [12, 2, 2], [14, 0, 1], [15, 4, 1],
];

// Second melody variation
const melodyPattern2 = [
  [0, 4, 1.5], [2, 3, 1], [3, 1, 0.5], [3.5, 2, 0.5],
  [4, 0, 2], [6, 5, 1], [7, 3, 1],
  [8, 2, 1.5], [10, 4, 0.5], [10.5, 3, 0.5], [11, 1, 1],
  [12, 0, 1.5], [14, 2, 1], [15, 4, 1],
];

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const wobble = tapeWobble(t);
  const beat = t / beatLen;
  const bar = Math.floor(beat / 4);
  const section = Math.floor(bar / 4); // 4-bar sections
  const chordIdx = bar % 4;
  const chord = chordProgressions[chordIdx];
  const beatIdx = Math.floor(beat);
  const beatFrac = beat - beatIdx;
  const beatInBar = beat % 4;
  let s = 0;

  // ── Fade in (first 8 bars = 32 beats) ──
  const fadeIn = Math.min(1, t / (beatLen * 16));
  // ── Fade out (last 8 bars) ──
  const fadeOut = Math.min(1, (DURATION - t) / (beatLen * 16));

  // ── DRUMS — enter after bar 4, with variations ──
  const drumsActive = bar >= 4;
  if (drumsActive) {
    // Kick: beat 1 and 3, with occasional variation
    const kickPattern = bar % 8 < 6
      ? (beatIdx % 4 === 0 || beatIdx % 4 === 2)
      : (beatIdx % 4 === 0 || beatIdx % 8 === 5); // variation every 2 bars
    if (kickPattern) {
      s += kick(t - beatIdx * beatLen) * 0.65;
    }

    // Snare: beat 2 and 4 (soft)
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      s += snare(t - beatIdx * beatLen) * 0.55;
    }

    // Hihats: 8th notes with swing
    const hhIdx = Math.floor(beat * 2);
    const swingDelay = (hhIdx % 2 === 1) ? 0.02 : 0;
    const hhT = t - (hhIdx * beatLen / 2 + swingDelay);
    const hhOpen = hhIdx % 8 === 3 || hhIdx % 8 === 7; // open on certain offbeats
    s += hihat(hhT, hhOpen) * (hhIdx % 2 === 0 ? 0.25 : 0.15);
  }

  // ── BASS — warm sine bass, follows chord root ──
  const bassActive = bar >= 2;
  if (bassActive) {
    const bassFreq = chord.bass * wobble;
    const bassEnv = adsr(beatInBar * beatLen, 0.02, 0.3, 0.5, 0.3, beatLen * 4);
    s += sine(t, bassFreq) * 0.3 * bassEnv;
    s += sine(t, bassFreq * 2) * 0.05 * bassEnv; // subtle octave
  }

  // ── RHODES CHORDS — the heart of the track ──
  const rhodesActive = bar >= 1;
  if (rhodesActive) {
    const chordBeatPhase = beatInBar * beatLen;
    // Strum effect: slight delay per note
    for (let n = 0; n < chord.notes.length; n++) {
      const noteFreq = chord.notes[n] * wobble;
      const strumDelay = n * 0.015; // 15ms between notes
      const noteT = chordBeatPhase - strumDelay;
      s += rhodes(noteT, noteFreq, beatLen * 3.5) * 0.08;
    }
  }

  // ── MELODY — enters at bar 8, plays pentatonic phrases ──
  const melodyActive = bar >= 8 && bar < (DURATION / (beatLen * 4) - 4);
  if (melodyActive) {
    const melSection = Math.floor((bar - 8) / 4);
    const pattern = melSection % 2 === 0 ? melodyPattern : melodyPattern2;
    const barInPhrase = (bar - 8) % 4;
    const phraseStartBeat = (bar - barInPhrase) * 4;

    for (const [offset, noteIdx, durBeats] of pattern) {
      const noteBeat = phraseStartBeat + offset;
      const noteT = t - noteBeat * beatLen;
      if (noteT >= 0 && noteT < durBeats * beatLen * 1.2) {
        const freq = melodyNotes[noteIdx] * wobble * 0.5; // one octave lower for warmth
        const env = adsr(noteT, 0.01, 0.15, 0.3, 0.2, durBeats * beatLen);
        // Soft sine melody with slight vibrato
        const vibrato = 1 + 0.004 * sine(noteT, 5);
        s += sine(noteT, freq * vibrato) * 0.07 * env;
        s += triangle(noteT, freq * vibrato * 2) * 0.015 * env; // harmonic
      }
    }
  }

  // ── AMBIENT TEXTURE — vinyl crackle + tape hiss ──
  s += noise() * 0.007; // vinyl
  // Occasional crackle pops
  if (Math.random() < 0.00005) {
    s += noise() * 0.04;
  }

  // ── RAIN / AMBIENCE — very subtle background wash ──
  if (bar >= 6) {
    // Filtered noise that sounds like distant rain
    s += noise() * 0.004 * sine(t, 0.1); // modulated noise
  }

  // Apply fades and master volume
  samples[i] = s * fadeIn * fadeOut * 0.85;
}

// Apply lowpass for warmth
const filtered = lowpass(samples, 4500);

// Write output
const outPath = path.join(__dirname, '..', 'public', 'sounds', 'chill_sunset_preview.wav');
writeWav(outPath, filtered);
console.log('\n✅ Done! Preview at: public/sounds/chill_sunset_preview.wav');
console.log('Play it: open the file in any media player to listen before adding to the game.');
