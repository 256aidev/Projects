import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Kick a member from the syndicate. Only leader or underboss can kick.
 * Cannot kick the leader. Underbosses can only kick regular members.
 */
export const kickMember = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const uid = request.auth.uid;
  const { syndicateId, targetUid } = request.data;

  if (!syndicateId || !targetUid) throw new HttpsError('invalid-argument', 'Missing fields');
  if (uid === targetUid) throw new HttpsError('invalid-argument', 'Cannot kick yourself');

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();
  if (!syndicate.exists) throw new HttpsError('not-found', 'Syndicate not found');

  const sd = syndicate.data()!;
  const isLeader = sd.leaderId === uid;
  const isUnderboss = sd.underbossIds.includes(uid);
  if (!isLeader && !isUnderboss) {
    throw new HttpsError('permission-denied', 'Only leaders and underbosses can kick');
  }
  if (sd.leaderId === targetUid) {
    throw new HttpsError('permission-denied', 'Cannot kick the leader');
  }
  if (isUnderboss && sd.underbossIds.includes(targetUid)) {
    throw new HttpsError('permission-denied', 'Underbosses cannot kick other underbosses');
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
