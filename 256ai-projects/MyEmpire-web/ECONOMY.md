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
| Closet | $0 (free) | dirty | 1 | 12 oz (¾ lb) | 1x |
| Shed | $2,000 | dirty | 2 | 24 oz (1.5 lbs) | 4x |
| Garage | $8,000 | dirty | 4 | 48 oz (3 lbs) | 16x |
| Small Grow | $32,000 | dirty | 10 | 120 oz (7.5 lbs) | 64x |
| Grow Facility | $128,000 | dirty | 25 | 300 oz (18.75 lbs) | 256x |
| Large Grow | $512,000 | dirty | 50 | 600 oz (37.5 lbs) | 1,024x |
| **Legal Distribution** | **$25,000,000** | **CLEAN** | **100** | **1,200 oz (75 lbs)** | **4,096x** |

**Legal Distribution** is the endgame capstone — the only grow building purchased with clean cash. Golden UI theme.

**Legal pricing rule:** Legal weed sells for **1/4 of street price** (after taxes/regulation). Strains: Royal Gold ($38/oz), Crown Jewel ($50/oz), Sovereign Kush ($65/oz), Empire Reserve ($85/oz). Compare to illegal top-tier: Exotic Kush $150/oz, Golden Leaf $340/oz.

**Two functions:**
1. **Grow legal weed** — grows its own strains, sells for clean cash directly (no dealers/laundering needed)
2. **Product laundering** (TODO) — convert dirty inventory into legal product at 25% street value. Feed illegal weed in → get clean cash out. Similar to business launder rate mechanic.

**`upgradeCostMultiplier`** scales all equipment upgrade costs within that room. Example: a $600 FloraGro I upgrade costs $600 x 256 = $153,600 in the Grow Facility.

**Code:** `GROW_ROOM_TYPE_DEFS` in `src/data/types.ts`

---

## 2. Strain Unlock Formula

Each room starts with 1 strain slot (free). Additional strain slots cost progressively more using a doubling formula.

**Rule:** `strainUnlockBase = purchaseCost x 2`

**Formula:** `strainUnlockBase x 2^(slotIndex - 1)`

| Room | purchaseCost | strainUnlockBase | Slot 1 (free) | Slot 2 | Slot 3 | Slot 4 |
|------|-------------|-----------------|---------------|--------|--------|--------|
| Closet | $0 | $500 | Basic Bud | $500 | $1,000 | $2,000 |
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

**Yield formula:** `floor(slot.harvestYield x (1 + roomYieldBonus + techYieldBonus))`

**Double chance:** `if (Math.random() < doubleChance) → yield x 2`

**Bonuses applied:**
- `yieldBonus` = sum of FloraMicro + Light upgrade bonuses (`getRoomBonus(room, 'yield')`)
- `speedBonus` = sum of FloraGro + Water upgrade bonuses (`getRoomBonus(room, 'speed')`)
- `doubleChance` = sum of FloraBloom upgrade bonuses (`getRoomBonus(room, 'double')`)
- `techYieldBonus` = `techUpgrades.tech_yield x 0.05` (from Tech Lab)

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

Direct street sales at 70% of average product price, with a **dynamic demand** system.

### Dynamic Street Demand

The max street sell quota grows as you gain jobs and businesses — you know more people, have more cover.

- **Base quota:** 160 oz (10 lbs)
- **Job bonus:** Each job adds to max demand (fast food +8oz → corporate +64oz)
- **Business bonus:** Each owned business adds demand based on concealment suitability:
  - **High** (24-40 oz): Dispensaries, nightclubs, car washes, strip clubs, smoke shops
  - **Medium** (10-20 oz): Bars, motels, barbershops, pawn shops, tattoo parlors
  - **Low** (2-8 oz): Food joints (families in lobby), legit corps, accounting firms
  - **Zero:** Passive rentals (no foot traffic), production/industrial businesses
- **Formula:** `maxDemand = 160 + jobBonus + sum(businessBonuses)`
- **Refill rate:** `(16 + (maxDemand - 160) × 0.08) / 60` oz per tick — scales slightly with max demand
- **Price:** `weightedAvgPrice × 0.7`
- **Produces:** Dirty cash

### Street Selling Heat

Selling on the street generates a tiny amount of heat, scaled by volume and job exposure:
- **Base:** 0.0002 heat per oz sold
- **Job multiplier:** `1 + (jobDemandBonus × 0.005)` — higher-tier jobs = more exposure
- **Example:** Selling 16 oz with a corporate job (bonus 64): `16 × 0.0002 × 1.32 = 0.0042 heat`

**Code:** `sellProduct()` in `src/store/gameStore.ts`, `getMaxStreetDemand()` / `getStreetRefillRate()` / `getStreetSellHeat()` in `src/engine/economy.ts`

---

## 13. Heat System — ACTIVE

Heat is a 0-1000 scale representing police attention. The primary heat source is **holding dirty cash** — the more you sit on, the faster heat rises. This creates core pressure to launder.

### Heat Tiers

| Tier | Name | Range | Color |
|------|------|-------|-------|
| 0 | Unknown | 0-249 | Green |
| 1 | Noticed | 250-499 | Yellow |
| 2 | Watched | 500-749 | Orange |
| 3 | Pressured | 750-899 | Red |
| 4 | Targeted | 900-1000 | Dark Red |

### Heat Formula (called every tick)

