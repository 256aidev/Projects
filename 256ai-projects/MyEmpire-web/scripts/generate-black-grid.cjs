/**
 * "Black Grid Protocol" — 10-minute Dark Tech / Industrial / Cyberpunk track
 * 132-140 BPM, D minor, 7 distinct sections with energy curve
 * Run: node scripts/generate-black-grid.cjs
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 600; // 10 minutes
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION;

console.log(`Generating "Black Grid Protocol" (${DURATION}s, ${(TOTAL_SAMPLES / 1e6).toFixed(1)}M samples)...\n`);
const startTime = Date.now();

// ═══════════════════════════════════════════════════════════════════
// WAV WRITER
// ═══════════════════════════════════════════════════════════════════
function writeWav(filePath, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24); buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
  console.log(`  ✓ ${path.basename(filePath)} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}

// ═══════════════════════════════════════════════════════════════════
// DSP TOOLKIT
// ═══════════════════════════════════════════════════════════════════

// ── Oscillators ──
function sine(t, freq) { return Math.sin(2 * Math.PI * freq * t); }
function saw(t, freq) { return 2 * ((t * freq) % 1) - 1; }
function square(t, freq) { return sine(t, freq) > 0 ? 0.5 : -0.5; }
function triangle(t, freq) { return 2 * Math.abs(2 * ((t * freq) % 1) - 1) - 1; }
function noise() { return Math.random() * 2 - 1; }

// ── Envelope ──
function adsr(t, a, d, s, r, dur) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  if (t < dur) return s * (1 - (t - (dur - r)) / r);
  return 0;
}

// ── Distortion ──
function distort(x, drive) { return Math.tanh(drive * x); }
function bitcrush(x, bits) { const q = Math.pow(2, bits); return Math.floor(x * q) / q; }
function foldback(x, threshold) {
  while (Math.abs(x) > threshold) x = threshold * 2 - Math.abs(x);
  return x;
}

// ── Filters ──
function lowpass(samples, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const out = new Float64Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) out[i] = out[i - 1] + alpha * (samples[i] - out[i - 1]);
  return out;
}

function highpass(samples, cutoff) {
  const lp = lowpass(samples, cutoff);
  const out = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] - lp[i];
  return out;
}

// Per-sample dynamic lowpass (cutoff changes over time)
function dynamicLowpass(samples, getCutoff) {
  const out = new Float64Array(samples.length);
  let prev = 0;
  for (let i = 0; i < samples.length; i++) {
    const cutoff = getCutoff(i);
    const rc = 1 / (2 * Math.PI * cutoff);
    const alpha = (1 / SAMPLE_RATE) / (rc + 1 / SAMPLE_RATE);
    prev = prev + alpha * (samples[i] - prev);
    out[i] = prev;
  }
  return out;
}

// ── Reverb (Schroeder) ──
function schroederReverb(samples, roomSize, damping, wet) {
  const out = new Float64Array(samples.length);
  // 4 parallel comb filters
  const combDelays = [1557, 1617, 1491, 1422].map(d => Math.round(d * roomSize));
  const combs = combDelays.map(d => ({ buf: new Float64Array(d), idx: 0 }));
  // 2 series allpass filters
  const apDelays = [225, 556].map(d => Math.round(d * roomSize));
  const allpasses = apDelays.map(d => ({ buf: new Float64Array(d), idx: 0 }));

  for (let i = 0; i < samples.length; i++) {
    let combSum = 0;
    for (const c of combs) {
      const delayed = c.buf[c.idx];
      c.buf[c.idx] = samples[i] + delayed * damping;
      c.idx = (c.idx + 1) % c.buf.length;
      combSum += delayed;
    }
    combSum /= combs.length;
    // Allpass cascade
    let ap = combSum;
    for (const a of allpasses) {
      const delayed = a.buf[a.idx];
      const input = ap + delayed * 0.5;
      a.buf[a.idx] = input;
      ap = delayed - ap * 0.5;
      a.idx = (a.idx + 1) % a.buf.length;
    }
    out[i] = samples[i] * (1 - wet) + ap * wet;
  }
  return out;
}

// ── Drums ──
function industrialKick(t, intensity) {
  if (t < 0 || t > 0.4) return 0;
  const freq = 180 * Math.exp(-t * 35) + 35;
  let s = sine(t, freq) * Math.exp(-t * 5) * 0.9;
  s += sine(t, freq * 0.5) * Math.exp(-t * 3) * 0.4; // sub layer
  s = distort(s * (1 + intensity * 0.5), 2 + intensity * 3); // gritty distortion
  return s * 0.8;
}

function industrialSnare(t) {
  if (t < 0 || t > 0.25) return 0;
  const body = sine(t, 220) * 0.3 + sine(t, 340) * 0.15; // metallic body
  const noiseLayer = noise() * 0.7;
  let s = (body + noiseLayer) * Math.exp(-t * 12);
  s = distort(s, 2.5); // gritty
  return s * 0.55;
}

function glitchHat(t, pattern) {
  if (t < 0) return 0;
  const dur = pattern === 'open' ? 0.1 : pattern === 'glitch' ? 0.02 : 0.035;
  if (t > dur) return 0;
  const decay = pattern === 'open' ? 20 : pattern === 'glitch' ? 150 : 80;
  let s = noise() * Math.exp(-t * decay);
  if (pattern === 'glitch') s = bitcrush(s, 4); // crushed
  return s * 0.3;
}

// ── Bass ──
function reeseBass(t, freq, detuneCents, dur) {
  if (t < 0 || t > dur) return 0;
  const env = adsr(t, 0.01, 0.15, 0.7, 0.1, dur);
  const ratio = Math.pow(2, detuneCents / 1200);
  const v1 = saw(t, freq);
  const v2 = saw(t, freq * ratio);
  const v3 = saw(t, freq / ratio);
  return (v1 + v2 + v3) / 3 * env;
}

function subBass(t, freq, dur) {
  if (t < 0 || t > dur) return 0;
  const env = adsr(t, 0.01, 0.1, 0.8, 0.15, dur);
  return sine(t, freq) * env * 0.6;
}

// ── Synths ──
function darkPad(t, freqs, dur) {
  if (t < 0 || t > dur) return 0;
  const env = adsr(t, 1.0, 0.5, 0.5, 1.5, dur);
  let s = 0;
  for (const f of freqs) {
    s += saw(t, f) * 0.06;
    s += sine(t, f * 1.002) * 0.03; // detuned shimmer
  }
  return s * env;
}

function alarmLead(t, freq, dur) {
  if (t < 0 || t > dur) return 0;
  const env = adsr(t, 0.005, 0.1, 0.6, 0.1, dur);
  const vibrato = 1 + 0.02 * sine(t, 6);
  let s = saw(t, freq * vibrato) * 0.15 + square(t, freq * vibrato * 2.01) * 0.08;
  return distort(s, 1.5) * env;
}

function robotArp(t, freq, dur) {
  if (t < 0 || t > dur) return 0;
  const env = adsr(t, 0.002, 0.04, 0.3, 0.02, dur);
  return square(t, freq) * 0.1 * env;
}

// ═══════════════════════════════════════════════════════════════════
// TRACK SECTIONS
// ═══════════════════════════════════════════════════════════════════

// D minor scale frequencies (octave 2-4)
const D2 = 73.42, F2 = 87.31, A2 = 110.00, Bb2 = 116.54, C3 = 130.81;
const D3 = 146.83, F3 = 174.61, A3 = 220.00, D4 = 293.66, F4 = 349.23, A4 = 440.00;

// Chord voicings (D minor palette)
const CHORDS = {
  Dm:  [D3, F3, A3],
  Am:  [A2, C3 * 2, D3 * 2],   // A minor with D color
  Bb:  [Bb2, D3, F3],
  Gm:  [D2 * 3, Bb2 * 2, D3],
  C:   [C3, D3 * 1.2, A3 * 0.75],
};

// Arpeggio patterns
const ARP_NOTES = [D3, F3, A3, D4, A3, F3, D4, F4];

function getSection(t) {
  if (t < 90)  return { id: 'boot', intensity: 0, bpm: 132 };
  if (t < 180) return { id: 'online', intensity: 0.3, bpm: 132 };
  if (t < 270) return { id: 'drop1', intensity: 0.7, bpm: 134 };
  if (t < 330) return { id: 'chaos', intensity: 0.5, bpm: 134 };
  if (t < 450) return { id: 'drop2', intensity: 0.9, bpm: 136 };
  if (t < 510) return { id: 'psycho', intensity: 0.1, bpm: 136 };
  return { id: 'final', intensity: 1.0, bpm: 140 };
}

function getBpm(t) {
  // Smooth BPM transitions
  const sec = getSection(t);
  return sec.bpm;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SYNTHESIS
// ═══════════════════════════════════════════════════════════════════

const mainBus = new Float64Array(TOTAL_SAMPLES);
const bassBus = new Float64Array(TOTAL_SAMPLES);
const padBus = new Float64Array(TOTAL_SAMPLES);
const kickPositions = []; // for sidechain

console.log('  Synthesizing sections...');

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  const sec = getSection(t);
  const bpm = sec.bpm;
  const beatLen = 60 / bpm;
  const beat = t / beatLen;
  const bar = Math.floor(beat / 4);
  const beatIdx = Math.floor(beat);
  const beatFrac = beat - beatIdx;
  const beatInBar = beat % 4;
  const barInSection = bar % 8;

  let drums = 0, bass = 0, synth = 0, fx = 0;

  // ── Global fade in/out ──
  const fadeIn = Math.min(1, t / 8);
  const fadeOut = Math.min(1, (DURATION - t) / 5);

  // ══════════════════════════════════════════════
  // SECTION: BOOT SEQUENCE (0:00 - 1:30)
  // ══════════════════════════════════════════════
  if (sec.id === 'boot') {
    const progress = t / 90; // 0→1

    // Deep sub rumble — slowly builds
    bass += sine(t, D2 * 0.5) * 0.15 * progress;
    bass += sine(t, D2 * 0.5 * 1.003) * 0.1 * progress; // beating

    // Distant pulses — metallic pings
    if (beatIdx % 8 === 0 && t > 10) {
      const pingT = t - beatIdx * beatLen;
      synth += sine(t, D4 * 2) * 0.03 * Math.exp(-pingT * 8) * progress;
    }

    // Glitch noise bursts — random
    if (Math.random() < 0.0001 * progress) {
      fx += noise() * 0.08 * Math.exp(-beatFrac * 20);
    }

    // Heartbeat kick — starts at 60 seconds, very soft
    if (t > 60) {
      const hbProgress = (t - 60) / 30;
      // Double-tap heartbeat pattern
      const hbBeat = Math.floor(t / (beatLen * 2));
      const hbPhase = (t / (beatLen * 2)) % 1;
      if (hbPhase < 0.15) {
        drums += industrialKick(hbPhase * beatLen * 2, 0) * 0.25 * hbProgress;
      } else if (hbPhase > 0.2 && hbPhase < 0.35) {
        drums += industrialKick((hbPhase - 0.2) * beatLen * 2, 0) * 0.15 * hbProgress;
      }
    }

    // Server hum
    synth += sine(t, 60) * 0.02 * progress; // 60Hz hum
    synth += sine(t, 120) * 0.01 * progress;

    // Data corruption sounds — increasing
    if (t > 30 && Math.random() < 0.00003 * progress) {
      fx += bitcrush(noise(), 3) * 0.06;
    }
  }

  // ══════════════════════════════════════════════
  // SECTION: SYSTEM ONLINE (1:30 - 3:00)
  // ══════════════════════════════════════════════
  else if (sec.id === 'online') {
    const progress = (t - 90) / 90;

    // Steady kick — on 1 and 3
    if (beatIdx % 4 === 0 || beatIdx % 4 === 2) {
      const kT = t - beatIdx * beatLen;
      drums += industrialKick(kT, 0.3) * 0.5;
      if (kT < 0.01) kickPositions.push(i);
    }

    // Minimal hi-hats — 8th notes
    const hhIdx = Math.floor(beat * 2);
    drums += glitchHat(t - hhIdx * beatLen / 2, 'closed') * 0.5 * progress;

    // Bass creeps in
    const bassNote = [D2, D2, Bb2 * 0.5, A2 * 0.5][bar % 4];
    bass += subBass(beatInBar * beatLen, bassNote, beatLen * 4) * 0.3 * progress;

    // Dark pad — very quiet, filtered
    const chordNotes = bar % 4 < 2 ? CHORDS.Dm : CHORDS.Bb;
    synth += darkPad(beatInBar * beatLen, chordNotes, beatLen * 4) * 0.3 * progress;

    // Build tension — rising filter sweep at end
    if (t > 160) {
      const riseProgress = (t - 160) / 20;
      synth += noise() * 0.03 * riseProgress; // rising noise
      fx += sine(t, 200 + riseProgress * 2000) * 0.02 * riseProgress; // rising tone
    }
  }

  // ══════════════════════════════════════════════
  // SECTION: FIRST DROP (3:00 - 4:30)
  // ══════════════════════════════════════════════
  else if (sec.id === 'drop1') {
    // Full drums
    if (beatIdx % 4 === 0 || beatIdx % 4 === 2) {
      const kT = t - beatIdx * beatLen;
      drums += industrialKick(kT, 0.7) * 0.7;
      if (kT < 0.01) kickPositions.push(i);
    }
    // Snare on 2 and 4
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      drums += industrialSnare(t - beatIdx * beatLen) * 0.7;
    }
    // Hi-hats — 16th notes with glitch variation
    const hh16 = Math.floor(beat * 4);
    const hhType = hh16 % 4 === 3 ? 'glitch' : hh16 % 8 === 4 ? 'open' : 'closed';
    drums += glitchHat(t - hh16 * beatLen / 4, hhType) * 0.7;

    // Bass fully engaged — reese + sub
    const bassNote = [D2, D2, F2, A2 * 0.5][bar % 4];
    bass += reeseBass(beatInBar * beatLen, bassNote, 15, beatLen * 3) * 0.25;
    bass += subBass(beatInBar * beatLen, bassNote, beatLen * 3.5) * 0.35;

    // Main synth riff — arpeggio
    const arpIdx = Math.floor(beat * 2) % ARP_NOTES.length;
    const arpT = t - Math.floor(beat * 2) * beatLen / 2;
    synth += robotArp(arpT, ARP_NOTES[arpIdx], beatLen / 2) * 0.8;

    // Dark pad underneath
    const chordNotes = bar % 4 < 2 ? CHORDS.Dm : CHORDS.Gm;
    synth += darkPad(beatInBar * beatLen, chordNotes, beatLen * 4) * 0.4;

    // Rhythmic glitch hits every 2 bars
    if (barInSection % 2 === 1 && beatIdx % 4 === 3) {
      fx += bitcrush(noise(), 3) * 0.1 * Math.exp(-beatFrac * 30);
    }
  }

  // ══════════════════════════════════════════════
  // SECTION: DIGITAL CHAOS (4:30 - 5:30)
  // ══════════════════════════════════════════════
  else if (sec.id === 'chaos') {
    const progress = (t - 270) / 60;

    // Stripped drums — kick on 1 only, erratic
    if (beatIdx % 8 === 0) {
      const kT = t - beatIdx * beatLen;
      drums += industrialKick(kT, 0.5) * 0.4;
      if (kT < 0.01) kickPositions.push(i);
    }
    // Glitch stuttered hats
    const hh32 = Math.floor(beat * 8);
    if (hh32 % 3 !== 0) { // irregular pattern
      drums += glitchHat(t - hh32 * beatLen / 8, 'glitch') * 0.5;
    }

    // Distortion sweeps — rising then falling
    const sweepFreq = 100 + Math.sin(t * 0.5) * 80 + progress * 200;
    fx += distort(sine(t, sweepFreq) * 0.1, 3 + progress * 2) * 0.15;

    // Unstable bass — glitching
    const bassNote = D2;
    bass += subBass(beatInBar * beatLen, bassNote, beatLen * 2) * 0.2;
    if (Math.random() < 0.001) bass += noise() * 0.15; // bass glitch

    // Creepy detuned pad
    synth += sine(t, D3 * 1.01) * 0.04 + sine(t, D3 * 0.99) * 0.04;
    synth += sine(t, A3 * 1.02) * 0.02;

    // Data corruption bursts
    if (Math.random() < 0.0005) {
      fx += bitcrush(noise() * 0.2, 2);
    }

    // Build to second drop — last 10 seconds
    if (t > 320) {
      const ramp = (t - 320) / 10;
      drums += industrialSnare(t - Math.floor(beat * (2 + ramp * 6)) * beatLen / (2 + ramp * 6)) * 0.3 * ramp;
      fx += noise() * 0.04 * ramp;
    }
  }

  // ══════════════════════════════════════════════
  // SECTION: SECOND DROP (5:30 - 7:30) — HEAVIER
  // ══════════════════════════════════════════════
  else if (sec.id === 'drop2') {
    // Harder kick
    if (beatIdx % 4 === 0 || beatIdx % 4 === 2 || (barInSection % 2 === 1 && beatIdx % 8 === 5)) {
      const kT = t - beatIdx * beatLen;
      drums += industrialKick(kT, 1.0) * 0.8;
      if (kT < 0.01) kickPositions.push(i);
    }
    // Snare — harder
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      drums += industrialSnare(t - beatIdx * beatLen) * 0.8;
    }
    // Double-time hi-hats (32nd notes) with trap rolls
    const hh32 = Math.floor(beat * 8);
    const hhType2 = hh32 % 8 === 7 ? 'open' : hh32 % 5 === 0 ? 'glitch' : 'closed';
    drums += glitchHat(t - hh32 * beatLen / 8, hhType2) * 0.6;

    // Trap roll every 8 bars
    if (barInSection === 7 && beatInBar > 3) {
      const rollSpeed = Math.floor(beat * 16);
      drums += glitchHat(t - rollSpeed * beatLen / 16, 'closed') * 0.4;
    }

    // New heavier bass layer
    const bassNote = [D2, F2, D2, A2 * 0.5][bar % 4];
    bass += reeseBass(beatInBar * beatLen, bassNote, 25, beatLen * 3) * 0.3; // wider detune
    bass += subBass(beatInBar * beatLen, bassNote, beatLen * 3.5) * 0.4;
    // Additional gritty bass layer
    const bassT = beatInBar * beatLen;
    bass += distort(saw(t, bassNote) * 0.15 * adsr(bassT, 0.01, 0.2, 0.5, 0.2, beatLen * 3), 3) * 0.2;

    // Alarm lead — every 4 bars
    if (barInSection % 4 < 2) {
      const leadNote = [D4, F4, D4, A3][barInSection % 4];
      synth += alarmLead(beatInBar * beatLen, leadNote, beatLen * 2) * 0.5;
    }

    // Faster arpeggio
    const arpIdx = Math.floor(beat * 4) % ARP_NOTES.length;
    const arpT = t - Math.floor(beat * 4) * beatLen / 4;
    synth += robotArp(arpT, ARP_NOTES[arpIdx] * 2, beatLen / 4) * 0.5;

    // Pad
    const chordNotes = bar % 4 < 2 ? CHORDS.Dm : CHORDS.Am;
    synth += darkPad(beatInBar * beatLen, chordNotes, beatLen * 4) * 0.3;

    // Rhythm switch every 8 bars — fake drop
    if (barInSection === 3 && beatInBar > 3.5) {
      drums *= 0.1; // momentary silence before slamming back
      fx += noise() * 0.05;
    }
  }

  // ══════════════════════════════════════════════
  // SECTION: PSYCHO BREAK (7:30 - 8:30)
  // ══════════════════════════════════════════════
  else if (sec.id === 'psycho') {
    const progress = (t - 450) / 60;

    // Almost no drums — just distant thuds
    if (beatIdx % 16 === 0) {
      const kT = t - beatIdx * beatLen;
      drums += industrialKick(kT, 0.2) * 0.2;
      if (kT < 0.01) kickPositions.push(i);
    }

    // Creepy dark ambient
    synth += sine(t, D2) * 0.06 * (1 + 0.3 * sine(t, 0.15)); // pulsing sub
    synth += sine(t, D3 * 1.005) * 0.03;
    synth += sine(t, A3 * 0.998) * 0.02;
    synth += triangle(t, F3 * 0.5) * 0.02 * sine(t, 0.2);

    // Uncomfortable high tones
    synth += sine(t, 3000 + sine(t, 0.3) * 500) * 0.008 * progress;
    synth += sine(t, 7000 + sine(t, 0.1) * 1000) * 0.003;

    // Static / radio chatter
    if (Math.random() < 0.0002) {
      fx += noise() * 0.06 * Math.exp(-beatFrac * 50);
    }

    // Tension rebuild — last 15 seconds
    if (t > 495) {
      const ramp = (t - 495) / 15;
      drums += industrialKick(t - Math.floor(beat * (1 + ramp * 7)) * beatLen / (1 + ramp * 7), 0.3 + ramp * 0.7) * 0.3 * ramp;
      bass += sine(t, D2) * 0.15 * ramp;
      fx += noise() * 0.06 * ramp * ramp;
      synth += sine(t, 200 + ramp * 3000) * 0.03 * ramp; // rising tone
    }
  }

  // ══════════════════════════════════════════════
  // SECTION: FINAL DROP (8:30 - 10:00) — FULL WAR
  // ══════════════════════════════════════════════
  else if (sec.id === 'final') {
    const progress = (t - 510) / 90;

    // Hardest kick — every beat
    if (beatIdx % 2 === 0 || (progress > 0.5 && beatIdx % 4 !== 1)) {
      const kT = t - beatIdx * beatLen;
      drums += industrialKick(kT, 1.5) * 0.85;
      if (kT < 0.01) kickPositions.push(i);
    }
    // Brutal snare
    if (beatIdx % 4 === 1 || beatIdx % 4 === 3) {
      drums += industrialSnare(t - beatIdx * beatLen) * 0.9;
    }
    // Chaotic hi-hats
    const hh32 = Math.floor(beat * 8);
    drums += glitchHat(t - hh32 * beatLen / 8, hh32 % 3 === 0 ? 'glitch' : 'closed') * 0.7;

    // Layer EVERYTHING — max bass
    const bassNote = [D2, D2, F2, D2][bar % 4];
    bass += reeseBass(beatInBar * beatLen, bassNote, 30, beatLen * 3) * 0.35;
    bass += subBass(beatInBar * beatLen, bassNote, beatLen * 3.5) * 0.45;
    bass += distort(saw(t, bassNote) * 0.2 * adsr(beatInBar * beatLen, 0.01, 0.2, 0.6, 0.2, beatLen * 3), 4) * 0.25;

    // All synths active
    const arpIdx = Math.floor(beat * 4) % ARP_NOTES.length;
    synth += robotArp(t - Math.floor(beat * 4) * beatLen / 4, ARP_NOTES[arpIdx] * 2, beatLen / 4) * 0.6;
    synth += alarmLead(beatInBar * beatLen, [D4, F4, A4, D4][bar % 4], beatLen * 2) * 0.4;
    synth += darkPad(beatInBar * beatLen, CHORDS.Dm, beatLen * 4) * 0.35;

    // Beat switches — every 16 bars
    if (bar % 16 > 14) {
      // Unexpected half-time feel
      if (beatIdx % 2 === 1) drums *= 0.3;
    }

    // Chaotic fills at phrase boundaries
    if (barInSection === 7 && beatInBar > 2) {
      const fillSpeed = Math.floor(beat * 16);
      drums += industrialSnare(t - fillSpeed * beatLen / 16) * 0.4;
      drums += glitchHat(t - fillSpeed * beatLen / 16, 'glitch') * 0.5;
    }

    // System overload ending — last 10 seconds
    if (t > 590) {
      const overload = (t - 590) / 10;
      fx += noise() * 0.1 * overload;
      fx += bitcrush(noise(), 2 + (1 - overload) * 6) * 0.1 * overload;
      drums *= (1 - overload * 0.8);
      bass *= (1 - overload * 0.5);
    }
  }

  // ── Mix to buses ──
  mainBus[i] = (drums + fx) * fadeIn * fadeOut;
  bassBus[i] = bass * fadeIn * fadeOut;
  padBus[i] = synth * fadeIn * fadeOut;

  // Progress indicator
  if (i % (SAMPLE_RATE * 60) === 0 && i > 0) {
    console.log(`    ${Math.round(t / 60)} min rendered...`);
  }
}

console.log('  Post-processing...');

// ═══════════════════════════════════════════════════════════════════
// POST-PROCESSING
// ═══════════════════════════════════════════════════════════════════

// 1. Sidechain compression on bass bus
console.log('    Sidechain compression...');
const scGain = new Float64Array(TOTAL_SAMPLES);
scGain.fill(1);
const SC_ATTACK = Math.round(SAMPLE_RATE * 0.003); // 3ms
const SC_RELEASE = Math.round(SAMPLE_RATE * 0.2);  // 200ms
for (const kickPos of kickPositions) {
  for (let j = 0; j < SC_ATTACK + SC_RELEASE && kickPos + j < TOTAL_SAMPLES; j++) {
    let gain;
    if (j < SC_ATTACK) {
      gain = 1 - 0.7 * (j / SC_ATTACK); // duck to 0.3
    } else {
      gain = 0.3 + 0.7 * ((j - SC_ATTACK) / SC_RELEASE);
    }
    gain = Math.min(gain, 1);
    scGain[kickPos + j] = Math.min(scGain[kickPos + j], gain);
  }
}
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  bassBus[i] *= scGain[i];
  padBus[i] *= scGain[i] * 0.5 + 0.5; // pads duck less
}

// 2. Filter bass bus
console.log('    Filtering bass...');
const filteredBass = lowpass(bassBus, 300);

// 3. Reverb on pad/synth bus
console.log('    Reverb on synths...');
const reverbPad = schroederReverb(padBus, 1.2, 0.7, 0.35);

// 4. Mix all buses
console.log('    Final mix...');
const master = new Float64Array(TOTAL_SAMPLES);
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  master[i] = mainBus[i] + filteredBass[i] + reverbPad[i];
}

// 5. Master distortion (light grit)
console.log('    Master saturation...');
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  master[i] = distort(master[i], 1.3) * 0.9;
}

// 6. Final lowpass (tame harshness)
console.log('    Final filter...');
const final = lowpass(master, 14000);

// ═══════════════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════════════
const outPath = path.join(__dirname, '..', 'public', 'sounds', 'black_grid_protocol.wav');
writeWav(outPath, final);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n✅ "Black Grid Protocol" generated in ${elapsed}s`);
console.log(`   ${outPath}`);
console.log('   Play it to preview before adding to the game.');
