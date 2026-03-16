"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.spendTreasury = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Leader-only function to spend syndicate treasury on purchases.
 */
exports.spendTreasury = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    const { syndicateId, purchaseId } = data;
    if (!syndicateId || !purchaseId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
    const synRef = db.collection('syndicates').doc(syndicateId);
    const synSnap = await synRef.get();
    if (!synSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Syndicate not found');
    const syn = synSnap.data();
    if (syn.leaderId !== context.auth.uid)
        throw new functions.https.HttpsError('permission-denied', 'Only the leader can spend treasury');
    // Validate purchase
    const purchases = {
        war_shield: { cost: 100000 },
        member_slot: { cost: 50000, field: 'maxMembers', increment: 1 },
        xp_boost: { cost: 200000 },
    };
    const purchase = purchases[purchaseId];
    if (!purchase)
        throw new functions.https.HttpsError('invalid-argument', 'Invalid purchase');
    if (syn.treasury < purchase.cost)
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient treasury funds');
    const updates = { treasury: admin.firestore.FieldValue.increment(-purchase.cost) };
    if (purchaseId === 'war_shield') {
        updates.warShieldActive = true;
    }
    else if (purchaseId === 'member_slot') {
        updates.maxMembers = (syn.maxMembers || 20) + 1;
    }
    else if (purchaseId === 'xp_boost') {
        updates.xpBoostActive = true;
    }
    await synRef.update(updates);
    return { success: true, purchaseId };
});
//# sourceMappingURL=spend.js.map