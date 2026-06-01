'use client';

import React from 'react';
import { Shield, FileText, Landmark, UserCheck, Play, ArrowRight } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<any>;
  x: number;
  y: number;
}

interface SwarmFlowchartProps {
  activeNodeId: string;
  nodesStatus: Record<string, 'idle' | 'processing' | 'paused' | 'completed'>;
}

export default function SwarmFlowchart({ activeNodeId, nodesStatus }: SwarmFlowchartProps) {
  const nodes: Node[] = [
    { id: 'scoping', name: 'Scoping Agent', role: 'Feature & Timeline Scope', icon: FileText, x: 80, y: 150 },
    { id: 'risk', name: 'Risk Agent', role: 'Compliance & Safety Check', icon: Shield, x: 260, y: 150 },
    { id: 'hitl', name: 'Human-in-the-Loop', role: 'Manual Transaction Override', icon: UserCheck, x: 440, y: 50 },
    { id: 'ledger', name: 'Ledger Agent', role: 'Milestones & Budget Approval', icon: Landmark, x: 440, y: 250 },
  ];

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) return 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] bg-slate-900/90 text-cyan-400';
    switch (status) {
      case 'completed': return 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400';
      case 'paused': return 'border-amber-500/50 bg-amber-950/20 text-amber-400 animate-pulse';
      case 'processing': return 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400 animate-pulse';
      default: return 'border-slate-800 bg-slate-950/40 text-slate-400';
    }
  };

  return (
    <div className="w-full bg-slate-950/50 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
            Active Swarm Flowchart
          </h2>
          <p className="text-xs text-slate-400">Visual agent pipeline execution & communication graph</p>
        </div>
      </div>

      <div className="relative w-full h-[320px] overflow-auto border border-slate-900 bg-slate-950/80 rounded-xl p-4 flex items-center justify-center">
        {/* SVG connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '600px' }}>
          <defs>
            <linearGradient id="gradient-scoping-risk" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gradient-risk-hitl" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gradient-risk-ledger" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="gradient-hitl-ledger" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Path: Scoping to Risk */}
          <path
            d="M 180 150 L 260 150"
            stroke={activeNodeId === 'scoping' ? 'url(#gradient-scoping-risk)' : '#1e293b'}
            strokeWidth="3"
            fill="none"
            className={activeNodeId === 'scoping' ? 'stroke-dasharray-glow' : ''}
          />
          {activeNodeId === 'scoping' && (
            <circle r="4" fill="#22d3ee">
              <animateMotion dur="2s" repeatCount="indefinite" path="M 180 150 L 260 150" />
            </circle>
          )}

          {/* Path: Risk to HITL (Top Branch) */}
          <path
            d="M 360 150 C 400 150, 390 50, 440 50"
            stroke={activeNodeId === 'risk' && nodesStatus['risk'] === 'paused' ? 'url(#gradient-risk-hitl)' : '#1e293b'}
            strokeWidth="3"
            fill="none"
          />
          {activeNodeId === 'risk' && nodesStatus['risk'] === 'paused' && (
            <circle r="4" fill="#f59e0b">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 360 150 C 400 150, 390 50, 440 50" />
            </circle>
          )}

          {/* Path: Risk to Ledger (Bottom Branch) */}
          <path
            d="M 360 150 C 400 150, 390 250, 440 250"
            stroke={activeNodeId === 'risk' && nodesStatus['risk'] === 'completed' ? 'url(#gradient-risk-ledger)' : '#1e293b'}
            strokeWidth="3"
            fill="none"
          />
          {activeNodeId === 'risk' && nodesStatus['risk'] === 'completed' && (
            <circle r="4" fill="#10b981">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 360 150 C 400 150, 390 250, 440 250" />
            </circle>
          )}

          {/* Path: HITL to Ledger */}
          <path
            d="M 490 100 L 490 200"
            stroke={activeNodeId === 'hitl' && nodesStatus['hitl'] === 'completed' ? 'url(#gradient-hitl-ledger)' : '#1e293b'}
            strokeWidth="3"
            fill="none"
          />
          {activeNodeId === 'hitl' && nodesStatus['hitl'] === 'completed' && (
            <circle r="4" fill="#10b981">
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M 490 100 L 490 200" />
            </circle>
          )}
        </svg>

        {/* Nodes Wrapper */}
        <div className="absolute w-[600px] h-[300px]">
          {nodes.map((node) => {
            const IconComponent = node.icon;
            const status = nodesStatus[node.id] || 'idle';
            const isActive = activeNodeId === node.id;
            const statusClass = getStatusColor(status, isActive);

            return (
              <div
                key={node.id}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute transform -translate-y-1/2 w-44 p-3 rounded-xl border backdrop-blur-md transition-all duration-300 ${statusClass} flex flex-col items-center text-center`}
              >
                <div className="p-2 rounded-lg bg-slate-950/80 mb-2 text-current border border-slate-800">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="font-semibold text-xs text-slate-100">{node.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{node.role}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    status === 'completed' ? 'bg-emerald-500' :
                    status === 'paused' ? 'bg-amber-500 animate-pulse' :
                    status === 'processing' ? 'bg-cyan-400 animate-pulse' :
                    'bg-slate-700'
                  }`}></span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">{status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx global>{`
        .stroke-dasharray-glow {
          stroke-dasharray: 8;
          animation: dash 30s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
    </div>
  );
}
