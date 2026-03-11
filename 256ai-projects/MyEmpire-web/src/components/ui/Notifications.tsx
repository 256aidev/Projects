import { useUIStore } from '../../store/uiStore';

export default function Notifications() {
  const notifications = useUIStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`
            px-4 py-2 rounded-xl text-sm font-semibold shadow-lg pointer-events-auto
            animate-[fadeIn_0.2s_ease]
            ${n.type === 'success' ? 'bg-green-600 text-white' : ''}
            ${n.type === 'warning' ? 'bg-yellow-600 text-white' : ''}
            ${n.type === 'error' ? 'bg-red-600 text-white' : ''}
          `}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
