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
exports.endWar = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// War bonuses
const WINNER_TREASURY_BONUS = 50000; // clean cash added to winner's treasury
const LOSER_TREASURY_BONUS = 10000; // consolation prize
const WINNER_XP = 100;
const LOSER_XP = 25;
/**
 * End war — runs every Saturday at 00:00 UTC.
 * Tallies final scores, distributes bonuses, clears war state.
 */
exports.endWar = functions.pubsub
    .schedule('every saturday 00:00')
    .timeZone('UTC')
    .onRun(async () => {
    const warsSnap = await db.collection('wars').where('status', '==', 'active').get();
    for (const warDoc of warsSnap.docs) {
        const warData = warDoc.data();
        const { syndicateA, syndicateB, totalPointsA, totalPointsB } = warData;
        const aWins = totalPointsA > totalPointsB;
        const tie = totalPointsA === totalPointsB;
        const winnerId = tie ? null : (aWins ? syndicateA : syndicateB);
        const loserId = tie ? null : (aWins ? syndicateB : syndicateA);
        const batch = db.batch();
        // Mark war complete
        batch.update(warDoc.ref, {
            status: 'completed',
            winnerId,
        });
        // Distribute bonuses
        if (winnerId && loserId) {
            batch.update(db.collection('syndicates').doc(winnerId), {
                currentWarId: null,
                warWins: admin.firestore.FieldValue.increment(1),
                treasury: admin.firestore.FieldValue.increment(WINNER_TREASURY_BONUS),
                xp: admin.firestore.FieldValue.increment(WINNER_XP),
            });
            batch.update(db.collection('syndicates').doc(loserId), {
                currentWarId: null,
                warLosses: admin.firestore.FieldValue.increment(1),
                treasury: admin.firestore.FieldValue.increment(LOSER_TREASURY_BONUS),
                xp: admin.firestore.FieldValue.increment(LOSER_XP),
            });
        }
        else {
            // Tie — both get consolation
            for (const sid of [syndicateA, syndicateB]) {
                batch.update(db.collection('syndicates').doc(sid), {
                    currentWarId: null,
                    treasury: admin.firestore.FieldValue.increment(LOSER_TREASURY_BONUS),
                    xp: admin.firestore.FieldValue.increment(LOSER_XP),
                });
            }
        }
        // Reset member war stats for both syndicates
        for (const sid of [syndicateA, syndicateB]) {
            const membersSnap = await db.collection('syndicates').doc(sid).collection('members').get();
            for (const memberDoc of membersSnap.docs) {
                batch.update(memberDoc.ref, { warFightsToday: 0, warPointsTotal: 0 });
            }
        }
        await batch.commit();
    }
    console.log(`Wars ended: ${warsSnap.size} wars resolved`);
    return null;
});
//# sourceMappingURL=endWar.js.map