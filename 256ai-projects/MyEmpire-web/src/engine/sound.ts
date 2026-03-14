/**
 * Sound Engine
 * Manages game audio using HTMLAudioElement pool.
 * All sounds are pre-generated WAV files in /public/sounds/.
 * Background music loops automatically.
 * SFX and music volumes + mutes are independent and persisted in localStorage.
 */

export type SoundKey =
  | 'notify_success'
  | 'notify_warning'
  | 'plant'
  | 'harvest'
  | 'cash'
  | 'buy'
  | 'sell'
  | 'dealer_hire'
  | 'upgrade'
  | 'click'
  | 'fire'
  | 'casino_bet'
  | 'casino_win'
  | 'casino_lose'
  | 'attack'
  | 'event_popup'
  | 'prestige'
  | 'bg_lofi';

const SOUND_PATHS: Record<SoundKey, string> = {
  notify_success: '/sounds/notify_success.wav',
  notify_warning: '/sounds/notify_warning.wav',
  plant:          '/sounds/plant.wav',
  harvest:        '/sounds/harvest.wav',
  cash:           '/sounds/cash.wav',
  buy:            '/sounds/buy.wav',
  sell:           '/sounds/sell.wav',
  dealer_hire:    '/sounds/dealer_hire.wav',
  upgrade:        '/sounds/upgrade.wav',
  click:          '/sounds/click.wav',
  fire:           '/sounds/fire.wav',
  casino_bet:     '/sounds/casino_bet.wav',
  casino_win:     '/sounds/casino_win.wav',
  casino_lose:    '/sounds/casino_lose.wav',
  attack:         '/sounds/attack.wav',
  event_popup:    '/sounds/event_popup.wav',
  prestige:       '/sounds/prestige.wav',
  bg_lofi:        '/sounds/bg_lofi.wav',
};

const STORAGE_KEY = 'myempire-sound';

interface SoundPrefs {
  sfxVolume: number;
  musicVolume: number;
  sfxMuted: boolean;
  musicMuted: boolean;
}

function loadPrefs(): SoundPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch {}
  return defaultPrefs();
}

function defaultPrefs(): SoundPrefs {
  return { sfxVolume: 0.6, musicVolume: 0.25, sfxMuted: false, musicMuted: false };
}

class SoundEngine {
  private pool: Map<SoundKey, HTMLAudioElement[]> = new Map();
  private bgMusic: HTMLAudioElement | null = null;
  private prefs: SoundPrefs;

  constructor() {
    this.prefs = loadPrefs();
  }

  get sfxVolume() { return this.prefs.sfxVolume; }
  get musicVolume() { return this.prefs.musicVolume; }
  get sfxMuted() { return this.prefs.sfxMuted; }
  get musicMuted() { return this.prefs.musicMuted; }

  /** Legacy: treat as overall mute (both SFX + music) */
  get muted() { return this.prefs.sfxMuted && this.prefs.musicMuted; }

  setSfxVolume(v: number) {
    this.prefs.sfxVolume = Math.max(0, Math.min(1, v));
    this.save();
  }

  setMusicVolume(v: number) {
    this.prefs.musicVolume = Math.max(0, Math.min(1, v));
    if (this.bgMusic) this.bgMusic.volume = this.prefs.musicVolume;
    this.save();
  }

  setSfxMuted(muted: boolean) {
    this.prefs.sfxMuted = muted;
    this.save();
  }

  setMusicMuted(muted: boolean) {
    this.prefs.musicMuted = muted;
    if (this.bgMusic) {
      if (muted) this.bgMusic.pause();
      else this.bgMusic.play().catch(() => {});
    }
    this.save();
  }

  /** Legacy toggle — mutes/unmutes both */
  toggleMute() {
    const allMuted = this.muted;
    this.prefs.sfxMuted = !allMuted;
    this.prefs.musicMuted = !allMuted;
    if (this.bgMusic) {
      if (!allMuted) this.bgMusic.pause();
      else this.bgMusic.play().catch(() => {});
    }
    this.save();
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
  }

  /** Play a one-shot sound effect. */
  play(key: SoundKey) {
    if (this.prefs.sfxMuted || key === 'bg_lofi') return;

    let pool = this.pool.get(key);
    if (!pool) {
      pool = [];
      this.pool.set(key, pool);
    }

    let el = pool.find(e => e.paused || e.ended);
    if (!el) {
      el = new Audio(SOUND_PATHS[key]);
      pool.push(el);
    }

    el.volume = this.prefs.sfxVolume;
    el.currentTime = 0;
    el.play().catch(() => {});
  }

  /** Start looping background music. Call once after first user interaction. */
  startMusic() {
    if (this.bgMusic) return;
    this.bgMusic = new Audio(SOUND_PATHS['bg_lofi']);
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.prefs.musicVolume;
    if (!this.prefs.musicMuted) {
      this.bgMusic.play().catch(() => {});
    }
  }

  stopMusic() {
    this.bgMusic?.pause();
    this.bgMusic = null;
  }
}

export const sound = new SoundEngine();
