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
exports.startFight = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const MAX_FIGHTS_PER_DAY = 3;
/**
 * Initiate a war fight against an opponent from the enemy syndicate.
 * Server-side resolution — reads both players' power from leaderboard.
 */
exports.startFight = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    const uid = request.auth.uid;
    const { warId, defenderUid } = request.data;
    if (!warId || !defenderUid)
        throw new https_1.HttpsError('invalid-argument', 'Missing fields');
    if (uid === defenderUid)
        throw new https_1.HttpsError('invalid-argument', 'Cannot fight yourself');
    // Get war
    const warRef = db.collection('wars').doc(warId);
    const war = await warRef.get();
    if (!war.exists)
        throw new https_1.HttpsError('not-found', 'War not found');
    const warData = war.data();
    if (warData.status !== 'active') {
        throw new https_1.HttpsError('failed-precondition', 'War is not active');
    }
    // Determine which syndicate the attacker is in
    const attackerSyndicate = warData.syndicateA === request.data.syndicateId ? warData.syndicateA
        : warData.syndicateB === request.data.syndicateId ? warData.syndicateB : null;
    const defenderSyndicate = attackerSyndicate === warData.syndicateA ? warData.syndicateB : warData.syndicateA;
    if (!attackerSyndicate) {
        throw new https_1.HttpsError('permission-denied', 'Your syndicate is not in this war');
    }
    // Check fight limit
    const attackerMemberRef = db.collection('syndicates').doc(attackerSyndicate).collection('members').doc(uid);
    const attackerMember = await attackerMemberRef.get();
    if (!attackerMember.exists)
        throw new https_1.HttpsError('not-found', 'You are not in this syndicate');
    const fightsToday = (_b = (_a = attackerMember.data()) === null || _a === void 0 ? void 0 : _a.warFightsToday) !== null && _b !== void 0 ? _b : 0;
    if (fightsToday >= MAX_FIGHTS_PER_DAY) {
        throw new https_1.HttpsError('resource-exhausted', `Max ${MAX_FIGHTS_PER_DAY} fights per day`);
    }
    // Check defender is in enemy syndicate
    const defenderMemberRef = db.collection('syndicates').doc(defenderSyndicate).collection('members').doc(defenderUid);
    const defenderMember = await defenderMemberRef.get();
    if (!defenderMember.exists) {
        throw new https_1.HttpsError('not-found', 'Defender not found in enemy syndicate');
    }
    // Get both players' power from leaderboard
    const [attackerLB, defenderLB] = await Promise.all([
        db.collection('leaderboard').doc(uid).get(),
        db.collection('leaderboard').doc(defenderUid).get(),
    ]);
    const attackerPower = attackerLB.exists ? (_d = (_c = attackerLB.data()) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : 100 : 100;
    const defenderPower = defenderLB.exists ? (_f = (_e = defenderLB.data()) === null || _e === void 0 ? void 0 : _e.score) !== null && _f !== void 0 ? _f : 100 : 100;
    // Resolve fight — weighted random based on power ratio
    const totalPower = attackerPower + defenderPower;
    const attackerChance = totalPower > 0 ? attackerPower / totalPower : 0.5;
    const roll = Math.random();
    const attackerWins = roll < attackerChance;
    const winnerId = attackerWins ? uid : defenderUid;
    const winnerSyndicate = attackerWins ? attackerSyndicate : defenderSyndicate;
    // Points awarded — base 100, bonus for upset wins
    const pointsBase = 100;
    const upsetBonus = attackerWins && attackerPower < defenderPower ? 50 : 0;
    const pointsAwarded = pointsBase + upsetBonus;
    // Calculate current war day (0-indexed from start)
    const daysSinceStart = Math.floor((Date.now() - warData.startedAt) / (24 * 60 * 60 * 1000));
    // Store fight result
    const fightRef = warRef.collection('fights').doc();
    const fightData = {
        attackerUid: uid,
        defenderUid,
        attackerSyndicate,
        defenderSyndicate,
        attackerPower,
        defenderPower,
        winnerId,
        winnerSyndicate,
        pointsAwarded,
        day: daysSinceStart,
        timestamp: Date.now(),
    };
    const batch = db.batch();
    batch.set(fightRef, fightData);
    // Update attacker's fight count
    batch.update(attackerMemberRef, {
        warFightsToday: admin.firestore.FieldValue.increment(1),
        warPointsTotal: attackerWins ? admin.firestore.FieldValue.increment(pointsAwarded) : admin.firestore.FieldValue.increment(0),
    });
    // Update war totals
    if (winnerSyndicate === warData.syndicateA) {
        batch.update(warRef, { totalPointsA: admin.firestore.FieldValue.increment(pointsAwarded) });
    }
    else {
        batch.update(warRef, { totalPointsB: admin.firestore.FieldValue.increment(pointsAwarded) });
    }
    await batch.commit();
    return {
        success: true,
        attackerWins,
        attackerPower,
        defenderPower,
        pointsAwarded,
        winnerId,
        attackerName: (_h = (_g = attackerLB.data()) === null || _g === void 0 ? void 0 : _g.displayName) !== null && _h !== void 0 ? _h : 'You',
        defenderName: (_k = (_j = defenderLB.data()) === null || _j === void 0 ? void 0 : _j.displayName) !== null && _k !== void 0 ? _k : 'Opponent',
    };
});
//# sourceMappingURL=fight.js.map