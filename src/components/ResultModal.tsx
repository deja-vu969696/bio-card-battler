import React from 'react';
import { Trophy, Skull, RotateCcw, BookOpen, SkipForward } from 'lucide-react';
import { Node, CATEGORIES } from '../data/biologyData';

interface Props {
  status: 'victory' | 'defeat';
  completedNodes: Node[];
  onRetry: () => void;
  onFullReset: () => void;
}

export default function ResultModal({ status, completedNodes, onRetry, onFullReset }: Props) {
  const isVictory = status === 'victory';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
      <div className={`w-full max-w-3xl rounded-3xl overflow-hidden border-4 ${
        isVictory ? 'border-yellow-400 bg-slate-900 shadow-[0_0_80px_rgba(250,204,21,0.3)]' : 'border-red-600 bg-slate-950 shadow-[0_0_50px_rgba(220,38,38,0.3)]'
      }`}>
         {/* Header */}
         <div className="p-8 text-center border-b border-slate-800 relative overflow-hidden">
            <div className={`absolute inset-0 opacity-20 pointer-events-none ${isVictory ? 'bg-gradient-to-t from-yellow-500 to-transparent' : 'bg-gradient-to-t from-red-600 to-transparent'}`} />
            {isVictory ? (
               <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce relative z-10" />
            ) : (
               <Skull className="w-24 h-24 mx-auto text-slate-500 mb-4 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] animate-pulse relative z-10" />
            )}
            <h2 className={`text-4xl md:text-5xl font-black tracking-widest relative z-10 ${isVictory ? 'text-yellow-400' : 'text-red-500'}`}>
               {isVictory ? 'VICTORY!' : 'DEFEAT...'}
            </h2>
            <p className="text-slate-300 mt-4 text-lg relative z-10 whitespace-pre-line leading-relaxed font-medium">
               {isVictory 
                 ? '見事、完全生物バイオ・キメラを撃破した！\n君の理科知識が世界を救ったのだ！' 
                 : 'ボスの強大な力の前に倒れてしまった...\nしかし、君が得た知識は失われない。ツリーで基礎を鍛え直そう！'}
            </p>
         </div>

         {/* Skills Review (Only for Victory) */}
         {isVictory && (
            <div className="p-6 max-h-[40vh] overflow-y-auto custom-scrollbar bg-slate-950/80">
               <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-lg">
                 <BookOpen className="text-indigo-400" /> 学習成果（獲得スキル: {completedNodes.length} 個）
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {completedNodes.map(n => (
                    <div key={n.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
                       <CheckCircleIcon className="text-indigo-400 w-5 h-5 flex-shrink-0" />
                       <div>
                         <div className="text-[10px] text-indigo-300 mb-0.5">{CATEGORIES.find(c => c.id === n.category)?.label}</div>
                         <div className="font-bold text-white text-sm">{n.title}</div>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
         )}

         {/* Actions */}
         <div className="p-6 bg-slate-900 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
               onClick={onRetry}
               className={`px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                 isVictory 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600' 
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-1'
               }`}
            >
               {isVictory ? <SkipForward className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
               {isVictory ? 'このままツリーに戻る' : '知識を維持して再挑戦'}
            </button>
            
            {isVictory && (
               <button
                 onClick={onFullReset}
                 className="px-8 py-4 rounded-xl font-bold bg-yellow-600 hover:bg-yellow-500 text-white transition-all shadow-[0_0_20px_rgba(202,138,4,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] hover:-translate-y-1 flex items-center justify-center gap-2 w-full sm:w-auto"
               >
                 <RotateCcw className="w-5 h-5" />
                 最初からやり直す
               </button>
            )}
         </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
