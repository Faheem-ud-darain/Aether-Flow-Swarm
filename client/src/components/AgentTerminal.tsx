'use client';

import React, { useState, useEffect } from 'react';

interface MockLog {
  id: number;
  agent: string;
  status: string;
  message: string;
  time: string;
}

// Mock stream to simulate how the Band SDK will broadcast events to our UI
const MOCK_STREAM_LOGS: MockLog[] = [
  { id: 1, agent: 'Scoping Agent', status: 'processing', message: 'Ingesting raw project proposal text...', time: '10:02:15' },
  { id: 2, agent: 'Scoping Agent', status: 'success', message: 'Generated structured feature list & timeline matrix (5 weeks).', time: '10:02:42' },
  { id: 3, agent: 'System Router', status: 'info', message: 'Routing ScopingPayload data table to Risk Engine via Band Room channel...', time: '10:02:45' },
  { id: 4, agent: 'Risk Agent', status: 'processing', message: 'Analyzing features against compliance databases & API limits...', time: '10:03:01' },
  { id: 5, agent: 'Risk Agent', status: 'warning', message: 'Flagged Potential Issue: High-throughput API threshold risks budget overrun.', time: '10:03:18' },
  { id: 6, agent: 'System Router', status: 'awaiting_human', message: 'Triggers Human-In-The-Loop gate. Awaiting architectural override approval...', time: '10:03:20' }
];

export default function AgentTerminal() {
  const [logs, setLogs] = useState<MockLog[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Simulates a live event stream popping onto the screen over time
  useEffect(() => {
    if (currentIndex < MOCK_STREAM_LOGS.length) {
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, MOCK_STREAM_LOGS[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 2500); // New event log appears every 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      case 'warning': return 'text-amber-400 bg-amber-950/40 border-amber-800';
      case 'awaiting_human': return 'text-rose-400 bg-rose-950/40 border-rose-800 animate-pulse';
      case 'info': return 'text-blue-400 bg-blue-950/40 border-blue-800';
      default: return 'text-slate-300 bg-slate-900/60 border-slate-800';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-sm">
      {/* Terminal Header */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-400 pl-2 text-xs font-semibold uppercase tracking-wider">Band SDK Swarm Monitor</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live Listening</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-5 space-y-3 min-h-[320px] max-h-[450px] overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start space-x-3 border-l-2 border-slate-800 pl-3 py-1 hover:bg-slate-900/30 transition-colors">
            <span className="text-slate-600 select-none text-xs pt-0.5">[{log.time}]</span>
            <div className="flex-1">
              <span className="font-bold text-slate-200 mr-2">{log.agent}:</span>
              <span className="text-slate-300">{log.message}</span>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${getStatusColor(log.status)}`}>
              {log.status.replace('_', ' ')}
            </span>
          </div>
        ))}
        {currentIndex < MOCK_STREAM_LOGS.length && (
          <div className="text-slate-600 animate-pulse text-xs pl-3 pt-2 flex items-center space-x-1">
            <span className="inline-block w-1.5 h-3 bg-slate-500 animate-pulse"></span>
            <span>Swarm executing downstream tasks...</span>
          </div>
        )}
      </div>
    </div>
  );
}
