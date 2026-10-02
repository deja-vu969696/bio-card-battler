import codecs

content = """import React, { useState, useEffect } from 'react';
import { Node, Subject } from '../data/biologyData';
import { Layers, Zap, FlaskConical, Globe, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { playCardPlaySound, playCardDrawSound, playSlashSound } from '../utils/audio';

interface Props {
  nodes: Node[];
  activeDeck: string[];
  setActiveDeck: React.Dispatch<React.SetStateAction<string[]>>;
}

const SUBJECT_ICONS = {
  biology: <Layers className="w-5 h-5" />,
  chemistry: <FlaskConical className="w-5 h-5" />,
  physics: <Zap className="w-5 h-5" />,
  earth: <Globe className="w-5 h-5" />,
  neutral: <BookOpen className="w-5 h-5" />
};

const SUBJECT_NAMES = {
  biology: '生物 (Biology)',
  chemistry: '化学 (Chemistry)',
  physics: '物理 (Physics)',
  earth: '地学 (Earth)'
};

export default function DeckBuilder({ nodes, activeDeck, setActiveDeck }: Props) {
  const [selectedClass, setSelectedClass] = useState<Subject>('biology');

  // クラスが変更されたら、中立以外の他クラスカードを自動的に外す
  useEffect(() => {
    setActiveDeck(prev => {
      const valid = prev.filter(id => {
        const node = nodes.find(n => n.id === id);
        if (!node) return false;
        return node.subject === selectedClass || node.subject === 'neutral';
      });
      if (valid.length !== prev.length) return valid;
      return prev;
    });
  }, [selectedClass, nodes, setActiveDeck]);

  const completedNodes = nodes.filter(n => n.status === 'completed');
  
  // 利用可能なカード（選択クラス ＋ 中立）
  const availableNodes = completedNodes.filter(n => n.subject === selectedClass || n.subject === 'neutral');

  const deckNodes = activeDeck.map(id => nodes.find(n => n.id === id)).filter((n): n is Node => n !== undefined);
  const classCount = deckNodes.filter(n => n.subject === selectedClass).length;
  const neutralCount = deckNodes.filter(n => n.subject === 'neutral').length;

  const handleAdd = (node: Node) => {
    if (activeDeck.length >= 8) {
       playSlashSound(); 
       return;
    }
    if (node.subject === 'neutral' && neutralCount >= 3) {
       playSlashSound(); // 中立は3枚まで
       return;
    }
    // 同じカードは3枚まで
    if (activeDeck.filter(id => id === node.id).length >= 3) {
       playSlashSound();
       return;
    }
    
    playCardDrawSound();
    setActiveDeck(prev => [...prev, node.id]);
  };

  const handleRemove = (index: number) => {
    playCardPlaySound();
    setActiveDeck(prev => {
      const newDeck = [...prev];
      newDeck.splice(index, 1);
      return newDeck;
    });
  };

  const handleClear = () => {
    playCardPlaySound();
    setActiveDeck([]);
  };

  const isValid = activeDeck.length === 8 && classCount >= 5 && neutralCount <= 3;

  return (
    <div className="flex flex-col md:flex-row h-full gap-4">
      {/* メインクラス選択＆デッキ表示領域 */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        
        <div className="bg-slate-900 border-2 border-indigo-500/30 p-4 rounded-xl flex flex-col gap-3">
          <div className="text-cyan-400 font-black tracking-widest border-b border-indigo-500/30 pb-2 flex items-center justify-between">
            <span>専任クラス選択</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {(['biology', 'chemistry', 'physics', 'earth'] as Subject[]).map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedClass(sub)}
                className={`p-2 rounded-lg flex items-center gap-2 justify-center font-bold text-sm transition-all ${
                  selectedClass === sub 
                  ? (sub === 'biology' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.6)]' :
                     sub === 'chemistry' ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.6)]' :
                     sub === 'physics' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]' :
                     'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.6)]')
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {SUBJECT_ICONS[sub]}
                {SUBJECT_NAMES[sub].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border-2 border-cyan-500/30 flex-1 p-4 rounded-xl flex flex-col">
          <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
            <h2 className="text-cyan-400 font-black tracking-widest">現在のデッキ ({activeDeck.length} / 8)</h2>
            <button onClick={handleClear} className="text-slate-500 hover:text-red-400 p-1 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-300 bg-slate-800 p-2 rounded">
              <span className="flex items-center gap-1">{SUBJECT_ICONS[selectedClass]} クラスカード</span>
              <span className={classCount < 5 && activeDeck.length === 8 ? 'text-red-400' : 'text-green-400'}>{classCount} 枚 (最低5)</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-300 bg-slate-800 p-2 rounded">
              <span className="flex items-center gap-1">{SUBJECT_ICONS['neutral']} 中立カード</span>
              <span className={neutralCount > 3 ? 'text-red-400' : 'text-blue-400'}>{neutralCount} 枚 (最大3)</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
            {deckNodes.map((n, idx) => (
              <div 
                key={`${n.id}-${idx}`}
                onClick={() => handleRemove(idx)}
                className={`p-2 rounded bg-slate-800 border cursor-pointer hover:bg-red-900/50 hover:border-red-500/50 flex justify-between items-center transition-colors ${
                  n.subject === 'chemistry' ? 'border-purple-500/30' : 
                  n.subject === 'physics' ? 'border-red-500/30' : 
                  n.subject === 'earth' ? 'border-amber-500/30' : 
                  n.subject === 'neutral' ? 'border-slate-400/50' : 
                  'border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                    n.card.type === 'Attack' ? 'text-red-400 bg-red-950/50' : 
                    n.card.type === 'Skill' ? 'text-cyan-400 bg-cyan-950/50' : 
                    'text-amber-400 bg-amber-950/50'
                  }`}>{n.card.type.charAt(0)}</span>
                  <span className="text-sm font-bold text-slate-200">{n.card.name}</span>
                </div>
                <span className="text-xs font-black text-white bg-slate-950 px-2 py-0.5 rounded-full border border-slate-700">
                  {n.card.cost}
                </span>
              </div>
            ))}
            
            {activeDeck.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-8">カードを選んで追加してください</div>
            )}
          </div>
          
          {!isValid && activeDeck.length === 8 && (
            <div className="mt-2 text-red-400 text-xs font-bold flex items-center justify-center gap-1 bg-red-950/50 p-2 rounded border border-red-900">
              <AlertCircle className="w-3 h-3" /> 条件を満たしていません
            </div>
          )}
        </div>
      </div>

      {/* カードプール領域 */}
      <div className="w-full md:w-2/3 bg-slate-900 border-2 border-indigo-500/30 p-4 rounded-xl flex flex-col">
        <h2 className="text-indigo-400 font-black tracking-widest border-b border-indigo-500/30 pb-2 mb-4 flex items-center gap-2">
          {SUBJECT_ICONS[selectedClass]} 利用可能なカード
        </h2>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableNodes.map(node => {
              const countInDeck = activeDeck.filter(id => id === node.id).length;
              return (
                <div 
                  key={node.id} 
                  onClick={() => handleAdd(node)}
                  className={`group relative p-3 rounded-xl border-2 flex flex-col h-48 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
                    countInDeck >= 3 ? 'opacity-50 grayscale cursor-not-allowed border-slate-700' :
                    node.subject === 'chemistry' ? 'border-purple-500/50 hover:border-purple-400 bg-slate-900' : 
                    node.subject === 'physics' ? 'border-red-500/50 hover:border-red-400 bg-slate-900' : 
                    node.subject === 'earth' ? 'border-amber-500/50 hover:border-amber-400 bg-slate-900' : 
                    node.subject === 'neutral' ? 'border-slate-500/50 hover:border-slate-300 bg-slate-900' : 
                    'border-cyan-500/50 hover:border-cyan-400 bg-slate-900'
                  }`}
                >
                  <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-white shadow-lg border-2 border-white/20 ${
                    node.subject === 'chemistry' ? 'bg-gradient-to-br from-purple-400 to-purple-700' :
                    node.subject === 'physics' ? 'bg-gradient-to-br from-red-400 to-red-700' :
                    node.subject === 'earth' ? 'bg-gradient-to-br from-amber-400 to-amber-700' :
                    node.subject === 'neutral' ? 'bg-gradient-to-br from-slate-400 to-slate-700' :
                    'bg-gradient-to-br from-cyan-400 to-blue-700'
                  }`}>
                    {node.card.cost}
                  </div>
                  
                  {countInDeck > 0 && (
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center font-black text-white text-xs border-2 border-slate-900 z-10 shadow-lg">
                      {countInDeck}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2 pl-4">
                    <div className="text-[9px] text-slate-400 font-bold truncate mt-1 flex-1 text-left">
                      {node.subject === 'neutral' ? '中立' : SUBJECT_NAMES[node.subject].split(' ')[0]}
                    </div>
                    <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      node.card.type === 'Attack' ? 'text-red-400 border-red-500/30 bg-red-950/50' : 
                      node.card.type === 'Skill' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/50' : 
                      'text-amber-400 border-amber-500/30 bg-amber-950/50'
                    }`}>{node.card.type}</div>
                  </div>
                  
                  <div className={`font-bold text-sm text-center mb-2 ${
                    node.subject === 'chemistry' ? 'text-purple-300' :
                    node.subject === 'physics' ? 'text-red-300' :
                    node.subject === 'earth' ? 'text-amber-300' :
                    node.subject === 'neutral' ? 'text-slate-300' :
                    'text-cyan-300'
                  }`}>{node.card.name}</div>
                  
                  <div className="text-[10px] text-slate-300 leading-tight bg-slate-950/80 p-2 rounded flex-1 overflow-y-auto custom-scrollbar">
                    {node.card.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
"""

with codecs.open('src/components/DeckBuilder.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("DeckBuilder updated")
"""

with codecs.open('update_deckbuilder.py', 'w', encoding='utf-8') as f:
    f.write(content)

