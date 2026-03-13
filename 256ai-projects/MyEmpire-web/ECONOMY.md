# MyEmpire: Kingpin — Economy Systems & Formulas

All costs in the game are formula-driven. Adding new content (rooms, strains, upgrades, dealer tiers, jobs) requires only adding data entries — no code changes.

**Two currencies:** Dirty Cash 💵 (criminal income) | Clean Cash 🏦 (laundered through businesses or earned via jobs)

---

## 1. Grow Room Buildings

Each building type can be purchased once. Prices follow a ×4 progression per tier, with ALL costs derived from the building's purchase cost.

**Core rule:** Each tier costs 4× the previous. `strainUnlockBase = 2× purchaseCost`. `autoHarvestCost = purchaseCost`. `upgradeCostMultiplier = 4^tierIndex`.

| Room | Purchase Cost (dirty) | upgradeCostMultiplier | autoHarvestCost |
|------|----------------------|----------------------|-----------------|
| Closet | $0 (free starter) | 1× | $500 |
| Shed | $2,000 | 4× | $2,000 |
| Garage | $8,000 | 16× | $8,000 |
| Small Grow Facility | $32,000 | 64× | $32,000 |
| Grow Facility | $128,000 | 256× | $128,000 |
| Large Grow Facility | $512,000 | 1,024× | $512,000 |

**`upgradeCostMultiplier`** scales all equipment upgrade costs within that room. Example: a $600 FloraGro I upgrade costs $600 × 256 = $153,600 in the Grow Facility.

**Code:** `GROW_ROOM_TYPE_DEFS` in `src/data/types.ts`

---

## 2. Strain Unlock Formula

Each room starts with 1 strain slot (free). Additional strain slots cost progressively more using a doubling formula.

**Rule:** `strainUnlockBase = purchaseCost × 2` (buying the building = getting the first strain free, unlocks start at 2× building cost)

**Formula:** `strainUnlockBase × 2^(slotIndex - 1)`

| Room | purchaseCost | strainUnlockBase | Slot 1 (free) | Slot 2 | Slot 3 | Slot 4 |
|------|-------------|-----------------|---------------|--------|--------|--------|
| Closet | $0 | $0 | Basic Bud | — | — | — |
| Shed | $2,000 | $4,000 | OG Kush | $4,000 | $8,000 | $16,000 |
| Garage | $8,000 | $16,000 | Sour Diesel | $16,000 | $32,000 | $64,000 |
| Small Grow | $32,000 | $64,000 | Durban Poison | $64,000 | $128,000 | $256,000 |
| Grow Facility | $128,000 | $256,000 | Gelato | $256,000 | $512,000 | $1,024,000 |
| Large Grow | $512,000 | $1,024,000 | Exotic Kush | $1,024,000 | $2,048,000 | $4,096,000 |

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

**Code:** `ROOM_UPGRADE_DEFS` in `src/data/types.ts`, `getRoomBonus()` and `getRoomCycleCost()` in `src/engine/economy.ts`

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

**Code:** `calculateLaunderTick()`, `calculateBusinessRevenue()`, `calculateBusinessExpenses()` in `src/engine/economy.ts`

---

## 6. Street Selling

Direct street sales at 70% of average product price, with a quota system.

- **Max quota:** 160 oz (10 lbs)
- **Refill rate:** 16 oz/min (1 lb/min)
- **Price:** `weightedAvgPrice × 0.7`

**Code:** `sellProduct()` action in `src/store/gameStore.ts`

---

## 7. Heat System

Heat is a 0–100 scale that increases from criminal activity and decreases from front businesses.

### Status: ⚠️ PARTIALLY ACTIVE

The heat data model, tiers, and UI display are complete. **However, `calculateHeatTick()` is NOT called in the game loop tick() — heat does not auto-update.** The only active heat mechanic is the Job District firing system.

### Heat Tiers

| Tier | Name | Range | Color |
|------|------|-------|-------|
| 0 | Unknown | 0–24 | Green |
| 1 | Noticed | 25–49 | Yellow |
| 2 | Watched | 50–74 | Orange |
| 3 | Pressured | 75–89 | Red |
| 4 | Targeted | 90–100 | Dark Red |

### Heat Sources (DEFINED, not yet wired into tick)

- **Dealer activity:** `tier.heatPerTick × dealerCount` per tick
- **Police multiplier:** District `policePresenceMultiplier` scales heat gain

### Heat Reduction (DEFINED, not yet wired into tick)

- **Natural decay:** 0.01 per tick (background cooling)
- **Business reduction:** Each business has `heatReductionPerTick` (e.g., Car Wash: 0.025, Laundromat: 0.020)
- **Lawyers:** Planned but not implemented ("coming soon" in Legal view)

### Heat Formula (in `calculateHeatTick()` — not yet called)

```
heatGain = dealerCount × 0.005 × avgPoliceMultiplier
heatDecay = 0.01 + sum(biz.heatReductionPerTick × 0.005)
heatDelta = heatGain - heatDecay
newHeat = clamp(0, 100, currentHeat + heatDelta)
```

### Active Heat Mechanics

- **Job firing:** If `heat > job.maxHeat`, player is auto-fired with 60s cooldown
- **Heat notice:** UI badge appears when `totalDirtyEarned >= $100K`
- **Heat display:** Shown in Legal view with tier name, color, and bar

### TODO to fully activate heat

1. Import and call `calculateHeatTick()` in the `tick()` function in `gameStore.ts`
2. Wire lawyer hiring to reduce heat decay
3. Add event/raid triggers at high heat tiers

**Code:** `calculateHeatTick()`, `getHeatTier()` in `src/engine/heat.ts`

---

## 8. Dirty Jobs District (Clean Cash Bootstrap)

