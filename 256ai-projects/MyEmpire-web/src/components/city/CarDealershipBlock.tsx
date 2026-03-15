import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import Tooltip from '../ui/Tooltip';

const BLOCK_W = 164;

export default function CarDealershipBlock() {
  const setShowCarDealership = useUIStore(s => s.setShowCarDealership);
  const cars = useGameStore(s => s.cars);
  const cleanCash = useGameStore(s => s.cleanCash);

  const totalPrestige = cars.reduce((s, c) => s + c.prestigeBonus, 0);

  return (
    <Tooltip text="Browse cars. Status symbols that boost reputation.">
    <button
      onClick={() => setShowCarDealership(true)}
      style={{ width: BLOCK_W, borderColor: '#EF444450', backgroundColor: '#EF444412' }}
      className="rounded-lg border p-2 flex flex-col items-center justify-center gap-1 hover:brightness-125 transition-all cursor-pointer"
    >
      <span className="text-3xl">🏎️</span>
      <p className="text-[10px] font-bold text-red-400">Prestige Motors</p>
      <p className="text-[8px] text-gray-400">Collect cars, flex prestige</p>

      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span className="text-[7px] text-gray-500">
          {cars.length} car{cars.length !== 1 ? 's' : ''} owned
        </span>
        {totalPrestige > 0 && (
          <span className="text-[7px] text-red-400">
            +{totalPrestige} prestige bonus
          </span>
        )}
      </div>

      <div className="mt-1 flex gap-1.5 text-sm">
        <span>🚗</span>
        <span>🏁</span>
        <span>🔥</span>
      </div>
      <p className="text-[7px] text-red-500/60 mt-0.5">Tap to shop</p>
    </button>
    </Tooltip>
  );
}
