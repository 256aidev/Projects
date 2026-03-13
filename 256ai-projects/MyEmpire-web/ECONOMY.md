# MyEmpire: Kingpin — Economy Systems & Formulas

All costs in the game are formula-driven. Adding new content (rooms, strains, upgrades, dealer tiers, jobs) requires only adding data entries — no code changes.

**Two currencies:** Dirty Cash (criminal income) | Clean Cash (laundered through businesses or earned via jobs)

---

## 1. Grow Room Buildings

Each building type can be purchased once. Prices follow a x4 progression per tier, with ALL costs derived from the building's purchase cost.

**Core rule:** Each tier costs 4x the previous. `strainUnlockBase = 2x purchaseCost`. `autoHarvestCost = purchaseCost`. `upgradeCostMultiplier = 4^tierIndex`.

**Yield rule:** `harvestYield = plantsCapacity × 12` (each plant yields 3/4 lb = 12 oz)

| Room | Cost | Currency | Plants | Yield/Harvest | upgradeCostMultiplier |
|------|------|----------|--------|--------------|----------------------|
| Closet | $0 (free) | dirty | 1 | 12 oz | 1x |
| Shed | $2,000 | dirty | 2 | 24 oz (1.5 lbs) | 4x |
| Garage | $8,000 | dirty | 4 | 48 oz (3 lbs) | 16x |
| Small Grow | $32,000 | dirty | 10 | 120 oz (7.5 lbs) | 64x |
| Grow Facility | $128,000 | dirty | 25 | 300 oz (18.75 lbs) | 256x |
| Large Grow | $512,000 | dirty | 50 | 600 oz (37.5 lbs) | 1,024x |
| **Legal Distribution** | **$25,000,000** | **CLEAN** | **100** | **1,200 oz (75 lbs)** | **4,096x** |

**Legal Distribution** is the endgame capstone — the only grow building purchased with clean cash. It has a golden theme and its product sells for clean cash directly (no laundering). See strains: Royal Gold, Crown Jewel, Sovereign Kush, Empire Reserve.

**`upgradeCostMultiplier`** scales all equipment upgrade costs within that room. Example: a $600 FloraGro I upgrade costs $600 x 256 = $153,600 in the Grow Facility.

**Code:** `GROW_ROOM_TYPE_DEFS` in `src/data/types.ts`

---

## 2. Strain Unlock Formula

Each room starts with 1 strain slot (free). Additional strain slots cost progressively more using a doubling formula.

**Rule:** `strainUnlockBase = purchaseCost x 2`

**Formula:** `strainUnlockBase x 2^(slotIndex - 1)`

| Room | purchaseCost | strainUnlockBase | Slot 1 (free) | Slot 2 | Slot 3 | Slot 4 |
|------|-------------|-----------------|---------------|--------|--------|--------|
| Closet | $0 | $0 | Basic Bud | -- | -- | -- |
| Shed | $2,000 | $4,000 | OG Kush | $4,000 | $8,000 | $16,000 |
| Garage | $8,000 | $16,000 | Sour Diesel | $16,000 | $32,000 | $64,000 |
| Small Grow | $32,000 | $64,000 | Durban Poison | $64,000 | $128,000 | $256,000 |
| Grow Facility | $128,000 | $256,000 | Gelato | $256,000 | $512,000 | $1,024,000 |
| Large Grow | $512,000 | $1,024,000 | Exotic Kush | $1,024,000 | $2,048,000 | $4,096,000 |
| Legal Distribution | $25M | $50M | Royal Gold | $50M | $100M | $200M |

**Code:** `getStrainUnlockCost(def, slotIndex)` in `src/data/types.ts`

---

## 3. Seeds & Planting

Seeds are required to grow product. Each plant consumes 1 seed.

**Base cost:** $5 per seed

**Bulk discounts:**
| Quantity | Price/Seed | Discount |
|----------|-----------|----------|
| 1-9,999 | $5 | -- |
| 10,000+ | $4 | $1 off |
| 20,000+ | $3 | $2 off |
| 30,000+ | $2 | $3 off |

**Formula:** `cost = (baseCost - discount) x quantity`

**Planting:** Consumes 1 seed, starts grow timer at `slot.growTimerTicks x (1 - speedBonus)` ticks.

**Code:** `buySeed()`, `plantSeeds()` in `src/store/gameStore.ts`, `seedCostPerUnit` in `src/data/types.ts`

---

## 4. Harvesting

When a slot's `ticksRemaining` reaches 0, it can be harvested.

**Yield formula:** `floor(slot.harvestYield x (1 + yieldBonus + prestigeBonus))`

