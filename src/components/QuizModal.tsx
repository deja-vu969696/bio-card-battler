"use client";

import React, { useState, useMemo } from 'react';
import { Brain, CheckCircle, XCircle } from 'lucide-react';
import { Node } from '../data/biologyData';
import quizzesRaw from '../../quizzes.json';

const quizzesData = quizzesRaw as Record<string, any[]>;

interface Props {
  node: Node;
  onClose: () => void;
  onComplete: (isCorrect: boolean) => void;
}

export default function QuizModal({ node, onClose, onComplete }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const quiz = useMemo(() => {
    if (node.quizKey && quizzesData[node.quizKey] && quizzesData[node.quizKey].length > 0) {
      const pool = quizzesData[node.quizKey];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Fallback if quizKey not found
    return {
      type: 'multiple_choice',
      text: node.quiz.question,
      options: node.quiz.options,
      correctIndex: node.quiz.answerIndex,
      explanation: node.quiz.explanation
    };
  }, [node]);

  const [inputText, setInputText] = useState('');
  const [orderState, setOrderState] = useState<number[]>([]);

  const handleMultipleChoice = (idx: number) => {
    setIsCorrect(idx === quiz.correctIndex);
    setShowExplanation(true);
  };

  const handleTrueFalse = (val: boolean) => {
    const expected = typeof quiz.isTrue === 'string' ? quiz.isTrue.toLowerCase() === 'true' : quiz.isTrue;
    setIsCorrect(val === expected);
    setShowExplanation(true);
  };

  const handleTextInput = () => {
    setIsCorrect(inputText.trim() === quiz.correctAnswer);
    setShowExplanation(true);
  };

  const handleOrderSelect = (idx: number) => {
    if (orderState.includes(idx)) {
      setOrderState(prev => prev.filter(i => i !== idx));
    } else {
      setOrderState(prev => [...prev, idx]);
    }
  };

  const handleOrderSubmit = () => {
    if (orderState.length !== quiz.items.length) return;
    const isMatched = orderState.every((val, i) => val === quiz.correctOrder[i]);
    setIsCorrect(isMatched);
    setShowExplanation(true);
  };

  const handleClose = () => {
    if (isCorrect) onComplete(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-slate-900 border-2 rounded-2xl w-full max-w-2xl overflow-hidden ${
        node.subject === 'chemistry' ? 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 
        'border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.2)]'
      }`}>
        <div className="p-6 border-b border-slate-800">
          <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${node.subject === 'chemistry' ? 'text-purple-400' : 'text-cyan-400'}`}>
            <Brain /> スキル獲得試験: {node.title}
          </h2>
        </div>
        
        <div className="p-6">
          {!showExplanation ? (
            <>
              <p className="text-base md:text-lg text-slate-200 mb-8 leading-relaxed">
                {quiz.text}
              </p>
              
              {/* --- Multiple Choice --- */}
              {quiz.type === 'multiple_choice' && (
                <div className="grid grid-cols-1 gap-3">
                  {quiz.options.map((option: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleMultipleChoice(idx)}
                      className={`text-left p-4 rounded-lg bg-slate-800 border border-slate-700 transition-all font-medium text-slate-300 hover:text-white ${node.subject === 'chemistry' ? 'hover:border-purple-400 hover:bg-slate-750' : 'hover:border-cyan-400 hover:bg-slate-750'}`}
                    >
                      {idx + 1}. {option}
                    </button>
                  ))}
                </div>
              )}

              {/* --- True / False --- */}
              {quiz.type === 'true_false' && (
                <div className="flex gap-4">
                  <button onClick={() => handleTrueFalse(true)} className="flex-1 p-6 rounded-lg bg-slate-800 border border-slate-700 hover:border-green-400 hover:bg-slate-750 transition-all text-xl font-bold text-slate-200">
                    〇 (True)
                  </button>
                  <button onClick={() => handleTrueFalse(false)} className="flex-1 p-6 rounded-lg bg-slate-800 border border-slate-700 hover:border-red-400 hover:bg-slate-750 transition-all text-xl font-bold text-slate-200">
                    ✕ (False)
                  </button>
                </div>
              )}

              {/* --- Text Input --- */}
              {quiz.type === 'text_input' && (
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="答えを入力..." 
                    className="p-4 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-lg"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTextInput(); }}
                  />
                  <button onClick={handleTextInput} className="p-4 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold transition-colors">
                    回答する
                  </button>
                </div>
              )}

              {/* --- Ordering --- */}
              {quiz.type === 'ordering' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-slate-400">正しい順番にタップしてください。</p>
                  <div className="flex flex-col gap-2">
                    {quiz.items.map((item: string, idx: number) => {
                      const selectedIdx = orderState.indexOf(idx);
                      const isSelected = selectedIdx !== -1;
                      return (
                        <button 
                          key={idx}
                          onClick={() => handleOrderSelect(idx)}
                          className={`p-4 rounded-lg text-left transition-all border font-medium ${
                            isSelected 
                              ? 'bg-cyan-900 border-cyan-400 text-white' 
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-700'
                          }`}
                        >
                          {isSelected && <span className="font-bold text-cyan-300 mr-2">{selectedIdx + 1}.</span>}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={handleOrderSubmit} 
                    disabled={orderState.length !== quiz.items.length}
                    className="mt-4 p-4 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
                  >
                    回答する
                  </button>
                </div>
              )}
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
              
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 text-left mb-8 shadow-inner relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${node.subject === 'chemistry' ? 'bg-purple-500' : 'bg-cyan-500'}`} />
                <h4 className={`font-bold mb-2 flex items-center gap-2 ${node.subject === 'chemistry' ? 'text-purple-400' : 'text-cyan-400'}`}>
                  <Brain className="w-4 h-4"/> 学習ポイント
                </h4>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {quiz.explanation}
                </p>
                {/* 答えの表示（間違い用） */}
                {!isCorrect && quiz.type === 'text_input' && (
                  <p className="mt-4 text-red-400 font-bold text-sm">正解: {quiz.correctAnswer}</p>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className={`px-10 py-4 font-bold rounded-xl transition-all hover:scale-105 ${
                  isCorrect 
                    ? (node.subject === 'chemistry' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)]')
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
