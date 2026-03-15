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
exports.contributeTreasury = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Contribute clean cash to syndicate treasury.
 * Deducts from player's leaderboard cleanCash field (informational — actual deduction happens client-side).
 */
exports.contributeTreasury = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const uid = context.auth.uid;
    const { syndicateId, amount } = data;
    if (!syndicateId || !amount || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid contribution amount');
    }
    const syndicateRef = db.collection('syndicates').doc(syndicateId);
    const syndicate = await syndicateRef.get();
    if (!syndicate.exists)
        throw new functions.https.HttpsError('not-found', 'Syndicate not found');
    const sd = syndicate.data();
    if (!sd.memberIds.includes(uid)) {
        throw new functions.https.HttpsError('permission-denied', 'You are not in this syndicate');
    }
    await syndicateRef.update({
        treasury: admin.firestore.FieldValue.increment(amount),
    });
    return { success: true, newTreasury: ((_a = sd.treasury) !== null && _a !== void 0 ? _a : 0) + amount };
});
//# sourceMappingURL=treasury.js.map