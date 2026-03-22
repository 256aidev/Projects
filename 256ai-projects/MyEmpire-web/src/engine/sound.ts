/**
 * Sound Engine
 * Manages game audio using HTMLAudioElement pool.
 * All sounds are pre-generated WAV files in /public/sounds/.
 * Background music supports playlist with auto-rotation.
 * SFX and music volumes + mutes are independent and persisted in localStorage.
 */

import { MUSIC_TRACKS, TRACK_ROTATION_MS, loadPlaylistPrefs, savePlaylistPrefs } from '../data/musicDefs';
import type { PlaylistPrefs } from '../data/musicDefs';

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
  | 'prestige';

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
  private playlistPrefs: PlaylistPrefs;
  private currentTrackIndex = 0;
  private rotationTimer: number | null = null;
  private _currentTrackId: string | null = null;
  private _onTrackChange: (() => void) | null = null;

  constructor() {
    this.prefs = loadPrefs();
    this.playlistPrefs = loadPlaylistPrefs();
  }

  get sfxVolume() { return this.prefs.sfxVolume; }
  get musicVolume() { return this.prefs.musicVolume; }
  get sfxMuted() { return this.prefs.sfxMuted; }
  get musicMuted() { return this.prefs.musicMuted; }
  get currentTrackId() { return this._currentTrackId; }
  get playlist() { return this.playlistPrefs; }

  /** Legacy: treat as overall mute (both SFX + music) */
  get muted() { return this.prefs.sfxMuted && this.prefs.musicMuted; }

  onTrackChange(cb: (() => void) | null) { this._onTrackChange = cb; }

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
    if (this.prefs.sfxMuted) return;

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

  // ── Playlist Management ──────────────────────────────────────────────

  private getEnabledTracks() {
    const enabled = new Set(this.playlistPrefs.enabledTracks);
    const ordered = this.playlistPrefs.order.filter(id => enabled.has(id));
    // Add any enabled tracks not in the order
    for (const id of this.playlistPrefs.enabledTracks) {
      if (!ordered.includes(id)) ordered.push(id);
    }
    return ordered.map(id => MUSIC_TRACKS.find(t => t.id === id)).filter(Boolean);
  }

  private pickNextTrack() {
    const tracks = this.getEnabledTracks();
    if (tracks.length === 0) return null;
    if (this.playlistPrefs.shuffle) {
      const idx = Math.floor(Math.random() * tracks.length);
      this.currentTrackIndex = idx;
      return tracks[idx];
    }
    this.currentTrackIndex = (this.currentTrackIndex + 1) % tracks.length;
    return tracks[this.currentTrackIndex];
  }

  /** Toggle a track on/off in the playlist */
  toggleTrack(trackId: string) {
    const idx = this.playlistPrefs.enabledTracks.indexOf(trackId);
    if (idx >= 0) {
      // Don't allow disabling the last track
      if (this.playlistPrefs.enabledTracks.length <= 1) return;
      this.playlistPrefs.enabledTracks.splice(idx, 1);
    } else {
      this.playlistPrefs.enabledTracks.push(trackId);
    }
    savePlaylistPrefs(this.playlistPrefs);
  }

  /** Move a track up in the order */
  moveTrackUp(trackId: string) {
    const order = this.playlistPrefs.order;
    const idx = order.indexOf(trackId);
    if (idx > 0) {
      [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
      savePlaylistPrefs(this.playlistPrefs);
    }
  }

  /** Move a track down in the order */
  moveTrackDown(trackId: string) {
    const order = this.playlistPrefs.order;
    const idx = order.indexOf(trackId);
    if (idx >= 0 && idx < order.length - 1) {
      [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
      savePlaylistPrefs(this.playlistPrefs);
    }
  }

  /** Toggle shuffle mode */
  toggleShuffle() {
    this.playlistPrefs.shuffle = !this.playlistPrefs.shuffle;
    savePlaylistPrefs(this.playlistPrefs);
  }

  /** Set auto-switch interval in minutes (1-20) */
  setRotationMinutes(mins: number) {
    this.playlistPrefs.rotationMinutes = Math.max(1, Math.min(20, Math.round(mins)));
    savePlaylistPrefs(this.playlistPrefs);
    this.resetRotationTimer();
  }

  /** Play a specific track immediately */
  playTrack(trackId: string) {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track) return;
    const tracks = this.getEnabledTracks();
    this.currentTrackIndex = tracks.findIndex(t => t?.id === trackId);
    if (this.currentTrackIndex < 0) this.currentTrackIndex = 0;
    this.loadAndPlayTrack(track.path, track.id);
  }

  /** Skip to next track */
  nextTrack() {
    const track = this.pickNextTrack();
    if (track) this.loadAndPlayTrack(track.path, track.id);
  }

  private loadAndPlayTrack(path: string, id: string) {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic = null;
    }
    this._currentTrackId = id;
    this.bgMusic = new Audio(path);
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.prefs.musicVolume;
    if (!this.prefs.musicMuted) {
      this.bgMusic.play().catch(() => {});
    }
    this._onTrackChange?.();
    this.resetRotationTimer();
  }

  private resetRotationTimer() {
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    this.rotationTimer = window.setInterval(() => {
      if (this.getEnabledTracks().length > 1) {
        this.nextTrack();
      }
    }, (this.playlist.rotationMinutes ?? 10) * 60 * 1000);
  }

  /** Start looping background music. Call once after first user interaction. */
  startMusic() {
    if (this.bgMusic) return;
    // Start with the first enabled track
    const tracks = this.getEnabledTracks();
    if (tracks.length === 0) return;
    const track = tracks[0];
    if (!track) return;
    this.currentTrackIndex = 0;
    this.loadAndPlayTrack(track.path, track.id);
  }

  stopMusic() {
    this.bgMusic?.pause();
    this.bgMusic = null;
    this._currentTrackId = null;
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }
}

export const sound = new SoundEngine();
