import React, { useEffect, useRef, useState } from 'react';
import { Brain, CheckCircle, Unlock, Lock, Zap } from 'lucide-react';
import { Node, CATEGORIES } from '../data/biologyData';

interface Props {
  nodes: Node[];
  onNodeClick: (node: Node) => void;
}

interface LineDef {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
}

export default function SkillTree({ nodes, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LineDef[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const updateLines = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      
      setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });
      const newLines: LineDef[] = [];

      nodes.forEach(node => {
        if (node.prerequisites.length > 0) {
          const toEl = document.getElementById(`node-${node.id}`);
          node.prerequisites.forEach(preId => {
            const fromEl = document.getElementById(`node-${preId}`);
            if (fromEl && toEl) {
              const fromRect = fromEl.getBoundingClientRect();
              const toRect = toEl.getBoundingClientRect();
              
              const x1 = fromRect.left - containerRect.left + scrollLeft + fromRect.width / 2;
              const y1 = fromRect.top - containerRect.top + scrollTop + fromRect.height / 2;
              const x2 = toRect.left - containerRect.left + scrollLeft + toRect.width / 2;
              const y2 = toRect.top - containerRect.top + scrollTop + toRect.height / 2;

              const preNode = nodes.find(n => n.id === preId);
              const active = preNode?.status === 'completed' && (node.status === 'completed' || node.status === 'unlocked');

              newLines.push({ id: `${preId}-${node.id}`, x1, y1, x2, y2, active });
            }
          });
        }
      });
      setLines(newLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    
    const observer = new MutationObserver(updateLines);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', updateLines);
      observer.disconnect();
    };
  }, [nodes]);

  return (
    <section className="w-full bg-slate-900 border border-indigo-500/30 rounded-xl p-4 md:p-6 shadow-lg flex flex-col relative overflow-hidden h-[calc(100vh-12rem)]">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b border-indigo-500/30 pb-3 relative z-20">
        <Brain className="text-indigo-400" /> 
        知識のラボ (Skill Tree)
      </h2>
      
      <div 
        ref={containerRef} 
        className="flex-1 flex flex-col gap-8 overflow-y-auto relative custom-scrollbar pb-10"
      >
        <svg 
          className="absolute top-0 left-0 pointer-events-none" 
          style={{ width: svgSize.w, height: svgSize.h, zIndex: 0 }}
        >
          {lines.map(line => (
            <line
              key={line.id}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke={line.active ? '#06b6d4' : '#334155'}
              strokeWidth={line.active ? 3 : 2}
              strokeDasharray={line.active ? 'none' : '4 4'}
              className={`transition-all duration-500 ${line.active ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}`}
            />
          ))}
        </svg>

        {CATEGORIES.map(category => {
          const categoryNodes = nodes.filter(n => n.category === category.id);
          if (categoryNodes.length === 0) return null;

          return (
            <div key={category.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 relative z-10 backdrop-blur-sm">
              <h3 className="text-sm text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" /> {category.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryNodes.map(node => (
                  <div
                    key={node.id}
                    id={`node-${node.id}`}
                    onClick={() => node.status === 'unlocked' && onNodeClick(node)}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 relative overflow-hidden flex flex-col ${
                      node.status === 'completed' 
                        ? (node.subject === 'chemistry' ? 'bg-purple-900/60 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : node.subject === 'physics' ? 'bg-red-900/60 border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : node.subject === 'earth' ? 'bg-amber-900/60 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-indigo-900/60 border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.4)]')
                        : node.status === 'unlocked'
                        ? (node.subject === 'chemistry' ? 'bg-slate-800 border-purple-500/80 hover:bg-slate-700 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:-translate-y-1' : node.subject === 'physics' ? 'bg-slate-800 border-red-500/80 hover:bg-slate-700 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:-translate-y-1' : node.subject === 'earth' ? 'bg-slate-800 border-amber-500/80 hover:bg-slate-700 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:-translate-y-1' : 'bg-slate-800 border-cyan-500/80 hover:bg-slate-700 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:-translate-y-1')
                        : 'bg-slate-900 border-slate-800 opacity-70 cursor-not-allowed grayscale'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <h4 className="font-bold text-cyan-50">{node.title}</h4>
                      {node.status === 'completed' && <CheckCircle className="text-indigo-400 w-5 h-5" />}
                      {node.status === 'unlocked' && <Unlock className="text-cyan-400 w-5 h-5 animate-pulse" />}
                      {node.status === 'locked' && <Lock className="text-slate-500 w-5 h-5" />}
                    </div>
                    
                    {/* Card Info */}
                    <div className="flex gap-2 text-[10px] mt-auto pt-3 relative z-10 font-bold">
                      <span className={`px-2 py-1 rounded border ${
                        node.card.type === 'Attack' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                        node.card.type === 'Skill' ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' :
                        'text-purple-400 bg-purple-400/10 border-purple-400/20'
                      }`}>
                        {node.card.type} (コスト: {node.card.cost})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
