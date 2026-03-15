import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Contribute clean cash to syndicate treasury.
 * Deducts from player's leaderboard cleanCash field (informational — actual deduction happens client-side).
 */
export const contributeTreasury = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const uid = request.auth.uid;
  const { syndicateId, amount } = request.data;

  if (!syndicateId || !amount || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid contribution amount');
  }

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();
  if (!syndicate.exists) throw new HttpsError('not-found', 'Syndicate not found');

  const sd = syndicate.data()!;
  if (!sd.memberIds.includes(uid)) {
    throw new HttpsError('permission-denied', 'You are not in this syndicate');
  }

  await syndicateRef.update({
    treasury: admin.firestore.FieldValue.increment(amount),
  });

  return { success: true, newTreasury: (sd.treasury ?? 0) + amount };
});