**Double chance:** `if (Math.random() < doubleChance) → yield x 2`

**Bonuses applied:**
- `yieldBonus` = sum of FloraMicro + Light upgrade bonuses (`getRoomBonus(room, 'yield')`)
- `speedBonus` = sum of FloraGro + Water upgrade bonuses (`getRoomBonus(room, 'speed')`)
- `doubleChance` = sum of FloraBloom upgrade bonuses (`getRoomBonus(room, 'double')`)
- `prestigeBonus` = `prestigeCount x 0.05`

**Cycle cost:** `getRoomCycleCost(room)` deducted from dirty cash on each harvest (sum of all upgrade costPerCycle values).

**Auto-replant:** After harvest, if seeds available and auto-harvest upgrade owned, automatically replants and resets timer.

**Code:** `harvestSlot()` in `src/engine/economy.ts`, `harvestGrowRoom()` in `src/store/gameStore.ts`

---

## 5. Auto-Harvest

When the Auto-Harvest upgrade is purchased for a room, harvesting and replanting happen automatically every tick.

**Trigger:** `room.upgradeLevels.auto_harvest >= 1` AND `slot.ticksRemaining === 1` AND `seedStock > 0`

**Behavior:** Same harvest formula as manual. Deducts cycle cost automatically. Replants with new timer `ceil(growTimerTicks x (1 - speedBonus))`.

**Code:** `tickCriminalOperation()` in `src/engine/economy.ts` (runs every tick)

---

## 6. Product Inventory

Harvested product is stored per-strain with price tracking.

**Structure:** `productInventory: Record<string, { oz: number, pricePerUnit: number }>`

**Sources:** Manual harvest, auto-harvest
**Consumers:** Dealers (proportional drain), dispensaries (player-set rate), street selling

**Code:** `CriminalOperation.productInventory` in `src/data/types.ts`

---

## 7. Equipment Upgrades (Unified System)

All room equipment upgrades are defined in `ROOM_UPGRADE_DEFS` (data-driven). Each upgrade has multiple levels with fixed costs that get scaled by the room's `upgradeCostMultiplier`.

**Actual cost:** `upgradeDef.levels[level].cost x room.upgradeCostMultiplier`

| Upgrade | Type | Levels | Bonus Type |
|---------|------|--------|------------|
| FloraGro | Nutrient | 3 | Speed (faster grow) |
| FloraMicro | Nutrient | 3 | Yield (more harvest) |
| FloraBloom | Nutrient | 3 | Double (chance to 2x harvest) |
| Water | Infrastructure | 3 | Speed |
| Light | Infrastructure | 3 | Yield |
| Auto-Harvest | Toggle | 1 | Auto-replants on harvest |

**Per-cycle costs:** Each upgrade level has a `costPerCycle` (dirty cash deducted per harvest). Some upgrades have a `baseCostPerCycle` even at level 0 (Water: $1/cycle, Light: $2/cycle).

**Bonus stacking:** Multiple upgrades of the same bonus type stack additively. Example: FloraGro III (-15% time) + Water III (-3% time) = -18% total grow time.

**Code:** `ROOM_UPGRADE_DEFS` in `src/data/types.ts`, `getRoomBonus()` and `getRoomCycleCost()` in `src/engine/economy.ts`

---

## 8. Dealer Network -- Escalating Hire Costs

Dealers sell product for dirty cash. Each additional dealer of the same tier costs exponentially more.

**Hire formula:** `floor(tier.hireCost x 1.5^ownedCount)`

**Dealer sales per tick:** `unitsSold = min(totalOz, tier.salesRatePerTick x dealerCount)`

**Dealer cut:** `unitsSold x (cutPer8oz / 8)` deducted from sale proceeds

**Tier upgrade cost:** `nextTier.hireCost x 3` (flat, not escalating)

**Tier downgrade refund:** 50% of upgrade cost

| Tier | Base Hire | Sales/Tick | Cut/8oz | Heat/Tick |
|------|----------|-----------|---------|-----------|
| Corner Boys | $500 | 0.5 oz | $3 | 0.005 |
| Street Crew | $300 | 1.5 oz | $5 | 0.012 |
| Distribution Network | $1,200 | 4.0 oz | $8 | 0.020 |
| City Syndicate | $6,000 | 12.0 oz | $15 | 0.035 |
| Regional Cartel | $30,000 | 40.0 oz | $25 | 0.060 |

Example (Corner Boys, base $500):
| Dealer # | Cost | Cumulative |
|----------|------|-----------|
| 1st | $500 | $500 |
| 2nd | $750 | $1,250 |
| 3rd | $1,125 | $2,375 |
| 5th | $2,531 | $6,593 |
| 10th | $19,268 | ~$57K total |

