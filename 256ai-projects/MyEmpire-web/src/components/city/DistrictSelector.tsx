import { DISTRICTS } from '../../data/districts';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';

export default function DistrictSelector() {
  const unlockedDistricts = useGameStore((s) => s.unlockedDistricts);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const unlockDistrict = useGameStore((s) => s.unlockDistrict);
  const activeDistrictId = useUIStore((s) => s.activeDistrictId);
  const setActiveDistrict = useUIStore((s) => s.setActiveDistrict);
  const addNotification = useUIStore((s) => s.addNotification);

  return (
    <div className="flex items-center gap-1 bg-gray-800/80 px-3 py-1.5 overflow-x-auto">
      {DISTRICTS.map((d) => {
        const unlocked = unlockedDistricts.includes(d.id);
        const active = activeDistrictId === d.id;
        const canAfford = cleanCash >= d.unlockCost;

        return (
          <button
            key={d.id}
            onClick={() => {
              if (unlocked) {
                setActiveDistrict(d.id);
              } else if (canAfford) {
                if (unlockDistrict(d.id)) {
                  setActiveDistrict(d.id);
                  addNotification(`Unlocked ${d.name}!`, 'success');
                }
              } else {
                addNotification(`Need ${formatMoney(d.unlockCost)} to unlock ${d.name}`, 'warning');
              }
            }}
            className={`
              px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition
              ${active
                ? 'text-white shadow-lg'
                : unlocked
                  ? 'text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700'
                  : canAfford
                    ? 'text-gray-400 bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600'
                    : 'text-white bg-gray-800/50 cursor-not-allowed'
              }
            `}
            style={active ? { backgroundColor: d.themeColor } : undefined}
          >
            {unlocked ? d.name : `${d.name} (${formatMoney(d.unlockCost)})`}
          </button>
        );
      })}
    </div>
  );
}
