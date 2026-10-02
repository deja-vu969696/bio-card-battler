"use client";

import React, { useEffect, useState } from 'react';
import { Skull } from 'lucide-react';
import { Node, BOSS_DATA, CATEGORIES } from '../data/biologyData';
import { 
  playCardDrawSound, playCardPlaySound, playSlashSound, 
  playShieldSound, playHealSound, playEnemyIntentSound, playWeakHitSound 
} from '../utils/audio';

interface CardInstance { uid: string; nodeId: string; }
interface FloatingText { id: number; text: string; type: 'damage'|'heal'|'shield'|'crit'; target: 'boss'|'player'; offsetX: number; }

interface BattleState {
  playerHp: number; playerMaxHp: number; playerShield: number; energy: number;
  drawPile: CardInstance[]; hand: CardInstance[]; discardPile: CardInstance[];
  playerBuffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; acid: boolean; alkali: boolean; strata: number; };
  bossHp: number; bossMaxHp: number; bossShield: number;
  bossBuffs: { starchArmor: boolean; weakness: number; poison: number };
  bossIntentIndex: number;
  turn: 'init' | 'player' | 'boss' | 'gameover';
  log: string[];
  floatingTexts: FloatingText[];
  shakeTarget: 'boss' | 'screen' | null;
  whiteFlash: boolean;
  bossLunge: boolean;
}

interface Props { deck: Node[]; onVictory: () => void; onDefeat: () => void; }

