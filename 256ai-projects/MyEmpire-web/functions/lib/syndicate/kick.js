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
exports.kickMember = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Kick a member from the syndicate. Only leader or underboss can kick.
 * Cannot kick the leader. Underbosses can only kick regular members.
 */
exports.kickMember = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const uid = request.auth.uid;
    const { syndicateId, targetUid } = request.data;
    if (!syndicateId || !targetUid)
        throw new https_1.HttpsError('invalid-argument', 'Missing fields');
    if (uid === targetUid)
        throw new https_1.HttpsError('invalid-argument', 'Cannot kick yourself');
    const syndicateRef = db.collection('syndicates').doc(syndicateId);
    const syndicate = await syndicateRef.get();
    if (!syndicate.exists)
        throw new https_1.HttpsError('not-found', 'Syndicate not found');
    const sd = syndicate.data();
    const isLeader = sd.leaderId === uid;
    const isUnderboss = sd.underbossIds.includes(uid);
    if (!isLeader && !isUnderboss) {
        throw new https_1.HttpsError('permission-denied', 'Only leaders and underbosses can kick');
    }
    if (sd.leaderId === targetUid) {
        throw new https_1.HttpsError('permission-denied', 'Cannot kick the leader');
    }
    if (isUnderboss && sd.underbossIds.includes(targetUid)) {
        throw new https_1.HttpsError('permission-denied', 'Underbosses cannot kick other underbosses');
    }
    const memberRef = syndicateRef.collection('members').doc(targetUid);
    const memberDoc = await memberRef.get();
    const memberPower = memberDoc.exists ? (_b = (_a = memberDoc.data()) === null || _a === void 0 ? void 0 : _a.powerContribution) !== null && _b !== void 0 ? _b : 0 : 0;
    const batch = db.batch();
    batch.delete(memberRef);
    batch.update(syndicateRef, {
        memberIds: admin.firestore.FieldValue.arrayRemove(targetUid),
        underbossIds: admin.firestore.FieldValue.arrayRemove(targetUid),
        memberCount: admin.firestore.FieldValue.increment(-1),
        totalPower: admin.firestore.FieldValue.increment(-memberPower),
    });
    try {
        batch.update(db.collection('leaderboard').doc(targetUid), { syndicateId: null });
    }
    catch (_c) { }
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=kick.js.map