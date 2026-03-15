import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Leave current syndicate. If leader leaves, promotes first underboss or oldest member.
 * If last member, deletes the syndicate.
 */
export const leaveSyndicate = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const uid = request.auth.uid;
  const { syndicateId } = request.data;

  if (!syndicateId) throw new HttpsError('invalid-argument', 'Missing syndicateId');

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();

  if (!syndicate.exists) throw new HttpsError('not-found', 'Syndicate not found');

  const syndicateData = syndicate.data()!;
  if (!syndicateData.memberIds.includes(uid)) {
    throw new HttpsError('permission-denied', 'You are not in this syndicate');
  }

  const memberRef = syndicateRef.collection('members').doc(uid);
  const memberDoc = await memberRef.get();
  const memberPower = memberDoc.exists ? memberDoc.data()?.powerContribution ?? 0 : 0;

  const batch = db.batch();

  // Remove member
  batch.delete(memberRef);
  batch.update(syndicateRef, {
    memberIds: admin.firestore.FieldValue.arrayRemove(uid),
    memberCount: admin.firestore.FieldValue.increment(-1),
    totalPower: admin.firestore.FieldValue.increment(-memberPower),
  });

  // Clear player's syndicateId
  try { batch.update(db.collection('leaderboard').doc(uid), { syndicateId: null }); } catch {}

  // Handle leader succession
  if (syndicateData.leaderId === uid) {
    const remainingIds = syndicateData.memberIds.filter((id: string) => id !== uid);

    if (remainingIds.length === 0) {
      // Last member — delete syndicate
      batch.delete(syndicateRef);
    } else {
      // Promote first underboss, or oldest remaining member
      const newLeaderId = syndicateData.underbossIds.find((id: string) => id !== uid)
        ?? remainingIds[0];
      batch.update(syndicateRef, {
        leaderId: newLeaderId,
        underbossIds: syndicateData.underbossIds.filter((id: string) => id !== uid && id !== newLeaderId),
      });
      batch.update(syndicateRef.collection('members').doc(newLeaderId), { role: 'leader' });
    }
  } else if (syndicateData.underbossIds.includes(uid)) {
    // Remove from underboss list
    batch.update(syndicateRef, {
      underbossIds: admin.firestore.FieldValue.arrayRemove(uid),
    });
  }

  await batch.commit();
  return { success: true };
});