```
Constants:
  DIRTY_CASH_DIVISOR = 50,000
  DIRTY_CASH_RATE    = 0.04
  NATURAL_DECAY      = 0.1

Heat Gain:
  dirtyCashHeat = (dirtyCash / 50,000) × 0.04
  dealerHeat    = dealerCount × tier.heatPerTick
  totalGain     = (dirtyCashHeat + dealerHeat) × avgPoliceMultiplier

Heat Loss:
  naturalDecay  = 0.1 (always)
  lawyerDecay   = activeLawyer.heatDecayBonus (if hired)
  businessDecay = Σ(biz.heatReductionPerTick) for operating fronts
  totalLoss     = naturalDecay + lawyerDecay + businessDecay

heatDelta = totalGain - totalLoss
newHeat   = clamp(0, 1000, heat + heatDelta)
```

**Dirty cash heat examples (0-1000 scale):**
| Dirty Cash On Hand | Heat/Tick | Time to Tier 1 (heat 250) |
|-------------------|-----------|--------------------------|
| $1,000 | 0.0008 | ~90 hours |
| $5,000 | 0.004 | ~17 hours |
| $50,000 | 0.04 | ~100 min |
| $500,000 | 0.4 | ~10 min |

### One-Time Heat Bumps

- **Job bribe:** `+5 + (jobIndex × 5)` → ranges from +5 (Fast Food) to +30 (Corporate Exec)
- **Dealer hire:** `+2 per dealer hired`

### Heat Effects

- **Job firing:** If `heat > job.maxHeat` → auto-fired, 60-tick cooldown
- **Lawyer requirement:** Higher heat tiers unlock (and require) better lawyers
- **HUD display:** Heat bar visible at all times in top bar

### Lawyers — Heat Reduction

Lawyers provide a per-tick heat decay bonus. One lawyer at a time. Hiring a new one replaces the old. Auto-fired if you can't afford the retainer.

| Lawyer | Unlock Cost (clean) | Retainer (clean/tick) | Heat Decay Bonus | Required Tier |
|--------|-------------------|---------------------|-----------------|---------------|
| Public Defender | $500 | $2/tick | -0.05/s | 0 (Unknown) |
| Strip Mall Lawyer | $5,000 | $8/tick | -0.15/s | 1 (Noticed) |
| Criminal Defense Attorney | $25,000 | $25/tick | -0.35/s | 2 (Watched) |
| The Fixer | $100,000 | $80/tick | -0.60/s | 3 (Pressured) |
| Cartel Counsel | $500,000 | $250/tick | -1.0/s | 4 (Targeted) |

**Auto-fire:** If `cleanCash < retainer` on a tick, lawyer is fired immediately (no refund).

**Code:** `calculateHeatTick()`, `getHeatTier()`, `getHeatBreakdown()` in `src/engine/heat.ts`, `LAWYER_DEFS` in `src/data/lawyers.ts`, `hireLawyer()`, `fireLawyer()` in `src/store/gameStore.ts`

### 13b. Rival Heat System — ACTIVE

Rival heat is a separate 0-1000 scale representing attention from rival gangs. As you expand your dealer network and territory, rivals take notice.

#### Rival Heat Tiers

| Tier | Name | Range | Color |
|------|------|-------|-------|
| 0 | Off Radar | 0-249 | Green |
| 1 | On Their Radar | 250-499 | Purple |
| 2 | Rival Territory | 500-749 | Magenta |
| 3 | Turf War | 750-899 | Rose |
| 4 | All-Out War | 900-1000 | Dark Red |

#### Rival Heat Formula

```
Sources:
  dealerHeat    = dealerCount × currentTier.heatPerTick × 0.5
  territoryHeat = operatingBusinessCount × 0.002

Reduction:
  naturalDecay  = 0.05/tick

rivalHeat = clamp(0, 1000, rivalHeat + totalGain - naturalDecay)
```

Future: Rival gangs will be defined with territories, strength, and consequences at high rival heat (raids, theft, turf wars).

**Code:** `calculateRivalHeatTick()`, `getRivalHeatTier()`, `getRivalHeatBreakdown()` in `src/engine/heat.ts`

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
| Fast Food | $1,000 | $3/s | 750 |
| Retail | $5,000 | $8/s | 600 |
| Office Clerk | $25,000 | $20/s | 450 |
| Warehouse Manager | $100,000 | $50/s | 300 |
| Finance Bro | $400,000 | $120/s | 200 |
| Corporate Exec | $1,000,000 | $250/s | 100 |

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

## 16. Prestige & Tech Points

Reset the game to earn **Tech Points (TP)** — a permanent currency spent on upgrades in the **Tech Lab**.

### Prestige Threshold
- **Threshold:** $1M total dirty cash earned to unlock prestige
- **Base reward:** 1 TP per prestige
- **Milestone bonuses:** Additional TP for achievements during the run (up to ~22 TP per prestige)

### Prestige Milestones (bonus TP per prestige)
| Category | Threshold | Bonus TP |
|----------|-----------|----------|
| Total Dirty Earned | $5M / $25M / $100M | +1 / +2 / +3 |
| Total Clean Earned | $500K / $5M / $50M | +1 / +2 / +3 |
| Grow Rooms Built | 3 / 6 / 10 | +1 / +1 / +2 |
| Front Businesses | 3 / 8 / 15 | +1 / +1 / +2 |
| Districts Unlocked | 4 / 8 | +1 / +2 |
| Rivals Defeated | 1 / All | +1 / +2 |

### Tech Upgrades (7 tracks, 5 levels each)
| ID | Name | Effect/Level | Cost (L1-L5) | Total TP |
|----|------|-------------|-------------|----------|
| `tech_yield` | Hybrid Genetics | +5% yield | 1, 2, 4, 7, 12 | 26 |
| `tech_speed` | LED Matrix | -3% grow time | 1, 2, 4, 7, 12 | 26 |
| `tech_double` | Selective Breeding | +2% double chance | 1, 3, 5, 8, 14 | 31 |
| `tech_capacity` | Vertical Farming | +1 plant/room | 2, 3, 5, 8, 14 | 32 |
| `tech_dealer` | Supply Chain | +10% dealer sales | 2, 4, 6, 10, 16 | 38 |
| `tech_launder` | Creative Accounting | +5% launder efficiency | 2, 4, 6, 10, 16 | 38 |
| `tech_heat` | Clean Operation | -8% heat gain | 3, 5, 8, 12, 18 | 46 |

