import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Weekly matchmaking — runs every Monday at 00:00 UTC.
 * Pairs syndicates by total power level for the weekly war.
 */
export const weeklyMatchmaking = onSchedule({ schedule: 'every monday 00:00', timeZone: 'UTC' }, async () => {
  // Get all syndicates with 2+ members, sorted by power
  const syndicatesSnap = await db.collection('syndicates')
    .where('memberCount', '>=', 2)
    .orderBy('memberCount')
    .orderBy('totalPower', 'desc')
    .get();

  const syndicates = syndicatesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter out syndicates already in active wars
  const available = syndicates.filter((s: any) => !s.currentWarId);

  // Pair by similar power (greedy matching)
  const paired: [any, any][] = [];
  const used = new Set<string>();

  for (let i = 0; i < available.length; i++) {
    if (used.has(available[i].id)) continue;

    // Find closest power match that isn't used
    let bestMatch = -1;
    let bestDiff = Infinity;
    for (let j = i + 1; j < available.length; j++) {
      if (used.has(available[j].id)) continue;
      const diff = Math.abs((available[i] as any).totalPower - (available[j] as any).totalPower);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = j;
      }
    }

    if (bestMatch >= 0) {
      paired.push([available[i], available[bestMatch]]);
      used.add(available[i].id);
      used.add(available[bestMatch].id);
    }
  }

  // Create wars for each pair
  const now = Date.now();
  const warDuration = 5 * 24 * 60 * 60 * 1000; // 5 days

  for (const [a, b] of paired) {
    const warRef = db.collection('wars').doc();
    const warData = {
      syndicateA: a.id,
      syndicateB: b.id,
      syndicateAName: (a as any).name,
      syndicateBName: (b as any).name,
      startedAt: now,
      endsAt: now + warDuration,
      status: 'active',
      dayResults: [],
      winnerId: null,
      totalPointsA: 0,
      totalPointsB: 0,
    };

    const batch = db.batch();
    batch.set(warRef, warData);
    batch.update(db.collection('syndicates').doc(a.id), { currentWarId: warRef.id });
    batch.update(db.collection('syndicates').doc(b.id), { currentWarId: warRef.id });
    await batch.commit();
  }

  console.log(`Matchmaking complete: ${paired.length} wars created`);
});
