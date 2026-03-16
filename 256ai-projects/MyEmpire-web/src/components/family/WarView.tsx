import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSyndicateStore } from '../../store/syndicateStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';

function useCountdown(endsAt: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()));
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(id);
  }, [endsAt]);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return { days, hours, minutes, remaining };
}

export default function WarView() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.uid ?? '';

  const {
    syndicate, members, currentWar, enemyMembers, warFights,
    startFight,
  } = useSyndicateStore();
  const addNotification = useUIStore((s) => s.addNotification);

  if (!currentWar || !syndicate) return null;

  const isTeamA = currentWar.syndicateA === syndicate.id;
  const ourName = isTeamA ? currentWar.syndicateAName : currentWar.syndicateBName;
  const enemyName = isTeamA ? currentWar.syndicateBName : currentWar.syndicateAName;
  const ourScore = isTeamA ? currentWar.totalPointsA : currentWar.totalPointsB;
  const enemyScore = isTeamA ? currentWar.totalPointsB : currentWar.totalPointsA;
  const totalScore = ourScore + enemyScore || 1; // avoid /0

  const startedAt = currentWar.startedAt;
  const dayNumber = Math.min(5, Math.ceil((Date.now() - startedAt) / 86_400_000)) || 1;

  const { days, hours, minutes } = useCountdown(currentWar.endsAt);

  const isActive = currentWar.status === 'active';

  // Current user's member data
  const myMember = members.find((m) => m.uid === uid);
  const myFightsToday = myMember?.warFightsToday ?? 0;
  const myWarPoints = myMember?.warPointsTotal ?? 0;
  const fightsRemaining = Math.max(0, 3 - myFightsToday);

  // Member standings sorted by war points
  const standings = [...members].sort((a, b) => b.warPointsTotal - a.warPointsTotal);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-red-900/60 to-orange-900/40 border border-red-500/30 rounded-2xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="text-white font-bold text-lg">War — Day {dayNumber} of 5</h2>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            isActive ? 'bg-red-700/60 text-red-200' : 'bg-gray-700/60 text-gray-300'
          }`}>
            {isActive ? 'Active' : 'Completed'}
          </span>
        </div>
        {isActive && (
          <p className="text-gray-400 text-xs">
            {days > 0 && `${days}d `}{hours}h {minutes}m remaining
          </p>
        )}
      </div>

      {/* ── Score Comparison ── */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center flex-1">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Our Syndicate</p>
            <p className="text-white font-bold text-xs">{syndicate.icon} {ourName}</p>
            <p className="text-green-400 font-black text-2xl mt-1">{ourScore.toLocaleString()}</p>
            <p className="text-gray-500 text-[9px]">{members.length} members</p>
          </div>
          <span className="text-gray-600 text-2xl font-black px-4">VS</span>
          <div className="text-center flex-1">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Enemy</p>
            <p className="text-white font-bold text-xs">{enemyName}</p>
            <p className="text-red-400 font-black text-2xl mt-1">{enemyScore.toLocaleString()}</p>
            <p className="text-gray-500 text-[9px]">{enemyMembers.length} members</p>
          </div>
        </div>
        {/* Score bar */}
        <div className="w-full h-3 rounded-full bg-gray-900 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700"
            style={{ width: `${(ourScore / totalScore) * 100}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700"
            style={{ width: `${(enemyScore / totalScore) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px]">
          <span className="text-green-400">{Math.round((ourScore / totalScore) * 100)}%</span>
          <span className="text-red-400">{Math.round((enemyScore / totalScore) * 100)}%</span>
        </div>
      </div>

      {/* ── Your Status ── */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
        <h3 className="text-white font-semibold text-sm mb-2">Your Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Fights today:</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`text-sm ${i < myFightsToday ? 'opacity-100' : 'opacity-30'}`}>
                  {i < myFightsToday ? '\u2694\uFE0F' : '\u2694\uFE0F'}
                </span>
              ))}
            </div>
            <span className="text-gray-500 text-[10px]">{myFightsToday}/3</span>
          </div>
          <div className="text-right">
            <span className="text-yellow-400 font-bold text-sm">{myWarPoints.toLocaleString()}</span>
            <span className="text-gray-500 text-[10px] ml-1">pts</span>
          </div>
        </div>
      </div>

      {/* ── Enemy Roster ── */}
      {enemyMembers.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <h3 className="text-white font-semibold text-sm mb-2">Enemy Roster</h3>
          <div className="space-y-1.5">
            {enemyMembers.map((enemy) => (
              <div key={enemy.uid} className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-2">
                <div>
                  <p className="text-white text-xs font-semibold">{enemy.displayName}</p>
                  <p className="text-gray-500 text-[9px]">
                    Power: {enemy.powerContribution.toLocaleString()} · War pts: {enemy.warPointsTotal.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const result = await startFight(enemy.uid);
                    if (result) {
                      sound.play(result.attackerWins ? 'casino_win' : 'casino_lose');
                      addNotification(
                        result.attackerWins
                          ? `You beat ${result.defenderName}! +${result.pointsAwarded} pts`
                          : `${result.defenderName} defeated you!`,
                        result.attackerWins ? 'success' : 'warning',
                      );
                    }
                  }}
                  disabled={!isActive || fightsRemaining <= 0}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                    !isActive || fightsRemaining <= 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-700 hover:bg-red-600 text-white'
                  }`}
                >
                  {fightsRemaining <= 0 ? 'No Fights' : 'Fight'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fight Log ── */}
      {warFights.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
          <h3 className="text-white font-semibold text-sm mb-2">Fight Log</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {warFights.map((fight) => {
              const isOurWin = (isTeamA && fight.winnerId === fight.attackerUid) ||
                (!isTeamA && fight.winnerId === fight.defenderUid);
              // Determine if this fight involved our syndicate winning
              const won = fight.winnerId === uid || isOurWin;
              return (
                <div
                  key={fight.id}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[10px] ${
                    won ? 'bg-green-900/20 border border-green-800/30' : 'bg-red-900/20 border border-red-800/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={`font-bold ${fight.winnerId === fight.attackerUid ? 'text-green-400' : 'text-red-400'}`}>
                      {fight.attackerName}
                    </span>
                    <span className="text-gray-600 text-[9px]">
                      ({fight.attackerPower.toLocaleString()})
                    </span>
                    <span className="text-gray-500">vs</span>
                    <span className={`font-bold ${fight.winnerId === fight.defenderUid ? 'text-green-400' : 'text-red-400'}`}>
                      {fight.defenderName}
                    </span>
                    <span className="text-gray-600 text-[9px]">
                      ({fight.defenderPower.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-yellow-400 font-bold">+{fight.pointsAwarded}</span>
                    <span className="text-gray-600 text-[8px]">
                      {new Date(fight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Member Standings ── */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
        <h3 className="text-white font-semibold text-sm mb-2">Member Standings</h3>
        <div className="space-y-1">
          {standings.map((member, idx) => (
            <div
              key={member.uid}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 ${
                member.uid === uid ? 'bg-indigo-900/30 border border-indigo-500/30' : 'bg-gray-900/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px] font-mono w-4 text-right">
                  {idx === 0 ? '\uD83E\uDD47' : idx === 1 ? '\uD83E\uDD48' : idx === 2 ? '\uD83E\uDD49' : `#${idx + 1}`}
                </span>
                <div>
                  <p className="text-white text-xs font-semibold">
                    {member.displayName}
                    {member.uid === uid && <span className="text-indigo-400 text-[9px] ml-1">(you)</span>}
                  </p>
                  <p className="text-gray-500 text-[9px]">
                    Power: {member.powerContribution.toLocaleString()} · Fights: {member.warFightsToday}/3
                  </p>
                </div>
              </div>
              <span className="text-yellow-400 font-bold text-sm">{member.warPointsTotal.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