**Total to max all: 237 TP** (~35-45 prestiges at avg 5-6 TP each)

### How Prestige Tech Bonuses Stack
- **Yield:** `floor(harvestYield x (1 + roomYieldBonus + techYieldBonus + sessionYieldBonus))`
- **Speed:** `ceil(growTimerTicks x (1 - roomSpeedBonus - techSpeedBonus - sessionSpeedBonus - carGrowSpeed))`
- **Double:** `roomDoubleChance + techDoubleChance`
- **Capacity:** Each room's plantsCapacity gets `+ techCapacityLevel`
- **Dealer:** `salesRatePerTick x dealerCount x techDealerMultiplier x sessionDealerMultiplier`
- **Launder:** `dirtyConsumed x launderEfficiency x techLaunderMultiplier x sessionLaunderMultiplier x (1 + carLaunderBoost)`
- **Heat:** `heatGain x (1 - techHeatReduction - sessionHeatReduction - carHeatReduction)`

### Persists Across Resets
`prestigeCount`, `techPoints`, `totalTechPointsEarned`, `techUpgrades`

### Session Tech (Street Upgrades) — Temporary

Separate tech tree that **resets on prestige reset or game reset**. Costs **dirty cash + clean cash + product (weed oz)** — requiring all three currencies makes them hard to spam.

| ID | Name | Icon | Effect/Level | L1 Cost | L2 Cost | L3 Cost |
|----|------|------|-------------|---------|---------|---------|
| `stech_yield` | Stronger Fertilizer | 🧪 | +10% yield | $50K/25K/100oz | $200K/100K/500oz | $800K/400K/2000oz |
| `stech_speed` | Overclocked Lights | 💡 | -8% grow time | $40K/20K/80oz | $160K/80K/400oz | $640K/320K/1600oz |
| `stech_dealer` | Street Connects | 🤙 | +15% dealer sales | $60K/30K/150oz | $250K/125K/600oz | $1M/500K/2500oz |
| `stech_launder` | Offshore Accounts | 🏝️ | +10% launder eff | $75K/50K/120oz | $300K/200K/500oz | $1.2M/800K/2000oz |
| `stech_heat` | Police Scanner | 📡 | -10% heat gain | $45K/30K/100oz | $180K/120K/400oz | $720K/480K/1600oz |
| `stech_demand` | Word of Mouth | 📢 | +50 oz street demand | $30K/15K/200oz | $120K/60K/800oz | $500K/250K/3000oz |
| `stech_seeds` | Bulk Seed Deal | 🌱 | -15% seed cost | $20K/10K/50oz | $80K/40K/200oz | $320K/160K/800oz |

*Cost format: dirty/clean/product*

**Session tech bonuses multiply with prestige tech** — a player with both tech trees maxed is significantly stronger than either alone, but loses session tech on prestige reset (creating meaningful prestige tension).

### UI
- **Prestige Tech Lab (🔬):** HUD button with TP badge → full-screen overlay with upgrade grid
- **Session Tech (🛠️ Street Upgrades):** HUD button → full-screen overlay showing costs in all 3 currencies
- **Prestige Confirm (🔄):** HUD button, modal showing TP breakdown before confirming reset

**Code:** `prestige()`, `purchaseTechUpgrade()`, `purchaseSessionTech()` in `src/store/gameStore.ts`
**Data:** `src/data/techDefs.ts`, `src/data/sessionTechDefs.ts`
**Engine:** `src/engine/tech.ts`, `src/engine/sessionTech.ts`

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

- **Formula:** Linear $2K increments — 1st block = $2K, 2nd = $4K, 3rd = $6K, etc.
- **Calculated dynamically:** `cost = 2000 + (genBlocksUnlocked × 2000)`
- **Generated blocks:** Infinite expansion, auto-discovered adjacent to unlocked districts

### Lot Pricing (within districts)

Each district starts with **2 free lots**. Additional lots cost $2K each, increasing by $2K per lot:

| Lot # | Cost |
|-------|------|
| 1-2 | Free (start unlocked) |
| 3 | $2,000 |
| 4 | $4,000 |
| 5 | $6,000 |
| 6 | $8,000 |

**Formula:** `cost = 2000 × (lotIndex - 1)` for lotIndex >= 2

### Lot Ownership Colors
- **Player empty lots:** Emerald/green border and background
- **Player businesses:** Business theme color
- **Rival businesses:** Rival's gang color (unique per rival)

**Code:** `DISTRICTS` in `src/data/districts.ts`, `unlockDistrict()`, `unlockLot()`, `unlockGeneratedBlock()` in `src/store/gameStore.ts`

---

## 18. Game Loop (Tick Order)

Every tick (1 second):

1. **Compute bonuses:** Combine prestige tech + session tech + car bonuses into `effectiveTech`
2. **Criminal operation:** Dealers sell product, auto-harvest runs → dirty cash (uses effectiveTech for yield/speed/dealer)
3. **Inventory calc:** Compute total oz and weighted avg price across all strains
4. **Business processing:** Revenue, expenses, laundering (dirty→clean using effectiveTech.launderMultiplier), dispensary (product→clean), rental (pure clean)
5. **Reverse flow:** Clean→dirty at 95% via configured business rates
6. **Lawyer retainer:** Deduct lawyer retainer from clean cash; auto-fire if can't afford
7. **Heat calculation:** `calculateHeatTick()` uses effectiveTech.heatReduction + carBonus.heatReduction
8. **Job income:** If employed, add `cleanPerTick`; check heat→fire (uses new heat value)
9. **Street sell quota:** Dynamic max from `getMaxStreetDemand(job, businesses) + sessionTech.demandBonus`
10. **State update:** Update all cash totals, heat, tick count, cooldowns