export default function BattleArena({ deck, onVictory, onDefeat }: Props) {
  const [state, setState] = useState<BattleState>({
    playerHp: 100, playerMaxHp: 100, playerShield: 0, energy: 3,
    drawPile: [], hand: [], discardPile: [],
    playerBuffs: { poison: 0, extraDraw: 0, extraEnergy: 0, nextAttackBonus: 0, counter: 0, acid: false, alkali: false, strata: 0 },
    bossHp: BOSS_DATA.maxHp, bossMaxHp: BOSS_DATA.maxHp, bossShield: 0,
    bossBuffs: { starchArmor: false, weakness: 0, poison: 0 },
    bossIntentIndex: 0,
    turn: 'init', log: ['バトル開始！'],
    floatingTexts: [], shakeTarget: null, whiteFlash: false, bossLunge: false
  });

  const [playingCardUid, setPlayingCardUid] = useState<string | null>(null);

  useEffect(() => {
    if (state.turn === 'init') {
      const initialDeck = deck.map((n, i) => ({ uid: `${n.id}-${i}`, nodeId: n.id }));
      const shuffled = [...initialDeck].sort(() => Math.random() - 0.5);
      const startHand = shuffled.splice(0, 4);
      setTimeout(() => playCardDrawSound(), 500); 
      setState(s => ({ ...s, drawPile: shuffled, hand: startHand, turn: 'player', energy: 3 }));
    }
  }, [deck, state.turn]);

  const addFloatingText = (s: BattleState, text: string, type: 'damage'|'heal'|'shield'|'crit', target: 'boss'|'player') => {
    const id = Date.now() + Math.random();
    s.floatingTexts = [...s.floatingTexts, { id, text, type, target, offsetX: Math.random() * 60 - 30 }];
    setTimeout(() => {
      setState(curr => ({ ...curr, floatingTexts: curr.floatingTexts.filter(t => t.id !== id) }));
    }, 1000);
  };

  const executeDraw = (amount: number, currentDraw: CardInstance[], currentDiscard: CardInstance[]) => {
    let newDraw = [...currentDraw];
    let newDiscard = [...currentDiscard];
    let drawn: CardInstance[] = [];
    for(let i=0; i<amount; i++) {
      if(newDraw.length === 0) {
        if(newDiscard.length === 0) break;
        newDraw = [...newDiscard].sort(() => Math.random() - 0.5);
        newDiscard = [];
      }
      drawn.push(newDraw.pop()!);
    }
    return { newDraw, newDiscard, drawn };
  };

  const handleCardClick = (uid: string) => {
    if (state.turn !== 'player' || playingCardUid) return;
    const cardInst = state.hand.find(c => c.uid === uid);
    if (!cardInst) return;
    const node = deck.find(n => n.id === cardInst.nodeId);
    if (!node || state.energy < node.card.cost) return;

    playCardPlaySound();
    setPlayingCardUid(uid); 

    setTimeout(() => {
      setPlayingCardUid(null);
      resolveCardEffect(uid);
    }, 300); 
  };

  const resolveCardEffect = (uid: string) => {
    setState(prev => {
      if (prev.turn !== 'player') return prev;
      const cardInst = prev.hand.find(c => c.uid === uid);
      if (!cardInst) return prev;
      const node = deck.find(n => n.id === cardInst.nodeId);
      if (!node) return prev;

      let s = { ...prev };
      s.energy -= node.card.cost;
      
      let dmg = 0, shield = 0, heal = 0, isCrit = false, pierce = false;
      let logMsg = `プレイヤーは [${node.card.name}] を使用した。`;

      switch (node.id) {
        case 'cell-1': dmg = 8; break;
        case 'cell-2': shield = 12; break;
        case 'cell-3': s.playerBuffs.extraDraw += 1; break;
        case 'dig-1': 
          if (s.bossBuffs.starchArmor) { dmg = 24; isCrit = true; s.bossBuffs.starchArmor = false; logMsg += ' 装甲破壊！2倍ダメージ！'; }
          else { dmg = 12; } break;
        case 'dig-2': dmg = 18; s.bossBuffs.weakness += 2; break;
        case 'dig-3': heal = 10; s.playerBuffs.extraDraw += 1; break;
        case 'cir-1': s.playerBuffs.extraEnergy += 1; break;
        case 'cir-2': s.playerBuffs.nextAttackBonus = 0.5; break;
        case 'cir-3': s.playerBuffs.poison = 0; shield = 8; break;
        case 'ner-1':
          const res1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = res1.newDraw; s.discardPile = res1.newDiscard; s.hand = [...s.hand, ...res1.drawn];
          playCardDrawSound(); break;
        case 'ner-2': s.energy += 2; break;
        case 'ner-3': shield = 15; s.playerBuffs.counter = 15; break;
        case 'evo-1': dmg = 10; break;
        case 'evo-2': dmg = deck.length * 6; isCrit = true; break;
        case 'chem-1': dmg = 5; s.playerBuffs.acid = true; logMsg += ' 自身が酸性になった！'; break;
        case 'chem-2': dmg = 5; s.playerBuffs.alkali = true; logMsg += ' 自身がアルカリ性になった！'; break;
        case 'chem-3': 
          if (s.playerBuffs.acid && s.playerBuffs.alkali) {
            dmg = 30; heal = 15; isCrit = true;
            s.playerBuffs.acid = false; s.playerBuffs.alkali = false;
            logMsg += ' 中和反応コンボ発動！特大ダメージ＆回復！';
          } else {
            logMsg += ' （酸性とアルカリ性が揃っていないため効果なし）';
          }
          break;
        case 'phys-1': 
          dmg = 6; 
          s.playerBuffs.extraDraw += 1; 
          break;
        case 'phys-2': 
          dmg = 15; 
          pierce = true; 
          logMsg += ' 貫通ダメージ！'; 
          break;
        case 'phys-3': 
          s.energy += 1; 
          s.playerBuffs.extraDraw += 1; 
          break;
        case 'earth-1': 
          shield = 5; 
          s.playerBuffs.strata += 1; 
          break;
        case 'earth-2': 
          shield = s.playerBuffs.strata * 8; 
          break;
        case 'earth-3': 
          if (s.playerBuffs.strata >= 3) {
            dmg = 50; isCrit = true; s.playerBuffs.strata = 0; logMsg += ' 大地震発生！！';
          } else {
            dmg = 10;
          }
          break;
      }

      if (dmg > 0) {
        if (s.playerBuffs.nextAttackBonus > 0) {
          dmg = Math.floor(dmg * (1 + s.playerBuffs.nextAttackBonus));
          s.playerBuffs.nextAttackBonus = 0;
          isCrit = true;
        }
        
        if (isCrit) { playWeakHitSound(); s.whiteFlash = true; s.shakeTarget = 'screen'; }
        else { playSlashSound(); s.shakeTarget = 'boss'; }
        
        setTimeout(() => setState(curr => ({ ...curr, whiteFlash: false, shakeTarget: null })), 300);

        if (pierce) {
          s.bossHp = Math.max(0, s.bossHp - dmg);
        } else if (s.bossShield > 0) {
          const remaining = s.bossShield - dmg;
          if (remaining >= 0) { s.bossShield = remaining; }
          else { s.bossShield = 0; s.bossHp = Math.max(0, s.bossHp + remaining); }
        } else {
          s.bossHp = Math.max(0, s.bossHp - dmg);
        }
        addFloatingText(s, isCrit ? `CRITICAL ${dmg}` : `-${dmg}`, isCrit ? 'crit' : 'damage', 'boss');
      }

      if (shield > 0) { s.playerShield += shield; playShieldSound(); addFloatingText(s, `+${shield}`, 'shield', 'player'); }
      if (heal > 0) { s.playerHp = Math.min(s.playerMaxHp, s.playerHp + heal); playHealSound(); addFloatingText(s, `+${heal}`, 'heal', 'player'); }

      s.hand = s.hand.filter(c => c.uid !== uid);
      s.discardPile = [...s.discardPile, cardInst];
      s.log = [logMsg, ...s.log].slice(0, 10);

      if (s.bossHp <= 0) { s.turn = 'gameover'; setTimeout(() => onVictory(), 1000); }
      return s;
    });
  };

  const endTurn = () => {
    setState(prev => {
      if (prev.turn !== 'player') return prev;
      let s = { ...prev };
      s.discardPile = [...s.discardPile, ...s.hand];
      s.hand = [];
      s.turn = 'boss';
      s.log = ['--- 敵のターン ---', ...s.log].slice(0, 10);
      playEnemyIntentSound();
      return s;
    });
  };

  useEffect(() => {
    if (state.turn === 'boss' && state.bossHp > 0 && state.playerHp > 0) {
      
      const lungeTimer = setTimeout(() => {
        setState(s => ({ ...s, bossLunge: true }));
      }, 500);

      const resolveTimer = setTimeout(() => {
        setState(prev => {
          let s = { ...prev, bossLunge: false };
          const intent = BOSS_DATA.pattern[s.bossIntentIndex];
          let logMsg = `ボスは「${intent.description}」を実行した。`;
          
          if (intent.action === 'attack') {
            let dmg = intent.value;
            if (s.bossBuffs.weakness > 0) { dmg = Math.floor(dmg * 0.75); s.bossBuffs.weakness -= 1; }
            if (s.playerShield > 0) {
               const remaining = s.playerShield - dmg;
               if (remaining >= 0) { s.playerShield = remaining; dmg = 0; }
               else { s.playerShield = 0; dmg = -remaining; }
            }
            if (dmg > 0) {
              s.playerHp = Math.max(0, s.playerHp - dmg);
              s.shakeTarget = 'screen';
              setTimeout(() => setState(curr => ({ ...curr, shakeTarget: null })), 200);
            }
            playSlashSound();
            addFloatingText(s, `-${dmg}`, 'damage', 'player');
            
            if (s.playerBuffs.counter > 0) {
              s.bossHp = Math.max(0, s.bossHp - s.playerBuffs.counter);
              playSlashSound();
              addFloatingText(s, `-${s.playerBuffs.counter}`, 'damage', 'boss');
              s.playerBuffs.counter = 0;
            }
          } else if (intent.action === 'defend' || intent.action === 'starch_armor') {
            s.bossShield += intent.value;
            if (intent.action === 'starch_armor') s.bossBuffs.starchArmor = true;
            playShieldSound();
            addFloatingText(s, `+${intent.value}`, 'shield', 'boss');
          } else if (intent.action === 'poison') {
            s.playerBuffs.poison += intent.value;
            addFloatingText(s, `POISON +${intent.value}`, 'crit', 'player');
          }

          if (s.bossHp <= 0) { s.turn = 'gameover'; setTimeout(() => onVictory(), 1000); return s; }
          if (s.playerHp <= 0) { s.turn = 'gameover'; setTimeout(() => onDefeat(), 1000); return s; }

          s.bossIntentIndex = (s.bossIntentIndex + 1) % BOSS_DATA.pattern.length;
          s.log = [logMsg, ...s.log].slice(0, 10);
          
          s.turn = 'player';
          s.log = ['--- プレイヤーのターン ---', ...s.log].slice(0, 10);
          
          if (s.playerBuffs.poison > 0) {
            s.playerHp = Math.max(0, s.playerHp - s.playerBuffs.poison);
            addFloatingText(s, `-${s.playerBuffs.poison} 毒`, 'damage', 'player');
            s.playerBuffs.poison -= 1; 
          }
          if (s.playerHp <= 0) { s.turn = 'gameover'; setTimeout(() => onDefeat(), 1000); return s; }

          s.playerShield = 0; s.bossShield = 0; 
          s.energy = 3 + s.playerBuffs.extraEnergy; 
          
          const toDraw = 4 + s.playerBuffs.extraDraw; 
          s.playerBuffs.extraDraw = 0; 
          
          const { newDraw, newDiscard, drawn } = executeDraw(toDraw, s.drawPile, s.discardPile);
          s.drawPile = newDraw; s.discardPile = newDiscard; s.hand = drawn;
          
          if (drawn.length > 0) playCardDrawSound();

          return s;
        });
      }, 800); 

      return () => { clearTimeout(lungeTimer); clearTimeout(resolveTimer); }
    }
  }, [state.turn, onVictory, onDefeat]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up { 0% { opacity: 1; transform: translateY(0) scale(1.5); } 100% { opacity: 0; transform: translateY(-80px) scale(1); } }
        @keyframes shake-boss { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-15px) rotate(-3deg); } 75% { transform: translateX(15px) rotate(3deg); } }
        @keyframes shake-screen { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-10px, -10px); } 30% { transform: translate(10px, 10px); } 50% { transform: translate(-10px, 10px); } 70% { transform: translate(10px, -10px); } 90% { transform: translate(-5px, -5px); } }
        @keyframes card-fly { 0% { transform: translateY(0) scale(1.1); opacity: 1; } 100% { transform: translateY(-400px) scale(0.3); opacity: 0; } }
        @keyframes lunge { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(60px) scale(1.1); } }
        .animate-float-up { animation: float-up 1s ease-out forwards; }
        .animate-shake-boss { animation: shake-boss 0.15s ease-in-out 2; }
        .animate-shake-screen { animation: shake-screen 0.25s ease-in-out 2; }
        .animate-card-fly { animation: card-fly 0.3s ease-in forwards; z-index: 50; }
        .animate-lunge { animation: lunge 0.3s ease-in-out; }
      `}} />

      <section className={`flex-1 flex flex-col h-[calc(100vh-12rem)] relative ${state.shakeTarget === 'screen' ? 'animate-shake-screen' : ''}`}>
        
        {state.whiteFlash && <div className="absolute inset-0 bg-white z-50 pointer-events-none opacity-80 animate-ping" style={{ animationDuration: '0.3s' }} />}

        <div className="h-2/5 w-full bg-slate-900 rounded-xl border-2 border-red-900/40 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-700 flex flex-col gap-1 z-10">
            <div className="text-xs text-slate-400">次の行動 (Intent)</div>
            <div className="text-red-400 font-bold flex items-center gap-2">
              <Skull className="w-4 h-4" /> {BOSS_DATA.pattern[state.bossIntentIndex].description}
            </div>
          </div>

          <div className={`text-center relative z-10 mt-8 ${state.shakeTarget === 'boss' ? 'animate-shake-boss' : ''} ${state.bossLunge ? 'animate-lunge' : ''}`}>
            <div className="text-3xl font-black tracking-widest text-red-100 mb-2 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
              {BOSS_DATA.name}
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              {state.bossBuffs.starchArmor && <span className="text-xs bg-yellow-600 px-2 py-1 rounded text-white shadow-lg">デンプン装甲</span>}
              {state.bossBuffs.weakness > 0 && <span className="text-xs bg-purple-600 px-2 py-1 rounded text-white shadow-lg">弱体化 {state.bossBuffs.weakness}</span>}
            </div>

            <div className="w-72 bg-slate-950 h-6 rounded-full border border-red-900 overflow-hidden relative shadow-inner mx-auto">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${(Math.max(0, state.bossHp) / state.bossMaxHp) * 100}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                HP: {state.bossHp} / {state.bossMaxHp}
              </div>
            </div>
            {state.bossShield > 0 && (
              <div className="w-72 bg-slate-950 h-2 rounded-full border border-blue-900 overflow-hidden relative shadow-inner mx-auto mt-1">
                <div className="h-full bg-blue-500" style={{ width: '100%' }} />
              </div>
            )}
            
            {state.floatingTexts.filter(t => t.target === 'boss').map(t => (
              <div key={t.id} className={`absolute top-0 animate-float-up font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] ${
                t.type === 'damage' ? 'text-red-400' : t.type === 'shield' ? 'text-blue-400' : 'text-yellow-400 text-4xl z-50'
              }`} style={{ left: `calc(50% + ${t.offsetX}px)` }}>
                {t.text}
              </div>
            ))}
          </div>
        </div>

        <div className="h-1/5 my-4 w-full bg-slate-950/50 rounded-xl border border-slate-800 p-4 overflow-y-auto custom-scrollbar flex flex-col-reverse text-sm relative z-0">
          {state.log.map((msg, idx) => (
            <div key={idx} className={`mb-1 ${idx === 0 ? 'text-white font-bold' : 'text-slate-500'}`}>{msg}</div>
          ))}
        </div>

        <div className="h-2/5 w-full bg-slate-900 rounded-xl border border-indigo-500/30 p-4 relative flex flex-col justify-end">
          
          {state.floatingTexts.filter(t => t.target === 'player').map(t => (
            <div key={t.id} className={`absolute top-0 animate-float-up font-black text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-40 ${
              t.type === 'damage' ? 'text-red-500' : t.type === 'shield' ? 'text-blue-400' : 'text-green-400'
            }`} style={{ left: `calc(50% + ${t.offsetX}px)` }}>
              {t.text}
            </div>
          ))}

          <div className="absolute top-4 left-4 flex gap-4 z-10">
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-red-900/50 shadow-inner flex flex-col items-center">
              <span className="text-xs text-red-400 font-bold">HP</span>
              <span className="text-white font-black text-lg">{state.playerHp}/{state.playerMaxHp}</span>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-blue-900/50 shadow-inner flex flex-col items-center">
              <span className="text-xs text-blue-400 font-bold">ブロック</span>
              <span className="text-white font-black text-lg">{state.playerShield}</span>
            </div>
            <div className="bg-slate-950 px-6 py-2 rounded-lg border border-yellow-700/50 shadow-[0_0_15px_rgba(202,138,4,0.3)] flex flex-col items-center">
              <span className="text-xs text-yellow-400 font-bold tracking-widest">エナジー</span>
              <span className="text-white font-black text-2xl">{state.energy}</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            {state.playerBuffs.acid && <span className="bg-red-800 px-2 py-1 rounded font-bold text-white shadow-lg animate-pulse">酸性</span>}
            {state.playerBuffs.alkali && <span className="bg-blue-800 px-2 py-1 rounded font-bold text-white shadow-lg animate-pulse">アルカリ性</span>}
            {state.playerBuffs.strata > 0 && <span className="bg-amber-700 px-2 py-1 rounded font-bold text-white shadow-lg">地層 {state.playerBuffs.strata}</span>}
            {state.playerBuffs.poison > 0 && <span className="bg-green-800 px-2 py-1 rounded font-bold text-white shadow-lg">毒 {state.playerBuffs.poison}</span>}
            {state.playerBuffs.nextAttackBonus > 0 && <span className="bg-orange-600 px-2 py-1 rounded font-bold text-white shadow-lg">攻撃力UP</span>}
            {state.playerBuffs.counter > 0 && <span className="bg-indigo-600 px-2 py-1 rounded font-bold text-white shadow-lg">反射構え {state.playerBuffs.counter}</span>}
          </div>

          <div className="flex justify-between items-end w-full">
            <div className="w-16 h-24 bg-slate-800 rounded border-2 border-slate-700 flex flex-col items-center justify-center text-slate-400 shadow-lg">
              <span className="text-[10px] font-bold">山札</span>
              <span className="font-black text-2xl">{state.drawPile.length}</span>
            </div>

            <div className="flex-1 flex justify-center gap-2 mx-4 relative h-36">
              {state.hand.map((cardInst, idx) => {
                const node = deck.find(n => n.id === cardInst.nodeId);
                if (!node) return null;
                const canPlay = state.energy >= node.card.cost && state.turn === 'player';
                const isPlaying = playingCardUid === cardInst.uid;
                
                return (
                  <div 
                    key={cardInst.uid}
                    onClick={() => handleCardClick(cardInst.uid)}
                    className={`w-36 h-48 rounded-xl border-2 p-2 flex flex-col transition-all absolute origin-bottom 
                      ${canPlay && !isPlaying ? 'cursor-pointer hover:z-30 hover:-translate-y-6 hover:scale-110 shadow-lg' : 'opacity-70'} 
                      ${isPlaying ? 'animate-card-fly' : ''}
                      ${node.subject === 'chemistry' ? 'border-purple-500/80 bg-gradient-to-b from-purple-950 to-slate-900 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]' : 
                        node.subject === 'physics' ? 'border-red-500/80 bg-gradient-to-b from-red-950 to-slate-900 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 
                        node.subject === 'earth' ? 'border-amber-500/80 bg-gradient-to-b from-amber-950 to-slate-900 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]' : 
                        'border-cyan-500/80 bg-gradient-to-b from-cyan-950 to-slate-900 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]'}`}
                    style={{
                      left: `calc(50% - 4.5rem + ${(idx - (state.hand.length - 1) / 2) * 5}rem)`,
                      transform: isPlaying ? '' : `rotate(${(idx - (state.hand.length - 1) / 2) * 6}deg)`,
                      zIndex: isPlaying ? 50 : 10 + idx
                    }}
                  >
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-white shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-white/20 bg-gradient-to-br from-cyan-400 to-blue-700">
                      {node.card.cost}
                    </div>
                    <div className="flex justify-between items-start mb-1 pl-4">
                      <div className="text-[9px] text-slate-400 font-bold truncate mt-1 max-w-[50%] text-left">
                        {CATEGORIES.find(c => c.id === node.category)?.label.split(' ')[0]}
                      </div>
                      <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        node.card.type === 'Attack' ? 'text-red-400 border-red-500/30 bg-red-950/50' : 
                        node.card.type === 'Skill' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/50' : 
                        'text-amber-400 border-amber-500/30 bg-amber-950/50'
                      }`}>{node.card.type}</div>
                    </div>
                    <div className="font-bold text-white text-sm text-center mb-1">{node.card.name}</div>
                    <div className="text-[10px] text-slate-200 leading-tight bg-slate-950/80 p-2 rounded flex-1">
                      {node.card.description}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-3">
              <button 
                onClick={endTurn} disabled={state.turn !== 'player'}
                className={`px-4 py-3 font-black tracking-widest rounded-xl border-b-4 transition-all ${
                  state.turn === 'player' ? 'bg-yellow-500 border-yellow-700 text-black hover:bg-yellow-400 hover:translate-y-1 hover:border-b-0' : 'bg-slate-800 border-slate-900 text-slate-500'
                }`}
              >
                TURN END
              </button>
              <div className="w-16 h-24 bg-slate-800 rounded border-2 border-slate-700 flex flex-col items-center justify-center text-slate-400 shadow-lg">
                <span className="text-[10px] font-bold">捨て札</span>
                <span className="font-black text-2xl">{state.discardPile.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
