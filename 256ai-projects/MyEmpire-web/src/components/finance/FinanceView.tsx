import { useGameStore } from '../../store/gameStore';
import { formatMoney, formatUnits, calculateLaunderCapacity, calculateBusinessRevenue, calculateBusinessExpenses } from '../../engine/economy';
import { DEALER_TIERS, WATER_TIERS, LIGHT_TIERS } from '../../data/types';

function Row({ label, value, color = 'text-white', sub, indent }: { label: string; value: string; color?: string; sub?: string; indent?: boolean }) {
  return (
    <div className={`py-2 border-b border-gray-800/80 last:border-0 ${indent ? 'pl-3' : ''}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-xs shrink-0 ${indent ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
        <span className={`font-semibold text-sm tabular-nums text-right ${color}`}>{value}</span>
      </div>
      {sub && <p className="text-gray-600 text-[10px] mt-0.5 leading-tight">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-0.5">
      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

function ChartTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-[10px] mt-1">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className={`text-gray-500 font-semibold py-1 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-t border-gray-800">
            {row.map((cell, ci) => (
              <td key={ci} className={`py-1.5 ${ci === 0 ? 'text-gray-300 text-left' : 'text-gray-400 text-right tabular-nums'}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FinanceView() {
  const state = useGameStore((s) => s);
  const { dirtyCash, cleanCash, totalDirtyEarned, totalCleanEarned, totalSpent,
    heat, operation, businesses, tickCount, prestigeCount, prestigeBonus,
    lastTickCleanProfit } = state;

  const dealerTier = DEALER_TIERS[operation.dealerTierIndex];

  // Business financials
  const bizRevPerTick = businesses.reduce((s, b) => s + calculateBusinessRevenue(b), 0);
  const bizExpPerTick = businesses.reduce((s, b) => s + calculateBusinessExpenses(b), 0);
  const bizNetPerTick = bizRevPerTick - bizExpPerTick;
  const launderCapPerTick = businesses.reduce((s, b) => s + calculateLaunderCapacity(b), 0);

  // Dealer sales rate
  const dealerSalesRate = dealerTier ? dealerTier.salesRatePerTick * operation.dealerCount : 0;
  const allSlots = operation.growRooms.flatMap((r) => r.slots);
  const avgPrice = allSlots.length > 0
    ? allSlots.reduce((sum, s) => sum + s.pricePerUnit, 0) / allSlots.length
    : 0;
  const dealerCutPerTick = dealerTier ? dealerSalesRate * (dealerTier.cutPer8oz / 8) : 0;
  const dirtyPerTick = Math.max(0, dealerSalesRate * avgPrice - dealerCutPerTick);

  const netWorth = dirtyCash + cleanCash;
  const timePlayed = `${Math.floor(tickCount / 60)}m ${tickCount % 60}s`;

  // Per-room overhead breakdown
  const roomOverheads = operation.growRooms.map((room) => {
    const water = WATER_TIERS[room.waterTier ?? 0];
    const light = LIGHT_TIERS[room.lightTier ?? 0];
    return {
      name: room.name,
      waterName: water?.name ?? 'Tap Water',
      waterIcon: water?.icon ?? '🚰',
      waterCost: water?.costPerCycle ?? 0,
      waterBonus: water?.yieldBonus ?? 0,
      lightName: light?.name ?? 'Single Bulb',
      lightIcon: light?.icon ?? '💡',
      lightCost: light?.costPerCycle ?? 0,
      lightBonus: light?.yieldBonus ?? 0,
      total: (water?.costPerCycle ?? 0) + (light?.costPerCycle ?? 0),
    };
  });
  const totalCycleOverhead = roomOverheads.reduce((s, r) => s + r.total, 0);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <p className="text-white font-bold text-base px-1">Finance</p>

      {/* Cash Position */}
      <Section title="Cash Position">
        <Row label="Dirty Cash" value={formatMoney(dirtyCash)} color="text-green-400" />
        <Row label="Clean Cash" value={formatMoney(cleanCash)} color="text-blue-400" />
        <Row label="Net Worth" value={formatMoney(netWorth)} color="text-white" />
      </Section>

      {/* Income */}
      <Section title="Income (per tick)">
        <Row
          label="Drug Sales"
          value={dirtyPerTick > 0 ? `+${formatMoney(dirtyPerTick)}/tick` : '—'}
          color="text-green-400"
          sub={operation.dealerCount > 0 ? `${operation.dealerCount}× ${dealerTier?.name} · $${dealerTier?.cutPer8oz} cut per 8oz · avg $${avgPrice.toFixed(0)}/oz` : 'No dealers hired'}
        />
        <Row
          label="Laundered (clean)"
          value={lastTickCleanProfit > 0 ? `+${formatMoney(lastTickCleanProfit)}/tick` : '—'}
          color="text-blue-400"
          sub={`Launder capacity: ${formatMoney(launderCapPerTick)}/tick across ${businesses.length} front${businesses.length !== 1 ? 's' : ''}`}
        />
        <Row
          label="Legit Business Revenue"
          value={bizRevPerTick > 0 ? `+${formatMoney(bizRevPerTick)}/tick` : '—'}
          color="text-blue-300"
        />
      </Section>

      {/* Expenses */}
      <Section title="Expenses">
        <Row
          label="Business Operating Costs"
          value={bizExpPerTick > 0 ? `-${formatMoney(bizExpPerTick)}/tick` : '—'}
          color="text-red-400"
          sub="Salaries + operating costs"
        />
        <Row
          label="Net Business Profit"
          value={`${bizNetPerTick >= 0 ? '+' : ''}${formatMoney(bizNetPerTick)}/tick`}
          color={bizNetPerTick >= 0 ? 'text-blue-400' : 'text-red-400'}
        />

        {/* Grow overhead — per room, per system */}
        <Row
          label="Grow Overhead (total)"
          value={totalCycleOverhead > 0 ? `-${formatMoney(totalCycleOverhead)}/cycle` : '—'}
          color="text-red-400"
        />
        {roomOverheads.map((r) => (
          <div key={r.name} className="pl-3 pt-1 pb-1 border-b border-gray-800/60 last:border-0">
            <p className="text-gray-500 text-[10px] mb-1">{r.name}</p>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">{r.waterIcon} {r.waterName}</span>
              <span className="text-red-400 tabular-nums">-${r.waterCost}/cycle</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">{r.lightIcon} {r.lightName}</span>
              <span className="text-red-400 tabular-nums">-${r.lightCost}/cycle</span>
            </div>
            <div className="flex justify-between text-[10px] mt-0.5 pt-0.5 border-t border-gray-800">
              <span className="text-gray-600">Room total</span>
              <span className="text-red-300 tabular-nums font-semibold">-${r.total}/cycle</span>
            </div>
          </div>
        ))}
      </Section>

      {/* Inventory */}
      <Section title="Inventory">
        <Row label="Product Ready" value={formatUnits(Object.values(operation.productInventory).reduce((s, e) => s + e.oz, 0))} color="text-green-400" />
        <Row label="Seed Stock" value={`${operation.seedStock} seeds`} color="text-yellow-400" />
        <Row
          label="Active Grow Slots"
          value={`${allSlots.filter(s => s.isHarvesting).length} / ${allSlots.length}`}
          sub="harvesting / total across all rooms"
        />
      </Section>

      {/* Risk */}
      <Section title="Risk">
        <Row
          label="Heat Level"
          value={heat.toFixed(1)}
          color={heat < 30 ? 'text-green-400' : heat < 60 ? 'text-yellow-400' : 'text-red-400'}
          sub={heat < 30 ? 'Low profile' : heat < 60 ? 'Getting noticed' : 'High risk — lay low'}
        />
        <Row label="Front Businesses" value={`${businesses.length}`} sub="Each operating front reduces heat per tick" />
      </Section>

      {/* Lifetime Stats */}
      <Section title="Lifetime Stats">
        <Row label="Total Dirty Earned" value={formatMoney(totalDirtyEarned)} color="text-green-400" />
        <Row label="Total Clean Earned" value={formatMoney(totalCleanEarned)} color="text-blue-400" />
        <Row label="Total Spent" value={formatMoney(totalSpent)} color="text-red-400" />
        <Row label="Time Played" value={timePlayed} />
        {prestigeCount > 0 && (
          <Row
            label="Prestige"
            value={`${prestigeCount}× (+${Math.round(prestigeBonus * 100)}% yield)`}
            color="text-yellow-400"
          />
        )}
      </Section>

      {/* ── REFERENCE CHARTS ── */}
      <Section title="💧 Water System Tiers">
        <ChartTable
          headers={['Tier', 'Upgrade Cost', '+Yield', 'Cost/Cycle']}
          rows={WATER_TIERS.map((t) => [
            `${t.icon} ${t.name}`,
            t.cost === 0 ? 'Free (starter)' : `$${t.cost.toLocaleString()}`,
            t.yieldBonus === 0 ? '—' : `+${Math.round(t.yieldBonus * 100)}%`,
            `$${t.costPerCycle}`,
          ])}
        />
      </Section>

      <Section title="💡 Lighting Tiers">
        <ChartTable
          headers={['Tier', 'Upgrade Cost', '+Yield', 'Cost/Cycle']}
          rows={LIGHT_TIERS.map((t) => [
            `${t.icon} ${t.name}`,
            t.cost === 0 ? 'Free (starter)' : `$${t.cost.toLocaleString()}`,
            t.yieldBonus === 0 ? '—' : `+${Math.round(t.yieldBonus * 100)}%`,
            `$${t.costPerCycle}`,
          ])}
        />
      </Section>

      <Section title="🤝 Dealer Tiers">
        <ChartTable
          headers={['Tier', 'Hire Cost', 'Sales/Tick', 'Cut/8oz']}
          rows={DEALER_TIERS.map((t) => [
            t.name,
            `$${t.hireCost.toLocaleString()}`,
            `${t.salesRatePerTick} oz`,
            `$${t.cutPer8oz}`,
          ])}
        />
      </Section>
    </div>
  );
}
