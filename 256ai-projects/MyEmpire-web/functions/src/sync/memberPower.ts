import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * When a player's leaderboard entry updates, sync their power to their syndicate.
 * This keeps syndicate totalPower accurate.
 */
export const syncMemberPower = onDocumentWritten('leaderboard/{uid}', async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  const before = event.data?.before?.exists ? event.data.before.data() : null;

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
