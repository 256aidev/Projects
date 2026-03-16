/**
 * Generate procedural music tracks as WAV files.
 * Each track has a unique character: different BPM, key, instruments, patterns.
 * Run: node scripts/generate-music.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 32; // 32 seconds per loop (they loop in-game)
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION;

// ── WAV writer ────────────────────────────────────────────────────────
function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20);  // PCM
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
  console.log(`  ✓ ${path.basename(filePath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

// ── Oscillators ───────────────────────────────────────────────────────
function sine(t, freq) { return Math.sin(2 * Math.PI * freq * t); }
function saw(t, freq) { return 2 * ((t * freq) % 1) - 1; }
function square(t, freq) { return sine(t, freq) > 0 ? 0.5 : -0.5; }
function triangle(t, freq) { return 2 * Math.abs(2 * ((t * freq) % 1) - 1) - 1; }
function noise() { return Math.random() * 2 - 1; }

// ── Envelopes ─────────────────────────────────────────────────────────
function adsr(t, a, d, s, r, dur) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  if (t < dur) return s * (1 - (t - (dur - r)) / r);
  return 0;
}

function kick(t) {
  if (t < 0 || t > 0.3) return 0;
  const freq = 150 * Math.exp(-t * 30) + 40;
  return sine(t, freq) * Math.exp(-t * 8) * 0.9;
}

function snare(t) {
  if (t < 0 || t > 0.2) return 0;
  return (sine(t, 200) * 0.3 + noise() * 0.7) * Math.exp(-t * 15) * 0.6;
}

function hihat(t, open = false) {
  if (t < 0 || t > (open ? 0.15 : 0.05)) return 0;
  return noise() * Math.exp(-t * (open ? 20 : 80)) * 0.3;
}

function sub808(t, freq, dur) {
  if (t < 0 || t > dur) return 0;
  return sine(t, freq) * adsr(t, 0.01, 0.1, 0.7, 0.1, dur) * 0.5;
}

// ── Lowpass filter (simple one-pole) ──────────────────────────────────
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

// ── Track generators ──────────────────────────────────────────────────

function generateTrapEmpire() {
  const bpm = 140;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  const notes = [32.70, 36.71, 38.89, 43.65]; // C1, D1, Eb1, F1

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 4);
    const beatInBar = beat % 4;
    let s = 0;

    // Kick on 1 and 3
    s += kick(t - Math.floor(beat) * beatLen) * ((Math.floor(beat) % 4 === 0 || Math.floor(beat) % 4 === 2) ? 1 : 0);
    // Snare on 2 and 4
    s += snare(t - Math.floor(beat) * beatLen) * ((Math.floor(beat) % 4 === 1 || Math.floor(beat) % 4 === 3) ? 1 : 0);
    // Rapid hihats
    const hhBeat = Math.floor(beat * 4);
    s += hihat(t - hhBeat * beatLen / 4, hhBeat % 4 === 2) * 0.8;
    // 808 bass
    const bassNote = notes[bar % notes.length];
    const bassT = t - bar * 4 * beatLen;
    s += sub808(bassT, bassNote, beatLen * 3) * 1.2;
    // Dark pad
    const padFreq = bassNote * 4;
    s += saw(t, padFreq) * 0.04 * adsr(beatInBar * beatLen, 0.5, 0.5, 0.3, 0.5, beatLen * 4);
    s += sine(t, padFreq * 1.5) * 0.03 * adsr(beatInBar * beatLen, 0.5, 0.5, 0.3, 0.5, beatLen * 4);

    samples[i] = s;
  }
  return lowpass(samples, 8000);
}

function generateMidnightGrind() {
  const bpm = 90;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  const bassNotes = [55, 49, 58.27, 51.91]; // A1, G1, Bb1, Ab1

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 4);
    const beatInBar = beat % 4;
    let s = 0;

    // Soft kick
    s += kick(t - Math.floor(beat) * beatLen) * ((Math.floor(beat) % 4 === 0 || Math.floor(beat) % 4 === 2.5) ? 0.7 : 0) * 0.8;
    // Rim snare on 2 and 4
    const snrBeat = Math.floor(beat);
    if (snrBeat % 4 === 1 || snrBeat % 4 === 3) {
      s += snare(t - snrBeat * beatLen) * 0.4;
    }
    // Slow hihats
    s += hihat(t - Math.floor(beat * 2) * beatLen / 2, false) * 0.5;

    // Warm bass
    const bn = bassNotes[bar % bassNotes.length];
    s += sine(t, bn) * 0.35 * adsr(beatInBar * beatLen, 0.05, 0.3, 0.5, 0.3, beatLen * 4);
    // Moody chord pad
    const chord = bn * 2;
    s += triangle(t, chord) * 0.06;
    s += triangle(t, chord * 1.25) * 0.04; // minor third
    s += triangle(t, chord * 1.5) * 0.03;  // fifth
    // Vinyl crackle
    s += noise() * 0.008;

    samples[i] = s;
  }
  return lowpass(samples, 6000);
}

function generateStreetKing() {
  const bpm = 95;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  const bassNotes = [41.20, 43.65, 36.71, 38.89]; // E1, F1, D1, Eb1

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 4);
    const beatIdx = Math.floor(beat);
    let s = 0;

    // Hard boom bap kick
    if (beatIdx % 4 === 0 || beatIdx % 4 === 2) {
      s += kick(t - beatIdx * beatLen) * 1.1;
    }
    // Snare crack on 2 and 4
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      s += snare(t - beatIdx * beatLen) * 0.9;
    }
    // Off-beat hihats
    const hhIdx = Math.floor(beat * 2);
    if (hhIdx % 2 === 1) {
      s += hihat(t - hhIdx * beatLen / 2, false) * 0.6;
    }
    // Punchy bass
    const bn = bassNotes[bar % bassNotes.length];
    const bassT = (beat % 4) * beatLen;
    s += saw(t, bn) * 0.15 * adsr(bassT, 0.01, 0.1, 0.4, 0.1, beatLen * 2);
    s += sine(t, bn) * 0.3 * adsr(bassT, 0.01, 0.1, 0.4, 0.1, beatLen * 2);
    // Stab synth on beat 1
    if (beatIdx % 8 === 0) {
      const stabT = t - beatIdx * beatLen;
      s += square(t, bn * 4) * 0.08 * adsr(stabT, 0.01, 0.05, 0.2, 0.1, beatLen);
    }

    samples[i] = s;
  }
  return lowpass(samples, 7000);
}

function generateCloudNine() {
  const bpm = 75;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  const chordFreqs = [
    [261.63, 329.63, 392.00], // C maj
    [293.66, 369.99, 440.00], // D maj
    [246.94, 311.13, 369.99], // B min
    [220.00, 277.18, 329.63], // A min
  ];

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 8); // 8-beat bars for dreaminess
    const beatInBar = (beat % 8) * beatLen;
    let s = 0;

    // Very soft kick
    const beatIdx = Math.floor(beat);
    if (beatIdx % 4 === 0) {
      s += kick(t - beatIdx * beatLen) * 0.4;
    }
    // Gentle hihats
    s += hihat(t - Math.floor(beat * 2) * beatLen / 2, true) * 0.15;

    // Lush pad chords
    const chord = chordFreqs[bar % chordFreqs.length];
    for (const freq of chord) {
      s += sine(t, freq) * 0.06 * adsr(beatInBar, 1.0, 1.0, 0.5, 2.0, beatLen * 8);
      s += sine(t, freq * 2.01) * 0.02 * adsr(beatInBar, 1.5, 1.0, 0.3, 2.0, beatLen * 8); // detuned for shimmer
    }
    // Soft arp
    const arpIdx = Math.floor(beat * 2) % chord.length;
    const arpFreq = chord[arpIdx] * 2;
    const arpT = t - Math.floor(beat * 2) * beatLen / 2;
    s += sine(t, arpFreq) * 0.04 * adsr(arpT, 0.02, 0.1, 0.2, 0.1, beatLen / 2);

    // Soft noise floor
    s += noise() * 0.005;

    samples[i] = s;
  }
  return lowpass(samples, 5000);
}

function generateDirtyMoney() {
  const bpm = 110;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  const bassNotes = [30.87, 34.65, 27.50, 32.70]; // B0, Db1, A0, C1

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 4);
    const beatIdx = Math.floor(beat);
    let s = 0;

    // Industrial kick — every beat
    s += kick(t - beatIdx * beatLen) * 0.9;
    // Snare on 2 and 4
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      s += snare(t - beatIdx * beatLen) * 0.7;
    }
    // Rapid closed hihats
    const hhIdx = Math.floor(beat * 4);
    s += hihat(t - hhIdx * beatLen / 4, false) * 0.4;

    // Menacing distorted bass
    const bn = bassNotes[bar % bassNotes.length];
    const bassT = (beat % 4) * beatLen;
    let bass = saw(t, bn) * 0.25 * adsr(bassT, 0.01, 0.2, 0.6, 0.2, beatLen * 3);
    bass = Math.tanh(bass * 3) * 0.3; // soft distortion
    s += bass;

    // Industrial noise hits on beat 1 of every other bar
    if (bar % 2 === 0 && beatIdx % 8 === 0) {
      const nT = t - beatIdx * beatLen;
      if (nT >= 0 && nT < 0.15) {
        s += noise() * 0.15 * Math.exp(-nT * 20);
      }
    }

    // Dark atmospheric pad
    s += sine(t, bn * 8) * 0.02;
    s += sine(t, bn * 12.05) * 0.015; // slightly detuned

    samples[i] = s;
  }
  return lowpass(samples, 6500);
}

function generatePenthouseView() {
  const bpm = 80;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  // Jazz chords: Cmaj7, Dm7, Em7, Fmaj7
  const chords = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7
    [146.83, 174.61, 220.00, 261.63], // Dm7
    [164.81, 196.00, 246.94, 293.66], // Em7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
  ];

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 4);
    const beatInBar = (beat % 4) * beatLen;
    const beatIdx = Math.floor(beat);
    let s = 0;

    // Soft brush kick
    if (beatIdx % 4 === 0 || beatIdx % 4 === 2) {
      s += kick(t - beatIdx * beatLen) * 0.35;
    }
    // Brush snare ghost notes
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      s += snare(t - beatIdx * beatLen) * 0.2;
    }
    // Swing hihats
    const swingOffset = (Math.floor(beat * 3) % 3 === 1) ? 0.03 : 0;
    const hhTime = Math.floor(beat * 3);
    s += hihat(t - hhTime * beatLen / 3 - swingOffset, hhTime % 3 === 2) * 0.2;

    // Jazz chord pad (triangle for warmth)
    const chord = chords[bar % chords.length];
    for (const freq of chord) {
      s += triangle(t, freq) * 0.04 * adsr(beatInBar, 0.3, 0.5, 0.4, 0.5, beatLen * 4);
    }

    // Walking bass
    const bassNote = chord[0] / 2;
    const walkNote = [bassNote, bassNote * 1.25, bassNote * 1.5, bassNote * 1.25];
    const wn = walkNote[beatIdx % 4];
    const walkT = t - beatIdx * beatLen;
    s += sine(t, wn) * 0.25 * adsr(walkT, 0.01, 0.1, 0.5, 0.1, beatLen * 0.9);

    // Vinyl warmth
    s += noise() * 0.006;

    samples[i] = s;
  }
  return lowpass(samples, 5500);
}

function generateBlockParty() {
  const bpm = 105;
  const beatLen = 60 / bpm;
  const samples = new Float64Array(TOTAL_SAMPLES);
  const bassNotes = [65.41, 73.42, 82.41, 73.42]; // C2, D2, E2, D2

  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beat = t / beatLen;
    const bar = Math.floor(beat / 4);
    const beatIdx = Math.floor(beat);
    const beatInBar = (beat % 4) * beatLen;
    let s = 0;

    // Funky kick
    s += kick(t - beatIdx * beatLen) * ((beatIdx % 4 === 0 || beatIdx % 4 === 2 || beatIdx % 8 === 5) ? 0.8 : 0);
    // Snare with ghost notes
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      s += snare(t - beatIdx * beatLen) * 0.7;
    }
    // Open hihats on offbeats
    const hhIdx = Math.floor(beat * 2);
    s += hihat(t - hhIdx * beatLen / 2, hhIdx % 2 === 1) * 0.5;

    // Funky bass
    const bn = bassNotes[bar % bassNotes.length];
    const walkBass = [bn, bn * 1.5, bn, bn * 0.75];
    const wbn = walkBass[beatIdx % 4];
    const bassT = t - beatIdx * beatLen;
    s += saw(t, wbn) * 0.12 * adsr(bassT, 0.01, 0.05, 0.5, 0.05, beatLen * 0.7);
    s += sine(t, wbn) * 0.2 * adsr(bassT, 0.01, 0.05, 0.5, 0.05, beatLen * 0.7);

    // Funky clavinet stabs
    if (beatIdx % 4 === 0 || beatIdx % 4 === 2) {
      const stabT = t - beatIdx * beatLen;
      s += square(t, bn * 4) * 0.06 * adsr(stabT, 0.005, 0.03, 0.3, 0.05, beatLen * 0.3);
      s += square(t, bn * 5) * 0.04 * adsr(stabT, 0.005, 0.03, 0.3, 0.05, beatLen * 0.3);
    }

    // Brass-like stab every 4 bars
    if (bar % 4 === 0 && beatIdx % 16 === 0) {
      const brassT = t - beatIdx * beatLen;
      s += saw(t, bn * 8) * 0.05 * adsr(brassT, 0.02, 0.1, 0.3, 0.2, beatLen * 2);
    }

    samples[i] = s;
  }
  return lowpass(samples, 7500);
}

// ── Main ──────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'sounds');

console.log('Generating music tracks...\n');

const tracks = [
  { name: 'trap_empire', fn: generateTrapEmpire },
  { name: 'midnight_grind', fn: generateMidnightGrind },
  { name: 'street_king', fn: generateStreetKing },
  { name: 'cloud_nine', fn: generateCloudNine },
  { name: 'dirty_money', fn: generateDirtyMoney },
  { name: 'penthouse_view', fn: generatePenthouseView },
  { name: 'block_party', fn: generateBlockParty },
];

for (const track of tracks) {
  const samples = track.fn();
  writeWav(path.join(outDir, `${track.name}.wav`), samples);
}

console.log(`\n✅ Generated ${tracks.length} tracks in ${outDir}`);
