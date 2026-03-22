/**
 * RED PROTOCOL — 10-min Dark Tech / Industrial / Aggressive
 * 138→150 BPM, F# minor, 24-bit WAV
 * Harder, faster, more chaotic than Black Grid Protocol
 */
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DURATION = 600; // 10 minutes
const TOTAL_SAMPLES = SR * DURATION;
const CHANNELS = 1;
const BITS = 16;

// ── Utilities ──
function clamp(x, lo = -1, hi = 1) { return x < lo ? lo : x > hi ? hi : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function tanh(x) { return Math.tanh(x); }
function bitcrush(x, bits) { const s = Math.pow(2, bits); return Math.round(x * s) / s; }

// ── Noise ──
function noise() { return Math.random() * 2 - 1; }
let pinkB0 = 0, pinkB1 = 0, pinkB2 = 0;
function pinkNoise() {
  const w = noise();
  pinkB0 = 0.99765 * pinkB0 + w * 0.0990460;
  pinkB1 = 0.96300 * pinkB1 + w * 0.2965164;
  pinkB2 = 0.57000 * pinkB2 + w * 1.0526913;
  return (pinkB0 + pinkB1 + pinkB2 + w * 0.1848) * 0.11;
}

// ── Oscillators ──
function saw(phase) { return 2 * (phase % 1) - 1; }
function square(phase, pw = 0.5) { return (phase % 1) < pw ? 1 : -1; }
function tri(phase) { const p = phase % 1; return p < 0.5 ? 4 * p - 1 : 3 - 4 * p; }
function sin(phase) { return Math.sin(phase * Math.PI * 2); }

// ── Filters ──
class SVF {
  constructor() { this.ic1eq = 0; this.ic2eq = 0; }
  process(v0, cutoff, q) {
    const g = Math.tan(Math.PI * Math.min(cutoff / SR, 0.49));
    const k = 1 / Math.max(q, 0.5);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = v0 - this.ic2eq;
    const v1 = a1 * this.ic1eq + a2 * v3;
    const v2 = this.ic2eq + a2 * this.ic1eq + a3 * v3;
    this.ic1eq = 2 * v1 - this.ic1eq;
    this.ic2eq = 2 * v2 - this.ic2eq;
    return { lp: v2, bp: v1, hp: v0 - k * v1 - v2 };
  }
}

// ── Reverb (Schroeder) ──
class Reverb {
  constructor(decay = 0.7) {
    this.delays = [1557, 1617, 1491, 1422].map(d => ({ buf: new Float32Array(d), idx: 0, len: d }));
    this.allpasses = [225, 556, 441, 341].map(d => ({ buf: new Float32Array(d), idx: 0, len: d }));
    this.decay = decay;
  }
  process(input) {
    let sum = 0;
    for (const d of this.delays) {
      const delayed = d.buf[d.idx];
      d.buf[d.idx] = input + delayed * this.decay;
      d.idx = (d.idx + 1) % d.len;
      sum += delayed;
    }
    let out = sum * 0.25;
    for (const ap of this.allpasses) {
      const delayed = ap.buf[ap.idx];
      const v = out + delayed * 0.5;
      ap.buf[ap.idx] = v;
      ap.idx = (ap.idx + 1) % ap.len;
      out = delayed - v * 0.5;
    }
    return out;
  }
}

// ── BPM interpolation (138 → 150) ──
function getBPM(t) {
  if (t < 60) return 138;
  if (t < 150) return lerp(138, 142, (t - 60) / 90);
  if (t < 300) return lerp(142, 146, (t - 150) / 150);
  if (t < 480) return lerp(146, 150, (t - 300) / 180);
  return 150;
}

// ── Section detection ──
function getSection(t) {
  if (t < 60) return 'ignition';
  if (t < 150) return 'pressure';
  if (t < 240) return 'drop1';
  if (t < 300) return 'fracture';
  if (t < 420) return 'drop2';
  if (t < 480) return 'panic';
  return 'overload';
}

function getSectionIntensity(t) {
  const s = getSection(t);
  switch (s) {
    case 'ignition': return lerp(0.15, 0.35, t / 60);
    case 'pressure': return lerp(0.35, 0.65, (t - 60) / 90);
    case 'drop1': return lerp(0.7, 0.85, (t - 150) / 90);
    case 'fracture': return lerp(0.5, 0.6, (t - 240) / 60);
    case 'drop2': return lerp(0.85, 0.95, (t - 300) / 120);
    case 'panic': return lerp(0.4, 0.55, (t - 420) / 60);
    case 'overload': return lerp(0.95, 1.0, (t - 480) / 120);
    default: return 0.5;
  }
}

// ── F# minor scale: F#2=92.5Hz ──
const ROOT = 92.5; // F#2
const FSHARP_FREQS = [92.5, 103.83, 110.0, 123.47, 138.59, 146.83, 164.81]; // F# G# A B C# D E

// ── GENERATE ──
console.log('Generating Red Protocol (10 min, F# minor, 138-150 BPM)...');

const buffer = new Float32Array(TOTAL_SAMPLES);

// State
let beatPhase = 0;
let barCount = 0;
let lastBeatTime = 0;
let kickPhase = 0;
let kickEnv = 0;
let snareEnv = 0;
let hatPhase = 0;
let bassPhase = 0;
let bassPhase2 = 0;
let bassPhase3 = 0;
let leadPhase = 0;
let leadPhase2 = 0;
let padPhase1 = 0;
let padPhase2 = 0;
let padPhase3 = 0;
let arpPhase = 0;
let sirenPhase = 0;

const kickFilter = new SVF();
const bassFilter = new SVF();
const leadFilter = new SVF();
const padFilter = new SVF();
const masterFilter = new SVF();
const reverb = new Reverb(0.55);
const reverb2 = new Reverb(0.35);

// Track beat position
let beatPos = 0; // fractional beat number
let prevBeatPos = 0;
let barPos = 0; // beat within bar (0-3)

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SR;
  const section = getSection(t);
  const intensity = getSectionIntensity(t);
  const bpm = getBPM(t);
  const beatLen = 60 / bpm;
  const sixteenth = beatLen / 4;

  // Advance beat tracking
  prevBeatPos = beatPos;
  beatPos += bpm / (60 * SR);
  barPos = beatPos % 4;
  const isNewBeat = Math.floor(beatPos) !== Math.floor(prevBeatPos);
  const beatInBar = Math.floor(barPos);
  const barNumber = Math.floor(beatPos / 4);
  const sixteenthPos = (beatPos * 4) % 1; // position within 16th
  const sixteenthNum = Math.floor(beatPos * 4) % 16; // which 16th in bar

  // Time since last beat
  const beatFrac = beatPos % 1;
  const timeSinceBeat = beatFrac * beatLen;

  // ── KICK ──
  let kick = 0;
  if (section !== 'ignition' || t > 40) {
    const kickTrigger = beatFrac < 0.05;
    if (kickTrigger && kickEnv < 0.01) kickEnv = 1;
    kickEnv *= 0.9985;

    // Extra kicks in aggressive sections
    let extraKick = false;
    if ((section === 'drop1' || section === 'drop2' || section === 'overload')) {
      if (sixteenthNum === 6 || sixteenthNum === 10) extraKick = beatFrac > 0.48 && beatFrac < 0.53;
      if (section === 'overload' && (sixteenthNum === 14)) extraKick = true;
    }
    if (extraKick && kickEnv < 0.3) kickEnv = 0.8;

    const kickFreq = 55 * (1 + kickEnv * 8) * (1 + kickEnv * kickEnv * 15);
    kickPhase += kickFreq / SR;
    const kickBody = sin(kickPhase) * kickEnv;
    const kickClick = noise() * kickEnv * kickEnv * 0.6;
    const kickDistortion = section === 'overload' ? 3.0 : section === 'drop2' ? 2.5 : section === 'drop1' ? 2.0 : 1.5;
    kick = tanh((kickBody + kickClick) * kickDistortion) * Math.min(kickEnv * 4, 1);

    // Sidechain envelope
    const scEnv = Math.max(0, 1 - timeSinceBeat * 8);
    kick *= lerp(0.7, 1.0, intensity);
  }

  // ── SNARE ──
  let snare = 0;
  if (section !== 'ignition') {
    const snareHit = (beatInBar === 1 || beatInBar === 3) && beatFrac < 0.03;
    // Extra snares in aggressive sections
    const extraSnare = (section === 'drop2' || section === 'overload') &&
      (sixteenthNum === 7 || sixteenthNum === 15) && beatFrac > 0.45 && beatFrac < 0.55;
    if (snareHit || extraSnare) snareEnv = 1;
    snareEnv *= 0.997;

    const snareBody = sin(kickPhase * 3.7) * snareEnv * 0.4;
    const snareNoise = noise() * snareEnv * 0.7;
    const snareMetal = sin(kickPhase * 7.3) * snareEnv * snareEnv * 0.3;
    snare = tanh((snareBody + snareNoise + snareMetal) * (section === 'overload' ? 2.5 : 2.0)) * Math.min(snareEnv * 3, 1);
    snare *= lerp(0.5, 0.8, intensity);
  }

  // ── HI-HATS (fast, glitchy, trap-influenced) ──
  let hat = 0;
  if (section !== 'ignition' || t > 30) {
    const hatSpeed = section === 'overload' ? 8 : section === 'drop2' ? 6 : section === 'drop1' ? 4 : 2;
    const hatTick = (beatPos * hatSpeed) % 1;
    const hatOpen = section === 'drop2' || section === 'overload' ? 0.996 : 0.99;

    // Trap rolls
    let trapRoll = false;
    if ((section === 'drop1' || section === 'drop2' || section === 'overload') &&
      (sixteenthNum >= 12 && sixteenthNum <= 15)) {
      trapRoll = true;
    }

    const hatEnv = trapRoll ? Math.pow(1 - ((beatPos * 16) % 1), 4) :
      Math.pow(1 - hatTick, section === 'fracture' ? 8 : 12);
    hatPhase += (8000 + noise() * 2000) / SR;
    const hatSig = noise() * hatEnv * 0.3;
    const { hp } = kickFilter.process(hatSig, 7000 + intensity * 3000, 1.5);
    hat = hp * lerp(0.3, 0.7, intensity);

    // Glitch stutters in fracture
    if (section === 'fracture') {
      hat *= (Math.random() > 0.3) ? 1 : 0;
    }
  }

  // ── INDUSTRIAL PERCUSSION ──
  let perc = 0;
  if (section === 'drop1' || section === 'drop2' || section === 'overload' || section === 'fracture') {
    const percPattern = [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1];
    if (percPattern[sixteenthNum] && sixteenthPos < 0.1) {
      perc = tanh(noise() * 3) * 0.15 * intensity;
    }
    // Metal impacts
    if (section === 'overload' && sixteenthNum % 3 === 0 && sixteenthPos < 0.05) {
      perc += sin(kickPhase * 11.3) * 0.12 * Math.pow(1 - sixteenthPos * 20, 3);
    }
  }

  // ── BASS (aggressive reese + sub) ──
  let bass = 0;
  if (section !== 'ignition' || t > 45) {
    const bassNote = section === 'drop2' || section === 'overload' ?
      FSHARP_FREQS[(barNumber % 4 === 3) ? 4 : (barNumber % 4 === 2) ? 3 : (barNumber % 2) ? 1 : 0] :
      FSHARP_FREQS[(barNumber % 2) ? 3 : 0];
    const bassFreq = bassNote * (section === 'drop2' || section === 'overload' ? 1 : 0.5);

    // 3-voice detuned reese
    bassPhase += bassFreq / SR;
    bassPhase2 += (bassFreq * 1.008) / SR;
    bassPhase3 += (bassFreq * 0.992) / SR;

    const reese = (saw(bassPhase) + saw(bassPhase2) + saw(bassPhase3)) / 3;
    const sub = sin(bassPhase * 0.5) * 0.6;

    const distAmt = section === 'overload' ? 5 : section === 'drop2' ? 4 : section === 'drop1' ? 3 : 2;
    const { lp: bassLP } = bassFilter.process(reese, lerp(200, 800, intensity) + sin(t * 0.3) * 200, 1.2);
    bass = tanh(bassLP * distAmt) * 0.4 + sub * 0.25;
    bass *= lerp(0.3, 0.8, intensity);

    // Sidechain from kick
    const scAmount = Math.max(0, 1 - timeSinceBeat * 6);
    bass *= (1 - scAmount * 0.7);
  }

  // ── LEAD SYNTH (harsh, screaming, alarm-like) ──
  let lead = 0;
  if (section === 'drop1' || section === 'drop2' || section === 'overload') {
    const leadNotes = [
      FSHARP_FREQS[0] * 4, FSHARP_FREQS[4] * 4, FSHARP_FREQS[3] * 4, FSHARP_FREQS[1] * 4,
      FSHARP_FREQS[0] * 4, FSHARP_FREQS[5] * 2, FSHARP_FREQS[4] * 4, FSHARP_FREQS[3] * 4,
    ];
    const noteIdx = Math.floor(beatPos * 2) % leadNotes.length;
    const leadFreq = leadNotes[noteIdx];
    leadPhase += leadFreq / SR;
    leadPhase2 += (leadFreq * 1.005) / SR;

    const leadRaw = (square(leadPhase, 0.3) + saw(leadPhase2)) * 0.5;
    const { bp } = leadFilter.process(leadRaw, 1500 + sin(t * 2) * 800 + intensity * 2000, 2.5);
    lead = tanh(bp * (section === 'overload' ? 3 : 2)) * 0.15 * intensity;
  }

  // ── SIREN / ALARM ──
  let siren = 0;
  if (section === 'ignition' || section === 'panic' || section === 'overload') {
    sirenPhase += (800 + sin(t * 3) * 400 + sin(t * 0.7) * 200) / SR;
    const sirenAmp = section === 'ignition' ? lerp(0, 0.08, t / 60) :
      section === 'panic' ? 0.12 : 0.08;
    siren = sin(sirenPhase) * sirenAmp * (0.5 + sin(t * 1.5) * 0.5);
  }

  // ── PADS (distorted, unstable) ──
  let pad = 0;
  if (section !== 'fracture') {
    const padFreqs = [ROOT, ROOT * 1.498, ROOT * 1.888]; // F# C# E (minor)
    padPhase1 += padFreqs[0] / SR;
    padPhase2 += padFreqs[1] / SR;
    padPhase3 += padFreqs[2] / SR;

    const padRaw = (tri(padPhase1) + tri(padPhase2) * 0.7 + tri(padPhase3) * 0.5) / 2.2;
    const padCutoff = section === 'ignition' ? lerp(200, 600, t / 60) :
      section === 'panic' ? lerp(400, 800, (t - 420) / 60) :
        lerp(300, 1200, intensity);
    const { lp: padLP } = padFilter.process(padRaw, padCutoff, 0.8);
    pad = padLP * lerp(0.06, 0.15, section === 'ignition' || section === 'panic' ? 1 : 0.3);
  }

  // ── ARP (fast, mechanical) ──
  let arp = 0;
  if (section === 'pressure' || section === 'drop1' || section === 'drop2' || section === 'overload') {
    const arpSpeed = section === 'overload' ? 8 : section === 'drop2' ? 6 : 4;
    const arpNotes = [FSHARP_FREQS[0] * 2, FSHARP_FREQS[4] * 2, FSHARP_FREQS[3] * 2,
    FSHARP_FREQS[1] * 2, FSHARP_FREQS[5], FSHARP_FREQS[0] * 4];
    const arpIdx = Math.floor(beatPos * arpSpeed) % arpNotes.length;
    const arpFreq = arpNotes[arpIdx];
    arpPhase += arpFreq / SR;

    const arpEnv = Math.pow(1 - ((beatPos * arpSpeed) % 1), 3);
    arp = square(arpPhase, 0.25) * arpEnv * 0.08 * intensity;
  }

  // ── GLITCH FX ──
  let glitch = 0;
  if (section === 'fracture' || section === 'overload') {
    // Bitcrushed noise bursts
    if (Math.random() < (section === 'overload' ? 0.01 : 0.02)) {
      glitch = bitcrush(noise() * 0.2, 3);
    }
    // Data corruption
    if (section === 'fracture' && Math.random() < 0.005) {
      glitch += noise() * 0.15;
    }
  }

  // ── SILENCE/DROPOUT FX ──
  let dropout = 1;
  // Fake drops: brief silence before big hits
  if (section === 'drop1' && barNumber % 8 === 7 && beatInBar === 3 && beatFrac > 0.5) {
    dropout = 0;
  }
  if (section === 'drop2' && barNumber % 6 === 5 && beatInBar >= 3 && beatFrac > 0.3) {
    dropout = 0;
  }
  // Stutter in fracture
  if (section === 'fracture') {
    const stutterRate = 8 + Math.floor(t - 240) / 5;
    if (sin(t * stutterRate) > 0.7) dropout *= 0.1;
  }

  // ── FILTER SWEEP ──
  let sweepCut = 20000;
  // Low-pass sweeps before drops
  if (section === 'pressure' && t > 130) {
    sweepCut = lerp(20000, 800, (t - 130) / 20);
  }
  if (section === 'panic' && t > 460) {
    sweepCut = lerp(20000, 600, (t - 460) / 20);
  }

  // ── MIX ──
  let mix = kick * 0.9 + snare * 0.7 + hat + perc + bass + lead + siren + pad + arp + glitch;

  // Apply dropout
  mix *= dropout;

  // Master filter sweep
  const { lp: filtered } = masterFilter.process(mix, sweepCut, 0.7);
  mix = sweepCut < 19000 ? filtered : mix;

  // Reverb (less in aggressive sections)
  const reverbAmt = section === 'ignition' || section === 'panic' ? 0.25 :
    section === 'fracture' ? 0.3 : 0.1;
  const wet = reverb.process(mix * 0.3);
  mix = mix + wet * reverbAmt;

  // ── MASTER CHAIN ──
  // Aggressive saturation
  const satAmt = section === 'overload' ? 2.5 : section === 'drop2' ? 2.0 : 1.5;
  mix = tanh(mix * satAmt) / satAmt * satAmt * 0.7;

  // Final limiter
  mix = tanh(mix * 1.8) * 0.85;

  // End: collapse or cutoff
  if (t > 595) {
    const fadeOut = 1 - (t - 595) / 5;
    // Distortion overload collapse
    mix = mix * fadeOut + noise() * (1 - fadeOut) * 0.3 * fadeOut;
  }

  buffer[i] = clamp(mix);
}

