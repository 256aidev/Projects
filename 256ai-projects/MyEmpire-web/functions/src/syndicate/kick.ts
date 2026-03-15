import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Kick a member from the syndicate. Only leader or underboss can kick.
 * Cannot kick the leader. Underbosses can only kick regular members.
 */
export const kickMember = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const uid = context.auth.uid;
  const { syndicateId, targetUid } = data;

  if (!syndicateId || !targetUid) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
  if (uid === targetUid) throw new functions.https.HttpsError('invalid-argument', 'Cannot kick yourself');

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();
  if (!syndicate.exists) throw new functions.https.HttpsError('not-found', 'Syndicate not found');

  const sd = syndicate.data()!;
  const isLeader = sd.leaderId === uid;
  const isUnderboss = sd.underbossIds.includes(uid);
  if (!isLeader && !isUnderboss) {
    throw new functions.https.HttpsError('permission-denied', 'Only leaders and underbosses can kick');
  }
  if (sd.leaderId === targetUid) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot kick the leader');
  }
  if (isUnderboss && sd.underbossIds.includes(targetUid)) {
    throw new functions.https.HttpsError('permission-denied', 'Underbosses cannot kick other underbosses');
  }

  const memberRef = syndicateRef.collection('members').doc(targetUid);
  const memberDoc = await memberRef.get();
  const memberPower = memberDoc.exists ? memberDoc.data()?.powerContribution ?? 0 : 0;

  const batch = db.batch();
  batch.delete(memberRef);
  batch.update(syndicateRef, {
    memberIds: admin.firestore.FieldValue.arrayRemove(targetUid),
    underbossIds: admin.firestore.FieldValue.arrayRemove(targetUid),
    memberCount: admin.firestore.FieldValue.increment(-1),
    totalPower: admin.firestore.FieldValue.increment(-memberPower),
  });
  try { batch.update(db.collection('leaderboard').doc(targetUid), { syndicateId: null }); } catch {}

  await batch.commit();
  return { success: true };
});
