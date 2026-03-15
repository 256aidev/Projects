import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const MAX_FIGHTS_PER_DAY = 3;

/**
 * Initiate a war fight against an opponent from the enemy syndicate.
 * Server-side resolution — reads both players' power from leaderboard.
 */
export const startFight = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const uid = context.auth.uid;
  const { warId, defenderUid } = data;

  if (!warId || !defenderUid) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
  if (uid === defenderUid) throw new functions.https.HttpsError('invalid-argument', 'Cannot fight yourself');

  // Get war
  const warRef = db.collection('wars').doc(warId);
  const war = await warRef.get();
  if (!war.exists) throw new functions.https.HttpsError('not-found', 'War not found');
  const warData = war.data()!;

  if (warData.status !== 'active') {
    throw new functions.https.HttpsError('failed-precondition', 'War is not active');
  }

  // Determine which syndicate the attacker is in
  const attackerSyndicate = warData.syndicateA === data.syndicateId ? warData.syndicateA
    : warData.syndicateB === data.syndicateId ? warData.syndicateB : null;
  const defenderSyndicate = attackerSyndicate === warData.syndicateA ? warData.syndicateB : warData.syndicateA;

  if (!attackerSyndicate) {
    throw new functions.https.HttpsError('permission-denied', 'Your syndicate is not in this war');
  }

  // Check fight limit
  const attackerMemberRef = db.collection('syndicates').doc(attackerSyndicate).collection('members').doc(uid);
  const attackerMember = await attackerMemberRef.get();
  if (!attackerMember.exists) throw new functions.https.HttpsError('not-found', 'You are not in this syndicate');

  const fightsToday = attackerMember.data()?.warFightsToday ?? 0;
  if (fightsToday >= MAX_FIGHTS_PER_DAY) {
    throw new functions.https.HttpsError('resource-exhausted', `Max ${MAX_FIGHTS_PER_DAY} fights per day`);
  }

  // Check defender is in enemy syndicate
  const defenderMemberRef = db.collection('syndicates').doc(defenderSyndicate).collection('members').doc(defenderUid);
  const defenderMember = await defenderMemberRef.get();
  if (!defenderMember.exists) {
    throw new functions.https.HttpsError('not-found', 'Defender not found in enemy syndicate');
  }

  // Get both players' power from leaderboard
  const [attackerLB, defenderLB] = await Promise.all([
    db.collection('leaderboard').doc(uid).get(),
    db.collection('leaderboard').doc(defenderUid).get(),
  ]);

  const attackerPower = attackerLB.exists ? attackerLB.data()?.score ?? 100 : 100;
  const defenderPower = defenderLB.exists ? defenderLB.data()?.score ?? 100 : 100;

  // Resolve fight — weighted random based on power ratio
  const totalPower = attackerPower + defenderPower;
  const attackerChance = totalPower > 0 ? attackerPower / totalPower : 0.5;
  const roll = Math.random();
  const attackerWins = roll < attackerChance;
  const winnerId = attackerWins ? uid : defenderUid;
  const winnerSyndicate = attackerWins ? attackerSyndicate : defenderSyndicate;

  // Points awarded — base 100, bonus for upset wins
  const pointsBase = 100;
  const upsetBonus = attackerWins && attackerPower < defenderPower ? 50 : 0;
  const pointsAwarded = pointsBase + upsetBonus;

  // Calculate current war day (0-indexed from start)
  const daysSinceStart = Math.floor((Date.now() - warData.startedAt) / (24 * 60 * 60 * 1000));

  // Store fight result
  const fightRef = warRef.collection('fights').doc();
  const fightData = {
    attackerUid: uid,
    defenderUid,
    attackerSyndicate,
    defenderSyndicate,
    attackerPower,
    defenderPower,
    winnerId,
    winnerSyndicate,
    pointsAwarded,
    day: daysSinceStart,
    timestamp: Date.now(),
  };

  const batch = db.batch();
  batch.set(fightRef, fightData);

  // Update attacker's fight count
  batch.update(attackerMemberRef, {
    warFightsToday: admin.firestore.FieldValue.increment(1),
    warPointsTotal: attackerWins ? admin.firestore.FieldValue.increment(pointsAwarded) : admin.firestore.FieldValue.increment(0),
  });

  // Update war totals
  if (winnerSyndicate === warData.syndicateA) {
    batch.update(warRef, { totalPointsA: admin.firestore.FieldValue.increment(pointsAwarded) });
  } else {
    batch.update(warRef, { totalPointsB: admin.firestore.FieldValue.increment(pointsAwarded) });
  }

  await batch.commit();

  return {
    success: true,
    attackerWins,
    attackerPower,
    defenderPower,
    pointsAwarded,
    winnerId,
    attackerName: attackerLB.data()?.displayName ?? 'You',
    defenderName: defenderLB.data()?.displayName ?? 'Opponent',
  };
});
