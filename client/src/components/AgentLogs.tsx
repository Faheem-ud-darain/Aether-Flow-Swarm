'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, FileText, Landmark, UserCheck, Search, ArrowDown } from 'lucide-react';

export interface LogMessage {
  id: string;
  timestamp: string;
  agent: 'scoping' | 'risk' | 'hitl' | 'ledger' | 'system';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: any;
}

interface AgentLogsProps {
  logs: LogMessage[];
  onClear: () => void;
}

export default function AgentLogs({ logs, onClear }: AgentLogsProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.agent === filter;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                          log.agent.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getAgentStyles = (agent: string) => {
    switch (agent) {
      case 'scoping': return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: FileText };
      case 'risk': return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Shield };
      case 'hitl': return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: UserCheck };
      case 'ledger': return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Landmark };
      default: return { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: Terminal };
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-rose-600';
      default: return 'text-slate-700';
    }
  };

  return (
    <div className="w-full h-[400px] flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-500" />
            Agent Message Logs
          </h2>
          <p className="text-xs text-slate-500">Real-time trace stream of multi-agent interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClear} 
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-600 text-xs transition-colors"
          >
            Clear Logs
          </button>
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
              autoScroll 
                ? 'border-cyan-500 bg-cyan-50 text-cyan-600' 
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
            Auto-Scroll
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {['all', 'scoping', 'risk', 'hitl', 'ledger', 'system'].map((agentName) => (
            <button
              key={agentName}
              onClick={() => setFilter(agentName)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize border transition-all ${
                filter === agentName
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              {agentName}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search log messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full md:w-60 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Log list viewport */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-slate-50 border border-slate-100 p-4 font-mono text-xs space-y-3 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            No trace logs recorded.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const styles = getAgentStyles(log.agent);
            const AgentIcon = styles.icon;

            return (
              <div key={log.id} className="flex items-start gap-3 hover:bg-white p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200/50 shadow-sm-hover">
                <span className="text-slate-400 select-none pt-0.5">{log.timestamp}</span>
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${styles.bg}`}>
                  <AgentIcon className="w-3 h-3" />
                  {log.agent}
                </span>
                <div className="flex-1">
                  <span className={getTypeColor(log.type)}>{log.message}</span>
                  {log.metadata && (
                    <pre className="mt-2 p-2.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-600 overflow-x-auto shadow-inner">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
