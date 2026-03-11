import type { LeaderboardEntry } from '../api/dashboard';
import Avatar from './Avatar';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  compact?: boolean;
}

const medals = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'];

export default function LeaderboardList({
  entries,
  compact = false,
}: LeaderboardListProps) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        No leaderboard data yet
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {entries.map((entry) => (
        <li
          key={entry.child_id}
          className="flex items-center gap-3 py-2.5"
        >
          <span className="w-8 text-center text-lg">
            {entry.rank <= 3 ? medals[entry.rank] : `#${entry.rank}`}
          </span>
          {!compact && (
            <Avatar
              name={entry.display_name}
              color={entry.avatar_color}
              size="sm"
            />
          )}
          <span className="flex-1 text-sm font-medium text-gray-800">
            {entry.display_name}
          </span>
          <span className="text-sm font-semibold text-indigo-600">
            {entry.weekly_points} pts
          </span>
        </li>
      ))}
    </ul>
  );
}
