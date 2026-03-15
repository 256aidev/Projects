import { GAME_THEME } from '../data/theme';

/** Access game theme config. Components use this instead of hardcoding names/icons. */
export function useTheme() {
  return GAME_THEME;
}
