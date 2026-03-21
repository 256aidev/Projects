import type { RivalSyndicate, BusinessInstance } from '../data/types';
import { ARSON_DURATION, ARSON_INSURANCE } from '../data/types';
import { BUSINESSES } from '../data/businesses';
import { DISTRICTS } from '../data/districts';
import type { HiredCrew } from '../data/crewDefs';
import { getCrewDefense, getCrewUpkeep, getCrewCount } from '../data/crewDefs';
import { getTuning } from '../store/tuningStore';

// Rival AI runs every N ticks to avoid per-tick overhead — now tunable
export const RIVAL_TICK_INTERVAL = 10; // fallback, actual value read from tuning

// Legacy fallback — each rival now has its own activeAtTick for staggered entry
export const RIVAL_HEAD_START_TICKS = 300;

/** Get total player defense power from crew (with optional tech bonus) */
export function getPlayerDefense(crew: HiredCrew[], techDefenseBonus = 0): number {
  return getCrewDefense(crew, techDefenseBonus);
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

    // ── Passive growth — all values from tuning dashboard ──────
    const t = getTuning();
    let r = { ...rival };
    r.dirtyCash += Math.floor(t.rivalDirtyBase + r.power * t.rivalDirtyPerPower);
    if (r.dirtyCash >= t.rivalCleanThreshold) {
      r.cleanCash += Math.floor(t.rivalCleanBase + r.power * t.rivalCleanPerPower);
    }
    r.productOz += Math.floor(1 + r.power * t.rivalProductPerPower);
    r.power = Math.min(t.rivalPowerCap, r.power + t.rivalPowerGrowth);
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
    if (r.dirtyCash >= t.rivalLotCost && Math.random() < t.rivalLotBuyChance) {
      const maxDistrictCost = r.power * 25000;
      const availableDistricts = DISTRICTS.filter(d =>
        d.maxBusinessSlots > 0 && (d.unlockCost ?? 0) <= maxDistrictCost
      );
      const district = availableDistricts[Math.floor(Math.random() * availableDistricts.length)];
      if (district) {
        // Rivals use slot indices starting at 100+ to never conflict with player's sequential 0,1,2...
        const rivalSlotBase = 100 + rivals.indexOf(rival) * 20;
        const existingRivalSlots = r.businesses.filter(b => b.districtId === district.id).length
          + r.ownedLots.filter(l => l.districtId === district.id).length;
        // Each rival gets up to 3 businesses per district
        if (existingRivalSlots < 3) {
          const slot = rivalSlotBase + existingRivalSlots;
          const slotKey = `${district.id}:${slot}`;
          const isBlacklisted = (r.blacklistedSlots ?? []).includes(slotKey);
          if (!isBlacklisted) {
            r.ownedLots = [...r.ownedLots, { districtId: district.id, slotIndex: slot, boughtAtTick: tickCount }];
            r.dirtyCash -= t.rivalLotCost;
          }
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
    if (r.dirtyCash > t.rivalHitmanCost * 4 && Math.random() < t.rivalHitmanHireChance) {
      r.hitmen += 1;
      r.dirtyCash -= t.rivalHitmanCost;
    }

    // ── Attack decision ─────────────────────────────────────────────────
    // Higher rival heat + higher aggression = more likely to attack
    const attackChance = (rivalHeat / 1000) * r.aggression * t.rivalAttackMultiplier;
    if (Math.random() < attackChance && r.hitmen > 0) {
      const rivalAttack = r.hitmen * 15;
      const defenseRatio = playerDefense / Math.max(1, rivalAttack);

      // Defense can reduce or block the attack
      if (Math.random() > defenseRatio * 0.5) {
        // Attack succeeds — pick a random attack type
        const roll = Math.random();
        if (roll < 0.4) {
          // Steal dirty cash
          const stolen = Math.min(playerDirtyCash - dirtyCashLost, t.rivalStolenCashBase + Math.floor(r.power * t.rivalStolenCashPerPower));
          if (stolen > 0) {
            dirtyCashLost += stolen;
            r.dirtyCash += stolen;
            messages.push(`${r.icon} ${r.name} robbed you for $${stolen.toLocaleString()}!`);
          }
        } else if (roll < 0.7) {
          // Steal product
          const stolenOz = Math.min(playerProductOz - productLost, t.rivalStolenProductBase + Math.floor(r.power * t.rivalStolenProductPerPower));
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
