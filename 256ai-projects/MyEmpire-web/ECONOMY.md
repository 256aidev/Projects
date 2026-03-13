# MyEmpire: Kingpin — Economy Systems & Formulas

All costs in the game are formula-driven. Adding new content (rooms, strains, upgrades, dealer tiers) requires only adding data entries — no code changes.

---

## 1. Grow Room Buildings

Each building type can be purchased once. Prices increase with each tier.

| Room | Purchase Cost | upgradeCostMultiplier | autoHarvestCost |
|------|--------------|----------------------|-----------------|
| Closet | $0 (free starter) | 1× | $500 |
| Shed | $1,500 | 2× | $1,000 |
| Garage | $16,000 | 4× | $2,000 |
| Small Grow Facility | $100,000 | 8× | $4,000 |
| Grow Facility | $250,000 | 16× | $8,000 |

**`upgradeCostMultiplier`** scales all equipment upgrade costs within that room. Example: a $500 Water upgrade costs $500 × 16 = $8,000 in the Grow Facility.

---

## 2. Strain Unlock Formula

Each room starts with 1 strain slot (free). Additional strain slots cost progressively more using a doubling formula.

**Rule:** `strainUnlockBase = purchaseCost × 2` (buying the building = getting the first strain free, unlocks start at 2× building cost)

**Formula:** `strainUnlockBase × 2^(slotIndex - 1)`

| Room | purchaseCost | strainUnlockBase | Slot 1 (free) | Slot 2 | Slot 3 | Slot 4 |
|------|-------------|-----------------|---------------|--------|--------|--------|
| Closet | $0 | $0 | Basic Bud | — | — | — |
| Shed | $1,500 | $3,000 | OG Kush | $3,000 | $6,000 | $12,000 |
| Garage | $16,000 | $32,000 | Sour Diesel | $32,000 | $64,000 | $128,000 |
| Small Grow | $100,000 | $200,000 | Durban Poison | $200,000 | $400,000 | $800,000 |
| Grow Facility | $250,000 | $500,000 | Gelato | $500,000 | $1,000,000 | $2,000,000 |

**Code:** `getStrainUnlockCost(def, slotIndex)` in `src/data/types.ts`

---

## 3. Equipment Upgrades (Unified System)

All room equipment upgrades are defined in `ROOM_UPGRADE_DEFS` (data-driven). Each upgrade has multiple levels with fixed costs that get scaled by the room's `upgradeCostMultiplier`.

**Actual cost:** `upgradeDef.levels[level].cost × room.upgradeCostMultiplier`

| Upgrade | Type | Levels | Bonus Type |
|---------|------|--------|------------|
| FloraGro | Nutrient | 3 | Speed (faster grow) |
| FloraMicro | Nutrient | 3 | Yield (more harvest) |
| FloraBloom | Nutrient | 3 | Double (chance to 2× harvest) |
| Water | Infrastructure | 3 | Speed |
| Light | Infrastructure | 3 | Yield |
| Auto-Harvest | Toggle | 1 | Auto-replants on harvest |

**Per-cycle costs:** Each upgrade level has a `costPerCycle` (dirty cash deducted per harvest). Some upgrades have a `baseCostPerCycle` even at level 0 (Water: $1/cycle, Light: $2/cycle).

**Bonus stacking:** Multiple upgrades of the same bonus type stack additively. Example: FloraGro III (-15% time) + Water III (-3% time) = -18% total grow time.

**Code:** `getRoomBonus(room, 'speed'|'yield'|'double')` and `getRoomCycleCost(room)` in `src/engine/economy.ts`

---

## 4. Dealer Network — Escalating Hire Costs

Dealers sell product for dirty cash. Each additional dealer of the same tier costs exponentially more, preventing easy spam.

**Formula:** `Math.floor(tier.hireCost × 1.5^ownedCount)`

