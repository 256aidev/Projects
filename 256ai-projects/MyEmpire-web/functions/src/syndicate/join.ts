import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const MAX_MEMBERS = 20;

/**
 * Join an existing syndicate.
 * Requires: syndicateId
 */
export const joinSyndicate = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

  const uid = request.auth.uid;
  const { syndicateId } = request.data;

  if (!syndicateId) throw new HttpsError('invalid-argument', 'Missing syndicateId');

  // Check player isn't already in a syndicate
  const syndicatesWithMember = await db.collectionGroup('members')
    .where('uid', '==', uid).limit(1).get();
  if (!syndicatesWithMember.empty) {
    throw new HttpsError('already-exists', 'You are already in a syndicate');
  }

  const syndicateRef = db.collection('syndicates').doc(syndicateId);
  const syndicate = await syndicateRef.get();

  if (!syndicate.exists) {
    throw new HttpsError('not-found', 'Syndicate not found');
  }

  const syndicateData = syndicate.data()!;
  if (syndicateData.memberCount >= MAX_MEMBERS) {
    throw new HttpsError('resource-exhausted', 'Syndicate is full');
  }

  // Get player info
  const leaderboardDoc = await db.collection('leaderboard').doc(uid).get();
  const displayName = leaderboardDoc.exists ? leaderboardDoc.data()?.displayName ?? 'Unknown' : 'Unknown';
  const playerPower = leaderboardDoc.exists ? leaderboardDoc.data()?.score ?? 0 : 0;

  const memberData = {
    uid,
    displayName,
    role: 'member' as const,
    joinedAt: Date.now(),
    powerContribution: playerPower,
    warFightsToday: 0,
    warPointsTotal: 0,
  };

  const batch = db.batch();
  batch.set(syndicateRef.collection('members').doc(uid), memberData);
  batch.update(syndicateRef, {
    memberIds: admin.firestore.FieldValue.arrayUnion(uid),
    memberCount: admin.firestore.FieldValue.increment(1),
    totalPower: admin.firestore.FieldValue.increment(playerPower),
  });
  batch.update(db.collection('leaderboard').doc(uid), { syndicateId });

  await batch.commit();

  return { syndicateId, name: syndicateData.name };
});