**Code:** `tick()` in `src/store/gameStore.ts`, `tickCriminalOperation()` in `src/engine/economy.ts`

---

## Key Helper Functions

| Function | File | Purpose |
|----------|------|---------|
| `getStrainUnlockCost(def, slotIndex)` | `src/data/types.ts` | Doubling strain unlock cost |
| `getDealerHireCost(tier, ownedCount)` | `src/data/types.ts` | Escalating dealer cost (1.5x per dealer) |
| `getRoomBonus(room, bonusType)` | `src/engine/economy.ts` | Total speed/yield/double bonus from upgrades |
| `getRoomCycleCost(room)` | `src/engine/economy.ts` | Total per-harvest overhead cost |
| `tickCriminalOperation(op, tech?)` | `src/engine/economy.ts` | Full criminal op tick (dealers + auto-harvest) |
| `harvestSlot(op, roomId, slotIdx, tech?)` | `src/engine/economy.ts` | Manual harvest with bonuses |
| `calculateLaunderTick(biz, available)` | `src/engine/economy.ts` | Dirty -> clean per tick |
| `calculateDispensaryTick(biz, oz, price)` | `src/engine/economy.ts` | Product -> clean per tick |
| `calculateBusinessRevenue(biz)` | `src/engine/economy.ts` | Clean cash revenue per tick |
| `calculateBusinessExpenses(biz)` | `src/engine/economy.ts` | Operating costs per tick |
| `calculateHeatTick()` | `src/engine/heat.ts` | Heat delta per tick (dirty cash + dealers - decay) |
| `getHeatBreakdown()` | `src/engine/heat.ts` | Detailed heat gain/loss breakdown for UI |
| `getHeatTier(heat)` | `src/engine/heat.ts` | Numeric heat -> tier name/color |
| `formatMoney(amount)` | `src/engine/economy.ts` | Human-readable money ($1.5K, $2.3M) |
| `formatUnits(oz)` | `src/engine/economy.ts` | Human-readable weight (3lb 4oz, 2 crates) |
| `getTechBonuses(techUpgrades)` | `src/engine/tech.ts` | Prestige tech bonuses from upgrade levels |
| `getSessionTechBonuses(sessionTech)` | `src/engine/sessionTech.ts` | Session tech bonuses from upgrade levels |
| `getCarBonuses(cars)` | `src/data/carDefs.ts` | Car gameplay bonuses (heat, speed, income, etc.) |
| `getDifficultyMultiplier(rivals, delay)` | `src/engine/difficulty.ts` | Score multiplier from game settings (×1.0–×2.0) |
| `calculatePrestigeTP(state)` | `src/data/techDefs.ts` | Tech Points earned for a prestige reset |

---

## 19. Rival Syndicates — ACTIVE

Rival gangs operate autonomously in the city. They grow in power over time, buy businesses, hire hitmen, and attack the player.

### Rival Generation

Rivals are procedurally generated at game start with random names, icons, and colors.

**Royal Rumble Entry:** Rivals enter the game in a staggered "Royal Rumble" pattern. The **Rival Start Time** (0–60 minutes, in 10-minute increments, default 10 min) sets when the first rival appears. Subsequent rivals are spaced evenly: `spacingTicks = firstEntryTicks / rivalCount`. A start time of 0 means all rivals are active immediately.

**Difficulty Multiplier:** Harder settings (more rivals + shorter entry delay) amplify the leaderboard score via `getDifficultyMultiplier()` (×1.0 to ×2.0). Shown on the Start Game screen.

**Starting stats (all rivals start from zero, like the player):**
| Stat | Starting Value |
|------|---------------|
| Dirty Cash | $0 |
| Clean Cash | $0 |
| Product | 0 oz |
| Hitmen | 0 |
| Aggression | 0.1 - 0.5 (random) |
| Power | 1.0 (grows over time, max 20) |

**Code:** `generateRivals()` in `src/data/rivals.ts`

### Rival Passive Income (per rival tick, every 10 game ticks)

Income scales **linearly** with power level (not quadratic):

```
dirtyCash += 10 + power × 20
cleanCash += 15 + power × 15   (ONLY if dirtyCash ≥ $100K)
productOz += floor(power × 0.3)
power     += 0.0005 (very slow creep, max 20)
```

**Clean cash gate:** Rivals must accumulate $100K dirty cash before they start earning any clean cash. This prevents them from buying businesses too early.

| Power | Dirty Cash/tick | Clean Cash/tick | Time to $100K dirty |
|-------|----------------|-----------------|---------------------|
| 1 | $30 | $0 (gated) | ~55 min |
| 5 | $110 | $90 | ~15 min |
| 10 | $210 | $165 | ~8 min |
| 20 | $410 | $315 | ~4 min |

### Rival Business Buying (Two-Step: Lot → Build)

Rivals use a two-step process (same system as the player):

**Step 1 — Buy a Lot:**
- **Lot cost:** $2,000 flat
- **Buy chance:** 1% per rival tick (every 10 game ticks)
- **District restriction:** Only districts with `unlockCost ≤ power × $25,000`
- Lot is stored in `ownedLots[]` with `boughtAtTick` timestamp
- Player-owned slots and blacklisted slots are skipped

