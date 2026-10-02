import React, { useState } from 'react';
import { Users, Copy, Check, Swords, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { playCardPlaySound, playHealSound, playSlashSound } from '../utils/audio';

interface Props {
  onStartMatch: (roomCode: string, isHost: boolean) => void;
  deckCount: number;
}

export default function PvpLobby({ onStartMatch, deckCount }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'hosting' | 'joining'>('idle');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (deckCount < 5) {
      playSlashSound();
      setMessage('エラー: デッキを5枚以上セットしてください');
      return;
    }

    playCardPlaySound();
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(code);
    setStatus('hosting');
    setMessage('対戦相手の参加を待っています...');
    
    const channel = supabase.channel(`room_${code}`);
    channel.on('broadcast', { event: 'join' }, () => {
       playHealSound(); // マッチング成立音
       channel.send({ type: 'broadcast', event: 'start', payload: {} });
       onStartMatch(code, true);
    }).subscribe();
  };

  const handleJoinRoom = async () => {
    if (deckCount < 5) {
      playSlashSound();
      setMessage('エラー: デッキを5枚以上セットしてください');
      return;
    }
    if (!joinCode || joinCode.length !== 4) {
      playSlashSound();
      setMessage('エラー: 正しい4桁のルームコードを入力してください');
      return;
    }

    playCardPlaySound();
    setStatus('joining');
    setMessage('ルームに接続中...');
    
    const channel = supabase.channel(`room_${joinCode.toUpperCase()}`);
    channel.on('broadcast', { event: 'start' }, () => {
       playHealSound(); // マッチング成立音
       onStartMatch(joinCode.toUpperCase(), false);
    }).subscribe((status) => {
       if (status === 'SUBSCRIBED') {
         channel.send({ type: 'broadcast', event: 'join', payload: {} });
       }
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
      
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-8 max-w-2xl w-full shadow-[0_0_30px_rgba(99,102,241,0.2)] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>
        
        <Users className="w-16 h-16 mx-auto text-indigo-400 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        <h2 className="text-3xl font-black text-white mb-2 tracking-widest">PVP BATTLE LOBBY</h2>
        <p className="text-slate-400 mb-8">リアルタイムで他のプレイヤーと対戦します。</p>

        {deckCount < 5 && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-center justify-center gap-2 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            対戦に参加するにはデッキに最低5枚のカードが必要です
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Host Section */}
          <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4">
            <h3 className="text-lg font-bold text-cyan-400">ホストとして参加</h3>
            
            {status === 'hosting' ? (
              <div className="w-full">
                <div className="text-sm text-slate-400 mb-2">ルームコード</div>
                <div className="text-4xl font-black text-white tracking-widest bg-slate-900 py-3 rounded-lg border border-slate-700 mb-3 flex items-center justify-center gap-3">
                  {roomCode}
                  <button onClick={copyCode} className="text-slate-400 hover:text-white transition-colors">
                    {copied ? <Check className="w-6 h-6 text-green-400" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>
                <div className="text-cyan-400 animate-pulse text-sm font-bold">{message}</div>
              </div>
            ) : (
              <button 
                onClick={handleCreateRoom}
                disabled={status !== 'idle'}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1"
              >
                ルームを作る
              </button>
            )}
          </div>

          {/* Join Section */}
          <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4">
            <h3 className="text-lg font-bold text-red-400">ゲストとして参加</h3>
            
            <div className="w-full">
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="4桁のコード"
                maxLength={4}
                disabled={status !== 'idle'}
                className="w-full bg-slate-900 border-2 border-slate-700 text-white font-black text-2xl text-center py-3 rounded-lg focus:outline-none focus:border-red-500 uppercase tracking-widest mb-4 placeholder-slate-600"
              />
              <button 
                onClick={handleJoinRoom}
                disabled={status !== 'idle' || joinCode.length !== 4}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                対戦に参加
              </button>
            </div>
            
            {status === 'joining' && (
              <div className="text-red-400 animate-pulse text-sm font-bold">{message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
