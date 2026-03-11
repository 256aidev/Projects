import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithApple = useAuthStore((s) => s.signInWithApple);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-950 px-6">
      {/* Logo / title */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🌿</div>
        <h1 className="text-white text-3xl font-black tracking-tight">My Empire</h1>
        <p className="text-gray-500 text-sm mt-1">Build your criminal empire</p>
      </div>

      {/* Sign-in buttons */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-7.9 19.7-20 0-1.3-.2-2.7-.2-3z" fill="#FFC107"/>
            <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.2-17.7 10.7z" fill="#FF3D00"/>
            <path d="M24 44c5.6 0 10.5-1.9 14.4-5l-6.6-5.6C29.8 34.9 27 36 24 36c-6.1 0-11.3-4.1-13.1-9.7L4 31.4C7.5 39.2 15.1 44 24 44z" fill="#4CAF50"/>
            <path d="M44.5 20H24v8.5h11.8c-.8 2.4-2.3 4.5-4.3 6l6.6 5.6C42.1 36.3 44.5 30 44.5 23c0-1.3-.2-2.7-.2-3z" fill="#1976D2"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={signInWithApple}
          className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-black text-white font-semibold text-sm border border-gray-700 hover:bg-gray-900 transition active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 814 1000" fill="white">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-155.5-127.4C46 790.6 0 663 0 541.8c0-207.5 134.4-317.3 266.6-317.3 70.1 0 128.4 46.4 172.5 46.4 42.3 0 109.2-49 190.5-49 30.5 0 110.8 2.6 167.6 64.8zm-159.8-219.9C601.4 88.4 622.5 46.8 622.5 5.2c0-5.8-.4-11.6-1.3-16.9C557.3-6.4 485-35.8 440.8 20.4 404.3 60.3 380 120.1 380 179.9c0 5.2.4 10.4 1.3 14.3 3.9.7 7.8 1.3 11.7 1.3 60.5 0 129.3-32.4 163.3-74.5z"/>
          </svg>
          Continue with Apple
        </button>

        <div className="relative flex items-center my-2">
          <div className="flex-1 border-t border-gray-700" />
          <span className="px-3 text-gray-600 text-xs">or</span>
          <div className="flex-1 border-t border-gray-700" />
        </div>

        <button
          onClick={() => {
            // Skip login — play locally without cloud save
            useAuthStore.setState({ user: { uid: 'guest', email: null, displayName: 'Guest' } as never });
          }}
          className="w-full py-2.5 rounded-xl text-gray-500 text-sm hover:text-gray-300 transition"
        >
          Play without signing in
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mt-6 w-full max-w-xs bg-red-900/40 border border-red-700 text-red-300 text-xs rounded-xl px-4 py-3 cursor-pointer"
          onClick={clearError}
        >
          {error} (tap to dismiss)
        </div>
      )}

      {/* Footer note */}
      <p className="text-gray-700 text-[10px] mt-10 text-center max-w-xs">
        Sign in to save your progress across devices. Your save data is stored securely and will never be lost on updates.
      </p>
    </div>
  );
}
