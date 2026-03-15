import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// War bonuses
const WINNER_TREASURY_BONUS = 50000;  // clean cash added to winner's treasury
const LOSER_TREASURY_BONUS = 10000;   // consolation prize
const WINNER_XP = 100;
const LOSER_XP = 25;

/**
 * End war — runs every Saturday at 00:00 UTC.
 * Tallies final scores, distributes bonuses, clears war state.
 */
export const endWar = onSchedule({ schedule: 'every saturday 00:00', timeZone: 'UTC' }, async () => {
  const warsSnap = await db.collection('wars').where('status', '==', 'active').get();

  for (const warDoc of warsSnap.docs) {
    const warData = warDoc.data();
    const { syndicateA, syndicateB, totalPointsA, totalPointsB } = warData;

    const aWins = totalPointsA > totalPointsB;
    const tie = totalPointsA === totalPointsB;
    const winnerId = tie ? null : (aWins ? syndicateA : syndicateB);
    const loserId = tie ? null : (aWins ? syndicateB : syndicateA);

    const batch = db.batch();

    // Mark war complete
    batch.update(warDoc.ref, {
      status: 'completed',
      winnerId,
    });

    // Distribute bonuses
    if (winnerId && loserId) {
      batch.update(db.collection('syndicates').doc(winnerId), {
        currentWarId: null,
        warWins: admin.firestore.FieldValue.increment(1),
        treasury: admin.firestore.FieldValue.increment(WINNER_TREASURY_BONUS),
        xp: admin.firestore.FieldValue.increment(WINNER_XP),
      });
      batch.update(db.collection('syndicates').doc(loserId), {
        currentWarId: null,
        warLosses: admin.firestore.FieldValue.increment(1),
        treasury: admin.firestore.FieldValue.increment(LOSER_TREASURY_BONUS),
        xp: admin.firestore.FieldValue.increment(LOSER_XP),
      });
    } else {
      // Tie — both get consolation
      for (const sid of [syndicateA, syndicateB]) {
        batch.update(db.collection('syndicates').doc(sid), {
          currentWarId: null,
          treasury: admin.firestore.FieldValue.increment(LOSER_TREASURY_BONUS),
          xp: admin.firestore.FieldValue.increment(LOSER_XP),
        });
      }
    }

    // Reset member war stats for both syndicates
    for (const sid of [syndicateA, syndicateB]) {
      const membersSnap = await db.collection('syndicates').doc(sid).collection('members').get();
      for (const memberDoc of membersSnap.docs) {
        batch.update(memberDoc.ref, { warFightsToday: 0, warPointsTotal: 0 });
      }
    }

    await batch.commit();
  }

  console.log(`Wars ended: ${warsSnap.size} wars resolved`);
});