**Step 2 — Build on Lot (after 60-tick cooldown):**
- Once a lot has been owned for `LOT_BUILD_COOLDOWN` (60 ticks = 60 seconds), the rival builds
- **Max budget:** `power × $15,000` (power 1 = $15K max, power 10 = $150K)
- **Must have enough CLEAN cash** to pay the business `purchaseCost`
- Picks a random affordable business definition
- Builds on the oldest ready lot first

### Universal Lot Build Cooldown

Both players and rivals share the same lot cooldown system (`LOT_BUILD_COOLDOWN = 60` ticks):
- **Player:** When unlocking a lot via `unlockLot()`, `lotBuildTimers[districtId:slotIndex] = tickCount` is recorded. `purchaseBusiness()` checks this timer and blocks building until cooldown expires. BuyBusinessPanel shows "Lot Under Development" with a countdown and progress bar.
- **Rival:** When buying a lot, `boughtAtTick = tickCount` is stored. `tickRivals()` only builds on lots where `tickCount - boughtAtTick ≥ 60`.
- **Blacklisted slots** are skipped (see Arson below)

**Code:** `tickRivals()` in `src/engine/rivals.ts`

### Player Attacks on Rivals

All attacks cost dirty cash (paid win or lose) to prevent spam. Higher success rates compensate for the cost.

| Attack | Cost (dirty) | Success Rate | Effect on Success |
|--------|-------------|-------------|-------------------|
| Rob | $2,000 | 80% | Steal 10-30% of rival's dirty cash |
| Raid | $5,000 | 70% | Steal 20-50% of rival's product |
| Sabotage | $8,000 | 75% | Damage a random rival business (−30 health) |
| Arson | $20,000 | 65% | Burn a rival business (fire → rubble → cleared) |

**Code:** `attackRival()` in `src/store/gameStore.ts`, `RIVAL_ACTIONS` in `src/data/types.ts`

### Arson Fire & Insurance System — Building Lifecycle

Arson is the most expensive attack ($20K) but the only way to permanently remove a rival business from a lot. The system models a realistic fire → rubble → demolition → resale cycle.

#### Full Lifecycle

```
Player pays $20K dirty cash (win or lose)
        │
        ▼
   65% success?
   ├── NO → "Attack failed!" (money still spent)
   └── YES ▼
        │
   Building catches FIRE
   ├── burnedAtTick = currentTick
   ├── health = 0
   ├── Business stops generating income for rival
   └── City map shows: 🔥 fire animation + 🧱🪨 rubble
        │
        ▼
   100 ticks pass (~10 seconds real time)
        │
        ▼
   Fire CLEARS (processed in tickRivals)
   ├── Business removed from rival's inventory
   ├── Rival collects $5,000 insurance payout
   ├── Slot added to rival's blacklistedSlots[]
   └── Lot appears EMPTY on city map (available for purchase)
        │
        ▼
   BLACKLIST active for that rival
   ├── That rival CANNOT buy this lot again
   ├── Other rivals CAN buy this lot
   └── Player CAN buy this lot
        │
        ▼
   Player BUYS a business on this lot (optional)
   ├── Blacklist entry cleared for ALL rivals
   └── If player later sells/loses it, rival could buy it again
```

#### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `ARSON_DURATION` | 100 ticks | How long fire burns before clearing |
| `ARSON_INSURANCE` | $5,000 | Dirty cash rival receives per cleared building |

#### Visual States on City Map

| State | Visual | Duration |
|-------|--------|----------|
| Normal rival business | Rival color border + business icon | Until attacked |
| Burning (after arson) | Dark red bg, pulsing 🔥, rubble 🧱🪨, "FIRE" label | 100 ticks |
| Cleared (after fire) | Empty lot (no building shown) | Until someone buys |

#### Blacklist Rules

- **Stored as:** Array of `"districtId:slotIndex"` strings on each `RivalSyndicate`
- **Checked when:** Rival AI tries to buy a new business (`tickRivals`)
- **Cleared when:** Player calls `purchaseBusiness()` on a blacklisted slot — clears that slot from ALL rivals' blacklists
- **Purpose:** Prevents the frustrating loop where you burn a rival's building and they instantly rebuy the same lot. The rival is "banned" from that lot until a new owner (the player) buys it and clears the title.

#### Code Locations

| What | Where |
|------|-------|
| Arson attack (sets burnedAtTick) | `attackRival()` in `src/store/gameStore.ts` |
| Fire cleanup (removes biz, pays insurance, blacklists) | `tickRivals()` in `src/engine/rivals.ts` |
| Fire/rubble visual | `RivalLot` component in `src/components/city/CityMap.tsx` |
| Blacklist clearing on player purchase | `purchaseBusiness()` in `src/store/gameStore.ts` |
| Constants (duration, insurance) | `ARSON_DURATION`, `ARSON_INSURANCE` in `src/data/types.ts` |

### Rival Attacks on Player

Rivals attack based on rival heat and their aggression stat:
- **Attack chance:** `(rivalHeat / 1000) × aggression × 0.15` per rival tick
- **Defense:** Player hitmen reduce attack success (`defenseRatio = playerDefense / rivalAttack`)
- **Attack types:** 40% steal dirty cash, 30% steal product, 30% damage player business

### Hitmen (Player Defense)

Players hire hitmen from the Legal view to defend against rival attacks.

| Hitman | Cost (dirty) | Defense | Upkeep/tick |
|--------|-------------|---------|-------------|
| (defined in HITMAN_DEFS) | varies | varies | varies |

**Code:** `getPlayerDefense()`, `getHitmanUpkeep()` in `src/engine/rivals.ts`, `HITMAN_MAP` in `src/data/types.ts`

---

