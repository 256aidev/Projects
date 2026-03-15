import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { CAR_DEFS, CAR_TIER_COLORS, CAR_TIER_ORDER, getCarBonuses } from '../../data/carDefs';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function CarDealershipView() {
  const close = useUIStore(s => s.setShowCarDealership);
  const cleanCash = useGameStore(s => s.cleanCash);
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const cars = useGameStore(s => s.cars);
  const buyCar = useGameStore(s => s.buyCar);
  const addNotification = useUIStore(s => s.addNotification);

  const ownedIds = new Set(cars.map(c => c.defId));
  const carBonuses = getCarBonuses(cars);

  const handleBuy = (defId: string) => {
    if (buyCar(defId)) { sound.play('buy'); addNotification('New ride acquired!', 'success'); }
    else addNotification('Cannot afford this car', 'warning');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/40">
        <div>
          <h2 className="text-red-400 font-bold text-lg">🏎️ Dealership</h2>
          <p className="text-[9px] text-gray-500">Each tier gives a unique gameplay bonus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-gray-400">💵 {formatMoney(dirtyCash)}</span>
            <br />
            <span className="text-[10px] text-gray-400">🏦 {formatMoney(cleanCash)}</span>
          </div>
          <Tooltip text="Leave the dealership."><button onClick={() => close(false)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button></Tooltip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Stats */}
        <div className="bg-gray-900/80 rounded-lg p-3 border border-red-900/30">
          <div className="flex justify-around mb-2">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{cars.length}</p>
              <p className="text-[8px] text-gray-500">Cars Owned</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-400">{CAR_DEFS.length - cars.length}</p>
              <p className="text-[8px] text-gray-500">Available</p>
            </div>
          </div>
          {cars.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {carBonuses.heatReduction > 0 && <span className="text-[9px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">-{Math.round(carBonuses.heatReduction * 100)}% heat</span>}
              {carBonuses.growSpeed > 0 && <span className="text-[9px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full">-{Math.round(carBonuses.growSpeed * 100)}% grow time</span>}
              {carBonuses.dealerBoost > 0 && <span className="text-[9px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full">+{Math.round(carBonuses.dealerBoost * 100)}% dealer sales</span>}
              {carBonuses.incomeMultiplier > 0 && <span className="text-[9px] bg-yellow-900/40 text-yellow-300 px-2 py-0.5 rounded-full">+{Math.round(carBonuses.incomeMultiplier * 100)}% dirty income</span>}
              {carBonuses.launderBoost > 0 && <span className="text-[9px] bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">+{Math.round(carBonuses.launderBoost * 100)}% launder</span>}
            </div>
          )}
        </div>

        {/* Cars by tier */}
        {CAR_TIER_ORDER.map(tier => {
          const tierCars = CAR_DEFS.filter(c => c.tier === tier);
          const tierColor = CAR_TIER_COLORS[tier];
          return (
            <div key={tier}>
              <p className="text-[11px] font-bold mb-2 capitalize" style={{ color: tierColor }}>
                {tier}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {tierCars.map(car => {
                  const owned = ownedIds.has(car.id);
                  const isDirty = car.currency === 'dirty';
                  const wallet = isDirty ? dirtyCash : cleanCash;
                  const canAfford = wallet >= car.cost;
                  return (
                    <div key={car.id}
                      className={`bg-gray-900 rounded-lg p-3 border flex items-center gap-3 ${
                        owned ? 'border-emerald-700/50' : 'border-gray-800'
                      }`}
                    >
                      <span className="text-2xl">{car.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-bold text-white truncate">{car.name}</p>
                          {owned && <span className="text-[8px] text-emerald-400 font-bold shrink-0">OWNED</span>}
                        </div>
                        <p className="text-[8px] text-gray-500">{car.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[9px] ${isDirty ? 'text-green-400' : 'text-blue-400'}`}>
                            {isDirty ? '💵' : '🏦'} {formatMoney(car.cost)}
                          </span>
                          <span className="text-[9px]" style={{ color: tierColor }}>+{Math.round(car.bonusValue * 100)}% {car.bonusType === 'heatReduction' ? 'heat reduction' : car.bonusType === 'growSpeed' ? 'grow speed' : car.bonusType === 'dealerBoost' ? 'dealer sales' : car.bonusType === 'incomeMultiplier' ? 'dirty income' : 'launder'}</span>
                        </div>
                      </div>
                      {!owned && (
                        <Tooltip text={car.description}><button onClick={() => handleBuy(car.id)}
                          disabled={!canAfford}
                          className={`px-5 py-3 rounded-xl text-sm font-black shrink-0 transition ${
                            canAfford ? 'bg-red-600 text-white active:bg-red-500 hover:bg-red-500' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          }`}
                        >BUY</button></Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Placeholder for future house */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-dashed border-gray-700 text-center mt-2">
          <span className="text-2xl">🏠</span>
          <p className="text-[9px] text-gray-600 mt-1">Garage & House — Coming Soon</p>
          <p className="text-[7px] text-gray-700">Your cars will park here one day...</p>
        </div>
      </div>
    </div>
  );
}
