import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';

export default function AccountScreen() {
  const { user, signOut, signInWithGoogle } = useAuthStore();
  const setShowAccountScreen = useUIStore((s) => s.setShowAccountScreen);
  const { dirtyCash, cleanCash, totalDirtyEarned, totalCleanEarned, tickCount, businesses } = useGameStore();

  const isGuest = !user || (user as { uid: string }).uid === 'guest';

  const handleSignOut = async () => {
    await signOut();
    setShowAccountScreen(false);
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
    setShowAccountScreen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border-t border-gray-700 rounded-t-2xl p-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Account</h2>
          <button
            onClick={() => setShowAccountScreen(false)}
            className="text-gray-500 hover:text-gray-300 text-2xl leading-none transition"
          >
            ×
          </button>
        </div>

        {/* User info */}
        <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
          {user?.photoURL && !isGuest ? (
            <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
              👤
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{isGuest ? 'Guest Player' : (user?.displayName ?? 'Player')}</p>
            <p className="text-gray-400 text-xs">{isGuest ? 'Local save only' : (user?.email ?? '')}</p>
          </div>
        </div>

        {/* Game stats */}
        <div className="bg-gray-800 rounded-xl p-4 space-y-2">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Game Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-500 text-[10px]">Dirty Cash</p>
              <p className="text-green-400 font-bold">{formatMoney(dirtyCash)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Clean Cash</p>
              <p className="text-blue-400 font-bold">{formatMoney(cleanCash)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Total Dirty Earned</p>
              <p className="text-white font-semibold text-sm">{formatMoney(totalDirtyEarned)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Total Clean Earned</p>
              <p className="text-white font-semibold text-sm">{formatMoney(totalCleanEarned)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Front Businesses</p>
              <p className="text-white font-semibold text-sm">{businesses.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Time Played</p>
              <p className="text-white font-semibold text-sm">{Math.floor(tickCount / 60)}m {tickCount % 60}s</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isGuest ? (
            <button
              onClick={handleSignIn}
              className="w-full py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-7.9 19.7-20 0-1.3-.2-2.7-.2-3z" fill="#FFC107"/>
                <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.2-17.7 10.7z" fill="#FF3D00"/>
                <path d="M24 44c5.6 0 10.5-1.9 14.4-5l-6.6-5.6C29.8 34.9 27 36 24 36c-6.1 0-11.3-4.1-13.1-9.7L4 31.4C7.5 39.2 15.1 44 24 44z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.8 2.4-2.3 4.5-4.3 6l6.6 5.6C42.1 36.3 44.5 30 44.5 23c0-1.3-.2-2.7-.2-3z" fill="#1976D2"/>
              </svg>
              Sign in with Google to save progress
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl bg-red-900/50 hover:bg-red-800/60 text-red-300 font-semibold text-sm transition"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