## Persist Version History

| Version | Changes |
|---------|---------|
| 12 | Base game state |
| 13 | Unified upgrade system (upgradeLevels), per-strain inventory |
| 14 | Residential districts, apartments |
| 15 | Job district (currentJobId, jobFiredCooldown) |
| 16 | Heat system active, lawyers (activeLawyerId backfill) |
| 17 | Migration syncs plantsCapacity, harvestYield, pricePerUnit from canonical defs |
| 18 | Heat max 100→1000, tier thresholds ×10, job maxHeat ×10 |
| 19 | Rival heat system (rivalHeat field, 0-1000 scale) |

---

## 20. Leaderboard System

### Overview
Global leaderboard powered by Firestore. No additional server — uses the same Firebase project as auth and cloud saves.

### Firestore Collection
- **Collection:** `leaderboard`
- **Document ID:** User's Firebase UID
- **Updated:** Every 60 ticks (~1 min) alongside cloud saves

### Composite Score Formula
```
score = totalDirtyEarned + totalCleanEarned + (prestigeCount × 500,000)
```
Prestige is weighted heavily ($500K per prestige) because each prestige requires reaching $1M total dirty earnings.

### Leaderboard Entry Fields
| Field | Type | Description |
|-------|------|-------------|
| displayName | string | From Firebase Auth |
| score | number | Composite score |
| totalDirtyEarned | number | Lifetime dirty cash earned |
| totalCleanEarned | number | Lifetime clean cash earned |
| prestigeCount | number | Number of prestige resets |
| businessCount | number | Current front businesses owned |
| tickCount | number | Total game ticks (time played) |
| updatedAt | number | Timestamp of last update |

### Ranking Tabs
1. **Empire Score** — composite score (default)
2. **Total Earned** — totalDirtyEarned + totalCleanEarned
3. **Prestige** — prestigeCount

### Rules
- Guest users are excluded (no UID to write to)
- Top 50 displayed per query
- Player's own entry shown at bottom if not in top 50
- 60-second cache on reads to limit Firestore costs
- Entries auto-update on every cloud save sync

### Code Locations
| File | Purpose |
|------|---------|
| `src/store/leaderboardStore.ts` | Zustand store, Firestore queries |
| `src/store/cloudSave.ts` | `updateLeaderboardEntry()` writes to Firestore |
| `src/store/authStore.ts` | Calls leaderboard update in `syncToCloud()` |
| `src/components/ui/LeaderboardView.tsx` | Leaderboard UI overlay |
| `src/components/layout/NavBar.tsx` | Trophy button to open leaderboard |

---

## 17. Casino (Money Laundering via Gambling)

The casino converts **dirty cash → clean cash** with a **15% tax** on winnings. Even losing launders (dirty cash is removed).

### Constants
| Param | Value |
|-------|-------|
| Tax Rate | 15% of gross payout |
| Min Bet | $100 |
| Max Bet | $100,000 |

### Games

**Roulette** — Bet on number (35:1), color (2:1), section (3:1), high/low (2:1), even/odd (2:1). Single-zero wheel (0–36).

**Blackjack** — Standard rules. Dealer hits on <17. Normal win pays 1:1. Natural blackjack pays 3:2. Push returns bet.

**Poker (5-Card Draw)** — Deal 5 cards, hold/discard, draw replacements. Jacks-or-better required for pair payout.

| Hand | Payout |
|------|--------|
| Royal Flush | 250:1 |
| Straight Flush | 50:1 |
| Four of a Kind | 25:1 |
| Full House | 10:1 |
| Flush | 7:1 |
| Straight | 5:1 |
| Three of a Kind | 3:1 |
| Two Pair | 2:1 |
| Pair (J+) | 1:1 |
| High Card | 0 (lose) |

### Settlement Formula
```
grossPayout = betAmount × multiplier (if won), else 0
taxAmount = floor(grossPayout × 0.15)
cleanCashWon = grossPayout - taxAmount
dirtyCash -= betAmount (always deducted)
cleanCash += cleanCashWon (if won)
```

### Code Locations
| File | Purpose |
|------|---------|
| `src/data/casinoDefs.ts` | Constants, payouts, card types |
| `src/engine/casino.ts` | Game logic (roulette, blackjack, poker) |
| `src/store/gameStore.ts` | `settleCasinoBet()` action |
| `src/components/casino/CasinoView.tsx` | Full-screen casino overlay with 3 games |
| `src/components/city/CasinoBlock.tsx` | City map block |

---

## 18. Jewelry Store (Passive Bonuses)

Buy and upgrade jewelry pieces for permanent passive bonuses. Each piece occupies a slot (ring, bracelet, necklace, pendant) with limits.

### Slot Limits
| Slot | Max |
|------|-----|
| Ring | 8 (4 per hand, no thumbs) |
| Bracelet | 2 |
| Necklace | 1 |
| Pendant | 1 |

### Tier Progression (5 tiers per piece)
| Tier | Name | Upgrade Cost |
|------|------|-------------|
| 0 | Silver | Free (base purchase) |
| 1 | Gold | $15,000 |
| 2 | Platinum | $75,000 |
| 3 | Diamond | $300,000 |
| 4 | Legendary | $1,000,000 |

### Bonus Formula
```
bonus = bonusPerTier × (tier + 1)
```
At Silver (tier 0): 1× base. At Legendary (tier 4): 5× base.

