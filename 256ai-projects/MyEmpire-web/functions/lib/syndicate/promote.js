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
exports.promoteMember = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Promote a member to underboss. Only the leader can promote.
 * Max 3 underbosses.
 */
exports.promoteMember = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const uid = context.auth.uid;
    const { syndicateId, targetUid } = data;
    if (!syndicateId || !targetUid)
        throw new functions.https.HttpsError('invalid-argument', 'Missing fields');
    const syndicateRef = db.collection('syndicates').doc(syndicateId);
    const syndicate = await syndicateRef.get();
    if (!syndicate.exists)
        throw new functions.https.HttpsError('not-found', 'Syndicate not found');
    const sd = syndicate.data();
    if (sd.leaderId !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only the leader can promote');
    }
    if (sd.underbossIds.includes(targetUid)) {
        throw new functions.https.HttpsError('already-exists', 'Already an underboss');
    }
    if (sd.underbossIds.length >= 3) {
        throw new functions.https.HttpsError('resource-exhausted', 'Maximum 3 underbosses');
    }
    const batch = db.batch();
    batch.update(syndicateRef, {
        underbossIds: admin.firestore.FieldValue.arrayUnion(targetUid),
    });
    batch.update(syndicateRef.collection('members').doc(targetUid), { role: 'underboss' });
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=promote.js.map