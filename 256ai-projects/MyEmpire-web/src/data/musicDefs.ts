// ─────────────────────────────────────────
// MUSIC TRACK DEFINITIONS & PLAYLIST
// ─────────────────────────────────────────

export interface MusicTrack {
  id: string;
  name: string;
  description: string;
  path: string;
  bpm: number;
  mood: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'bg_lofi',
    name: 'Lo-Fi Hustle',
    description: 'Chill lo-fi beat. The OG track.',
    path: '/sounds/bg_lofi.wav',
    bpm: 85,
    mood: 'Chill',
  },
  {
    id: 'trap_empire',
    name: 'Trap Empire',
    description: 'Dark trap beat with heavy 808s.',
    path: '/sounds/trap_empire.wav',
    bpm: 140,
    mood: 'Aggressive',
  },
  {
    id: 'midnight_grind',
    name: 'Midnight Grind',
    description: 'Late night vibes. Smooth and moody.',
    path: '/sounds/midnight_grind.wav',
    bpm: 90,
    mood: 'Moody',
  },
  {
    id: 'street_king',
    name: 'Street King',
    description: 'Hard-hitting boom bap with attitude.',
    path: '/sounds/street_king.wav',
    bpm: 95,
    mood: 'Hard',
  },
  {
    id: 'cloud_nine',
    name: 'Cloud Nine',
    description: 'Dreamy synths floating above the city.',
    path: '/sounds/cloud_nine.wav',
    bpm: 75,
    mood: 'Dreamy',
  },
  {
    id: 'dirty_money',
    name: 'Dirty Money',
    description: 'Gritty industrial with a menacing bassline.',
    path: '/sounds/dirty_money.wav',
    bpm: 110,
    mood: 'Dark',
  },
  {
    id: 'penthouse_view',
    name: 'Penthouse View',
    description: 'Luxury jazz-hop for when you\'ve made it.',
    path: '/sounds/penthouse_view.wav',
    bpm: 80,
    mood: 'Smooth',
  },
  {
    id: 'block_party',
    name: 'Block Party',
    description: 'Upbeat funk-hop to celebrate the wins.',
    path: '/sounds/block_party.wav',
    bpm: 105,
    mood: 'Upbeat',
  },
  {
    id: 'chill_sunset',
    name: 'Chill Sunset',
    description: 'Rhodes keys over a warm lo-fi groove. 3 min journey.',
    path: '/sounds/chill_sunset.wav',
    bpm: 85,
    mood: 'Chill',
  },
  {
    id: 'black_grid_protocol',
    name: 'Black Grid Protocol',
    description: 'Dark tech industrial. 10 min of machine warfare.',
    path: '/sounds/black_grid_protocol.wav',
    bpm: 136,
    mood: 'Dark',
  },
  {
    id: 'red_protocol',
    name: 'Red Protocol',
    description: 'Aggressive dark tech. 10 min system meltdown. 138-150 BPM.',
    path: '/sounds/red_protocol.wav',
    bpm: 144,
    mood: 'Aggressive',
  },
];

export const MUSIC_TRACK_MAP = Object.fromEntries(MUSIC_TRACKS.map(t => [t.id, t]));

// How often to auto-switch tracks (in milliseconds)
export const TRACK_ROTATION_MS = 10 * 60 * 1000; // 10 minutes

const PLAYLIST_STORAGE_KEY = 'myempire-playlist';

export interface PlaylistPrefs {
  enabledTracks: string[];  // track IDs that are enabled
  order: string[];          // custom order
  shuffle: boolean;
  rotationMinutes: number;  // auto-switch interval in minutes (1-20)
}

export function loadPlaylistPrefs(): PlaylistPrefs {
  try {
    const raw = localStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabledTracks: parsed.enabledTracks ?? MUSIC_TRACKS.map(t => t.id),
        order: parsed.order ?? MUSIC_TRACKS.map(t => t.id),
        shuffle: parsed.shuffle ?? false,
        rotationMinutes: parsed.rotationMinutes ?? 10,
      };
    }
  } catch {}
  return {
    enabledTracks: MUSIC_TRACKS.map(t => t.id),
    order: MUSIC_TRACKS.map(t => t.id),
    shuffle: false,
    rotationMinutes: 10,
  };
}

export function savePlaylistPrefs(prefs: PlaylistPrefs) {
  localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(prefs));
}
