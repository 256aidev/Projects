import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { JEWELRY_DEFS, JEWELRY_DEF_MAP, JEWELRY_TIERS, JEWELRY_SLOT_LIMITS } from '../../data/jewelryDefs';
import { getJewelryBonuses } from '../../engine/jewelry';
import type { JewelrySlotType } from '../../data/types';

const BONUS_LABELS: Record<string, string> = {
  yield_boost: 'Yield',
  heat_decay: 'Heat Decay',
  operation_discount: 'Op Discount',
  hitman_discount: 'Hitman Discount',
  prestige_speed: 'Prestige Speed',
  launder_boost: 'Launder Boost',
};

const SLOT_ICONS: Record<JewelrySlotType, string> = {
  ring: '💍', bracelet: '⛓️', necklace: '📿', pendant: '🏅',
};

export default function JewelryStoreView() {
  const close = useUIStore(s => s.setShowJewelryStore);
  const cleanCash = useGameStore(s => s.cleanCash);
  const jewelry = useGameStore(s => s.jewelry);
  const buyJewelry = useGameStore(s => s.buyJewelry);
  const upgradeJewelry = useGameStore(s => s.upgradeJewelry);
  const addNotification = useUIStore(s => s.addNotification);

  const bonuses = getJewelryBonuses(jewelry);
  const ownedIds = new Set(jewelry.map(j => j.defId));

  const slotCounts: Record<JewelrySlotType, number> = { ring: 0, bracelet: 0, necklace: 0, pendant: 0 };
  for (const j of jewelry) slotCounts[j.slotType]++;

  const handleBuy = (defId: string) => {
    if (buyJewelry(defId)) addNotification('Purchased jewelry!', 'success');
    else addNotification('Cannot buy — check funds or slot limits', 'warning');
  };

  const handleUpgrade = (idx: number) => {
    if (upgradeJewelry(idx)) addNotification('Jewelry upgraded!', 'success');
    else addNotification('Cannot upgrade — check funds or max tier', 'warning');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/40">
        <div>
          <h2 className="text-cyan-400 font-bold text-lg">💎 Ice Box Jewelers</h2>
          <p className="text-[9px] text-gray-500">Buy & upgrade for permanent bonuses</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400">🏦 {formatMoney(cleanCash)}</span>
          <button onClick={() => close(false)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Active bonuses summary */}
        {jewelry.length > 0 && (
          <div className="bg-gray-900/80 rounded-lg p-3 border border-cyan-900/30">
            <p className="text-[9px] text-gray-500 mb-1.5 font-semibold">Active Bonuses</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(bonuses).map(([key, val]) => val > 0 && (
                <span key={key} className="text-[10px] text-cyan-300">
                  +{(val * 100).toFixed(1)}% {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Slot overview */}
        <div className="flex gap-3 justify-center">
          {(Object.entries(JEWELRY_SLOT_LIMITS) as [JewelrySlotType, number][]).map(([slot, max]) => (
            <div key={slot} className="text-center">
              <span className="text-sm">{SLOT_ICONS[slot]}</span>
              <p className="text-[8px] text-gray-400">{slotCounts[slot]}/{max}</p>
            </div>
          ))}
        </div>

        {/* Owned jewelry */}
        {jewelry.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 font-semibold mb-2">Your Collection</p>
            <div className="grid grid-cols-2 gap-2">
              {jewelry.map((owned, idx) => {
                const def = JEWELRY_DEF_MAP[owned.defId];
                if (!def) return null;
                const tier = JEWELRY_TIERS[owned.tier];
                const nextTier = owned.tier < 4 ? JEWELRY_TIERS[owned.tier + 1] : null;
                const currentBonus = def.bonusPerTier * (owned.tier + 1);
                return (
                  <div key={idx} className="bg-gray-900 rounded-lg p-2 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{def.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{def.name}</p>
                        <p className="text-[8px] text-gray-500">{tier.icon} {tier.name}</p>
                      </div>
                    </div>
                    <p className="text-[8px] text-cyan-400 mb-1">+{(currentBonus * 100).toFixed(1)}% {BONUS_LABELS[def.bonusType]}</p>
                    {/* Tier dots */}
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= owned.tier ? 'bg-cyan-400' : 'bg-gray-700'}`} />
                      ))}
                    </div>
                    {nextTier && (
                      <button onClick={() => handleUpgrade(idx)}
                        className={`w-full py-1 rounded text-[9px] font-bold ${
                          cleanCash >= nextTier.upgradeCost
                            ? 'bg-cyan-700 text-white active:bg-cyan-600'
                            : 'bg-gray-800 text-gray-600'
                        }`}
                      >
                        {nextTier.icon} Upgrade → {nextTier.name} ({formatMoney(nextTier.upgradeCost)})
                      </button>
                    )}
                    {!nextTier && <p className="text-[8px] text-yellow-400 text-center font-bold">MAX TIER</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shop — items not yet owned */}
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-2">Shop</p>
          <div className="grid grid-cols-2 gap-2">
            {JEWELRY_DEFS.filter(d => !ownedIds.has(d.id)).map(def => {
              const slotFull = slotCounts[def.slotType] >= JEWELRY_SLOT_LIMITS[def.slotType];
              const canAfford = cleanCash >= def.baseCost;
              return (
                <button key={def.id} onClick={() => !slotFull && canAfford && handleBuy(def.id)}
                  disabled={slotFull || !canAfford}
                  className={`bg-gray-900 rounded-lg p-2 border text-left transition ${
                    slotFull ? 'border-gray-800 opacity-40' : canAfford ? 'border-cyan-900/40 active:bg-gray-800' : 'border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{def.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{def.name}</p>
                      <p className="text-[8px] text-gray-500">{def.slotType}</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-cyan-400">+{(def.bonusPerTier * 100).toFixed(1)}% {BONUS_LABELS[def.bonusType]}/tier</p>
                  <p className={`text-[9px] font-bold mt-1 ${canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatMoney(def.baseCost)}
                  </p>
                  {slotFull && <p className="text-[7px] text-red-400">Slot full</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
