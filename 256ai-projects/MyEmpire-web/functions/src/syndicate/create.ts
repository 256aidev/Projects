import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Create a new syndicate. Caller becomes the Head of the Family.
 * Requires: name (3-30 chars), tag (2-5 chars), icon (emoji), color (hex)
 */
export const createSyndicate = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const uid = context.auth.uid;
  const { name, tag, icon, color } = data;

  // Validate inputs
  if (!name || typeof name !== 'string' || name.length < 3 || name.length > 30) {
    throw new functions.https.HttpsError('invalid-argument', 'Name must be 3-30 characters');
  }
  if (!tag || typeof tag !== 'string' || tag.length < 2 || tag.length > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Tag must be 2-5 characters');
  }

  // Check player isn't already in a syndicate (via leaderboard doc)
  const leaderboardRef = db.collection('leaderboard').doc(uid);
  const lbDoc = await leaderboardRef.get();
  if (lbDoc.exists && lbDoc.data()?.syndicateId) {
    throw new functions.https.HttpsError('already-exists', 'You are already in a syndicate');
  }

  // Get player display name from leaderboard
  const displayName = lbDoc.exists ? lbDoc.data()?.displayName ?? 'Unknown' : 'Unknown';
  const playerPower = lbDoc.exists ? lbDoc.data()?.score ?? 0 : 0;

  // Create syndicate document
  const syndicateRef = db.collection('syndicates').doc();
  const syndicateId = syndicateRef.id;

  const syndicateData = {
    name,
    tag: tag.toUpperCase(),
    icon: icon || '🏴',
    color: color || '#6366f1',
    leaderId: uid,
    underbossIds: [] as string[],
    memberIds: [uid],
    memberCount: 1,
    totalPower: playerPower,
    treasury: 0,
    level: 1,
    xp: 0,
    createdAt: Date.now(),
    currentWarId: null,
    warWins: 0,
    warLosses: 0,
  };

  // Create member subdocument
  const memberData = {
    uid,
    displayName,
    role: 'leader' as const,
    joinedAt: Date.now(),
    powerContribution: playerPower,
    warFightsToday: 0,
    warPointsTotal: 0,
  };

  const batch = db.batch();
  batch.set(syndicateRef, syndicateData);
  batch.set(syndicateRef.collection('members').doc(uid), memberData);

  // Update player's leaderboard entry with syndicateId (set+merge in case doc doesn't exist)
  batch.set(leaderboardRef, { syndicateId }, { merge: true });

  await batch.commit();

  return { syndicateId, name: syndicateData.name };
});
