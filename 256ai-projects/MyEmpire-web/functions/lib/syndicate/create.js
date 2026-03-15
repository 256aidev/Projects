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
exports.createSyndicate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Create a new syndicate. Caller becomes the Head of the Family.
 * Requires: name (3-30 chars), tag (2-5 chars), icon (emoji), color (hex)
 */
exports.createSyndicate = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d, _e;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
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
    if (lbDoc.exists && ((_a = lbDoc.data()) === null || _a === void 0 ? void 0 : _a.syndicateId)) {
        throw new functions.https.HttpsError('already-exists', 'You are already in a syndicate');
    }
    // Get player display name from leaderboard
    const displayName = lbDoc.exists ? (_c = (_b = lbDoc.data()) === null || _b === void 0 ? void 0 : _b.displayName) !== null && _c !== void 0 ? _c : 'Unknown' : 'Unknown';
    const playerPower = lbDoc.exists ? (_e = (_d = lbDoc.data()) === null || _d === void 0 ? void 0 : _d.score) !== null && _e !== void 0 ? _e : 0 : 0;
    // Create syndicate document
    const syndicateRef = db.collection('syndicates').doc();
    const syndicateId = syndicateRef.id;
    const syndicateData = {
        name,
        tag: tag.toUpperCase(),
        icon: icon || '🏴',
        color: color || '#6366f1',
        leaderId: uid,
        underbossIds: [],
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
        role: 'leader',
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
//# sourceMappingURL=create.js.map