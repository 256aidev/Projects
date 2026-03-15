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
exports.weeklyMatchmaking = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Weekly matchmaking — runs every Monday at 00:00 UTC.
 * Pairs syndicates by total power level for the weekly war.
 */
exports.weeklyMatchmaking = functions.pubsub
    .schedule('every monday 00:00')
    .timeZone('UTC')
    .onRun(async () => {
    // Get all syndicates with 2+ members, sorted by power
    const syndicatesSnap = await db.collection('syndicates')
        .where('memberCount', '>=', 2)
        .orderBy('memberCount')
        .orderBy('totalPower', 'desc')
        .get();
    const syndicates = syndicatesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
    // Filter out syndicates already in active wars
    const available = syndicates.filter((s) => !s.currentWarId);
    // Pair by similar power (greedy matching)
    const paired = [];
    const used = new Set();
    for (let i = 0; i < available.length; i++) {
        if (used.has(available[i].id))
            continue;
        // Find closest power match that isn't used
        let bestMatch = -1;
        let bestDiff = Infinity;
        for (let j = i + 1; j < available.length; j++) {
            if (used.has(available[j].id))
                continue;
            const diff = Math.abs(available[i].totalPower - available[j].totalPower);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestMatch = j;
            }
        }
        if (bestMatch >= 0) {
            paired.push([available[i], available[bestMatch]]);
            used.add(available[i].id);
            used.add(available[bestMatch].id);
        }
    }
    // Create wars for each pair
    const now = Date.now();
    const warDuration = 5 * 24 * 60 * 60 * 1000; // 5 days
    for (const [a, b] of paired) {
        const warRef = db.collection('wars').doc();
        const warData = {
            syndicateA: a.id,
            syndicateB: b.id,
            syndicateAName: a.name,
            syndicateBName: b.name,
            startedAt: now,
            endsAt: now + warDuration,
            status: 'active',
            dayResults: [],
            winnerId: null,
            totalPointsA: 0,
            totalPointsB: 0,
        };
        const batch = db.batch();
        batch.set(warRef, warData);
        batch.update(db.collection('syndicates').doc(a.id), { currentWarId: warRef.id });
        batch.update(db.collection('syndicates').doc(b.id), { currentWarId: warRef.id });
        await batch.commit();
    }
    console.log(`Matchmaking complete: ${paired.length} wars created`);
    return null;
});
//# sourceMappingURL=matchmaking.js.map