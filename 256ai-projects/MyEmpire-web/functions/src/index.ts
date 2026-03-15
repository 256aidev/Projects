import * as admin from 'firebase-admin';

admin.initializeApp();

// Syndicate management
export { createSyndicate } from './syndicate/create';
export { joinSyndicate } from './syndicate/join';
export { leaveSyndicate } from './syndicate/leave';
export { kickMember } from './syndicate/kick';
export { promoteMember } from './syndicate/promote';
export { contributeTreasury } from './syndicate/treasury';

// War system
export { startFight } from './war/fight';
export { weeklyMatchmaking } from './war/matchmaking';
export { dailyWarReset } from './war/dailyReset';
export { endWar } from './war/endWar';

// Sync triggers
export { syncMemberPower } from './sync/memberPower';