### Bonus Types
| Type | Effect | Example Pieces |
|------|--------|---------------|
| yield_boost | +% harvest yield | Harvest Band (+1%/tier), Crown Medallion (+3%/tier) |
| heat_decay | +% heat decay rate | Shadow Ring (+1.5%/tier) |
| operation_discount | -% operation costs | Efficiency Ring (+1%/tier) |
| hitman_discount | -% hitman costs | Iron Knuckle (+2%/tier), War Bangle (+3%/tier) |
| prestige_speed | +% prestige progress | King's Chain (+4%/tier) |
| launder_boost | +% launder efficiency | Clean Cut (+1%/tier), Money Cuff (+2%/tier) |

### Code Locations
| File | Purpose |
|------|---------|
| `src/data/jewelryDefs.ts` | 12 piece definitions, tier data, slot limits |
| `src/engine/jewelry.ts` | `getJewelryBonuses()` aggregation |
| `src/store/gameStore.ts` | `buyJewelry()`, `upgradeJewelry()` actions |
| `src/components/jewelry/JewelryStoreView.tsx` | Full-screen store overlay |
| `src/components/city/JewelryBlock.tsx` | City map block |

---

## 19. Car Dealership (Tier-Specific Gameplay Bonuses)

Buy collectible cars. Each **tier** gives a unique gameplay bonus that stacks across owned cars. Economy cars cost **dirty cash**, all others cost **clean cash**.

### Tier Bonuses
| Tier | Price Range | Currency | Bonus Type | Range |
|------|------------|----------|------------|-------|
| Economy | $150K–$200K | **Dirty** | **Heat Reduction** — blend in, look normal | -3% to -8% |
| Sport | $35K–$55K | Clean | **Grow Speed** — faster harvest cycles | -5% to -10% |
| Luxury | $100K–$150K | Clean | **Dealer Boost** — flex = more customers | +5% to +10% |
| Exotic | $250K–$400K | Clean | **Income Multiplier** — status = more money | +5% to +10% |
| Supercar | $750K–$2M | Clean | **Launder Boost** — wealth = legit cover | +8% to +15% |

**Bonus application in game tick:**
- `heatReduction` → added to `tech.heatReduction` in heat calculation
- `growSpeed` → added to `tech.speedBonus` in operation tick
- `dealerBoost` + `incomeMultiplier` → multiply raw dirty income: `dirtyEarned × (1 + incomeMultiplier + dealerBoost)`
- `launderBoost` → multiplies launder efficiency: `launderMultiplier × (1 + launderBoost)`

15 total cars. Each can only be purchased once. `getCarBonuses()` sums all owned car bonuses.

### Code Locations
| File | Purpose |
|------|---------|
| `src/data/carDefs.ts` | 15 car definitions, `getCarBonuses()`, tier colors |
| `src/data/types.ts` | `CarDef` interface with `bonusType` + `bonusValue` |
| `src/store/gameStore.ts` | `buyCar()` action, car bonuses applied in `tick()` |
| `src/components/cars/CarDealershipView.tsx` | Full-screen dealership with active bonus display |
| `src/components/city/CarDealershipBlock.tsx` | City map block |

---

## 21. Event System

Random events trigger every 120-360 ticks (~2-6 min at 1x speed) with 400 total events across 4 categories. Each event presents 2-3 choices with risk/reward outcomes. Full documentation in [EVENTS.md](EVENTS.md).

**Speed scaling:** At higher game speeds (2x/4x/8x), event intervals multiply by the speed factor so events stay ~2 min apart in real wall-clock time.

**Bug fix:** `dismissEvent()` now properly resets `lastEventTick` to prevent rapid-fire events.

| Category | Count | Theme |
|----------|-------|-------|
| Life | 100 | Personal, family, neighborhood |
| Criminal | 100 | Law enforcement, rivals, underground |
| Business | 100 | Front businesses, market, finance |
| Vice | 100 | Gambling, temptation, moral dilemmas |

### Key Files

| File | Purpose |
|------|---------|
| `src/data/events/` | 400 event definitions (types, life, criminal, business, vice) |
| `src/engine/events.ts` | Event engine (selection, resolution, buffs) |
| `src/components/ui/EventPopup.tsx` | Event popup UI |

---

## 22. Difficulty & Leaderboard Scoring

Game difficulty is set at the Start Game screen via two sliders:

### Settings
| Setting | Range | Default | Step |
|---------|-------|---------|------|
| Rival Count | 1–5 | 3 | 1 |
| Rival Start Time | 0–60 min | 10 min | 10 min |

### Difficulty Multiplier (×1.0 to ×2.0)
Applied to leaderboard scores. Higher rivals + shorter start time = bigger multiplier.

**Rival bonus:** 1→+0.1, 2→+0.2, 3→+0.35, 4→+0.5 (5 rivals)
**Delay bonus:** 0min→+0.5, 10min→+0.35, 20min→+0.2, 30min→+0.1, 50min→+0.05, 60min→+0

**Formula:** `multiplier = 1 + rivalBonus + delayBonus` (capped at ×2.0)

**Leaderboard score:** `Math.floor(baseScore × difficultyMultiplier)`

### Point Scoring System (per category)
| Category | Formula | Difficulty |
|----------|---------|------------|
| Money | 1 pt per $1K total earned (dirty + clean) | Easiest |
| Territory | 5K per business + 2K per district unlocked | Easy |
| Criminal | 10K per grow room + 1K per dealer + 15K per dealer tier | Medium |
| Combat | 50K per rival defeated + 5K per hitman | Hard |
| Collection | 20K per car + 15K per jewelry | Hard |
| Prestige | 500K per prestige reset + 10K per Tech Point earned | Hardest |
| **Overall** | Sum of all categories × difficulty multiplier | Combined |

**Code:** `getDifficultyMultiplier()` in `src/engine/difficulty.ts`
**UI:** `src/components/ui/LeaderboardView.tsx` (full tab with 7 sub-tabs)
**Sync:** `updateLeaderboardEntry()` in `src/store/cloudSave.ts`

