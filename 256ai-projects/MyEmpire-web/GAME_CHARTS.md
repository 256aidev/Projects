# MyEmpire: Kingpin — Game Balance Charts

All costs are in dirty cash unless marked clean ($).

---

## 💧 Water System Tiers

| # | Tier | Upgrade Cost | Yield Bonus | Cost/Cycle |
|---|------|-------------|-------------|------------|
| 0 | 🚰 Tap Water   | Free        | +0%  | $1  |
| 1 | 💧 Drip System  | $500        | +15% | $2  |
| 2 | 🌊 Hydro Setup  | $2,500      | +35% | $5  |
| 3 | ⚗️ Aeroponics   | $10,000     | +60% | $12 |

**Cost/Cycle** = charged once per completed grow cycle (per harvest).

---

## 💡 Lighting Tiers

| # | Tier | Upgrade Cost | Yield Bonus | Cost/Cycle |
|---|------|-------------|-------------|------------|
| 0 | 💡 Single Bulb   | Free    | +0%  | $2  |
| 1 | 🔆 LED Strip     | $800    | +15% | $3  |
| 2 | ☀️ Full Spec LED | $4,000  | +35% | $8  |
| 3 | 🌡️ HPS + CO2     | $15,000 | +60% | $18 |

**Max combo** (Aeroponics + HPS + CO2) = $30/cycle, +120% yield.

---

## 🧪 Nutrient Upgrades

Three independent nutrient lines per grow room. Each is purchased separately with dirty cash and charged a maintenance fee per harvest cycle. All base costs shown are for the **Closet** — multiply by the room's `upgradeCostMultiplier` for other buildings.

### 🟢 FloraGro — Speed (faster grow cycles)

| Level | Name | Base Cost | ×Shed | ×Garage | ×SmGrow | ×Facility | Cost/Cycle | Speed Bonus |
|-------|------|-----------|-------|---------|---------|-----------|-----------|-------------|
| 1 | FloraGro I   | $600    | $1,200   | $2,400   | $4,800    | $9,600    | $1 | −5% grow time  |
| 2 | FloraGro II  | $3,000  | $6,000   | $12,000  | $24,000   | $48,000   | $3 | −10% grow time |
| 3 | FloraGro III | $12,000 | $24,000  | $48,000  | $96,000   | $192,000  | $6 | −15% grow time |

### 🟣 FloraMicro — Yield (bigger harvests)

| Level | Name | Base Cost | ×Shed | ×Garage | ×SmGrow | ×Facility | Cost/Cycle | Yield Bonus |
|-------|------|-----------|-------|---------|---------|-----------|-----------|-------------|
| 1 | FloraMicro I   | $800    | $1,600   | $3,200   | $6,400    | $12,800   | $1 | +5% harvest yield  |
| 2 | FloraMicro II  | $4,000  | $8,000   | $16,000  | $32,000   | $64,000   | $3 | +10% harvest yield |
| 3 | FloraMicro III | $15,000 | $30,000  | $60,000  | $120,000  | $240,000  | $6 | +15% harvest yield |

### 🩷 FloraBloom — Double (chance to 2× crop)

| Level | Name | Base Cost | ×Shed | ×Garage | ×SmGrow | ×Facility | Cost/Cycle | Double Chance |
|-------|------|-----------|-------|---------|---------|-----------|-----------|---------------|
| 1 | FloraBloom I   | $1,200  | $2,400   | $4,800   | $9,600    | $19,200   | $2 | 2% chance |
| 2 | FloraBloom II  | $6,000  | $12,000  | $24,000  | $48,000   | $96,000   | $4 | 4% chance |
| 3 | FloraBloom III | $20,000 | $40,000  | $80,000  | $160,000  | $320,000  | $8 | 6% chance |

**upgradeCostMultiplier:** Closet ×1 · Shed ×2 · Garage ×4 · Small Grow ×8 · Grow Facility ×16
**Cost/Cycle** = charged once per completed harvest (per slot). Multiple nutrients stack their cycle costs.
**Stack note:** All three nutrients are independent — you can have FloraGro III + FloraMicro III + FloraBloom III in the same room.

---

## 🤝 Dealer Tiers

| # | Tier | Hire Cost/ea | Upgrade Cost (×3) | Sales/Tick/dealer | Cut per 8oz | Cut/oz | Heat/Tick | Downgrade Refund |
|---|------|-------------|-------------------|-------------------|-------------|--------|-----------|-----------------|
| 0 | Corner Boys          | $500    | —         | 0.5 oz  | $3  | $0.375 | 0.005 | —        |
| 1 | Street Crew          | $300    | $900      | 1.5 oz  | $5  | $0.625 | 0.012 | $450     |
| 2 | Distribution Network | $1,200  | $3,600    | 4.0 oz  | $8  | $1.000 | 0.020 | $1,800   |
| 3 | City Syndicate       | $6,000  | $18,000   | 12.0 oz | $15 | $1.875 | 0.035 | $9,000   |
| 4 | Regional Cartel      | $30,000 | $90,000   | 40.0 oz | $25 | $3.125 | 0.060 | $45,000  |

