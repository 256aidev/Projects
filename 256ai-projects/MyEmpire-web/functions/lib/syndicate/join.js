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
exports.joinSyndicate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const MAX_MEMBERS = 20;
/**
 * Join an existing syndicate.
 * Requires: syndicateId
 */
exports.joinSyndicate = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const uid = context.auth.uid;
    const { syndicateId } = data;
    if (!syndicateId)
        throw new functions.https.HttpsError('invalid-argument', 'Missing syndicateId');
    // Check player isn't already in a syndicate
    const syndicatesWithMember = await db.collectionGroup('members')
        .where('uid', '==', uid).limit(1).get();
    if (!syndicatesWithMember.empty) {
        throw new functions.https.HttpsError('already-exists', 'You are already in a syndicate');
    }
    const syndicateRef = db.collection('syndicates').doc(syndicateId);
    const syndicate = await syndicateRef.get();
    if (!syndicate.exists) {
        throw new functions.https.HttpsError('not-found', 'Syndicate not found');
    }
    const syndicateData = syndicate.data();
    if (syndicateData.memberCount >= MAX_MEMBERS) {
        throw new functions.https.HttpsError('resource-exhausted', 'Syndicate is full');
    }
    // Get player info
    const leaderboardDoc = await db.collection('leaderboard').doc(uid).get();
    const displayName = leaderboardDoc.exists ? (_b = (_a = leaderboardDoc.data()) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : 'Unknown' : 'Unknown';
    const playerPower = leaderboardDoc.exists ? (_d = (_c = leaderboardDoc.data()) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : 0 : 0;
    const memberData = {
        uid,
        displayName,
        role: 'member',
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
//# sourceMappingURL=join.js.map