Example (Corner Boys, base $500):
| Dealer # | Cost | Cumulative |
|----------|------|-----------|
| 1st | $500 | $500 |
| 2nd | $750 | $1,250 |
| 3rd | $1,125 | $2,375 |
| 4th | $1,687 | $4,062 |
| 5th | $2,531 | $6,593 |
| 10th | $19,268 | ~$57K total |

**Tier upgrade cost:** `nextTier.hireCost × 3` (flat, not escalating)

| Tier | Base Hire | Sales/Tick | Cut/8oz | Heat/Tick |
|------|----------|-----------|---------|-----------|
| Corner Boys | $500 | 0.5 oz | $3 | 0.005 |
| Street Crew | $300 | 1.5 oz | $5 | 0.012 |
| Distribution Network | $1,200 | 4.0 oz | $8 | 0.020 |
| City Syndicate | $6,000 | 12.0 oz | $15 | 0.035 |
| Regional Cartel | $30,000 | 40.0 oz | $25 | 0.060 |

**Code:** `getDealerHireCost(tier, ownedCount)` in `src/data/types.ts`

---

## 5. Front Business Laundering

Front businesses convert dirty cash → clean cash (or sell product for dispensaries).

**Launder capacity:** `baseLaunderPerTick × tier.launderMultiplier × district.customerTrafficMultiplier`

**Clean cash produced:** `dirtyConsumed × launderEfficiency` (efficiency < 1.0 = laundering fee)

**Reverse flow:** Clean → dirty at 95% efficiency (5% handling cost)

**Business revenue:** `baseRevenuePerTick × tier.revenueMultiplier × supplyModifier × district.revenueMultiplier`

**Business expenses:** `(baseOperatingCost × tier.operatingCostMult × district.operatingCostMult) + (employees × salaryPerTick)`

---

## 6. Street Selling

Direct street sales at 70% of average product price, with a quota system.

- **Max quota:** 160 oz (10 lbs)
- **Refill rate:** 16 oz/min (1 lb/min)
- **Price:** `weightedAvgPrice × 0.7`

---

## 7. Heat System

Heat increases from dealer activity and decreases from front businesses.

- **Dealer heat:** `tier.heatPerTick × dealerCount` per tick
- **Business heat reduction:** `heatReductionPerTick` per operating business per tick

---

## 8. Prestige

Reset the game with a permanent yield bonus.

- **Threshold:** $1M total dirty cash earned
- **Bonus:** +5% grow yield per prestige level (stacks)

---

## 9. City Block Expansion

New city blocks cost clean cash, doubling each purchase.

- **Initial cost:** $2,000
- **Formula:** `nextBlockCost × 2` after each purchase
- **Lot unlock:** `$1,000 × 2^(unlockedSlots - 2)` per lot within a block

---

## Key Helper Functions

| Function | File | Purpose |
|----------|------|---------|
| `getStrainUnlockCost(def, slotIndex)` | `src/data/types.ts` | Doubling strain unlock cost |
| `getDealerHireCost(tier, ownedCount)` | `src/data/types.ts` | Escalating dealer cost (1.5× per dealer) |
| `getRoomBonus(room, bonusType)` | `src/engine/economy.ts` | Total speed/yield/double bonus from upgrades |
| `getRoomCycleCost(room)` | `src/engine/economy.ts` | Total per-harvest overhead cost |
| `calculateLaunderCapacity(biz)` | `src/engine/economy.ts` | Max dirty cash laundered per tick |
| `calculateBusinessRevenue(biz)` | `src/engine/economy.ts` | Clean cash revenue per tick |
| `calculateBusinessExpenses(biz)` | `src/engine/economy.ts` | Operating costs per tick |
| `formatMoney(amount)` | `src/engine/economy.ts` | Human-readable money ($1.5K, $2.3M) |
| `formatUnits(oz)` | `src/engine/economy.ts` | Human-readable weight (3lb 4oz, 2 crates) |
