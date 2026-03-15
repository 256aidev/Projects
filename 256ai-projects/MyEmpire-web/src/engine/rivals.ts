import type { RivalSyndicate, HiredHitman, BusinessInstance } from '../data/types';
import { HITMAN_MAP, ARSON_DURATION, ARSON_INSURANCE } from '../data/types';
import { BUSINESSES } from '../data/businesses';
import { DISTRICTS } from '../data/districts';

// Rival AI runs every N ticks to avoid per-tick overhead
export const RIVAL_TICK_INTERVAL = 10;

// Legacy fallback — each rival now has its own activeAtTick for staggered entry
export const RIVAL_HEAD_START_TICKS = 300;

/** Get total player defense power from hitmen */
export function getPlayerDefense(hitmen: HiredHitman[]): number {
  return hitmen.reduce((sum, h) => {
    const def = HITMAN_MAP[h.defId];
    return sum + (def ? h.count * def.defense : 0);
  }, 0);
}

/** Get total hitman upkeep cost per tick */
export function getHitmanUpkeep(hitmen: HiredHitman[]): number {
  return hitmen.reduce((sum, h) => {
    const def = HITMAN_MAP[h.defId];
    return sum + (def ? h.count * def.upkeep : 0);
  }, 0);
}

/** Get total player hitman count */
export function getPlayerHitmanCount(hitmen: HiredHitman[]): number {
  return hitmen.reduce((sum, h) => sum + h.count, 0);
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

    // ── Passive growth — scales with power² so early game is slow ──────
    let r = { ...rival };
    // Power 1 = $50/tick, Power 5 = $550, Power 10 = $2050, Power 20 = $8050
    r.dirtyCash += Math.floor(50 + r.power * r.power * 20);
    r.cleanCash += Math.floor(10 + r.power * r.power * 5);
    r.productOz += Math.floor(r.power * 0.3);
    r.power = Math.min(20, r.power + 0.005); // very slow power creep

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

    // Rival buys a business occasionally (every ~50 ticks when they have money)
    // Budget scales with power: early rivals can only afford cheap businesses
    const maxBudget = Math.floor(r.power * 15000); // power 1 = $15K max, power 5 = $75K, power 10 = $150K
    const affordableBiz = BUSINESSES.filter(b => b.purchaseCost <= maxBudget && b.purchaseCost <= r.cleanCash);
    if (affordableBiz.length > 0 && Math.random() < 0.04) {
      const bizDef = affordableBiz[Math.floor(Math.random() * affordableBiz.length)];
      // Rivals only buy in starter/cheap districts until they're powerful
      const maxDistrictCost = r.power * 25000; // power 1 = $25K districts, power 4+ = $100K+
      const availableDistricts = DISTRICTS.filter(d =>
        d.maxBusinessSlots > 0 && (d.unlockCost ?? 0) <= maxDistrictCost
      );
      const district = availableDistricts[Math.floor(Math.random() * availableDistricts.length)];
      if (bizDef && district) {
        const slot = Math.floor(Math.random() * district.maxBusinessSlots);
        const slotKey = `${district.id}:${slot}`;
        const alreadyHas = r.businesses.some(b => b.districtId === district.id && b.slotIndex === slot);
        const isBlacklisted = (r.blacklistedSlots ?? []).includes(slotKey);
        // Skip player-owned empty lots — rivals can't take lots the player bought
        const playerOwnsSlot = slot < (playerUnlockedSlots?.[district.id] ?? 2);
        const playerHasBizThere = playerOwnsSlot && playerBusinesses.some(b => b.districtId === district.id && b.slotIndex === slot);
        const isProtected = playerOwnsSlot && !playerHasBizThere;
        if (!alreadyHas && !isBlacklisted && !isProtected) {
          r.businesses = [...r.businesses, {
            districtId: district.id,
            slotIndex: slot,
            businessDefId: bizDef.id,
            health: 100,
          }];
          r.cleanCash -= bizDef.purchaseCost;
        }
      }
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
        messages.push(`${r.icon} ${r.name} tried to attack but your hitmen held them off!`);
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
