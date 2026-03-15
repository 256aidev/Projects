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
exports.leaveSyndicate = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Leave current syndicate. If leader leaves, promotes first underboss or oldest member.
 * If last member, deletes the syndicate.
 */
exports.leaveSyndicate = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b, _c;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const uid = request.auth.uid;
    const { syndicateId } = request.data;
    if (!syndicateId)
        throw new https_1.HttpsError('invalid-argument', 'Missing syndicateId');
    const syndicateRef = db.collection('syndicates').doc(syndicateId);
    const syndicate = await syndicateRef.get();
    if (!syndicate.exists)
        throw new https_1.HttpsError('not-found', 'Syndicate not found');
    const syndicateData = syndicate.data();
    if (!syndicateData.memberIds.includes(uid)) {
        throw new https_1.HttpsError('permission-denied', 'You are not in this syndicate');
    }
    const memberRef = syndicateRef.collection('members').doc(uid);
    const memberDoc = await memberRef.get();
    const memberPower = memberDoc.exists ? (_b = (_a = memberDoc.data()) === null || _a === void 0 ? void 0 : _a.powerContribution) !== null && _b !== void 0 ? _b : 0 : 0;
    const batch = db.batch();
    // Remove member
    batch.delete(memberRef);
    batch.update(syndicateRef, {
        memberIds: admin.firestore.FieldValue.arrayRemove(uid),
        memberCount: admin.firestore.FieldValue.increment(-1),
        totalPower: admin.firestore.FieldValue.increment(-memberPower),
    });
    // Clear player's syndicateId
    try {
        batch.update(db.collection('leaderboard').doc(uid), { syndicateId: null });
    }
    catch (_d) { }
    // Handle leader succession
    if (syndicateData.leaderId === uid) {
        const remainingIds = syndicateData.memberIds.filter((id) => id !== uid);
        if (remainingIds.length === 0) {
            // Last member — delete syndicate
            batch.delete(syndicateRef);
        }
        else {
            // Promote first underboss, or oldest remaining member
            const newLeaderId = (_c = syndicateData.underbossIds.find((id) => id !== uid)) !== null && _c !== void 0 ? _c : remainingIds[0];
            batch.update(syndicateRef, {
                leaderId: newLeaderId,
                underbossIds: syndicateData.underbossIds.filter((id) => id !== uid && id !== newLeaderId),
            });
            batch.update(syndicateRef.collection('members').doc(newLeaderId), { role: 'leader' });
        }
    }
    else if (syndicateData.underbossIds.includes(uid)) {
        // Remove from underboss list
        batch.update(syndicateRef, {
            underbossIds: admin.firestore.FieldValue.arrayRemove(uid),
        });
    }
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=leave.js.map