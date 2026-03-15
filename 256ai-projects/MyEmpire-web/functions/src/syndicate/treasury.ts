import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Contribute clean cash to syndicate treasury.
 * Deducts from player's leaderboard cleanCash field (informational — actual deduction happens client-side).
 */
export const contributeTreasury = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const uid = context.auth.uid;
  const { syndicateId, amount } = data;

  if (!syndicateId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid contribution amount');
  }

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();
  if (!syndicate.exists) throw new functions.https.HttpsError('not-found', 'Syndicate not found');

  const sd = syndicate.data()!;
  if (!sd.memberIds.includes(uid)) {
    throw new functions.https.HttpsError('permission-denied', 'You are not in this syndicate');
  }

  await syndicateRef.update({
    treasury: admin.firestore.FieldValue.increment(amount),
  });

  return { success: true, newTreasury: (sd.treasury ?? 0) + amount };
});
