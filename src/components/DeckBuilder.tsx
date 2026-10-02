import React from 'react';
import { Node, CATEGORIES } from '../data/biologyData';
import { Lock, X, Swords, Shield, Scale, Plus } from 'lucide-react';
import { playCardPlaySound, playCardDrawSound, playSlashSound } from '../utils/audio';

interface Props {
  nodes: Node[];
  activeDeck: string[];
  setActiveDeck: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function DeckBuilder({ nodes, activeDeck, setActiveDeck }: Props) {
  const completedNodes = nodes.filter(n => n.status === 'completed');

  const handleAdd = (nodeId: string) => {
    if (activeDeck.length >= 8) {
       playSlashSound(); // エラー音代わり
       return;
    }
    playCardDrawSound();
    setActiveDeck(prev => [...prev, nodeId]);
  };

  const handleRemove = (nodeId: string) => {
    playCardPlaySound();
    setActiveDeck(prev => prev.filter(id => id !== nodeId));
  };

  const handleAutoBuild = (type: 'balance' | 'attack' | 'defense') => {
    if (completedNodes.length === 0) return;
    playCardDrawSound();
    
    let sorted = [...completedNodes];
    if (type === 'attack') {
      sorted.sort((a, b) => (a.card.type === 'Attack' ? -1 : 1));
    } else if (type === 'defense') {
      sorted.sort((a, b) => (a.card.type === 'Skill' ? -1 : 1));
    } else {
      sorted.sort(() => Math.random() - 0.5);
    }
    
    setActiveDeck(sorted.slice(0, 8).map(n => n.id));
  };

  const renderCard = (node: Node, context: 'active' | 'collection' | 'locked' | 'in_deck') => {
    const isLocked = context === 'locked';
    const inDeck = context === 'in_deck';
    const isActive = context === 'active';
    const isCollection = context === 'collection';
    
    return (
      <div 
        key={`${context}-${node.id}`} 
        onClick={() => {
          if (isActive) handleRemove(node.id);
          if (isCollection) handleAdd(node.id);
        }}
        className={`group relative p-3 rounded-xl border-2 flex flex-col h-48 transition-all ${
          isLocked ? 'border-slate-800 bg-slate-900 opacity-50 grayscale cursor-not-allowed' :
          inDeck ? 'border-slate-700 bg-slate-800 opacity-50 cursor-not-allowed' :
          isActive ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] ' + (node.subject === 'chemistry' ? 'border-purple-500/80 bg-gradient-to-b from-purple-950/40 to-slate-900' : node.subject === 'physics' ? 'border-red-500/80 bg-gradient-to-b from-red-950/40 to-slate-900' : node.subject === 'earth' ? 'border-amber-500/80 bg-gradient-to-b from-amber-950/40 to-slate-900' : 'border-cyan-500/80 bg-gradient-to-b from-cyan-950/40 to-slate-900') :
          'cursor-pointer hover:scale-105 hover:shadow-lg ' + (node.subject === 'chemistry' ? 'border-purple-500/50 hover:border-purple-400 bg-slate-900' : node.subject === 'physics' ? 'border-red-500/50 hover:border-red-400 bg-slate-900' : node.subject === 'earth' ? 'border-amber-500/50 hover:border-amber-400 bg-slate-900' : 'border-cyan-500/50 hover:border-cyan-400 bg-slate-900')
        }`}
      >
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-20 flex-col">
            <Lock className="text-slate-400 w-8 h-8 mb-2"/>
            <span className="text-xs text-slate-400 font-bold">ラボで解放</span>
          </div>
        )}
        {inDeck && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-20">
            <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">編成中</span>
          </div>
        )}
        {isActive && (
          <div className="absolute -top-3 -right-3 bg-red-600 rounded-full p-1.5 shadow-lg z-30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
            <X className="w-4 h-4 text-white" />
          </div>
        )}
        {isCollection && (
          <div className="absolute inset-0 bg-cyan-400/10 rounded-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <Plus className="w-12 h-12 text-cyan-400 drop-shadow-md" />
          </div>
        )}
        
        {/* Cost Orb */}
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-white shadow-[0_0_10px_rgba(255,255,255,0.3)] border-2 border-white/20 bg-gradient-to-br from-cyan-400 to-blue-700 z-10">
          {node.card.cost}
        </div>
        
        <div className="flex justify-between items-start mb-1 pl-4">
          <div className="text-[9px] text-slate-400 font-bold truncate mt-0.5 max-w-[50%]">
            {CATEGORIES.find(c => c.id === node.category)?.label.split(' ')[0]}
          </div>
          <div className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
            node.card.type === 'Attack' ? 'text-red-400 border-red-500/30 bg-red-950/50' : 
            node.card.type === 'Skill' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/50' : 
            'text-amber-400 border-amber-500/30 bg-amber-950/50'
          }`}>{node.card.type}</div>
        </div>
        
        <div className="font-bold text-white text-xs mb-1 text-center leading-tight">{node.card.name}</div>
        <div className="text-[10px] text-slate-300 leading-tight bg-slate-950/80 p-1.5 rounded flex-1 overflow-y-auto custom-scrollbar shadow-inner">
          {node.card.description}
        </div>
      </div>
    );
  };

  const activeNodes = activeDeck.map(id => nodes.find(n => n.id === id)).filter(Boolean) as Node[];
  const emptySlots = Math.max(0, 8 - activeNodes.length);

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar pb-6">
      
      {/* Top Pane: Active Deck */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 md:p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] flex-none">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 border-b border-cyan-900 pb-3 gap-4">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            バトルデッキ 
            <span className={`text-sm font-bold px-2 py-1 rounded ${activeDeck.length < 5 ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
              編成中: {activeDeck.length} / 8枚 (最小5枚)
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
             <button onClick={() => handleAutoBuild('balance')} className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-xs font-bold rounded border border-slate-700 flex items-center gap-1 transition-colors"><Scale className="w-3 h-3"/> バランス</button>
             <button onClick={() => handleAutoBuild('attack')} className="px-3 py-1.5 bg-slate-800 hover:bg-red-600 text-xs font-bold rounded border border-slate-700 flex items-center gap-1 transition-colors"><Swords className="w-3 h-3"/> 攻撃特化</button>
             <button onClick={() => handleAutoBuild('defense')} className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 text-xs font-bold rounded border border-slate-700 flex items-center gap-1 transition-colors"><Shield className="w-3 h-3"/> 耐久特化</button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 min-h-[12rem]">
           {activeNodes.map(node => renderCard(node, 'active'))}
           {Array.from({ length: emptySlots }).map((_, i) => (
             <div key={`empty-${i}`} className="border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50 h-48 flex items-center justify-center opacity-50">
               <span className="text-slate-600 font-bold text-xs">SLOT {activeNodes.length + i + 1}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Bottom Pane: Collection */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:p-6 flex-1">
        <h2 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>カードプール (全 {nodes.length} 種類)</span>
          <span className="text-sm font-normal text-slate-500">クリックしてデッキに追加</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-2">
          {nodes.map(node => {
            const context = node.status === 'locked' ? 'locked' : activeDeck.includes(node.id) ? 'in_deck' : 'collection';
            return renderCard(node, context);
          })}
        </div>
      </div>

    </div>
  );
}
