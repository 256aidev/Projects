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
exports.syncMemberPower = exports.endWar = exports.dailyWarReset = exports.weeklyMatchmaking = exports.startFight = exports.contributeTreasury = exports.promoteMember = exports.kickMember = exports.leaveSyndicate = exports.joinSyndicate = exports.createSyndicate = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Syndicate management
var create_1 = require("./syndicate/create");
Object.defineProperty(exports, "createSyndicate", { enumerable: true, get: function () { return create_1.createSyndicate; } });
var join_1 = require("./syndicate/join");
Object.defineProperty(exports, "joinSyndicate", { enumerable: true, get: function () { return join_1.joinSyndicate; } });
var leave_1 = require("./syndicate/leave");
Object.defineProperty(exports, "leaveSyndicate", { enumerable: true, get: function () { return leave_1.leaveSyndicate; } });
var kick_1 = require("./syndicate/kick");
Object.defineProperty(exports, "kickMember", { enumerable: true, get: function () { return kick_1.kickMember; } });
var promote_1 = require("./syndicate/promote");
Object.defineProperty(exports, "promoteMember", { enumerable: true, get: function () { return promote_1.promoteMember; } });
var treasury_1 = require("./syndicate/treasury");
Object.defineProperty(exports, "contributeTreasury", { enumerable: true, get: function () { return treasury_1.contributeTreasury; } });
// War system
var fight_1 = require("./war/fight");
Object.defineProperty(exports, "startFight", { enumerable: true, get: function () { return fight_1.startFight; } });
var matchmaking_1 = require("./war/matchmaking");
Object.defineProperty(exports, "weeklyMatchmaking", { enumerable: true, get: function () { return matchmaking_1.weeklyMatchmaking; } });
var dailyReset_1 = require("./war/dailyReset");
Object.defineProperty(exports, "dailyWarReset", { enumerable: true, get: function () { return dailyReset_1.dailyWarReset; } });
var endWar_1 = require("./war/endWar");
Object.defineProperty(exports, "endWar", { enumerable: true, get: function () { return endWar_1.endWar; } });
// Sync triggers
var memberPower_1 = require("./sync/memberPower");
Object.defineProperty(exports, "syncMemberPower", { enumerable: true, get: function () { return memberPower_1.syncMemberPower; } });
//# sourceMappingURL=index.js.map