**Code:** `getDealerHireCost(tier, ownedCount)` in `src/data/types.ts`, dealer tick in `tickCriminalOperation()` in `src/engine/economy.ts`

---

## 9. Front Business Laundering

Front businesses convert dirty cash -> clean cash (or sell product for dispensaries).

**Launder capacity:** `baseLaunderPerTick x tier.launderMultiplier x district.customerTrafficMultiplier`

**Clean cash produced:** `dirtyConsumed x launderEfficiency` (efficiency < 1.0 = laundering fee)

**Reverse flow:** Clean -> dirty at 95% efficiency (5% handling cost)

**Business revenue:** `baseRevenuePerTick x tier.revenueMultiplier x supplyModifier x district.revenueMultiplier`

**Business expenses:** `(baseOperatingCost x tier.operatingCostMult x district.operatingCostMult) + (employees x salaryPerTick)`

**Selling a business:** Returns 50% of purchase price as clean cash.

**Upgrading:** Each business has upgrade tiers with increasing costs. Upgrades boost launder multiplier, revenue multiplier, and add employees. Cost is clean cash.

**Code:** `calculateLaunderTick()`, `calculateBusinessRevenue()`, `calculateBusinessExpenses()` in `src/engine/economy.ts`

---

## 10. Dispensaries

Dispensaries are a special business type that consumes product inventory -> clean cash (instead of laundering dirty cash).

**Two types:**
| Dispensary | Purchase Cost | Base oz/tick | Price Efficiency |
|-----------|--------------|-------------|-----------------|
| Green Cross Wellness (Medical) | $40,000 | 4 oz/tick | 60% of avg price |
| Bloom Cannabis Co. (Recreational) | $150,000 | 12 oz/tick | 70% of avg price |

**Formula:** `cleanProduced = productConsumed x weightedAvgPrice x launderEfficiency`

**Player controls rate:** `setDispensaryRate(instanceId, ozPerTick)` sets how much product to sell per tick.

**Inventory drain:** Consumes proportionally from all strains in inventory.

**Code:** `calculateDispensaryTick()` in `src/engine/economy.ts`, `isDispensary: true` in `src/data/businesses.ts`

---

## 11. Rental Properties

Rental properties generate 100% clean cash passively -- no laundering, no product consumption.

**Three types:**
| Property | Purchase Cost | Base Revenue/tick | Notes |
|----------|-------------|------------------|-------|
| Small Apartment | $20,000 | $15/tick | Low maintenance |
| Duplex | $60,000 | $40/tick | Mid-tier |
| Apartment Block | $200,000 | $120/tick | Max revenue |

**Revenue formula:** Same as other businesses (`base x tier x district`) but goes straight to clean cash.

**Upgrades:** Scale revenue multiplier (up to 12x at max tier).

**Code:** `isRental: true` in `src/data/businesses.ts`

---

## 12. Street Selling

Direct street sales at 70% of average product price, with a quota system.

- **Max quota:** 160 oz (10 lbs)
- **Refill rate:** 16 oz/min (1 lb/min) = 16/60 oz per tick
- **Price:** `weightedAvgPrice x 0.7`
- **Produces:** Dirty cash

**Code:** `sellProduct()` in `src/store/gameStore.ts`

---

## 13. Heat System — ACTIVE

Heat is a 0-100 scale representing police attention. The primary heat source is **holding dirty cash** — the more you sit on, the faster heat rises. This creates core pressure to launder.

### Heat Tiers

| Tier | Name | Range | Color |
|------|------|-------|-------|
| 0 | Unknown | 0-24 | Green |
| 1 | Noticed | 25-49 | Yellow |
| 2 | Watched | 50-74 | Orange |
| 3 | Pressured | 75-89 | Red |
| 4 | Targeted | 90-100 | Dark Red |

### Heat Formula (called every tick)

```
Constants:
  DIRTY_CASH_DIVISOR = 50,000
  DIRTY_CASH_RATE    = 0.04
  NATURAL_DECAY      = 0.01

Heat Gain:
  dirtyCashHeat = (dirtyCash / 50,000) × 0.04
  dealerHeat    = dealerCount × tier.heatPerTick
  totalGain     = (dirtyCashHeat + dealerHeat) × avgPoliceMultiplier

Heat Loss:
  naturalDecay  = 0.01 (always)
  lawyerDecay   = activeLawyer.heatDecayBonus (if hired)
  businessDecay = Σ(biz.heatReductionPerTick × 0.005) for operating fronts
  totalLoss     = naturalDecay + lawyerDecay + businessDecay

heatDelta = totalGain - totalLoss
newHeat   = clamp(0, 100, heat + heatDelta)
```

