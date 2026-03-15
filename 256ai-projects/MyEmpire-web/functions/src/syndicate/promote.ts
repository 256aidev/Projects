import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Promote a member to underboss. Only the leader can promote.
 * Max 3 underbosses.
 */
export const promoteMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const uid = context.auth.uid;
  const { syndicateId, targetUid } = data;

  if (!syndicateId || !targetUid) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();
  if (!syndicate.exists) throw new functions.https.HttpsError('not-found', 'Syndicate not found');

  const sd = syndicate.data()!;
  if (sd.leaderId !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'Only the leader can promote');
  }
  if (sd.underbossIds.includes(targetUid)) {
    throw new functions.https.HttpsError('already-exists', 'Already an underboss');
  }
  if (sd.underbossIds.length >= 3) {
    throw new functions.https.HttpsError('resource-exhausted', 'Maximum 3 underbosses');
  }

  const batch = db.batch();
  batch.update(syndicateRef, {
    underbossIds: admin.firestore.FieldValue.arrayUnion(targetUid),
  });
  batch.update(syndicateRef.collection('members').doc(targetUid), { role: 'underboss' });

  await batch.commit();
  return { success: true };
});
