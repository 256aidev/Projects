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
exports.declineInvite = exports.acceptInvite = exports.sendInvite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Send invite — leader/underboss sends invite to a player by UID
exports.sendInvite = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    const { syndicateId, targetUid } = data;
    if (!syndicateId || !targetUid)
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
    const synSnap = await db.collection('syndicates').doc(syndicateId).get();
    if (!synSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Syndicate not found');
    const syn = synSnap.data();
    // Only leader or underboss can invite
    const uid = context.auth.uid;
    if (uid !== syn.leaderId && !(syn.underbossIds || []).includes(uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Only leaders and underbosses can invite');
    }
    // Check target isn't already in a syndicate
    const targetLeaderboard = await db.collection('leaderboard').doc(targetUid).get();
    if (targetLeaderboard.exists && ((_a = targetLeaderboard.data()) === null || _a === void 0 ? void 0 : _a.syndicateId)) {
        throw new functions.https.HttpsError('failed-precondition', 'Player is already in a syndicate');
    }
    // Check no duplicate pending invite
    const existing = await db.collection('syndicate_invites')
        .where('syndicateId', '==', syndicateId)
        .where('invitedUid', '==', targetUid)
        .where('status', '==', 'pending')
        .get();
    if (!existing.empty)
        throw new functions.https.HttpsError('already-exists', 'Invite already pending');
    // Check syndicate not full
    const maxMembers = syn.maxMembers || 20;
    if (syn.memberCount >= maxMembers)
        throw new functions.https.HttpsError('failed-precondition', 'Syndicate is full');
    const inviteRef = await db.collection('syndicate_invites').add({
        syndicateId,
        syndicateName: syn.name,
        syndicateIcon: syn.icon,
        invitedUid: targetUid,
        invitedBy: uid,
        status: 'pending',
        createdAt: Date.now(),
    });
    return { inviteId: inviteRef.id };
});
// Accept invite
exports.acceptInvite = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    const { inviteId } = data;
    if (!inviteId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing inviteId');
    const inviteRef = db.collection('syndicate_invites').doc(inviteId);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Invite not found');
    const invite = inviteSnap.data();
    if (invite.invitedUid !== context.auth.uid)
        throw new functions.https.HttpsError('permission-denied', 'Not your invite');
    if (invite.status !== 'pending')
        throw new functions.https.HttpsError('failed-precondition', 'Invite no longer pending');
    // Check syndicate still exists and has room
    const synRef = db.collection('syndicates').doc(invite.syndicateId);
    const synSnap = await synRef.get();
    if (!synSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Syndicate no longer exists');
    const syn = synSnap.data();
    const maxMembers = syn.maxMembers || 20;
    if (syn.memberCount >= maxMembers)
        throw new functions.https.HttpsError('failed-precondition', 'Syndicate is full');
    // Get player display name from leaderboard
    const lbSnap = await db.collection('leaderboard').doc(context.auth.uid).get();
    const displayName = lbSnap.exists ? (((_a = lbSnap.data()) === null || _a === void 0 ? void 0 : _a.displayName) || 'Unknown') : 'Unknown';
    const power = lbSnap.exists ? (((_b = lbSnap.data()) === null || _b === void 0 ? void 0 : _b.score) || 0) : 0;
    const batch = db.batch();
    // Update invite status
    batch.update(inviteRef, { status: 'accepted' });
    // Add member to syndicate
    batch.set(synRef.collection('members').doc(context.auth.uid), {
        displayName,
        role: 'member',
        joinedAt: Date.now(),
        powerContribution: power,
        warFightsToday: 0,
        warPointsTotal: 0,
    });
    // Update syndicate counts
    batch.update(synRef, {
        memberIds: admin.firestore.FieldValue.arrayUnion(context.auth.uid),
        memberCount: admin.firestore.FieldValue.increment(1),
        totalPower: admin.firestore.FieldValue.increment(power),
    });
    // Update leaderboard
    batch.set(db.collection('leaderboard').doc(context.auth.uid), { syndicateId: invite.syndicateId }, { merge: true });
    // Decline all other pending invites for this player
    const otherInvites = await db.collection('syndicate_invites')
        .where('invitedUid', '==', context.auth.uid)
        .where('status', '==', 'pending')
        .get();
    otherInvites.docs.forEach(doc => {
        if (doc.id !== inviteId)
            batch.update(doc.ref, { status: 'declined' });
    });
    await batch.commit();
    return { syndicateId: invite.syndicateId };
});
// Decline invite
exports.declineInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    const { inviteId } = data;
    if (!inviteId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing inviteId');
    const inviteRef = db.collection('syndicate_invites').doc(inviteId);
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Invite not found');
    const invite = inviteSnap.data();
    if (invite.invitedUid !== context.auth.uid)
        throw new functions.https.HttpsError('permission-denied', 'Not your invite');
    await inviteRef.update({ status: 'declined' });
    return { success: true };
});
//# sourceMappingURL=invite.js.map