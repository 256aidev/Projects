import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Leader-only function to spend syndicate treasury on purchases.
 */
export const spendTreasury = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required');

  const { syndicateId, purchaseId } = data;
  if (!syndicateId || !purchaseId) throw new functions.https.HttpsError('invalid-argument', 'Missing fields');

  const synRef = db.collection('syndicates').doc(syndicateId);
  const synSnap = await synRef.get();
  if (!synSnap.exists) throw new functions.https.HttpsError('not-found', 'Syndicate not found');

  const syn = synSnap.data()!;
  if (syn.leaderId !== context.auth.uid) throw new functions.https.HttpsError('permission-denied', 'Only the leader can spend treasury');

  // Validate purchase
  const purchases: Record<string, { cost: number; field?: string; increment?: number }> = {
    war_shield: { cost: 100000 },
    member_slot: { cost: 50000, field: 'maxMembers', increment: 1 },
    xp_boost: { cost: 200000 },
  };

  const purchase = purchases[purchaseId];
  if (!purchase) throw new functions.https.HttpsError('invalid-argument', 'Invalid purchase');
  if (syn.treasury < purchase.cost) throw new functions.https.HttpsError('failed-precondition', 'Insufficient treasury funds');

  const updates: Record<string, unknown> = { treasury: admin.firestore.FieldValue.increment(-purchase.cost) };

  if (purchaseId === 'war_shield') {
    updates.warShieldActive = true;
  } else if (purchaseId === 'member_slot') {
    updates.maxMembers = (syn.maxMembers || 20) + 1;
  } else if (purchaseId === 'xp_boost') {
    updates.xpBoostActive = true;
  }

  await synRef.update(updates);
  return { success: true, purchaseId };
});
