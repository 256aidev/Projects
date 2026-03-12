/**
 * Sound Engine
 * Manages game audio using HTMLAudioElement pool.
 * All sounds are pre-generated WAV files in /public/sounds/.
 * Background music loops automatically.
 * Respects user mute preference stored in localStorage.
 */

export type SoundKey =
  | 'notify_success'
  | 'notify_warning'
  | 'plant'
  | 'harvest'
  | 'cash'
  | 'buy'
  | 'dealer_hire'
  | 'bg_lofi';

const SOUND_PATHS: Record<SoundKey, string> = {
  notify_success: '/sounds/notify_success.wav',
  notify_warning: '/sounds/notify_warning.wav',
  plant:          '/sounds/plant.wav',
  harvest:        '/sounds/harvest.wav',
  cash:           '/sounds/cash.wav',
  buy:            '/sounds/buy.wav',
  dealer_hire:    '/sounds/dealer_hire.wav',
  bg_lofi:        '/sounds/bg_lofi.wav',
};

const SFX_VOLUME = 0.6;
const MUSIC_VOLUME = 0.25;
const MUTE_KEY = 'myempire-muted';

class SoundEngine {
  private pool: Map<SoundKey, HTMLAudioElement[]> = new Map();
  private bgMusic: HTMLAudioElement | null = null;
  private _muted: boolean = false;

  constructor() {
    this._muted = localStorage.getItem(MUTE_KEY) === 'true';
  }

  get muted() { return this._muted; }

  setMuted(muted: boolean) {
    this._muted = muted;
    localStorage.setItem(MUTE_KEY, String(muted));
    if (muted) {
      this.bgMusic?.pause();
    } else {
      this.bgMusic?.play().catch(() => {});
    }
  }

  toggleMute() {
    this.setMuted(!this._muted);
  }

  /** Play a one-shot sound effect. */
  play(key: SoundKey) {
    if (this._muted || key === 'bg_lofi') return;

    // Reuse a paused element from the pool, or create new
    let pool = this.pool.get(key);
    if (!pool) {
      pool = [];
      this.pool.set(key, pool);
    }

    let el = pool.find(e => e.paused || e.ended);
    if (!el) {
      el = new Audio(SOUND_PATHS[key]);
      el.volume = SFX_VOLUME;
      pool.push(el);
    }

    el.currentTime = 0;
    el.play().catch(() => {});
  }

  /** Start looping background music. Call once after first user interaction. */
  startMusic() {
    if (this.bgMusic) return;
    this.bgMusic = new Audio(SOUND_PATHS['bg_lofi']);
    this.bgMusic.loop = true;
    this.bgMusic.volume = MUSIC_VOLUME;
    if (!this._muted) {
      this.bgMusic.play().catch(() => {});
    }
  }

  stopMusic() {
    this.bgMusic?.pause();
    this.bgMusic = null;
  }
}

export const sound = new SoundEngine();
