'use client';

import React from 'react';
import { LogMessage } from './AgentLogs';

interface AgentTerminalProps {
  logs: LogMessage[];
  onIntervene?: () => void;
  nodesStatus: Record<string, 'idle' | 'processing' | 'paused' | 'completed'>;
}

export default function AgentTerminal({ logs, onIntervene, nodesStatus }: AgentTerminalProps) {
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'error': return 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getAgentLabel = (agent: string) => {
    switch (agent) {
      case 'scoping': return 'Scoping Agent';
      case 'risk': return 'Risk Agent';
      case 'hitl': return 'Human-in-the-Loop';
      case 'ledger': return 'Ledger Agent';
      case 'system': return 'System Router';
      default: return 'System';
    }
  };

  const isAwaitingHuman = nodesStatus?.hitl === 'processing';

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden font-mono text-sm">
      {/* Terminal Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-500 pl-2 text-xs font-semibold uppercase tracking-wider">Band SDK Swarm Monitor</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live Listening</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-5 space-y-3 min-h-[320px] max-h-[450px] overflow-y-auto bg-slate-50/30">
        {logs.length === 0 ? (
          <div className="text-slate-400 italic text-xs pl-3 pt-2">
            Awaiting swarm deployment context... Click "Deploy Context to Swarm" above to begin.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 border-l-2 border-slate-200 pl-3 py-1 hover:bg-white transition-colors">
              <span className="text-slate-400 select-none text-xs pt-0.5">[{log.timestamp}]</span>
              <div className="flex-1">
                <span className="font-bold text-slate-800 mr-2">{getAgentLabel(log.agent)}:</span>
                <span className="text-slate-600">{log.message}</span>
              </div>
              {log.agent === 'system' && log.type === 'error' && isAwaitingHuman && onIntervene && (
                <button 
                  onClick={onIntervene}
                  className="text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors mr-2 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse"
                >
                  INTERVENE
                </button>
              )}
              <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold uppercase ${getStatusColor(log.type)}`}>
                {log.type}
              </span>
            </div>
          ))
        )}
        
        {isAwaitingHuman && (
          <div className="text-amber-500 animate-pulse text-xs pl-3 pt-2 flex items-center space-x-1">
            <span className="inline-block w-1.5 h-3 bg-amber-500 animate-pulse"></span>
            <span>Swarm suspended. Human approval gate active. Awaiting decision...</span>
          </div>
        )}
      </div>
    </div>
  );
}
