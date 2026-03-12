import { useGameStore } from '../../store/gameStore';
import { formatUnits } from '../../engine/economy';
import CannabisLeaf from '../ui/CannabisLeaf';

export default function WarehouseView() {
  const operation = useGameStore((s) => s.operation);
  const inventory = useGameStore((s) => s.inventory);
  const storageCapacity = useGameStore((s) => s.storageCapacity);

  const allSlots = operation.growRooms.flatMap((r) => r.slots);
  const avgPrice = allSlots.length > 0
    ? allSlots.reduce((sum, s) => sum + s.pricePerUnit, 0) / allSlots.length
    : 0;
  const streetPrice = Math.floor(avgPrice * 0.7);
  const totalPlants = allSlots.reduce((sum, s) => sum + s.plantsCapacity, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="text-center py-2">
        <h2 className="text-white font-bold text-xl">Warehouse</h2>
        <p className="text-gray-400 text-xs mt-1">Your stash — keep it moving</p>
      </div>

      {/* Product */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Product Stash</h3>
          <CannabisLeaf size={32} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-gray-900/60 rounded-lg p-3">
            <p className="text-gray-500 text-xs">In Stock</p>
            <p className="text-green-400 font-bold text-lg">{formatUnits(Object.values(operation.productInventory).reduce((s, e) => s + e.oz, 0))}</p>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Seeds</p>
            <p className="text-lime-400 font-bold text-xl">{operation.seedStock}</p>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Avg Dealer Price</p>
            <p className="text-yellow-400 font-bold text-lg">${avgPrice.toFixed(0)}/oz</p>
          </div>
          <div className="bg-gray-900/60 rounded-lg p-3">
            <p className="text-gray-500 text-xs">Street Price</p>
            <p className="text-orange-400 font-bold text-lg">${streetPrice}/oz</p>
          </div>
        </div>
        <p className="text-gray-700 text-[10px] text-center mt-2">1 oz · 16oz = 1lb · 100lb = 1 crate</p>
      </div>

      {/* Active strains */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Active Strains · {totalPlants} plants total</h3>
        <div className="space-y-2">
          {operation.growRooms.map((room) =>
            room.slots.map((slot, i) => (
              <div key={`${room.id}_${i}`} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-white text-sm font-medium">{slot.strainName}</p>
                  <p className="text-gray-500 text-xs">{room.name} · {slot.plantsCapacity} plants</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 text-sm font-bold">${slot.pricePerUnit}/oz</p>
                  <p className="text-gray-500 text-xs">{formatUnits(slot.harvestYield)}/harvest</p>
                </div>
              </div>
            ))
          )}
          {operation.growRooms.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-2">No grow rooms yet</p>
          )}
        </div>
      </div>

      {/* Resources */}
      {Object.keys(inventory).length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Supply Inventory</h3>
          <div className="space-y-2">
            {Object.entries(inventory).map(([id, qty]) => (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-gray-300 capitalize">{id.replace('_', ' ')}</span>
                <span className="text-white font-semibold">{Math.floor(qty)} units</span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-2 text-right">
            Storage: {storageCapacity} capacity
          </p>
        </div>
      )}
    </div>
  );
}
