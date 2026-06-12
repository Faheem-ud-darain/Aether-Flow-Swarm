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
    { id: 'scoping', name: 'Scoping Agent', role: 'Feature & Timeline Scope', icon: FileText, x: 80, y: 240 },
    { id: 'risk', name: 'Risk Agent', role: 'Compliance & Safety Check', icon: Shield, x: 260, y: 240 },
    { id: 'hitl', name: 'Human-in-the-Loop', role: 'Manual Transaction Override', icon: UserCheck, x: 440, y: 110 },
    { id: 'ledger', name: 'Ledger Agent', role: 'Milestones & Budget Approval', icon: Landmark, x: 440, y: 370 },
  ];

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) return 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] bg-white text-cyan-600';
    switch (status) {
      case 'completed': return 'border-emerald-200 bg-emerald-50 text-emerald-600';
      case 'paused': return 'border-amber-200 bg-amber-50 text-amber-600 animate-pulse';
      case 'processing': return 'border-cyan-200 bg-cyan-50 text-cyan-600 animate-pulse';
      default: return 'border-slate-200 bg-white text-slate-400';
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping"></span>
            Active Swarm Flowchart
          </h2>
          <p className="text-xs text-slate-500">Visual agent pipeline execution & communication graph</p>
        </div>
      </div>

      <div className="relative w-full h-[510px] overflow-auto border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex items-center justify-center">
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
            d="M 180 240 L 260 240"
            stroke={nodesStatus.scoping === 'completed' || nodesStatus.scoping === 'processing' ? 'url(#gradient-scoping-risk)' : '#E2E8F0'}
            strokeWidth="3"
            fill="none"
            className={activeNodeId === 'scoping' ? 'stroke-dasharray-glow' : ''}
          />
          {activeNodeId === 'scoping' && (
            <circle r="4" fill="#22d3ee">
              <animateMotion dur="2s" repeatCount="indefinite" path="M 180 240 L 260 240" />
            </circle>
          )}

          {/* Path: Risk to HITL (Top Branch) */}
          <path
            d="M 360 240 C 400 240, 390 110, 440 110"
            stroke={nodesStatus.risk === 'paused' || nodesStatus.hitl !== 'idle' ? 'url(#gradient-risk-hitl)' : '#E2E8F0'}
            strokeWidth="3"
            fill="none"
          />
          {activeNodeId === 'risk' && nodesStatus['risk'] === 'paused' && (
            <circle r="4" fill="#f59e0b">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 360 240 C 400 240, 390 110, 440 110" />
            </circle>
          )}

          {/* Path: Risk to Ledger (Bottom Branch) */}
          <path
            d="M 360 240 C 400 240, 390 370, 440 370"
            stroke={nodesStatus.ledger !== 'idle' || (nodesStatus.risk === 'completed' && nodesStatus.hitl === 'idle') ? 'url(#gradient-risk-ledger)' : '#E2E8F0'}
            strokeWidth="3"
            fill="none"
          />
          {activeNodeId === 'risk' && nodesStatus['risk'] === 'completed' && (
            <circle r="4" fill="#10b981">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 360 240 C 400 240, 390 370, 440 370" />
            </circle>
          )}

          {/* Path: HITL to Ledger */}
          <path
            d="M 528 175 L 528 305"
            stroke={nodesStatus.hitl === 'completed' || nodesStatus.ledger !== 'idle' ? 'url(#gradient-hitl-ledger)' : '#E2E8F0'}
            strokeWidth="3"
            fill="none"
          />
          {activeNodeId === 'hitl' && nodesStatus['hitl'] === 'completed' && (
            <circle r="4" fill="#10b981">
              <animateMotion dur="1.5s" repeatCount="indefinite" path="M 528 175 L 528 305" />
            </circle>
          )}
        </svg>

        {/* Nodes Wrapper */}
        <div className="absolute w-[600px] h-[480px]">
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
                <div className="p-2 rounded-lg bg-slate-50 mb-2 text-current border border-slate-200">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-800">{node.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{node.role}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    status === 'completed' ? 'bg-emerald-500' :
                    status === 'paused' ? 'bg-amber-500 animate-pulse' :
                    status === 'processing' ? 'bg-cyan-500 animate-pulse' :
                    'bg-slate-300'
                  }`}></span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">{status}</span>
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
