import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * When a player's leaderboard entry updates, sync their power to their syndicate.
 * This keeps syndicate totalPower accurate.
 */
export const syncMemberPower = functions.firestore.document('leaderboard/{uid}').onWrite(async (change, context) => {
  const uid = context.params.uid;
  const after = change.after.exists ? change.after.data() : null;
  const before = change.before.exists ? change.before.data() : null;

  if (!after) return; // deleted — handled by leave

  const syndicateId = after.syndicateId;
  if (!syndicateId) return; // not in a syndicate

  const newPower = after.score ?? 0;
  const oldPower = before?.score ?? 0;
  const powerDiff = newPower - oldPower;

  if (powerDiff === 0) return; // no change

  // Update member's power contribution
  const memberRef = db.collection('syndicates').doc(syndicateId).collection('members').doc(uid);
  const memberDoc = await memberRef.get();
  if (!memberDoc.exists) return;

  const batch = db.batch();
  batch.update(memberRef, {
    powerContribution: newPower,
    displayName: after.displayName ?? 'Unknown',
  });
  batch.update(db.collection('syndicates').doc(syndicateId), {
    totalPower: admin.firestore.FieldValue.increment(powerDiff),
  });

  await batch.commit();
});
