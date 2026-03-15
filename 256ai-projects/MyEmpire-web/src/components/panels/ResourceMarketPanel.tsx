import { useState } from 'react';
import { RESOURCES } from '../../data/resources';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function ResourceMarketPanel() {
  const closeAll = useUIStore((s) => s.closeAll);
  const addNotification = useUIStore((s) => s.addNotification);
  const cleanCash = useGameStore((s) => s.cleanCash);
  const inventory = useGameStore((s) => s.inventory);
  const purchaseResource = useGameStore((s) => s.purchaseResource);

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeAll}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-96 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-1">Resource Market</h3>
        <p className="text-gray-400 text-xs mb-4">Buy supplies to keep your businesses running</p>

        <div className="flex flex-col gap-2">
          {RESOURCES.map((r) => {
            const qty = quantities[r.id] ?? 10;
            const totalCost = r.basePricePerUnit * qty;
            const stock = inventory[r.id] ?? 0;
            const canAfford = cleanCash >= totalCost;

            return (
              <div key={r.id} className="bg-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    <p className="text-gray-500 text-[10px]">{r.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 text-xs font-bold">{formatMoney(r.basePricePerUnit)}/unit</p>
                    <p className="text-gray-400 text-[10px]">Stock: {Math.floor(stock)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={qty}
                    onChange={(e) => setQuantities({ ...quantities, [r.id]: Number(e.target.value) })}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-white text-xs w-8 text-right">{qty}</span>
                  <Tooltip text="Buy supplies for your front businesses.">
                  <button
                    onClick={() => {
                      if (purchaseResource(r.id, qty)) {
                        sound.play('buy');
                        addNotification(`Bought ${qty} ${r.name}`, 'success');
                      } else {
                        addNotification('Not enough cleanCash or storage', 'warning');
                      }
                    }}
                    disabled={!canAfford}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-bold transition
                      ${canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {formatMoney(totalCost)}
                  </button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        <Tooltip text="Close this panel.">
        <button
          onClick={closeAll}
          className="w-full mt-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition"
        >
          Close
        </button>
        </Tooltip>
      </div>
    </div>
  );
}