Jobs let players earn clean cash by working legit jobs, bribed into with dirty cash. Higher-paying jobs have lower heat tolerance — get too hot and you're fired.

**Purpose:** Solves the clean cash chicken-and-egg problem (need clean cash to buy businesses, need businesses to earn clean cash).

**Rules:**
- One job at a time. Applying for a new job replaces the current one.
- **Heat check every tick:** If `heat > job.maxHeat` → auto-fired, 60-tick cooldown
- Quitting voluntarily has no cooldown
- Bribe cost paid in dirty cash

| Job | Bribe Cost (dirty) | Clean $/tick | Max Heat |
|-----|-------------------|-------------|----------|
| Fast Food | $1,000 | $3/s | 75 |
| Retail | $5,000 | $8/s | 60 |
| Office Clerk | $25,000 | $20/s | 45 |
| Warehouse Manager | $100,000 | $50/s | 30 |
| Finance Bro | $400,000 | $120/s | 20 |
| Corporate Exec | $1,000,000 | $250/s | 10 |

**Early game flow:** Grow weed → sell for dirty cash → bribe into Fast Food ($1K) → earn $3/tick clean → accumulate $3K → buy first taco shop → start laundering → scale up → eventually outgrow jobs.

**Code:** `JOB_DEFS`, `JOB_MAP` in `src/data/types.ts`, `applyForJob()`, `quitJob()` in `src/store/gameStore.ts`

**UI:** `src/components/city/JobDistrictBlock.tsx` — special district at grid position col:1, row:4

---

## 9. Prestige

Reset the game with a permanent yield bonus.

- **Threshold:** $1M total dirty cash earned
- **Bonus:** +5% grow yield per prestige level (stacks)

**Code:** `prestige()` in `src/store/gameStore.ts`

---

## 10. City Districts & Block Expansion

### Standard Business Districts

| District | Unlock Cost (clean) | Revenue Mult | Operating Cost Mult | Traffic Mult | Police Mult |
|----------|-------------------|-------------|-------------------|-------------|-------------|
| Starter Neighborhood | Free | 1.0× | 0.8× | 0.8× | 0.5× |
| Strip Mall | $25,000 | 1.3× | 1.0× | 1.3× | 1.0× |
| North Side | $75,000 | 1.4× | 1.1× | 1.2× | 1.0× |
| South Side Sliders | $100,000 | 1.5× | 0.9× | 1.4× | 1.2× |
| Downtown | $200,000 | 1.8× | 1.6× | 2.0× | 1.5× |
| Moving on Up Side | $300,000 | 2.0× | 1.8× | 1.6× | 1.3× |
| Desert Highway | $400,000 | 5.0× | 10.0× | 0.5× | 0.4× |
| Wealthy West Winds | $500,000 | 10.0× | 30.0× | 1.5× | 0.8× |

### Residential Districts

| District | Unlock Cost (clean) | Max Slots | Revenue Mult |
|----------|-------------------|-----------|-------------|
| Row Houses | $15,000 | 4 | 0.8× |
| Apartment Row | $80,000 | 6 | 1.2× |
| The Towers | $180,000 | 8 | 1.6× |

### Special Districts (no business slots)

| District | Purpose | Always Unlocked |
|----------|---------|----------------|
| Home Turf (Operations) | Grow rooms | Yes |
| Dealer Network | Dealer tiers | Yes |
| Dirty Jobs | Jobs for clean cash | Yes |

### Block Expansion

- **Initial cost:** $2,000 (clean cash)
- **Formula:** `nextBlockCost × 2` after each purchase
- **Lot unlock within district:** `$1,000 × 2^(unlockedSlots - 2)` per lot
- **Generated blocks:** Infinite expansion, auto-discovered adjacent to unlocked districts

**Code:** `DISTRICTS` in `src/data/districts.ts`, `unlockDistrict()`, `unlockLot()`, `unlockGeneratedBlock()` in `src/store/gameStore.ts`

---

## Key Helper Functions

| Function | File | Purpose |
|----------|------|---------|
| `getStrainUnlockCost(def, slotIndex)` | `src/data/types.ts` | Doubling strain unlock cost |
| `getDealerHireCost(tier, ownedCount)` | `src/data/types.ts` | Escalating dealer cost (1.5× per dealer) |
| `getRoomBonus(room, bonusType)` | `src/engine/economy.ts` | Total speed/yield/double bonus from upgrades |
| `getRoomCycleCost(room)` | `src/engine/economy.ts` | Total per-harvest overhead cost |
| `calculateLaunderTick(biz, available)` | `src/engine/economy.ts` | Dirty → clean per tick |
| `calculateDispensaryTick(biz, oz, price)` | `src/engine/economy.ts` | Product → clean per tick |
| `calculateBusinessRevenue(biz)` | `src/engine/economy.ts` | Clean cash revenue per tick |
| `calculateBusinessExpenses(biz)` | `src/engine/economy.ts` | Operating costs per tick |
| `calculateHeatTick()` | `src/engine/heat.ts` | Heat delta per tick (NOT YET CALLED) |
| `getHeatTier(heat)` | `src/engine/heat.ts` | Numeric heat → tier name/color |
| `formatMoney(amount)` | `src/engine/economy.ts` | Human-readable money ($1.5K, $2.3M) |
| `formatUnits(oz)` | `src/engine/economy.ts` | Human-readable weight (3lb 4oz, 2 crates) |

---

## Persist Version History

| Version | Changes |
|---------|---------|
| 12 | Base game state |
| 13 | Unified upgrade system (upgradeLevels), per-strain inventory |
| 14 | Residential districts, apartments |
| 15 | Job district (currentJobId, jobFiredCooldown) |
