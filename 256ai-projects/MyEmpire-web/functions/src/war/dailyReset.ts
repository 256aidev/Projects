import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Daily war reset — runs every day at 00:00 UTC.
 * Resets fight counts for all members in active wars.
 * Records daily results.
 */
export const dailyWarReset = functions.pubsub.schedule('every day 00:00').timeZone('UTC').onRun(async () => {
  // Get all active wars
  const warsSnap = await db.collection('wars').where('status', '==', 'active').get();

  for (const warDoc of warsSnap.docs) {
    const warData = warDoc.data();
    const syndicateAId = warData.syndicateA;
    const syndicateBId = warData.syndicateB;

    // Reset fight counts for both syndicates' members
    for (const syndicateId of [syndicateAId, syndicateBId]) {
      const membersSnap = await db.collection('syndicates').doc(syndicateId)
        .collection('members').get();

      const batch = db.batch();
      for (const memberDoc of membersSnap.docs) {
        batch.update(memberDoc.ref, { warFightsToday: 0 });
      }
      await batch.commit();
    }
  }

  console.log(`Daily reset: ${warsSnap.size} wars processed`);
});