**Upgrade Cost** = `hireCost × 3` paid in dirty cash to advance one tier.
**Downgrade Refund** = 50% of the current tier's upgrade cost, returned as dirty cash.
**Cut/oz** = `cutPer8oz ÷ 8` — actual cost deducted per oz sold (used in income formula).
**Net income/tick** = `(dealerCount × salesRate × avgPrice) − (dealerCount × salesRate × cutPerOz)`
**Heat/tick** = per dealer; scales with dealer count — higher tiers generate more heat per dealer.

### Net Income Example (10 dealers, $12/oz avg price)

| Tier | Sales/tick | Gross/tick | Cut/tick | Net/tick |
|------|-----------|-----------|---------|---------|
| Corner Boys          | 5 oz   | $60   | $1.88  | $58.13  |
| Street Crew          | 15 oz  | $180  | $9.38  | $170.63 |
| Distribution Network | 40 oz  | $480  | $40.00 | $440.00 |
| City Syndicate       | 120 oz | $1,440 | $187.50 | $1,252.50 |
| Regional Cartel      | 400 oz | $4,800 | $1,250.00 | $3,550.00 |

---

## 🌱 Grow Room Types

| Room | Buy Cost | Slots | Strains |
|------|---------|-------|---------|
| Closet              | Free      | 1 (no upgrades) | Basic Bud |
| Shed                | $1,500    | 1–4             | OG Kush → Blue Dream |
| Garage              | $16,000   | 1–4             | Sour Diesel → Girl Scout Cookies |
| Small Grow Facility | $100,000  | 1–4             | Durban Poison → Wedding Cake |
| Grow Facility       | $80,000   | 1–4             | Gelato → Biscotti |

### Strain Slots (unlock order per room)

#### Closet
| Slot | Strain | Price/oz | Grow Timer | Yield |
|------|--------|---------|-----------|-------|
| 1 | Basic Bud | $8 | 30 ticks | 8 oz |

#### Shed
| Slot | Strain | Price/oz | Grow Timer | Yield |
|------|--------|---------|-----------|-------|
| 1 | OG Kush     | $12 | 40 ticks | 28 oz |
| 2 | White Widow | $16 | 38 ticks | 28 oz |
| 3 | Purple Haze | $22 | 36 ticks | 28 oz |
| 4 | Blue Dream  | $30 | 34 ticks | 28 oz |

#### Garage
| Slot | Strain | Price/oz | Grow Timer | Yield |
|------|--------|---------|-----------|-------|
| 1 | Sour Diesel        | $20 | 36 ticks | 55 oz |
| 2 | AK-47              | $28 | 34 ticks | 55 oz |
| 3 | Gorilla Glue       | $36 | 32 ticks | 55 oz |
| 4 | Girl Scout Cookies | $46 | 30 ticks | 55 oz |

#### Small Grow Facility
| Slot | Strain | Price/oz | Grow Timer | Yield |
|------|--------|---------|-----------|-------|
| 1 | Durban Poison | $35 | 32 ticks | 100 oz |
| 2 | Jack Herer    | $45 | 30 ticks | 100 oz |
| 3 | Amnesia Haze  | $58 | 28 ticks | 100 oz |
| 4 | Wedding Cake  | $72 | 26 ticks | 100 oz |

#### Grow Facility
| Slot | Strain | Price/oz | Grow Timer | Yield |
|------|--------|---------|-----------|-------|
| 1 | Gelato   | $60  | 28 ticks | 200 oz |
| 2 | Runtz    | $78  | 26 ticks | 200 oz |
| 3 | Zkittlez | $95  | 24 ticks | 200 oz |
| 4 | Biscotti | $120 | 22 ticks | 200 oz |

---

## ⭐ Prestige System

| Threshold | Reward |
|-----------|--------|
| $1,000,000 total dirty earned | +5% grow yield (permanent, stacks) |

Prestige resets all cash and businesses but keeps prestige count and yield bonus.

---

## 🌡️ Heat System

| Heat | Tier Name  | Color  |
|------|-----------|--------|
| 0–29  | Unknown   | 🟢 Green  |
| 30–59 | Noticed   | 🟡 Yellow |
| 60–79 | Watched   | 🟠 Orange |
| 80–89 | Pressured | 🔴 Red    |
| 90+   | Targeted  | ⬛ Dark Red |

Heat increases from dealers and events. Front businesses reduce heat per tick.

---

## 🏢 Front Business Categories

| Category | Examples | Purpose |
|----------|---------|---------|
| FoodFront | Burger Cart, Taco Stand, Food Truck, Diner | Laundering + legit revenue |
| AutoFront | Car Wash, Auto Repair, Car Dealership | High launder capacity |
| RealEstate | Rental Property, Motel | Steady passive income |
| ServiceFront | Barbershop, Laundromat, Gym, Tattoo Parlor | Low heat + laundering |
| NightlifeFront | Bar, Nightclub | High revenue, higher risk |
| FinanceFront | Pawn Shop, Check Cashing | High launder efficiency |
| RetailFront | Convenience Store, Smoke Shop | Low cost entry |

**Launder efficiency** = fraction of dirty cash that becomes clean (e.g. 0.8 = 80¢ clean per $1 dirty).

---

*1 tick = 1 second of real time*