console.log('Normalizing...');
let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) peak = Math.max(peak, Math.abs(buffer[i]));
const norm = peak > 0 ? 0.95 / peak : 1;
for (let i = 0; i < TOTAL_SAMPLES; i++) buffer[i] *= norm;

// ── Write WAV ──
console.log('Writing WAV...');
const outPath = path.join(__dirname, '..', 'public', 'sounds', 'red_protocol.wav');

const dataSize = TOTAL_SAMPLES * CHANNELS * (BITS / 8);
const headerSize = 44;
const wavBuf = Buffer.alloc(headerSize + dataSize);

// RIFF header
wavBuf.write('RIFF', 0);
wavBuf.writeUInt32LE(headerSize + dataSize - 8, 4);
wavBuf.write('WAVE', 8);
wavBuf.write('fmt ', 12);
wavBuf.writeUInt32LE(16, 16); // chunk size
wavBuf.writeUInt16LE(1, 20); // PCM
wavBuf.writeUInt16LE(CHANNELS, 22);
wavBuf.writeUInt32LE(SR, 24);
wavBuf.writeUInt32LE(SR * CHANNELS * (BITS / 8), 28);
wavBuf.writeUInt16LE(CHANNELS * (BITS / 8), 32);
wavBuf.writeUInt16LE(BITS, 34);
wavBuf.write('data', 36);
wavBuf.writeUInt32LE(dataSize, 40);

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const s = Math.max(-1, Math.min(1, buffer[i]));
  const val = s < 0 ? s * 32768 : s * 32767;
  wavBuf.writeInt16LE(Math.round(val), headerSize + i * 2);
}

fs.writeFileSync(outPath, wavBuf);
const sizeMB = (headerSize + dataSize) / (1024 * 1024);
console.log(`Done! ${outPath} (${sizeMB.toFixed(1)} MB, ${DURATION}s)`);