---

## 23. Sound System

Pool-based HTMLAudioElement sound engine with 18 sound effects and background music.

### Sound Keys
| Key | Trigger |
|-----|---------|
| `notify_success` | Success notifications |
| `notify_warning` | Warning notifications |
| `plant` | Planting seeds |
| `harvest` | Harvesting crops |
| `cash` | Cash transactions |
| `buy` | Purchases (businesses, jewelry, cars, resources) |
| `sell` | Selling product |
| `dealer_hire` | Hiring dealers |
| `upgrade` | Upgrades (rooms, tech, jewelry, businesses) |
| `click` | UI button clicks (jobs, lawyers, hitmen, legal actions) |
| `fire` | Firing dealers/lawyers |
| `casino_bet` | Placing casino bets |
| `casino_win` | Winning at casino |
| `casino_lose` | Losing at casino |
| `attack` | Attacking rivals |
| `event_popup` | Random event appears |
| `prestige` | Prestige reset |
| `bg_lofi` | Background lo-fi music (loops) |

### Controls
- SFX toggle + volume slider (HUD quick toggle + Account screen slider)
- Music toggle + volume slider
- Pool size: 3 instances per sound for overlapping playback

**Code:** `src/engine/sound.ts`
**Assets:** `public/sounds/*.wav` (synthesized via Node.js script)

---

## 24. Tutorial System

Guided walkthrough for new players. Activated via the green "Tutorial" button on the Start Game screen. No rivals during tutorial.

### Flow (19 steps)
1. Welcome → Operation tab intro → Harvest → Product stash → Sell → Dirty cash → Buy seeds → Plant → Auto-harvest tip
2. Switch to City → City intro → Districts & lots
3. Switch to Legal → Heat & law → Jobs
4. Switch to Stats → Finance intro
5. Two currencies explained → Rivals warning → Complete

### Mechanics
- **Spotlight effect:** SVG mask highlights target element with dark overlay
- **Auto-advance:** Steps with `advanceOn` (harvest/sell/plant/buy-seed/switch-tab) advance when the player performs the action
- **Manual advance:** Informational steps have a "Got it" button
- **Skip:** Can bail out at any time
- **Progress dots:** Shows position in tutorial
- **data-tutorial attributes:** Added to key buttons (harvest-btn, plant-btn, sell-btn, buy-seed-btn, nav-city, nav-legal, nav-finance)

### State
- `gameSettings.tutorialActive: boolean` — true during tutorial
- `gameSettings.tutorialStep: number` — current step index
- Actions: `startTutorial()`, `advanceTutorial()`, `skipTutorial()`

### Code Locations
| File | Purpose |
|------|---------|
| `src/data/tutorial.ts` | 19 step definitions with targets and advance triggers |
| `src/components/ui/TutorialOverlay.tsx` | Spotlight + tooltip overlay |
| `src/store/gameStore.ts` | Tutorial state + actions, `checkTutorialAdvance()` |

---

## 25. Tooltip System

Hover tooltips on every interactive element across the game. 120+ tooltips across 20+ files.

### Component
`src/components/ui/Tooltip.tsx` — Reusable portal-based tooltip:
- `display: contents` wrapper (never breaks flex layouts)
- 300ms hover delay
- Auto-positioning (bottom by default, flips to top near viewport edge)
- Dark theme: `bg-gray-900 border-gray-600 text-white text-[11px]`
- `pointer-events-none` (never blocks gameplay)
- Max width 220px with word wrap

### Usage
```tsx
<Tooltip text="Collect grown product into your stash.">
  <button>Harvest!</button>
</Tooltip>
```

### Coverage
| Area | # Tooltips |
|------|-----------|
| OperationView (harvest, plant, seeds, sell, dealers, upgrades, rooms) | ~25 |
| HUD (cash, stash, tech, prestige, heat, speed, sound) | ~14 |
| NavBar (all tabs) | 5 |
| City panels (building menu, buy business, lots, resources, map) | ~15 |
| LegalView (lawyers, hitmen, jobs, rival attacks) | ~10 |
| TechMenu + PrestigeConfirm | ~11 |
| Casino + Jewelry + Cars + city blocks | ~25 |
| AccountScreen + StartGameScreen | ~12 |

---

## 26. Rival Economy

Rivals have their own dual-currency economy (dirty + clean cash) that scales **linearly** with power level.

### Passive Income (per rival tick, every 10 game ticks)
| Currency | Formula | Gate | Power 1 | Power 10 |
|----------|---------|------|---------|----------|
| Dirty | `10 + power × 20` | None | $30 | $210 |
| Clean | `15 + power × 15` | Dirty ≥ $100K | $0 | $165 |

### Key Rules
- **Rivals buy businesses with CLEAN cash** (same as player) — prevents them from bypassing the laundering economy
- **Clean cash gated:** Rivals don't earn clean cash until they accumulate $100K dirty cash
- **Two-step lot→build:** Rivals buy a lot first ($2K, 1% chance), then build after 60-tick cooldown
- **Budget cap:** `power × 15,000` for business purchases
- **District access:** `power × 25,000` max district unlock cost
- **Purchase chance:** 1% per rival tick (every 10 game ticks)
- **Power creep:** +0.0005 per rival tick (10× slower than before), capped at 20

### Royal Rumble Entry
Each rival has `activeAtTick` for staggered entry:
- 5-minute base buffer (`BASE_HEAD_START_TICKS = 300`)
- Configurable delay between entries (Start Game slider, 0-60 min)
- Formula: `activeAtTick = BASE_HEAD_START_TICKS + i × entryDelayTicks`

**Code:** `src/engine/rivals.ts`, `src/data/rivals.ts`