**Dirty cash heat examples:**
| Dirty Cash On Hand | Heat/Tick | Time to Tier 1 (heat 25) |
|-------------------|-----------|--------------------------|
| $1,000 | 0.0008 | ~9 hours |
| $5,000 | 0.004 | ~100 min |
| $50,000 | 0.04 | ~10 min |
| $500,000 | 0.4 | ~1 min |

### One-Time Heat Bumps

- **Job bribe:** `+0.5 + (jobIndex × 0.5)` → ranges from +0.5 (Fast Food) to +3.0 (Corporate Exec)
- **Dealer hire:** `+0.2 per dealer hired`

### Heat Effects

- **Job firing:** If `heat > job.maxHeat` → auto-fired, 60-tick cooldown
- **Lawyer requirement:** Higher heat tiers unlock (and require) better lawyers
- **HUD display:** Heat bar visible at all times in top bar

### Lawyers — Heat Reduction

Lawyers provide a per-tick heat decay bonus. One lawyer at a time. Hiring a new one replaces the old. Auto-fired if you can't afford the retainer.

| Lawyer | Unlock Cost (clean) | Retainer (clean/tick) | Heat Decay Bonus | Required Tier |
|--------|-------------------|---------------------|-----------------|---------------|
| Public Defender | $500 | $2/tick | -0.005/s | 0 (Unknown) |
| Strip Mall Lawyer | $5,000 | $8/tick | -0.015/s | 1 (Noticed) |
| Criminal Defense Attorney | $25,000 | $25/tick | -0.035/s | 2 (Watched) |
| The Fixer | $100,000 | $80/tick | -0.060/s | 3 (Pressured) |
| Cartel Counsel | $500,000 | $250/tick | -0.100/s | 4 (Targeted) |

**Auto-fire:** If `cleanCash < retainer` on a tick, lawyer is fired immediately (no refund).

**Code:** `calculateHeatTick()`, `getHeatTier()`, `getHeatBreakdown()` in `src/engine/heat.ts`, `LAWYER_DEFS` in `src/data/lawyers.ts`, `hireLawyer()`, `fireLawyer()` in `src/store/gameStore.ts`

---

## 14. Dirty Jobs District (Clean Cash Bootstrap)

Jobs let players earn clean cash by working legit jobs, bribed into with dirty cash. Higher-paying jobs have lower heat tolerance -- get too hot and you're fired.

**Purpose:** Solves the clean cash chicken-and-egg problem.

**Rules:**
- One job at a time. Applying replaces current job.
- Heat check every tick: If `heat > job.maxHeat` -> auto-fired, 60-tick cooldown
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

**Early game flow:** Grow weed -> sell for dirty cash -> bribe into Fast Food ($1K) -> earn $3/tick clean -> accumulate $3K -> buy first taco shop -> start laundering -> scale up.

**Code:** `JOB_DEFS`, `JOB_MAP` in `src/data/types.ts`, `applyForJob()`, `quitJob()` in `src/store/gameStore.ts`, `src/components/city/JobDistrictBlock.tsx`

---

## 15. Resource System (Supply Chain)

### Status: DEFINED BUT NOT ACTIVE

Resources are defined per business but do NOT currently affect gameplay. Business revenue/expenses are calculated without checking resource availability.

**Defined resources:** beef, chicken, greens, tortillas, packaging, fuel, cleaning

**Purchase action:** `purchaseResource(resourceId, quantity)` exists and works

**Storage:** `inventory: Record<string, number>`, `storageCapacity: 500`

**Code:** `src/data/resources.ts`, `purchaseResource()` in `src/store/gameStore.ts`

---

## 16. Prestige

Reset the game with a permanent yield bonus.

- **Threshold:** $1M total dirty cash earned
- **Bonus:** +5% grow yield per prestige level (stacks additively)
- **Persists across resets:** prestigeCount, prestigeBonus
- **Applied to:** All harvest yields (manual and auto): `yield x (1 + yieldBonus + prestigeBonus)`

**Code:** `prestige()` in `src/store/gameStore.ts`

---

## 17. City Districts & Block Expansion

### Standard Business Districts

