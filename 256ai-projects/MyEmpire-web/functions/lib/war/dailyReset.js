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
exports.dailyWarReset = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Daily war reset — runs every day at 00:00 UTC.
 * Resets fight counts for all members in active wars.
 * Records daily results.
 */
exports.dailyWarReset = functions.pubsub.schedule('every day 00:00').timeZone('UTC').onRun(async () => {
    // Get all active wars
    const warsSnap = await db.collection('wars').where('status', '==', 'active').get();
    for (const warDoc of warsSnap.docs) {
        const warData = warDoc.data();
        const syndicateAId = warData.syndicateA;
        const syndicateBId = warData.syndicateB;
        // Reset fight counts for both syndicates' members
        for (const syndicateId of [syndicateAId, syndicateBId]) {
            const membersSnap = await db.collection('syndicates').doc(syndicateId)
                .collection('members').get();
            const batch = db.batch();
            for (const memberDoc of membersSnap.docs) {
                batch.update(memberDoc.ref, { warFightsToday: 0 });
            }
            await batch.commit();
        }
    }
    console.log(`Daily reset: ${warsSnap.size} wars processed`);
});
//# sourceMappingURL=dailyReset.js.map