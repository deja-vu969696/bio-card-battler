"use client";

import React, { useEffect, useState, useRef } from 'react';
import { LogOut, Timer, ShieldAlert } from 'lucide-react';
import { Node, CATEGORIES } from '../data/biologyData';
import { supabase } from '../lib/supabase';
import { 
  playCardDrawSound, playCardPlaySound, playSlashSound, 
  playShieldSound, playHealSound, playEnemyIntentSound, playWeakHitSound 
} from '../utils/audio';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CardInstance { uid: string; nodeId: string; }
interface FloatingText { id: number; text: string; type: 'damage'|'heal'|'shield'|'crit'; target: 'opponent'|'self'; offsetX: number; }

interface PvpState {
  hp: number; shield: number; energy: number;
  drawPile: CardInstance[]; hand: CardInstance[]; discardPile: CardInstance[];
  buffs: { poison: number; extraDraw: number; extraEnergy: number; nextAttackBonus: number; counter: number; weakness: number; acid: boolean; alkali: boolean; strata: number; nextTurnEnergy: number; nextTurnDraw: number; pendingDiscard: number; };
  
  oppHp: number; oppShield: number;
  oppBuffs: { weakness: number; poison: number; counter: number; acid: boolean; alkali: boolean; strata: number; };
  
  turn: 'init' | 'self' | 'opponent' | 'gameover';
  timer: number;
  log: string[];
  floatingTexts: FloatingText[];
  shakeTarget: 'opponent' | 'screen' | null;
  whiteFlash: boolean;
  oppLunge: boolean;
  resultMsg: string | null;
}

interface Props { 
  roomCode: string; 
  isHost: boolean; 
  deck: Node[]; 
  onLeave: () => void; 
}

