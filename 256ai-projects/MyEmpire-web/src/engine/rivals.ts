import type { RivalSyndicate, BusinessInstance } from '../data/types';
import { ARSON_DURATION, ARSON_INSURANCE } from '../data/types';
import { BUSINESSES } from '../data/businesses';
import { DISTRICTS } from '../data/districts';
import type { HiredCrew } from '../data/crewDefs';
import { getCrewDefense, getCrewUpkeep, getCrewCount } from '../data/crewDefs';

// Rival AI runs every N ticks to avoid per-tick overhead
export const RIVAL_TICK_INTERVAL = 10;

// Legacy fallback — each rival now has its own activeAtTick for staggered entry
export const RIVAL_HEAD_START_TICKS = 300;

/** Get total player defense power from crew */
export function getPlayerDefense(crew: HiredCrew[]): number {
  return getCrewDefense(crew);
}

/** Get total crew upkeep cost per tick */
export function getCrewUpkeepTotal(crew: HiredCrew[]): number {
  return getCrewUpkeep(crew);
}

/** Get total crew member count */
export function getCrewMemberCount(crew: HiredCrew[]): number {
  return getCrewCount(crew);
}

interface RivalTickResult {
  rivals: RivalSyndicate[];
  attackMessages: string[];
  playerDirtyCashLost: number;
  playerCleanCashLost: number;
  playerProductLost: number;
  businessesDamaged: string[];  // instanceIds of damaged businesses
}

/**
 * Rival AI tick — runs every RIVAL_TICK_INTERVAL ticks.
 * Rivals passively grow and occasionally attack the player.
 */
