"use client";

import React, { useEffect, useState } from 'react';
import { RotateCcw, Beaker, Library, Swords, Volume2, VolumeX, AlertTriangle, Users } from 'lucide-react';
import { INITIAL_NODES, Node } from '../data/biologyData';
import SkillTree from '../components/SkillTree';
import BattleArena from '../components/BattleArena';
import DeckBuilder from '../components/DeckBuilder';
import PvpLobby from '../components/PvpLobby';
import PvpArena from '../components/PvpArena';
import QuizModal from '../components/QuizModal';
import ResultModal from '../components/ResultModal';
import { initAudio, toggleMute, getMuteState, playSlashSound } from '../utils/audio';

export default function GamePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const [activeTab, setActiveTab] = useState<'lab' | 'deck' | 'battle' | 'pvp'>('lab');
  const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const [activeDeck, setActiveDeck] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // PVP State
  const [pvpRoom, setPvpRoom] = useState<{code: string, isHost: boolean} | null>(null);

  useEffect(() => {
    const savedNodes = localStorage.getItem('rika_nodes');
    if (savedNodes) {
      const parsedNodes: Node[] = JSON.parse(savedNodes);
      const mergedNodes = INITIAL_NODES.map(initNode => {
        const saved = parsedNodes.find(n => n.id === initNode.id);
        return saved ? { ...initNode, status: saved.status } : initNode;
      });
      setNodes(mergedNodes);
    }
    
    const savedDeck = localStorage.getItem('rika_activeDeck');
    if (savedDeck) setActiveDeck(JSON.parse(savedDeck));
    
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('rika_nodes', JSON.stringify(nodes));
    localStorage.setItem('rika_activeDeck', JSON.stringify(activeDeck));
  }, [nodes, activeDeck, isMounted]);

  const completedNodes = nodes.filter(n => n.status === 'completed');

  const handleFullReset = () => {
    if (confirm('すべての進捗（獲得スキル・デッキ）をリセットして最初からやり直しますか？')) {
      setNodes(INITIAL_NODES);
      setActiveDeck([]);
      setActiveTab('lab');
      setGameResult(null);
      setPvpRoom(null);
    }
  };

  const handleTabChange = (tab: 'lab' | 'deck' | 'battle' | 'pvp') => {
    initAudio(); 
    
    if ((tab === 'battle' || tab === 'pvp') && activeDeck.length < 5) {
      playSlashSound(); 
      setToastMsg(`デッキを5枚以上セットしてください（現在 ${activeDeck.length}枚）`);
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    
    // PVPから別のタブへ移動する場合、対戦を破棄する
    if (activeTab === 'pvp' && tab !== 'pvp') {
      setPvpRoom(null);
    }

    setActiveTab(tab);
  };

  const handleMuteToggle = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleQuizComplete = (isCorrect: boolean) => {
    if (!selectedNode || !isCorrect) return;

    if (activeDeck.length < 8 && !activeDeck.includes(selectedNode.id)) {
      setActiveDeck(prev => [...prev, selectedNode.id]);
    }

    const newNodes = nodes.map(n => {
      if (n.id === selectedNode.id) return { ...n, status: 'completed' as const };
      return n;
    });

    const updatedNodes = newNodes.map(n => {
      if (n.status === 'locked') {
        const canUnlock = n.prerequisites.every(pId => newNodes.find(pn => pn.id === pId)?.status === 'completed');
        if (canUnlock) return { ...n, status: 'unlocked' as const };
      }
      return n;
    });

    setNodes(updatedNodes);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-cyan-500">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
        <div className="font-bold tracking-widest animate-pulse">LOADING PROTOCOL...</div>
      </div>
    );
  }

  const activeDeckNodes = completedNodes.filter(n => activeDeck.includes(n.id));

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-50 font-sans p-4 md:p-6 flex flex-col" onClick={() => initAudio()}>
      
      {toastMsg && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border-2 border-red-500 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-5 h-5" />
          {toastMsg}
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 flex-1">
        
        <header className="flex flex-col lg:flex-row justify-between items-center bg-slate-900 border border-indigo-500/50 p-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.15)] flex-none relative z-10">
          <div className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            BIO-CARD BATTLER
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4 lg:mt-0">
            <button 
              onClick={() => handleTabChange('lab')}
              className={`px-3 md:px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm md:text-base ${activeTab === 'lab' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Beaker className="w-4 h-4" /> ラボ (ツリー)
            </button>
            <button 
              onClick={() => handleTabChange('deck')}
              className={`px-3 md:px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm md:text-base ${activeTab === 'deck' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Library className="w-4 h-4" /> デッキ構築 ({activeDeck.length}/8)
            </button>
            <button 
              onClick={() => handleTabChange('battle')}
              className={`px-3 md:px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm md:text-base ${activeTab === 'battle' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Swords className="w-4 h-4" /> 対ボス戦
            </button>
            <button 
              onClick={() => handleTabChange('pvp')}
              className={`px-3 md:px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-sm md:text-base ${activeTab === 'pvp' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Users className="w-4 h-4" /> PVP対戦
            </button>
            
            <div className="flex ml-2 border-l border-slate-700 pl-4 gap-2">
              <button 
                onClick={handleMuteToggle}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-full transition-all"
                title={isMuted ? "ミュート解除" : "ミュート"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button 
                onClick={handleFullReset}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full transition-all"
                title="進捗をリセットして最初から"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 relative z-10">
          {activeTab === 'lab' && <SkillTree nodes={nodes} onNodeClick={setSelectedNode} />}
          {activeTab === 'deck' && <DeckBuilder nodes={nodes} activeDeck={activeDeck} setActiveDeck={setActiveDeck} />}
          {activeTab === 'battle' && <BattleArena key="battle-instance" deck={activeDeckNodes} onVictory={() => setGameResult('victory')} onDefeat={() => setGameResult('defeat')} />}
          
          {activeTab === 'pvp' && !pvpRoom && (
            <PvpLobby 
              deckCount={activeDeck.length} 
              onStartMatch={(code, host) => setPvpRoom({ code, isHost: host })} 
            />
          )}

          {activeTab === 'pvp' && pvpRoom && (
            <PvpArena 
              key={`pvp-${pvpRoom.code}`}
              roomCode={pvpRoom.code} 
              isHost={pvpRoom.isHost} 
              deck={activeDeckNodes}
              onLeave={() => { setPvpRoom(null); setActiveTab('lab'); }}
            />
          )}
        </main>
      </div>

      {selectedNode && activeTab === 'lab' && (
        <QuizModal 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          onComplete={handleQuizComplete} 
        />
      )}

      {gameResult && (
        <ResultModal 
          status={gameResult} 
          completedNodes={activeDeckNodes} 
          onRetry={() => { setGameResult(null); setActiveTab('lab'); }} 
          onFullReset={handleFullReset}
        />
      )}
    </div>
  );
}
