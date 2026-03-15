import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Promote a member to underboss. Only the leader can promote.
 * Max 3 underbosses.
 */
export const promoteMember = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const uid = request.auth.uid;
  const { syndicateId, targetUid } = request.data;

  if (!syndicateId || !targetUid) throw new HttpsError('invalid-argument', 'Missing fields');

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();
  if (!syndicate.exists) throw new HttpsError('not-found', 'Syndicate not found');

  const sd = syndicate.data()!;
  if (sd.leaderId !== uid) {
    throw new HttpsError('permission-denied', 'Only the leader can promote');
  }
  if (sd.underbossIds.includes(targetUid)) {
    throw new HttpsError('already-exists', 'Already an underboss');
  }
  if (sd.underbossIds.length >= 3) {
    throw new HttpsError('resource-exhausted', 'Maximum 3 underbosses');
  }

  const batch = db.batch();
  batch.update(syndicateRef, {
    underbossIds: admin.firestore.FieldValue.arrayUnion(targetUid),
  });
  batch.update(syndicateRef.collection('members').doc(targetUid), { role: 'underboss' });

  await batch.commit();
  return { success: true };
});