export function tickRivals(
  rivals: RivalSyndicate[],
  rivalHeat: number,
  playerDirtyCash: number,
  playerProductOz: number,
  playerBusinesses: BusinessInstance[],
  playerDefense: number,
  tickCount: number,
  playerUnlockedSlots?: Record<string, number>,
): RivalTickResult {
  const messages: string[] = [];
  let dirtyCashLost = 0;
  let cleanCashLost = 0;
  let productLost = 0;
  const damagedBiz: string[] = [];

  const updatedRivals = rivals.map(rival => {
    if (rival.isDefeated) return rival;
    // Royal Rumble staggered entry — each rival has its own activation tick
    const entryTick = rival.activeAtTick ?? RIVAL_HEAD_START_TICKS;
    if (tickCount < entryTick) return rival;

    // ── Passive growth — linear scaling, much slower ──────
    let r = { ...rival };
    // Dirty: $10 base + $20 per power level (power 1 = $30, power 5 = $110, power 10 = $210)
    r.dirtyCash += Math.floor(10 + r.power * 20);
    // Clean: $15 base + $15 per power level, but ONLY after accumulating $100K dirty
    if (r.dirtyCash >= 100000) {
      r.cleanCash += Math.floor(15 + r.power * 15);
    }
    r.productOz += Math.floor(r.power * 0.3);
    r.power = Math.min(20, r.power + 0.0005); // 10x slower power creep
    // Weakness decays very slowly — 0.005/tick ≈ 0.3%/min so attacks accumulate
    if ((r.weakness ?? 0) > 0) r.weakness = Math.max(0, (r.weakness ?? 0) - 0.005);

    // ── Process burned businesses — fire clears after ARSON_DURATION ticks ──
    const stillBurning: typeof r.businesses = [];
    const cleared: typeof r.businesses = [];
    for (const biz of r.businesses) {
      if (biz.burnedAtTick != null) {
        if (tickCount - biz.burnedAtTick >= ARSON_DURATION) {
          cleared.push(biz);
        } else {
          stillBurning.push(biz);
        }
      } else {
        stillBurning.push(biz);
      }
    }
    if (cleared.length > 0) {
      r.businesses = stillBurning;
      // Insurance payout per cleared building — rival gets cash back
      r.dirtyCash += cleared.length * ARSON_INSURANCE;
      // Blacklist the slots — rival can't rebuy until someone else buys and clears
      const newBlacklist = [...(r.blacklistedSlots ?? [])];
      for (const biz of cleared) {
        newBlacklist.push(`${biz.districtId}:${biz.slotIndex}`);
      }
      r.blacklistedSlots = newBlacklist;
      messages.push(`${r.icon} ${r.name} collected $${(cleared.length * ARSON_INSURANCE).toLocaleString()} insurance`);
    }

    // ── Step 1: Rival buys a LOT occasionally (1% chance per rival tick) ──
    if (!r.ownedLots) r.ownedLots = [];
    const LOT_COST = 2000; // flat lot cost for rivals
    if (r.dirtyCash >= LOT_COST && Math.random() < 0.01) {
      const maxDistrictCost = r.power * 25000;
      const availableDistricts = DISTRICTS.filter(d =>
        d.maxBusinessSlots > 0 && (d.unlockCost ?? 0) <= maxDistrictCost
      );
      const district = availableDistricts[Math.floor(Math.random() * availableDistricts.length)];
      if (district) {
        const slot = Math.floor(Math.random() * district.maxBusinessSlots);
        const slotKey = `${district.id}:${slot}`;
        const alreadyHas = r.businesses.some(b => b.districtId === district.id && b.slotIndex === slot);
        const alreadyOwnsLot = r.ownedLots.some(l => l.districtId === district.id && l.slotIndex === slot);
        const isBlacklisted = (r.blacklistedSlots ?? []).includes(slotKey);
        const playerOwnsSlot = slot < (playerUnlockedSlots?.[district.id] ?? 0);
        if (!alreadyHas && !alreadyOwnsLot && !isBlacklisted && !playerOwnsSlot) {
          r.ownedLots = [...r.ownedLots, { districtId: district.id, slotIndex: slot, boughtAtTick: tickCount }];
          r.dirtyCash -= LOT_COST;
        }
      }
    }

    // ── Step 2: Build on lots that have waited 60 ticks ──
    const LOT_BUILD_COOLDOWN = 60;
    const maxBudget = Math.floor(r.power * 15000);
    const affordableBiz = BUSINESSES.filter(b => b.purchaseCost <= maxBudget && b.purchaseCost <= r.cleanCash);
    const readyLots = r.ownedLots.filter(l => tickCount - l.boughtAtTick >= LOT_BUILD_COOLDOWN);
    if (readyLots.length > 0 && affordableBiz.length > 0) {
      const lot = readyLots[0]; // build on the oldest ready lot
      const bizDef = affordableBiz[Math.floor(Math.random() * affordableBiz.length)];
      r.businesses = [...r.businesses, {
        districtId: lot.districtId,
        slotIndex: lot.slotIndex,
        businessDefId: bizDef.id,
        health: 100,
      }];
      r.cleanCash -= bizDef.purchaseCost;
      r.ownedLots = r.ownedLots.filter(l => !(l.districtId === lot.districtId && l.slotIndex === lot.slotIndex));
    }

    // Rival hires hitmen occasionally
    if (r.dirtyCash > 20000 && Math.random() < 0.05) {
      r.hitmen += 1;
      r.dirtyCash -= 5000;
    }

    // ── Attack decision ─────────────────────────────────────────────────
    // Higher rival heat + higher aggression = more likely to attack
    const attackChance = (rivalHeat / 1000) * r.aggression * 0.15;
    if (Math.random() < attackChance && r.hitmen > 0) {
      const rivalAttack = r.hitmen * 15;
      const defenseRatio = playerDefense / Math.max(1, rivalAttack);

      // Defense can reduce or block the attack
      if (Math.random() > defenseRatio * 0.5) {
        // Attack succeeds — pick a random attack type
        const roll = Math.random();
        if (roll < 0.4) {
          // Steal dirty cash
          const stolen = Math.min(playerDirtyCash - dirtyCashLost, 1000 + Math.floor(r.power * 500));
          if (stolen > 0) {
            dirtyCashLost += stolen;
            r.dirtyCash += stolen;
            messages.push(`${r.icon} ${r.name} robbed you for $${stolen.toLocaleString()}!`);
          }
        } else if (roll < 0.7) {
          // Steal product
          const stolenOz = Math.min(playerProductOz - productLost, 2 + Math.floor(r.power * 2));
          if (stolenOz > 0) {
            productLost += stolenOz;
            r.productOz += stolenOz;
            messages.push(`${r.icon} ${r.name} raided your stash — stole ${stolenOz} oz!`);
          }
        } else if (playerBusinesses.length > 0) {
          // Damage a business
          const target = playerBusinesses[Math.floor(Math.random() * playerBusinesses.length)];
          damagedBiz.push(target.instanceId);
          messages.push(`${r.icon} ${r.name} attacked your business!`);
        }
      } else {
        messages.push(`${r.icon} ${r.name} tried to attack but your crew held them off!`);
      }
    }

    return r;
  });

  return {
    rivals: updatedRivals,
    attackMessages: messages,
    playerDirtyCashLost: dirtyCashLost,
    playerCleanCashLost: cleanCashLost,
    playerProductLost: productLost,
    businessesDamaged: damagedBiz,
  };
}
