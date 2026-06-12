'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  FileText,
  UserCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  ListTodo
} from 'lucide-react';

interface Log {
  id: string;
  agentName: string;
  status: string;
  payload: string;
  message: string;
  createdAt: string;
}

interface Checkpoint {
  id: string;
  conflictType: string;
  decision: string;
  modifications: string | null;
  feedback: string | null;
  createdAt: string;
}

interface Session {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  logs: Log[];
  checkpoints: Checkpoint[];
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all sessions from the server
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/workflow');
      if (!res.ok) throw new Error('Failed to fetch historical runs');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) {
        // Read URL query parameter if available
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('id');
        const exists = data.some((s: any) => s.id === queryId);
        if (queryId && exists) {
          setSelectedSessionId(queryId);
        } else if (!selectedSessionId) {
          setSelectedSessionId(data[0].id);
        }
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve sessions list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Parse payload helper
  const parsePayload = (payloadStr: string) => {
    try {
      return JSON.parse(payloadStr);
    } catch (_) {
      return null;
    }
  };

  const [feedback, setFeedback] = useState('');
  const [budgetOverride, setBudgetOverride] = useState<number>(0);
  const [weeksOverride, setWeeksOverride] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const awaitingLog = selectedSession?.logs.find(
    l => l.agentName === 'System Router' && l.status === 'AWAITING_HUMAN'
  );
  const awaitingPayload = awaitingLog ? parsePayload(awaitingLog.payload) : null;

  useEffect(() => {
    if (awaitingPayload) {
      setBudgetOverride(awaitingPayload.proposedBudget || 0);
      setWeeksOverride(awaitingPayload.estimatedWeeks || 6);
    } else {
      setBudgetOverride(0);
      setWeeksOverride(0);
    }
    setFeedback('');
  }, [selectedSessionId, awaitingLog]);

  const handleAction = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedSession) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`http://localhost:5000/api/workflow/session/${selectedSession.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictType: awaitingPayload?.conflictType || 'Compliance Override',
          decision,
          modifications: decision === 'APPROVED' ? {
            proposedBudget: budgetOverride,
            estimatedWeeks: weeksOverride
          } : null,
          feedback: feedback || (decision === 'APPROVED' ? 'Skipped from history panel' : 'Terminated from history panel'),
          provider: 'aiml',
          model: 'gpt-3.5-turbo',
          sandboxMode: false
        })
      });

      if (!res.ok) throw new Error('Override request failed');
      
      // Refresh current session
      await fetchSessions();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to determine status color badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1 w-max">● Completed</span>;
      case 'AWAITING_HUMAN':
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1 w-max animate-pulse">● Awaiting Override</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full flex items-center gap-1 w-max">● Processing</span>;
      case 'TERMINATED':
        return <span className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full flex items-center gap-1 w-max">● Terminated</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 rounded-full flex items-center gap-1 w-max">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Project Execution Records</h1>
              <p className="text-xs text-slate-500">View and audit historical Swarm workflows & agent outcomes</p>
            </div>
          </div>
          <button 
            onClick={fetchSessions} 
            className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl shadow-sm transition-all"
          >
            Refresh List
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Sessions Sidebar (4 cols) */}
        <section className="lg:col-span-4 space-y-4 flex flex-col max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">All Deployment Sessions</h2>
          
          {loading && sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading historical files...</div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-mono">{error}</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center bg-white border rounded-2xl text-xs text-slate-400">
              No project records found in database. Run a workspace simulation first.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group ${
                    selectedSessionId === session.id 
                      ? 'bg-white border-cyan-500 shadow-md ring-1 ring-cyan-500/10' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                      {session.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {session.id.slice(0, 8)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                    {getStatusBadge(session.status)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right Side: Step-by-Step Agent Decisions Details (8 cols) */}
        <section className="lg:col-span-8 space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2">
          {selectedSession ? (
            <div className="space-y-6">
              
              {/* Project Title Block */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedSession.title}</h2>
                    <span className="text-xs font-mono text-slate-400 block mt-1">Session ID: {selectedSession.id}</span>
                  </div>
                  {getStatusBadge(selectedSession.status)}
                </div>

                {/* Quick summaries */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Started At</div>
                    <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      {new Date(selectedSession.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Swarm Process Status</div>
                    <div className="text-xs font-bold text-slate-700 mt-1 uppercase">
                      {selectedSession.status}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Decision Log Count</div>
                    <div className="text-xs font-bold text-slate-700 mt-1">
                      {selectedSession.logs.length} Actions Recorded
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Section Header */}
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interactive Audit Workflow</h3>
              </div>

              {/* STEP 1: SCOPING AGENT */}
              {(() => {
                const scopeSuccessLog = selectedSession.logs.find(
                  l => l.agentName === 'Scoping Agent' && l.status === 'SUCCESS'
                );
                const scopeData = scopeSuccessLog ? parsePayload(scopeSuccessLog.payload) : null;
                
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-200/50 flex items-center justify-center text-cyan-600 font-extrabold text-sm shadow-sm">
                          1
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Scoping Agent Analysis</h4>
                          <p className="text-[10px] text-slate-400">Ingested instructions, generated project scopes & parameters</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Verified</span>
                    </div>

                    <div className="p-6 space-y-4">
                      {scopeData ? (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600 font-medium">
                            📝 {scopeSuccessLog?.message || 'Analyzed raw project parameters successfully.'}
                          </p>

                          {/* Budget and Timeline */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                              <DollarSign className="w-5 h-5 text-emerald-600" />
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Scoped Target Budget</span>
                                <span className="text-xs font-bold text-slate-700">
                                  ${scopeData.budget?.amount?.toLocaleString() || 'N/A'} {scopeData.budget?.currency || 'USD'}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                              <Clock className="w-5 h-5 text-cyan-600" />
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Estimated Duration</span>
                                <span className="text-xs font-bold text-slate-700">
                                  {scopeData.timeline?.estimatedDurationWeeks || 'N/A'} Weeks
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Features & Specifications Matrix</span>
                            <div className="space-y-2">
                              {scopeData.features?.map((f: any, idx: number) => (
                                <div key={idx} className="p-3 bg-slate-50 border rounded-xl space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-700">{f.name}</span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      f.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {f.priority?.toUpperCase()} Priority
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">No scoping parameters generated in database context.</div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* STEP 2: RISK & COMPLIANCE AGENT */}
              {(() => {
                const riskLog = selectedSession.logs.find(
                  l => l.agentName === 'Risk Agent' && (l.status === 'SUCCESS' || l.status === 'WARNING')
                );
                const riskData = riskLog ? parsePayload(riskLog.payload) : null;
                
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-200/50 flex items-center justify-center text-cyan-600 font-extrabold text-sm shadow-sm">
                          2
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Compliance & Risk Audit Agent</h4>
                          <p className="text-[10px] text-slate-400">Assessed features for safety parameters, regulatory compliances, & limits</p>
                        </div>
                      </div>
                      {riskLog?.status === 'WARNING' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">Awaiting Action</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Passed</span>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      {riskData ? (
                        <div className="space-y-4">
                          <div className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                            {riskLog?.status === 'WARNING' ? (
                              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            <span>{riskLog?.message || 'Compliance safety run resolved successfully.'}</span>
                          </div>

                          {/* Risk Metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 border rounded-xl">
                              <span className="text-[9px] text-slate-400 block font-bold uppercase">Compliance Validation Status</span>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`text-xs font-bold ${
                                  riskData.compliance_status?.status === 'non-compliant' ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                  {riskData.compliance_status?.status?.toUpperCase() || 'COMPLIANT'}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50 border rounded-xl">
                              <span className="text-[9px] text-slate-400 block font-bold uppercase">Dynamic Risk Score</span>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      (riskData.risk_score || 0) > 70 ? 'bg-rose-500' : (riskData.risk_score || 0) > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${riskData.risk_score || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-extrabold text-slate-700">{riskData.risk_score || 0}/100</span>
                              </div>
                            </div>
                          </div>

                          {/* Flagged Risks */}
                          {riskData.flagged_risks && riskData.flagged_risks.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Identified Vulnerabilities</span>
                              <div className="space-y-2">
                                {riskData.flagged_risks.map((r: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-slate-50 border border-amber-100 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-slate-700">{r.category}</span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        r.severity === 'critical' || r.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                      }`}>
                                        {r.severity?.toUpperCase()} Risk
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{r.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedSession.status === 'AWAITING_HUMAN' && awaitingPayload && (
                            <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-4">
                              <span className="text-xs font-bold text-amber-800 block">🛑 Manual Policy Bypass Gate</span>
                              <p className="text-xs text-amber-700 leading-relaxed">
                                This project is currently blocked. You can adjust the financial parameters below and manually approve/skip the risk checks, or terminate the pipeline.
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Adjusted Budget Target ($)</label>
                                  <input 
                                    type="number"
                                    value={budgetOverride}
                                    onChange={(e) => setBudgetOverride(parseInt(e.target.value, 10) || 0)}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50 font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-slate-500 font-bold uppercase block">Adjusted Schedule Lock (Weeks)</label>
                                  <input 
                                    type="number"
                                    value={weeksOverride}
                                    onChange={(e) => setWeeksOverride(parseInt(e.target.value, 10) || 0)}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase block">Override Justification Notes</label>
                                <textarea 
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Provide override/termination reasoning..."
                                  rows={2}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50 resize-none"
                                />
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleAction('REJECTED')}
                                  disabled={isSubmitting}
                                  className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
                                >
                                  Reject & Terminate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction('APPROVED')}
                                  disabled={isSubmitting}
                                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
                                >
                                  Approve & Skip Risk
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">Compliance database logs are empty or sandbox simulations are in process.</div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* STEP 3: HUMAN OVERRIDE CHECKPOINT (IF TRIGGERED) */}
              {selectedSession.checkpoints && selectedSession.checkpoints.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-600 font-extrabold text-sm shadow-sm">
                        H
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Human Administrator Override Panel</h4>
                        <p className="text-[10px] text-slate-500">Security bypass overrides and parameters adjustments applied manually</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Bypassed</span>
                  </div>

                  <div className="p-6 space-y-4">
                    {selectedSession.checkpoints.map((cp) => {
                      const mods = cp.modifications ? parsePayload(cp.modifications) : null;
                      
                      return (
                        <div key={cp.id} className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <UserCheck className="w-4 h-4 text-cyan-600" />
                            Decision: {cp.decision} - Bypass Conflict "{cp.conflictType}"
                          </div>
                          
                          {cp.feedback && (
                            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed italic">
                              "{cp.feedback}"
                            </div>
                          )}

                          {mods && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Adjusted Budget Gate</span>
                                <span className="text-xs font-bold text-slate-700">${mods.proposedBudget?.toLocaleString() || 'N/A'}</span>
                              </div>
                              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Timeline Locked</span>
                                <span className="text-xs font-bold text-slate-700">{mods.estimatedWeeks} Weeks</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: FINANCIAL LEDGER AGENT */}
              {(() => {
                const ledgerLog = selectedSession.logs.find(
                  l => l.agentName === 'Ledger Agent' && l.status === 'SUCCESS'
                );
                const ledgerData = ledgerLog ? parsePayload(ledgerLog.payload) : null;
                
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-200/50 flex items-center justify-center text-cyan-600 font-extrabold text-sm shadow-sm">
                          3
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Financial Ledger Agent</h4>
                          <p className="text-[10px] text-slate-400">Allocated budget milestones, runway setups, and invoice structures</p>
                        </div>
                      </div>
                      {selectedSession.status === 'COMPLETED' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Completed</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-100">Awaiting</span>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      {ledgerData ? (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600 font-medium">
                            💰 {ledgerLog?.message || 'Invoice and ledger parameters structured successfully.'}
                          </p>

                          {/* Runway Metrics */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                              <TrendingUp className="w-5 h-5 text-emerald-600" />
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Funding Allocated</span>
                                <span className="text-xs font-bold text-slate-700">
                                  ${ledgerData.runway_breakdown?.total_funding_allocated?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                              <DollarSign className="w-5 h-5 text-cyan-600" />
                              <div>
                                <span className="text-[9px] text-slate-400 block font-bold uppercase">Burn Rate Ceiling</span>
                                <span className="text-xs font-bold text-slate-700">
                                  ${ledgerData.runway_breakdown?.monthly_burn_rate?.toLocaleString() || 'N/A'}/Month
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Invoice Milestones */}
                          {ledgerData.invoice_milestones && ledgerData.invoice_milestones.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Structured Invoice Milestones</span>
                              <div className="space-y-2">
                                {ledgerData.invoice_milestones.map((m: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                      <span className="text-xs font-bold text-slate-700 block">{m.milestone_name}</span>
                                      <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-400" /> Due: {m.due_date}
                                      </span>
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                                      ${m.amount?.toLocaleString() || 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">Financial ledger generation pending risk clearance.</div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            <div className="h-96 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white border-slate-200">
              <HelpCircle className="w-10 h-10 text-slate-300 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700 mt-3">Select a Session to Audit</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Click on any session in the sidebar to load the complete step-by-step human-readable decision tree.
              </p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