export default function PvpArena({ roomCode, isHost, deck, onLeave }: Props) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  const [state, setState] = useState<PvpState>({
    hp: 80, shield: 0, energy: 3,
    drawPile: [], hand: [], discardPile: [],
    buffs: { poison: 0, extraDraw: 0, extraEnergy: 0, nextAttackBonus: 0, counter: 0, weakness: 0, acid: false, alkali: false, strata: 0, nextTurnEnergy: 0, nextTurnDraw: 0, pendingDiscard: 0 },
    
    oppHp: 80, oppShield: 0,
    oppBuffs: { weakness: 0, poison: 0, counter: 0, acid: false, alkali: false, strata: 0 },
    
    turn: 'init', timer: 45, log: ['ルームに接続しました。同期中...'],
    floatingTexts: [], shakeTarget: null, whiteFlash: false, oppLunge: false,
    resultMsg: null
  });

  const [playingCardUid, setPlayingCardUid] = useState<string | null>(null);

  // === ユーティリティ ===
  const addFloatingText = (s: PvpState, text: string, type: 'damage'|'heal'|'shield'|'crit', target: 'opponent'|'self') => {
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

  // === 初期化とSupabase通信 ===
  useEffect(() => {
    const channel = supabase.channel(`room_${roomCode}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'game_action' }, ({ payload }) => {
      setState(prev => {
        let s = { ...prev };
        
        if (s.turn === 'gameover') return s;

        
        else if (payload.action === 'APPLY_POISON') {
          s.buffs.poison += payload.value;
          s.log = [`毒 ${payload.value} ターンを付与された！`, ...s.log].slice(0, 10);
          addFloatingText(s, `POISON +${payload.value}`, 'crit', 'self');
        }

        if (payload.action === 'SYNC') {
          s.oppHp = payload.hp;
          s.oppShield = payload.shield;
          s.oppBuffs = payload.buffs;
        }
        else if (payload.action === 'ATTACK') {
          s.oppLunge = true;
          setTimeout(() => setState(c => ({...c, oppLunge: false})), 300);

          let { dmg, breakShield, applyWeakness, pierce } = payload;
          
          if (breakShield && s.shield > 0) {
             s.shield = 0; s.log = ['相手の攻撃でシールドが破壊された！', ...s.log].slice(0, 10);
             addFloatingText(s, 'SHIELD BREAK!', 'crit', 'self');
          }
          
          if (pierce) {
            // シールドを無視して直接ダメージ
            s.log = ['貫通ダメージを受けた！', ...s.log].slice(0, 10);
          } else if (s.shield > 0) {
             const rem = s.shield - dmg;
             if (rem >= 0) { s.shield = rem; dmg = 0; }
             else { s.shield = 0; dmg = -rem; }
          }
          
          }

      if (dmg > 0) { 
            s.hp = Math.max(0, s.hp - dmg); 
            s.log = [`相手から ${dmg} のダメージを受けた！`, ...s.log].slice(0, 10); 
            s.shakeTarget = 'screen';
            playSlashSound();
            setTimeout(() => setState(c => ({...c, shakeTarget: null})), 300);
            addFloatingText(s, `-${dmg}`, 'damage', 'self');
          } else if (payload.dmg > 0) {
            playShieldSound();
          }
          
          if (applyWeakness > 0) {
             s.buffs.weakness += applyWeakness; 
             s.log = [`弱体化 ${applyWeakness} を受けた！`, ...s.log].slice(0, 10);
             addFloatingText(s, `WEAKNESS +${applyWeakness}`, 'crit', 'self');
          }

          // Counter!
          if (dmg > 0 && s.buffs.counter > 0) {
             channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'COUNTER', dmg: s.buffs.counter }});
             s.log = [`せき髄反射！相手に ${s.buffs.counter} のカウンターダメージ！`, ...s.log].slice(0, 10);
             addFloatingText(s, `COUNTER ${s.buffs.counter}!`, 'shield', 'opponent');
             s.buffs.counter = 0;
             playShieldSound();
          }

          // Sync back
          channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'SYNC', hp: s.hp, shield: s.shield, buffs: s.buffs }});
        }
        else if (payload.action === 'COUNTER') {
          let { dmg } = payload;
          if (s.shield > 0) {
             const rem = s.shield - dmg;
             if (rem >= 0) { s.shield = rem; dmg = 0; }
             else { s.shield = 0; dmg = -rem; }
          }
          }

      if (dmg > 0) {
             s.hp = Math.max(0, s.hp - dmg);
             s.shakeTarget = 'screen';
             playSlashSound();
             setTimeout(() => setState(c => ({...c, shakeTarget: null})), 300);
             addFloatingText(s, `-${dmg}`, 'damage', 'self');
          }
          s.log = [`相手の反射カウンターで ${payload.dmg} ダメージを受けた！`, ...s.log].slice(0, 10);
          channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'SYNC', hp: s.hp, shield: s.shield, buffs: s.buffs }});
        }
        else if (payload.action === 'END_TURN') {
          s.turn = 'self';
          s.timer = 45;
          s.log = ['--- 自分のターン ---', ...s.log].slice(0, 10);
          
          if (s.buffs.poison > 0) {
            s.hp = Math.max(0, s.hp - s.buffs.poison);
            addFloatingText(s, `-${s.buffs.poison} 毒`, 'damage', 'self');
            s.buffs.poison -= 1; 
          }

          s.shield = 0; 
          s.energy = 3 + s.buffs.extraEnergy; 
          
          const toDraw = 4 + s.buffs.extraDraw; 
          s.buffs.extraDraw = 0; 
          
          const { newDraw, newDiscard, drawn } = executeDraw(toDraw, s.drawPile, s.discardPile);
          s.drawPile = newDraw; s.discardPile = newDiscard; s.hand = drawn;
          
          if (drawn.length > 0) playCardDrawSound();
          channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'SYNC', hp: s.hp, shield: s.shield, buffs: s.buffs }});
        }
        else if (payload.action === 'SURRENDER') {
          s.turn = 'gameover';
          s.resultMsg = '相手が降参しました（YOU WIN!）';
          playHealSound();
        }

        // 決着判定
        if (s.hp <= 0 && s.oppHp <= 0) { s.turn = 'gameover'; s.resultMsg = '引き分け (DRAW)'; }
        else if (s.hp <= 0) { s.turn = 'gameover'; s.resultMsg = '敗北 (YOU LOSE...)'; }
        else if (s.oppHp <= 0) { s.turn = 'gameover'; s.resultMsg = '勝利 (YOU WIN!)'; playHealSound(); }

        return s;
      });
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // 初期ドロー
        const initialDeck = deck.map((n, i) => ({ uid: `${n.id}-${i}-${Date.now()}`, nodeId: n.id }));
        const shuffled = [...initialDeck].sort(() => Math.random() - 0.5);
        
        setState(prev => {
          let s = { ...prev };
          if (isHost) {
            s.turn = 'self';
            s.log = ['--- 自分のターン（先攻） ---', ...s.log];
            const startHand = shuffled.splice(0, 4);
            s.drawPile = shuffled; s.hand = startHand;
            setTimeout(() => playCardDrawSound(), 500);
          } else {
            s.turn = 'opponent';
            s.log = ['--- 相手のターン（後攻） ---', ...s.log];
            const startHand = shuffled.splice(0, 5); // 後攻は5枚
            s.drawPile = shuffled; s.hand = startHand;
          }
          return s;
        });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, isHost, deck]);

  // === ターンタイマー ===
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.turn === 'self' && state.hp > 0 && state.oppHp > 0) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timer <= 1) {
            let s = { ...prev };
            s.discardPile = [...s.discardPile, ...s.hand];
            s.hand = [];
            s.turn = 'opponent';
            s.timer = 0;
            s.log = ['--- 時間切れ。相手のターン ---', ...s.log].slice(0, 10);
            playEnemyIntentSound();
            channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'END_TURN' }});
            return s;
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.turn, state.hp, state.oppHp]);

  // === カードプレイ ===

  const handleCardClick = (uid: string) => {
    if (state.turn !== 'self' || playingCardUid) return;

    // Discard mode for Precision Balance
    if (state.buffs.pendingDiscard > 0) {
      playSlashSound();
      setState(prev => {
        let s = { ...prev };
        s.hand = s.hand.filter(c => c.uid !== uid);
        s.discardPile = [...s.discardPile, prev.hand.find(c => c.uid === uid)!];
        s.buffs.pendingDiscard -= 1;
        s.log = ['カードを捨て札に送った。', ...s.log].slice(0,10);
        return s;
      });
      return;
    }

    const cardInst = state.hand.find(c => c.uid === uid);

    if (!cardInst) return;
    const node = deck.find(n => n.id === cardInst.nodeId);
    if (!node || state.energy < node.card.cost) return;

    playCardPlaySound();
    setPlayingCardUid(uid); 
    setTimeout(() => { setPlayingCardUid(null); resolveCardEffect(uid); }, 300); 
  };

  const resolveCardEffect = (uid: string) => {
    setState(prev => {
      if (prev.turn !== 'self') return prev;
      const cardInst = prev.hand.find(c => c.uid === uid);
      if (!cardInst) return prev;
      const node = deck.find(n => n.id === cardInst.nodeId);
      if (!node) return prev;

      let s = { ...prev };
      s.energy -= node.card.cost;
      
      let dmg = 0, shield = 0, heal = 0, isCrit = false, breakShield = false, applyWeakness = 0, pierce = false;
      let logMsg = `自分は [${node.card.name}] を使用した。`;

      switch (node.id) {
        // --- BIOLOGY ---
        case 'cell-1': dmg = 8; break;
        case 'cell-2': shield = 12; break;
        case 'cell-3': s.buffs.extraDraw += 1; break;
        case 'dig-1': 
          if (s.oppShield > 0) { dmg = 24; isCrit = true; breakShield = true; logMsg += ' 装甲破壊！2倍ダメージ！'; }
          else { dmg = 12; } break;
        case 'dig-2': dmg = 18; applyWeakness = 2; break;
        case 'dig-3': heal = 12; s.buffs.nextTurnDraw += 1; break;
        case 'cir-1': s.buffs.extraEnergy += 1; break;
        case 'cir-2': s.buffs.nextAttackBonus = 0.5; break;
        case 'cir-3': s.buffs.poison = 0; shield = 8; break;
        case 'ner-1':
          const res1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = res1.newDraw; s.discardPile = res1.newDiscard; s.hand = [...s.hand, ...res1.drawn];
          playCardDrawSound(); break;
        case 'ner-2': s.energy += 2; break;
        case 'ner-3': shield = 12; s.buffs.counter = 14; break;
        case 'evo-1': dmg = 10; break;
        case 'evo-2': dmg = deck.length * 6; isCrit = true; break;

        // --- CHEMISTRY ---
        case 'chem-1': 
          breakShield = true; 
          applyWeakness = 2; 
          logMsg += ' 敵のシールドを全破壊し、弱体化を付与！'; 
          break;
        case 'chem-2': 
          // 毒を3ターン付与。PvpではATTACKペイロードの代わりに専用ペイロードかバフ同期？
          // POISONペイロードがないので、一旦自身のバフUIではなく、直接POISONを送る。
          channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'APPLY_POISON', value: 3 } });
          logMsg += ' 敵に毒を付与した！'; 
          break;

        // --- PHYSICS ---
        case 'phys-1': dmg = 7; s.buffs.extraDraw += 1; break;
        case 'phys-2': dmg = 16; pierce = true; logMsg += ' 貫通ダメージ！'; break;
        case 'phys-3': s.energy += 2; s.buffs.extraDraw += 1; break;
        
        // --- EARTH ---
        case 'earth-1': shield = 8; s.buffs.strata += 1; break;
        case 'earth-2': shield = s.buffs.strata * 8; break;
        case 'earth-3': 
          if (s.buffs.strata >= 3) {
            dmg = 50; isCrit = true; s.buffs.strata = 0; logMsg += ' 大地震発生！！（地層全消費）';
          } else {
            dmg = 15;
          }
          break;

        // --- NEUTRAL ---
        case 'neu-1':
          const resNeu1 = executeDraw(2, s.drawPile, s.discardPile);
          s.drawPile = resNeu1.newDraw; s.discardPile = resNeu1.newDiscard; s.hand = [...s.hand, ...resNeu1.drawn];
          if (resNeu1.drawn.length > 0) {
            s.buffs.pendingDiscard += 1;
            logMsg += ' 2枚引き、1枚捨てる。捨てるカードを選んでください。';
          }
          playCardDrawSound(); 
          break;
        case 'neu-2':
          shield = 10;
          const hasNeutral = s.hand.some(c => {
             const n = deck.find(dn => dn.id === c.nodeId);
             return n?.subject === 'neutral' && c.uid !== uid;
          });
          if (hasNeutral) { shield += 5; logMsg += ' 手札の中立カードと共鳴して追加ブロック！'; }
          break;
        case 'neu-3':
          if (s.buffs.poison > 0) { s.buffs.poison = 0; logMsg += ' 毒を解除！'; }
          else if (s.buffs.weakness > 0) { s.buffs.weakness = 0; logMsg += ' 弱体化を解除！'; }
          s.buffs.extraDraw += 1;
          break;
        case 'neu-4':
          dmg = 8;
          s.buffs.nextTurnEnergy += 1;
          logMsg += ' 次のターン、エナジー追加獲得！';
          break;


      }

      if (dmg > 0) {
        if (s.buffs.nextAttackBonus > 0) { dmg = Math.floor(dmg * (1 + s.buffs.nextAttackBonus)); s.buffs.nextAttackBonus = 0; isCrit = true; }
        if (s.buffs.weakness > 0) { dmg = Math.floor(dmg * 0.75); s.buffs.weakness -= 1; }
        
        if (isCrit) { playWeakHitSound(); s.whiteFlash = true; s.shakeTarget = 'screen'; }
        else { playSlashSound(); s.shakeTarget = 'opponent'; }
        
        setTimeout(() => setState(curr => ({ ...curr, whiteFlash: false, shakeTarget: null })), 300);

        channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'ATTACK', dmg, breakShield, applyWeakness, isCrit, pierce }});
        addFloatingText(s, isCrit ? `CRITICAL ${dmg}` : `${dmg}`, isCrit ? 'crit' : 'damage', 'opponent');
      }

      if (shield > 0) { s.shield += shield; playShieldSound(); addFloatingText(s, `+${shield}`, 'shield', 'self'); }
      if (heal > 0) { s.hp = Math.min(80, s.hp + heal); playHealSound(); addFloatingText(s, `+${heal}`, 'heal', 'self'); }

      s.hand = s.hand.filter(c => c.uid !== uid);
      s.discardPile = [...s.discardPile, cardInst];
      s.log = [logMsg, ...s.log].slice(0, 10);
      
      channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'SYNC', hp: s.hp, shield: s.shield, buffs: s.buffs }});

      // 決着判定は自身では行わず、SYNCされた相手側が行うか、次ターンに死ぬ
      return s;
    });
  };

  const endTurn = () => {
    setState(prev => {
      if (prev.turn !== 'self') return prev;
      let s = { ...prev };
      s.discardPile = [...s.discardPile, ...s.hand];
      s.hand = [];
      s.turn = 'opponent';
      s.timer = 0;
      s.log = ['--- 相手のターン ---', ...s.log].slice(0, 10);
      playEnemyIntentSound();
      
      channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'END_TURN' }});
      return s;
    });
  };

  const surrender = () => {
    if (confirm('本当に降参しますか？')) {
      channelRef.current?.send({ type: 'broadcast', event: 'game_action', payload: { action: 'SURRENDER' }});
      setState(s => ({ ...s, turn: 'gameover', resultMsg: '敗北 (SURRENDER...)' }));
    }
  };

  if (state.turn === 'init') {
    return <div className="flex-1 flex items-center justify-center text-cyan-500 font-bold animate-pulse text-xl">通信を確立しています...</div>;
  }

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

      {/* GameOver Overlay */}
      {state.turn === 'gameover' && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
          <div className={`text-6xl font-black mb-8 tracking-widest ${state.resultMsg?.includes('WIN') ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'text-slate-500 drop-shadow-[0_0_10px_rgba(0,0,0,1)]'}`}>
            {state.resultMsg}
          </div>
          <button onClick={onLeave} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.5)]">
            <LogOut className="w-6 h-6" /> ルームを退出する
          </button>
        </div>
      )}

      <section className={`flex-1 flex flex-col h-[calc(100vh-12rem)] relative ${state.shakeTarget === 'screen' ? 'animate-shake-screen' : ''}`}>
        
        {state.whiteFlash && <div className="absolute inset-0 bg-white z-50 pointer-events-none opacity-80 animate-ping" style={{ animationDuration: '0.3s' }} />}

        {/* --- OPPONENT AREA --- */}
        <div className="h-2/5 w-full bg-slate-900 rounded-xl border-2 border-indigo-900/40 relative overflow-hidden flex flex-col items-center justify-center">
          
          <div className="absolute top-4 left-4 bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-3 z-10">
            <span className="text-indigo-400 font-bold flex items-center gap-2 tracking-wider">
              ENEMY PLAYER
            </span>
            <span className="bg-slate-800 px-2 rounded text-xs text-slate-400">ROOM: {roomCode}</span>
          </div>

          <button onClick={surrender} className="absolute top-4 right-4 bg-slate-800 hover:bg-red-900/80 border border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors z-10 flex items-center gap-2">
            <ShieldAlert className="w-3 h-3" /> 降参
          </button>

          <div className={`text-center relative z-10 mt-8 ${state.shakeTarget === 'opponent' ? 'animate-shake-boss' : ''} ${state.oppLunge ? 'animate-lunge' : ''}`}>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              {state.oppBuffs.acid && <span className="bg-red-800 px-2 py-1 rounded font-bold text-white shadow-lg animate-pulse text-xs">酸性</span>}
              {state.oppBuffs.alkali && <span className="bg-blue-800 px-2 py-1 rounded font-bold text-white shadow-lg animate-pulse text-xs">アルカリ性</span>}
              {state.oppBuffs.strata > 0 && <span className="bg-amber-700 px-2 py-1 rounded font-bold text-white shadow-lg text-xs">地層 {state.oppBuffs.strata}</span>}
              {state.oppBuffs.weakness > 0 && <span className="text-xs bg-purple-600 px-2 py-1 rounded text-white shadow-lg">弱体化 {state.oppBuffs.weakness}</span>}
              {state.oppBuffs.counter > 0 && <span className="text-xs bg-indigo-600 px-2 py-1 rounded text-white shadow-lg">反射構え</span>}
            </div>

            <div className="w-72 bg-slate-950 h-6 rounded-full border border-indigo-900 overflow-hidden relative shadow-inner mx-auto">
              <div className="h-full bg-gradient-to-r from-indigo-700 to-indigo-400 transition-all duration-300" style={{ width: `${(Math.max(0, state.oppHp) / 80) * 100}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                HP: {state.oppHp} / 80
              </div>
            </div>
            {state.oppShield > 0 && (
              <div className="w-72 bg-slate-950 h-2 rounded-full border border-blue-900 overflow-hidden relative shadow-inner mx-auto mt-1">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: '100%' }} />
              </div>
            )}
            
            {state.floatingTexts.filter(t => t.target === 'opponent').map(t => (
              <div key={t.id} className={`absolute top-0 animate-float-up font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] ${
                t.type === 'damage' ? 'text-red-400' : t.type === 'shield' ? 'text-blue-400' : 'text-yellow-400 text-4xl z-50'
              }`} style={{ left: `calc(50% + ${t.offsetX}px)` }}>
                {t.text}
              </div>
            ))}
          </div>
        </div>

        {/* --- BATTLE LOG & TURN INDICATOR --- */}
        <div className="h-1/5 my-4 w-full bg-slate-950/50 rounded-xl border border-slate-800 p-4 flex gap-4 relative z-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse text-sm">
            {state.log.map((msg, idx) => (
              <div key={idx} className={`mb-1 ${idx === 0 ? 'text-white font-bold' : 'text-slate-500'}`}>{msg}</div>
            ))}
          </div>
          <div className="w-48 bg-slate-900 border border-slate-700 rounded-lg flex flex-col items-center justify-center shadow-inner">
            <div className={`text-lg font-black tracking-widest mb-1 ${state.turn === 'self' ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>
              {state.turn === 'self' ? 'YOUR TURN' : 'ENEMY TURN'}
            </div>
            <div className={`flex items-center gap-2 font-black text-3xl ${state.timer <= 10 && state.turn === 'self' ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
              <Timer className="w-6 h-6" /> {state.timer}s
            </div>
          </div>
        </div>

        {/* --- PLAYER AREA --- */}
        <div className="h-2/5 w-full bg-slate-900 rounded-xl border border-indigo-500/30 p-4 relative flex flex-col justify-end">
          
          {state.floatingTexts.filter(t => t.target === 'self').map(t => (
            <div key={t.id} className={`absolute top-0 animate-float-up font-black text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-40 ${
              t.type === 'damage' ? 'text-red-500' : t.type === 'shield' ? 'text-blue-400' : 'text-green-400'
            }`} style={{ left: `calc(50% + ${t.offsetX}px)` }}>
              {t.text}
            </div>
          ))}

          <div className="absolute top-4 left-4 flex gap-4 z-10">
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-indigo-900/50 shadow-inner flex flex-col items-center">
              <span className="text-xs text-indigo-400 font-bold">HP</span>
              <span className="text-white font-black text-lg">{state.hp}/80</span>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-blue-900/50 shadow-inner flex flex-col items-center">
              <span className="text-xs text-blue-400 font-bold">ブロック</span>
              <span className="text-white font-black text-lg">{state.shield}</span>
            </div>
            <div className="bg-slate-950 px-6 py-2 rounded-lg border border-yellow-700/50 shadow-[0_0_15px_rgba(202,138,4,0.3)] flex flex-col items-center">
              <span className="text-xs text-yellow-400 font-bold tracking-widest">エナジー</span>
              <span className="text-white font-black text-2xl">{state.energy}</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            {state.buffs.acid && <span className="bg-red-800 px-2 py-1 rounded font-bold text-white shadow-lg animate-pulse text-xs">酸性</span>}
            {state.buffs.alkali && <span className="bg-blue-800 px-2 py-1 rounded font-bold text-white shadow-lg animate-pulse text-xs">アルカリ性</span>}
            {state.buffs.strata > 0 && <span className="bg-amber-700 px-2 py-1 rounded font-bold text-white shadow-lg text-xs">地層 {state.buffs.strata}</span>}
            {state.buffs.poison > 0 && <span className="bg-green-800 px-2 py-1 rounded font-bold text-white shadow-lg">毒 {state.buffs.poison}</span>}
            {state.buffs.nextAttackBonus > 0 && <span className="bg-orange-600 px-2 py-1 rounded font-bold text-white shadow-lg">攻撃力UP</span>}
            {state.buffs.counter > 0 && <span className="bg-indigo-600 px-2 py-1 rounded font-bold text-white shadow-lg">反射構え {state.buffs.counter}</span>}
            {state.buffs.weakness > 0 && <span className="bg-purple-600 px-2 py-1 rounded font-bold text-white shadow-lg">弱体化 {state.buffs.weakness}</span>}
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
                const canPlay = state.energy >= node.card.cost && state.turn === 'self';
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
                onClick={endTurn} disabled={state.turn !== 'self'}
                className={`px-4 py-3 font-black tracking-widest rounded-xl border-b-4 transition-all ${
                  state.turn === 'self' ? 'bg-yellow-500 border-yellow-700 text-black hover:bg-yellow-400 hover:translate-y-1 hover:border-b-0 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800 border-slate-900 text-slate-500'
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
