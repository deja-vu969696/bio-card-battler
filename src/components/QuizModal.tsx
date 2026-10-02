import React, { useState } from 'react';
import { Brain, CheckCircle, XCircle } from 'lucide-react';
import { Node } from '../data/biologyData';

interface Props {
  node: Node;
  onClose: () => void;
  onComplete: (isCorrect: boolean) => void;
}

export default function QuizModal({ node, onClose, onComplete }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleOptionClick = (idx: number) => {
    const correct = idx === node.quiz.answerIndex;
    setIsCorrect(correct);
    setShowExplanation(true);
  };

  const handleClose = () => {
    if (isCorrect) {
      onComplete(true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl md:text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Brain /> スキル獲得試験: {node.title}
          </h2>
        </div>
        
        <div className="p-6">
          {!showExplanation ? (
            <>
              <p className="text-base md:text-lg text-slate-200 mb-8 leading-relaxed">
                {node.quiz.question}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {node.quiz.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    className="text-left p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-400 hover:bg-slate-750 transition-all font-medium text-slate-300 hover:text-white"
                  >
                    {idx + 1}. {option}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center mb-4">
                {isCorrect ? (
                  <CheckCircle className="w-16 h-16 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />
                )}
              </div>
              <div className={`text-3xl font-bold mb-6 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'SUCCESS!' : 'FAILED...'}
              </div>
              
              {/* 解説（学習ポイント） */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 text-left mb-8 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4"/> 学習ポイント
                </h4>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {node.quiz.explanation}
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className={`px-10 py-4 font-bold rounded-xl transition-all hover:scale-105 ${
                  isCorrect 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white shadow-lg'
                }`}
              >
                {isCorrect ? 'スキル獲得！' : '閉じる'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
