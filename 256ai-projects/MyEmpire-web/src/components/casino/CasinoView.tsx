import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../engine/economy';
import { MIN_BET, MAX_BET, CASINO_TAX_RATE, ROULETTE_PAYOUTS, POKER_HAND_NAMES } from '../../data/casinoDefs';
import type { RouletteBetType } from '../../data/casinoDefs';
import {
  shuffleDeck, spinRoulette, checkRouletteWin, settleBet,
  handValue, isBlackjack, dealerPlay, evaluatePokerHand,
} from '../../engine/casino';
import type { Card } from '../../data/casinoDefs';

const SUIT_SYM: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RANK_NAME: Record<number, string> = { 2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A' };
function cardStr(c: Card) { return `${RANK_NAME[c.rank]}${SUIT_SYM[c.suit]}`; }
function cardColor(c: Card) { return c.suit === 'hearts' || c.suit === 'diamonds' ? 'text-red-400' : 'text-white'; }

type Tab = 'roulette' | 'blackjack' | 'poker';

// ─── ROULETTE ────────────────────────────────────────────────────────────
function RouletteGame() {
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const settle = useGameStore(s => s.settleCasinoBet);
  const [bet, setBet] = useState(1000);
  const [betType, setBetType] = useState<RouletteBetType>('color');
  const [betValue, setBetValue] = useState<string | number>('red');
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<{ won: boolean; payout: number } | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (dirtyCash < bet || spinning) return;
    setSpinning(true);
    setTimeout(() => {
      const num = spinRoulette();
      const won = checkRouletteWin(num, betType, betValue);
      const grossPayout = won ? bet * ROULETTE_PAYOUTS[betType] : 0;
      const res = settleBet(bet, grossPayout);
      settle(bet, grossPayout);
      setResult(num);
      setLastWin({ won: res.won, payout: res.cleanCashWon });
      setSpinning(false);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Result display */}
      <div className="flex items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-yellow-600 flex items-center justify-center">
          {spinning ? (
            <span className="text-2xl animate-spin">🎡</span>
          ) : result !== null ? (
            <span className="text-xl font-bold text-yellow-400">{result}</span>
          ) : (
            <span className="text-lg text-gray-600">?</span>
          )}
        </div>
        {lastWin && (
          <p className={`text-sm font-bold ${lastWin.won ? 'text-emerald-400' : 'text-red-400'}`}>
            {lastWin.won ? `+${formatMoney(lastWin.payout)} clean!` : 'Lost!'}
          </p>
        )}
      </div>

      {/* Bet type selector */}
      <div className="flex flex-wrap gap-1 justify-center">
        {([
          ['color', 'Color'],
          ['parity', 'Even/Odd'],
          ['half', 'High/Low'],
          ['section', 'Section'],
          ['number', 'Number'],
        ] as [RouletteBetType, string][]).map(([t, label]) => (
          <button key={t} onClick={() => { setBetType(t); setBetValue(t === 'color' ? 'red' : t === 'parity' ? 'even' : t === 'half' ? 'low' : t === 'section' ? '1st' : 0); }}
            className={`px-2 py-1 rounded text-[10px] font-semibold ${betType === t ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-gray-300'}`}
          >{label}</button>
        ))}
      </div>

      {/* Bet value selector */}
      <div className="flex flex-wrap gap-1 justify-center">
        {betType === 'color' && ['red', 'black'].map(v => (
          <button key={v} onClick={() => setBetValue(v)}
            className={`px-3 py-1 rounded text-[10px] font-bold ${betValue === v ? (v === 'red' ? 'bg-red-600' : 'bg-gray-600') + ' text-white' : 'bg-gray-800 text-gray-400'}`}
          >{v}</button>
        ))}
        {betType === 'parity' && ['even', 'odd'].map(v => (
          <button key={v} onClick={() => setBetValue(v)}
            className={`px-3 py-1 rounded text-[10px] font-bold ${betValue === v ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-gray-400'}`}
          >{v}</button>
        ))}
        {betType === 'half' && ['low', 'high'].map(v => (
          <button key={v} onClick={() => setBetValue(v)}
            className={`px-3 py-1 rounded text-[10px] font-bold ${betValue === v ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-gray-400'}`}
          >{v} {v === 'low' ? '1-18' : '19-36'}</button>
        ))}
        {betType === 'section' && ['1st', '2nd', '3rd'].map(v => (
          <button key={v} onClick={() => setBetValue(v)}
            className={`px-3 py-1 rounded text-[10px] font-bold ${betValue === v ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-gray-400'}`}
          >{v}</button>
        ))}
        {betType === 'number' && (
          <input type="number" min={0} max={36} value={betValue as number}
            onChange={e => setBetValue(Math.max(0, Math.min(36, parseInt(e.target.value) || 0)))}
            className="w-16 px-2 py-1 rounded bg-gray-800 text-white text-center text-sm border border-gray-700"
          />
        )}
      </div>

      {/* Bet amount + spin */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setBet(b => Math.max(MIN_BET, b / 2))} className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-xs">½</button>
        <span className="text-yellow-400 font-bold text-sm">{formatMoney(bet)}</span>
        <button onClick={() => setBet(b => Math.min(MAX_BET, Math.min(dirtyCash, b * 2)))} className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-xs">2×</button>
      </div>
      <button onClick={spin} disabled={dirtyCash < bet || spinning}
        className={`mx-auto px-6 py-2 rounded-lg font-bold text-sm ${dirtyCash >= bet && !spinning ? 'bg-yellow-600 text-black active:bg-yellow-500' : 'bg-gray-800 text-gray-600'}`}
      >{spinning ? 'Spinning...' : 'Spin!'}</button>
      <p className="text-[8px] text-gray-600 text-center">Payout: {ROULETTE_PAYOUTS[betType]}:1 · {(CASINO_TAX_RATE * 100).toFixed(0)}% tax on wins</p>
    </div>
  );
}

// ─── BLACKJACK ───────────────────────────────────────────────────────────
function BlackjackGame() {
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const settle = useGameStore(s => s.settleCasinoBet);
  const [bet, setBet] = useState(1000);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'bet' | 'play' | 'result'>('bet');
  const [resultMsg, setResultMsg] = useState('');
  const [resultPayout, setResultPayout] = useState(0);

  const deal = () => {
    if (dirtyCash < bet) return;
    const d = shuffleDeck();
    const pCards = [d[0], d[2]];
    const dCards = [d[1], d[3]];
    const remaining = d.slice(4);
    setPlayerCards(pCards);
    setDealerCards(dCards);
    setDeck(remaining);

    // Check immediate blackjacks
    if (isBlackjack(pCards) || isBlackjack(dCards)) {
      finishHand(pCards, dCards, remaining);
    } else {
      setPhase('play');
    }
  };

  const hit = () => {
    const newCards = [...playerCards, deck[0]];
    const remaining = deck.slice(1);
    setPlayerCards(newCards);
    setDeck(remaining);
    if (handValue(newCards) >= 21) {
      finishHand(newCards, dealerCards, remaining);
    }
  };

  const stand = () => {
    finishHand(playerCards, dealerCards, deck);
  };

  const finishHand = (pCards: Card[], dCards: Card[], remaining: Card[]) => {
    // Dealer plays
    const { dealerCards: finalDealer } = dealerPlay(dCards, remaining);
    setDealerCards(finalDealer);

    const pVal = handValue(pCards);
    const dVal = handValue(finalDealer);
    const pBJ = isBlackjack(pCards);
    const dBJ = isBlackjack(finalDealer);

    let grossPayout = 0;
    let msg = '';
    if (pBJ && dBJ) { grossPayout = bet; msg = 'Push — both blackjack!'; }
    else if (pBJ) { grossPayout = Math.floor(bet * 2.5); msg = 'Blackjack! 3:2 payout!'; }
    else if (dBJ) { grossPayout = 0; msg = 'Dealer blackjack!'; }
    else if (pVal > 21) { grossPayout = 0; msg = `Bust! (${pVal})`; }
    else if (dVal > 21) { grossPayout = bet * 2; msg = `Dealer busts! (${dVal})`; }
    else if (pVal > dVal) { grossPayout = bet * 2; msg = `You win! ${pVal} vs ${dVal}`; }
    else if (pVal === dVal) { grossPayout = bet; msg = `Push — ${pVal} tie`; }
    else { grossPayout = 0; msg = `Dealer wins. ${dVal} vs ${pVal}`; }

    const res = settleBet(bet, grossPayout);
    settle(bet, grossPayout);
    setResultMsg(msg);
    setResultPayout(res.cleanCashWon);
    setPhase('result');
  };

  const newHand = () => {
    setPhase('bet');
    setPlayerCards([]);
    setDealerCards([]);
    setResultMsg('');
  };

  return (
    <div className="flex flex-col gap-3">
      {phase !== 'bet' && (
        <>
          {/* Dealer hand */}
          <div className="text-center">
            <p className="text-[9px] text-gray-500 mb-1">Dealer {phase === 'result' ? `(${handValue(dealerCards)})` : ''}</p>
            <div className="flex justify-center gap-1">
              {dealerCards.map((c, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-sm font-mono ${phase === 'play' && i > 0 ? 'text-gray-700' : cardColor(c)}`}>
                  {phase === 'play' && i > 0 ? '??' : cardStr(c)}
                </span>
              ))}
            </div>
          </div>
          {/* Player hand */}
          <div className="text-center">
            <p className="text-[9px] text-gray-500 mb-1">You ({handValue(playerCards)})</p>
            <div className="flex justify-center gap-1">
              {playerCards.map((c, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-sm font-mono ${cardColor(c)}`}>
                  {cardStr(c)}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {phase === 'result' && (
        <p className={`text-center text-sm font-bold ${resultPayout > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {resultMsg} {resultPayout > 0 ? `+${formatMoney(resultPayout)} clean` : ''}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {phase === 'bet' && (
          <>
            <button onClick={() => setBet(b => Math.max(MIN_BET, b / 2))} className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-xs">½</button>
            <span className="text-yellow-400 font-bold text-sm">{formatMoney(bet)}</span>
            <button onClick={() => setBet(b => Math.min(MAX_BET, Math.min(dirtyCash, b * 2)))} className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-xs">2×</button>
          </>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {phase === 'bet' && (
          <button onClick={deal} disabled={dirtyCash < bet}
            className={`px-6 py-2 rounded-lg font-bold text-sm ${dirtyCash >= bet ? 'bg-emerald-600 text-white active:bg-emerald-500' : 'bg-gray-800 text-gray-600'}`}
          >Deal</button>
        )}
        {phase === 'play' && (
          <>
            <button onClick={hit} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm active:bg-blue-500">Hit</button>
            <button onClick={stand} className="px-4 py-2 rounded-lg bg-amber-600 text-black font-bold text-sm active:bg-amber-500">Stand</button>
          </>
        )}
        {phase === 'result' && (
          <button onClick={newHand} className="px-6 py-2 rounded-lg bg-gray-700 text-white font-bold text-sm active:bg-gray-600">New Hand</button>
        )}
      </div>
      <p className="text-[8px] text-gray-600 text-center">Blackjack pays 3:2 · Dealer hits on &lt;17 · {(CASINO_TAX_RATE * 100).toFixed(0)}% tax on wins</p>
    </div>
  );
}

// ─── POKER (5-card draw) ─────────────────────────────────────────────────
function PokerGame() {
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const settle = useGameStore(s => s.settleCasinoBet);
  const [bet, setBet] = useState(1000);
  const [hand, setHand] = useState<Card[]>([]);
  const [held, setHeld] = useState<boolean[]>([false,false,false,false,false]);
  const [phase, setPhase] = useState<'bet' | 'hold' | 'result'>('bet');
  const [deck, setDeck] = useState<Card[]>([]);
  const [handName, setHandName] = useState('');
  const [payout, setPayout] = useState(0);

  const deal = () => {
    if (dirtyCash < bet) return;
    const d = shuffleDeck();
    setHand(d.slice(0, 5));
    setDeck(d.slice(5));
    setHeld([false,false,false,false,false]);
    setPhase('hold');
  };

  const draw = () => {
    let deckIdx = 0;
    const newHand = hand.map((c, i) => {
      if (held[i]) return c;
      return deck[deckIdx++];
    });
    setHand(newHand);

    const hName = evaluatePokerHand(newHand);
    const displayName = POKER_HAND_NAMES[hName] ?? hName;
    const { POKER_HAND_PAYOUTS } = require('../../data/casinoDefs');
    const mult = POKER_HAND_PAYOUTS[hName] ?? 0;
    const grossPayout = mult > 0 ? bet * (1 + mult) : 0;
    const res = settleBet(bet, grossPayout);
    settle(bet, grossPayout);
    setHandName(displayName);
    setPayout(res.cleanCashWon);
    setPhase('result');
  };

  const toggleHold = (i: number) => {
    if (phase !== 'hold') return;
    setHeld(h => { const n = [...h]; n[i] = !n[i]; return n; });
  };

  const newGame = () => {
    setPhase('bet');
    setHand([]);
    setHandName('');
    setPayout(0);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Cards */}
      {hand.length > 0 && (
        <div className="flex justify-center gap-1.5">
          {hand.map((c, i) => (
            <button key={i} onClick={() => toggleHold(i)}
              className={`w-12 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition ${
                held[i] ? 'border-yellow-400 bg-yellow-900/30' : 'border-gray-700 bg-gray-800'
              } ${phase === 'hold' ? 'cursor-pointer' : ''}`}
            >
              <span className={`text-sm font-mono font-bold ${cardColor(c)}`}>{RANK_NAME[c.rank]}</span>
              <span className={`text-xs ${cardColor(c)}`}>{SUIT_SYM[c.suit]}</span>
              {phase === 'hold' && held[i] && <span className="text-[7px] text-yellow-400 font-bold">HELD</span>}
            </button>
          ))}
        </div>
      )}

      {phase === 'result' && (
        <div className="text-center">
          <p className={`text-sm font-bold ${payout > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {handName}
          </p>
          <p className={`text-xs ${payout > 0 ? 'text-emerald-300' : 'text-gray-500'}`}>
            {payout > 0 ? `+${formatMoney(payout)} clean!` : 'No payout'}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {phase === 'bet' && (
          <>
            <button onClick={() => setBet(b => Math.max(MIN_BET, b / 2))} className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-xs">½</button>
            <span className="text-yellow-400 font-bold text-sm">{formatMoney(bet)}</span>
            <button onClick={() => setBet(b => Math.min(MAX_BET, Math.min(dirtyCash, b * 2)))} className="px-2 py-1 rounded bg-gray-800 text-gray-400 text-xs">2×</button>
          </>
        )}
      </div>
      <div className="flex justify-center gap-2">
        {phase === 'bet' && (
          <button onClick={deal} disabled={dirtyCash < bet}
            className={`px-6 py-2 rounded-lg font-bold text-sm ${dirtyCash >= bet ? 'bg-purple-600 text-white active:bg-purple-500' : 'bg-gray-800 text-gray-600'}`}
          >Deal</button>
        )}
        {phase === 'hold' && (
          <button onClick={draw} className="px-6 py-2 rounded-lg bg-purple-600 text-white font-bold text-sm active:bg-purple-500">Draw</button>
        )}
        {phase === 'result' && (
          <button onClick={newGame} className="px-6 py-2 rounded-lg bg-gray-700 text-white font-bold text-sm active:bg-gray-600">New Hand</button>
        )}
      </div>
      {phase === 'hold' && <p className="text-[8px] text-gray-500 text-center">Tap cards to hold, then draw replacements</p>}
      <p className="text-[8px] text-gray-600 text-center">Jacks or better to win · {(CASINO_TAX_RATE * 100).toFixed(0)}% tax on wins</p>
    </div>
  );
}

// ─── MAIN CASINO VIEW ────────────────────────────────────────────────────
export default function CasinoView() {
  const close = useUIStore(s => s.setShowCasino);
  const dirtyCash = useGameStore(s => s.dirtyCash);
  const [tab, setTab] = useState<Tab>('roulette');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-yellow-900/40">
        <div>
          <h2 className="text-yellow-400 font-bold text-lg">🎰 Lucky 7 Casino</h2>
          <p className="text-[9px] text-gray-500">Dirty cash in, clean cash out (minus {(CASINO_TAX_RATE * 100).toFixed(0)}% tax)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400">💵 {formatMoney(dirtyCash)}</span>
          <button onClick={() => close(false)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {([['roulette', '🎡 Roulette'], ['blackjack', '🃏 Blackjack'], ['poker', '♠️ Poker']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold transition ${tab === t ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500'}`}
          >{label}</button>
        ))}
      </div>

      {/* Game area */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'roulette' && <RouletteGame />}
        {tab === 'blackjack' && <BlackjackGame />}
        {tab === 'poker' && <PokerGame />}
      </div>
    </div>
  );
}