| District | Unlock Cost (clean) | Revenue Mult | Operating Cost Mult | Traffic Mult | Police Mult |
|----------|-------------------|-------------|-------------------|-------------|-------------|
| Starter Neighborhood | Free | 1.0x | 0.8x | 0.8x | 0.5x |
| Strip Mall | $25,000 | 1.3x | 1.0x | 1.3x | 1.0x |
| North Side | $75,000 | 1.4x | 1.1x | 1.2x | 1.0x |
| South Side Sliders | $100,000 | 1.5x | 0.9x | 1.4x | 1.2x |
| Downtown | $200,000 | 1.8x | 1.6x | 2.0x | 1.5x |
| Moving on Up Side | $300,000 | 2.0x | 1.8x | 1.6x | 1.3x |
| Desert Highway | $400,000 | 5.0x | 10.0x | 0.5x | 0.4x |
| Wealthy West Winds | $500,000 | 10.0x | 30.0x | 1.5x | 0.8x |

### Residential Districts

| District | Unlock Cost (clean) | Max Slots | Revenue Mult |
|----------|-------------------|-----------|-------------|
| Row Houses | $15,000 | 4 | 0.8x |
| Apartment Row | $80,000 | 6 | 1.2x |
| The Towers | $180,000 | 8 | 1.6x |

### Special Districts (no business slots)

| District | Purpose | Always Unlocked |
|----------|---------|----------------|
| Home Turf (Operations) | Grow rooms | Yes |
| Dealer Network | Dealer tiers | Yes |
| Dirty Jobs | Jobs for clean cash | Yes |

### Block Expansion

- **Initial cost:** $2,000 (clean cash)
- **Formula:** `nextBlockCost x 2` after each purchase
- **Lot unlock within district:** `$1,000 x 2^(unlockedSlots - 2)` per lot
- **Generated blocks:** Infinite expansion, auto-discovered adjacent to unlocked districts

**Code:** `DISTRICTS` in `src/data/districts.ts`, `unlockDistrict()`, `unlockLot()`, `unlockGeneratedBlock()` in `src/store/gameStore.ts`

---

## 18. Game Loop (Tick Order)

Every tick (1 second):

1. **Criminal operation:** Dealers sell product, auto-harvest runs -> dirty cash
2. **Inventory calc:** Compute total oz and weighted avg price across all strains
3. **Business processing:** Revenue, expenses, laundering (dirty->clean), dispensary (product->clean), rental (pure clean)
4. **Reverse flow:** Clean->dirty at 95% via configured business rates
5. **Lawyer retainer:** Deduct lawyer retainer from clean cash; auto-fire if can't afford
6. **Heat calculation:** `calculateHeatTick()` computes heat gain (dirty cash + dealers) vs decay (natural + lawyer + businesses)
7. **Job income:** If employed, add `cleanPerTick`; check heat->fire (uses new heat value)
8. **Street sell quota:** Refill 16/60 oz per tick (max 160)
9. **State update:** Update all cash totals, heat, tick count, cooldowns

**Code:** `tick()` in `src/store/gameStore.ts`, `tickCriminalOperation()` in `src/engine/economy.ts`

---

## Key Helper Functions

| Function | File | Purpose |
|----------|------|---------|
| `getStrainUnlockCost(def, slotIndex)` | `src/data/types.ts` | Doubling strain unlock cost |
| `getDealerHireCost(tier, ownedCount)` | `src/data/types.ts` | Escalating dealer cost (1.5x per dealer) |
| `getRoomBonus(room, bonusType)` | `src/engine/economy.ts` | Total speed/yield/double bonus from upgrades |
| `getRoomCycleCost(room)` | `src/engine/economy.ts` | Total per-harvest overhead cost |
| `tickCriminalOperation(op, prestige)` | `src/engine/economy.ts` | Full criminal op tick (dealers + auto-harvest) |
| `harvestSlot(op, roomId, slotIdx, prestige)` | `src/engine/economy.ts` | Manual harvest with bonuses |
| `calculateLaunderTick(biz, available)` | `src/engine/economy.ts` | Dirty -> clean per tick |
| `calculateDispensaryTick(biz, oz, price)` | `src/engine/economy.ts` | Product -> clean per tick |
| `calculateBusinessRevenue(biz)` | `src/engine/economy.ts` | Clean cash revenue per tick |
| `calculateBusinessExpenses(biz)` | `src/engine/economy.ts` | Operating costs per tick |
| `calculateHeatTick()` | `src/engine/heat.ts` | Heat delta per tick (dirty cash + dealers - decay) |
| `getHeatBreakdown()` | `src/engine/heat.ts` | Detailed heat gain/loss breakdown for UI |
| `getHeatTier(heat)` | `src/engine/heat.ts` | Numeric heat -> tier name/color |
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
| 16 | Heat system active, lawyers (activeLawyerId backfill) |
