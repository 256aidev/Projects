import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSyndicateStore } from '../../store/syndicateStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { formatMoney } from '../../engine/economy';
import { sound } from '../../engine/sound';
import Tooltip from '../ui/Tooltip';

export default function FamilyView() {
  const user = useAuthStore((s) => s.user);
  const isGuest = !user || (user as { uid: string }).uid === 'guest';

  const {
    syndicate, members, currentWar, enemyMembers,
    searchResults, loading, error,
    createSyndicate, joinSyndicate, leaveSyndicate,
    kickMember, promoteMember, contributeTreasury,
    startFight, searchSyndicates, subscribe, clearError,
  } = useSyndicateStore();

  const cleanCash = useGameStore((s) => s.cleanCash);
  const addNotification = useUIStore((s) => s.addNotification);

  const [view, setView] = useState<'main' | 'create' | 'search' | 'war'>('main');
  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createIcon, setCreateIcon] = useState('🏴');
  const [contributeAmount, setContributeAmount] = useState('');

  const uid = user?.uid;
  const isLeader = syndicate?.leaderId === uid;
  const isUnderboss = syndicate?.underbossIds?.includes(uid ?? '') ?? false;
  const canManage = isLeader || isUnderboss;

  // Auto-load syndicate if player has one
  useEffect(() => {
    // Check leaderboard for syndicateId
    if (!uid || isGuest) return;
    // We'd need to check if player already has a syndicateId
    // For now, syndicate loads when player subscribes
  }, [uid, isGuest]);

  // ── Guest state ──
  if (isGuest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <span className="text-5xl mb-4">🔒</span>
        <h2 className="text-white font-bold text-xl mb-2">Sign In Required</h2>
        <p className="text-gray-400 text-sm text-center">Sign in with Google or Apple to join or create a syndicate.</p>
      </div>
    );
  }

  // ── No syndicate — show create/join ──
  if (!syndicate) {
    if (view === 'create') {
      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <button onClick={() => setView('main')} className="text-gray-400 text-sm hover:text-white">← Back</button>
          <div className="text-center py-4">
            <span className="text-4xl">🏴</span>
            <h2 className="text-white font-bold text-xl mt-2">Create Syndicate</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-xs">Syndicate Name</label>
              <input value={createName} onChange={e => setCreateName(e.target.value)} maxLength={30} placeholder="The Cobras"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs">Tag (2-5 chars)</label>
              <input value={createTag} onChange={e => setCreateTag(e.target.value.toUpperCase())} maxLength={5} placeholder="COB"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs">Icon</label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {['🏴', '🐍', '🦅', '💀', '🐺', '🔥', '⚡', '🗡️', '👑', '🦈', '🎯', '💎'].map(icon => (
                  <button key={icon} onClick={() => setCreateIcon(icon)}
                    className={`text-2xl p-1.5 rounded-lg border transition ${createIcon === icon ? 'border-indigo-500 bg-indigo-900/30' : 'border-gray-700 hover:border-gray-500'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              onClick={async () => {
                const id = await createSyndicate(createName, createTag, createIcon, '#6366f1');
                if (id) { sound.play('upgrade'); addNotification('Syndicate created!', 'success'); }
              }}
              disabled={loading || createName.length < 3 || createTag.length < 2}
              className={`w-full py-3 rounded-xl text-sm font-bold transition ${
                loading ? 'bg-gray-700 text-gray-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {loading ? 'Creating...' : 'Create Syndicate'}
            </button>
          </div>
        </div>
      );
    }

    if (view === 'search') {
      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <button onClick={() => setView('main')} className="text-gray-400 text-sm hover:text-white">← Back</button>
          <h2 className="text-white font-bold text-lg">Find a Syndicate</h2>

          <button onClick={() => searchSyndicates()} className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold">
            Search All Syndicates
          </button>

          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map(s => (
                <div key={s.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-white font-bold text-sm">{s.name}</span>
                      <span className="text-gray-500 text-[10px]">[{s.tag}]</span>
                    </div>
                    <p className="text-gray-400 text-[10px]">{s.memberCount}/20 members · Power: {s.totalPower.toLocaleString()} · W{s.warWins}/L{s.warLosses}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (await joinSyndicate(s.id)) { sound.play('upgrade'); addNotification(`Joined ${s.name}!`, 'success'); }
                    }}
                    disabled={loading || s.memberCount >= 20}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center">No syndicates found. Be the first to create one!</p>
          )}
        </div>
      );
    }

    // Default: create or join prompt
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <span className="text-5xl">🤝</span>
        <div className="text-center">
          <h2 className="text-white font-bold text-xl">Syndicates</h2>
          <p className="text-gray-400 text-sm mt-1">Join forces with other players. Wage war as a team.</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button onClick={() => setView('create')}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition">
            Create a Syndicate
          </button>
          <button onClick={() => { setView('search'); searchSyndicates(); }}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition">
            Find & Join a Syndicate
          </button>
        </div>
      </div>
    );
  }

  // ── Has syndicate — show management ──
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Syndicate Header */}
      <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-4 text-center">
        <span className="text-3xl">{syndicate.icon}</span>
        <h2 className="text-white font-bold text-xl mt-1">{syndicate.name}</h2>
        <p className="text-indigo-300 text-xs">[{syndicate.tag}] · Level {syndicate.level}</p>
        <div className="flex justify-center gap-4 mt-2 text-[10px]">
          <span className="text-gray-400">{syndicate.memberCount}/20 members</span>
          <span className="text-yellow-400">Treasury: {formatMoney(syndicate.treasury)}</span>
          <span className="text-green-400">W{syndicate.warWins} / L{syndicate.warLosses}</span>
        </div>
      </div>

      {/* War Status */}
      {currentWar && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-400 font-bold text-sm">⚔️ AT WAR</h3>
            <span className="text-gray-400 text-[10px]">Ends: {new Date(currentWar.endsAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-white font-bold text-lg">{currentWar.totalPointsA}</p>
              <p className="text-gray-400 text-[10px]">{currentWar.syndicateAName}</p>
            </div>
            <span className="text-gray-600 text-xl font-bold px-3">vs</span>
            <div className="text-center flex-1">
              <p className="text-white font-bold text-lg">{currentWar.totalPointsB}</p>
              <p className="text-gray-400 text-[10px]">{currentWar.syndicateBName}</p>
            </div>
          </div>

          {/* Enemy members to fight */}
          {enemyMembers.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">Fight Opponents (3/day)</p>
              {enemyMembers.map(enemy => (
                <div key={enemy.uid} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-2 py-1.5">
                  <span className="text-white text-xs">{enemy.displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-[10px]">Power: {enemy.powerContribution.toLocaleString()}</span>
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
                      className="px-2 py-1 rounded text-[9px] font-bold bg-red-700 hover:bg-red-600 text-white"
                    >
                      Fight
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Treasury Contribution */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
        <h3 className="text-white font-semibold text-sm mb-2">💰 Treasury</h3>
        <p className="text-yellow-400 font-bold text-lg">{formatMoney(syndicate.treasury)}</p>
        <div className="flex gap-2 mt-2">
          <input value={contributeAmount} onChange={e => setContributeAmount(e.target.value)}
            type="number" min="0" placeholder="Amount"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500" />
          <button
            onClick={async () => {
              const amt = Math.floor(Number(contributeAmount));
              if (amt > 0 && amt <= cleanCash) {
                if (await contributeTreasury(amt)) {
                  // Deduct from player's clean cash
                  useGameStore.getState().set?.({ cleanCash: cleanCash - amt } as any);
                  addNotification(`Contributed ${formatMoney(amt)} to treasury`, 'success');
                  setContributeAmount('');
                }
              }
            }}
            className="px-4 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold"
          >
            Contribute
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
        <h3 className="text-white font-semibold text-sm mb-2">👥 Members ({members.length})</h3>
        <div className="space-y-1.5">
          {members.sort((a, b) => {
            const order = { leader: 0, underboss: 1, member: 2 };
            return order[a.role] - order[b.role];
          }).map(member => (
            <div key={member.uid} className="flex items-center justify-between bg-gray-900/60 rounded-lg px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {member.role === 'leader' ? '👑' : member.role === 'underboss' ? '⭐' : '👤'}
                </span>
                <div>
                  <p className="text-white text-xs font-semibold">{member.displayName}</p>
                  <p className="text-gray-500 text-[9px]">{member.role} · Power: {member.powerContribution.toLocaleString()}</p>
                </div>
              </div>
              {canManage && member.uid !== uid && member.role !== 'leader' && (
                <div className="flex gap-1">
                  {isLeader && member.role === 'member' && (
                    <button onClick={() => promoteMember(member.uid)}
                      className="px-2 py-0.5 rounded text-[8px] font-bold bg-indigo-700 hover:bg-indigo-600 text-white">
                      Promote
                    </button>
                  )}
                  <button onClick={() => kickMember(member.uid)}
                    className="px-2 py-0.5 rounded text-[8px] font-bold bg-red-900/60 hover:bg-red-800 text-red-300">
                    Kick
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Syndicate */}
      <button
        onClick={async () => {
          if (confirm(isLeader ? 'As leader, leaving will transfer leadership. Are you sure?' : 'Leave this syndicate?')) {
            if (await leaveSyndicate()) addNotification('Left syndicate', 'warning');
          }
        }}
        className="w-full py-2 rounded-xl bg-gray-800 hover:bg-red-950 text-gray-500 hover:text-red-400 text-sm font-semibold transition border border-transparent hover:border-red-800"
      >
        Leave Syndicate
      </button>

      {error && (
        <div className="bg-red-900/30 rounded-lg p-2 text-center">
          <p className="text-red-400 text-xs">{error}</p>
          <button onClick={clearError} className="text-gray-500 text-[10px] mt-1">Dismiss</button>
        </div>
      )}
    </div>
  );
}
