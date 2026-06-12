'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  RotateCcw, 
  Cpu, 
  CheckCircle, 
  Users, 
  AlertTriangle, 
  Coins,
  Sparkles,
  Upload,
  FileText,
  AlertCircle,
  Settings
} from 'lucide-react';
import SwarmFlowchart from '@/components/SwarmFlowchart';
import AgentLogs, { LogMessage } from '@/components/AgentLogs';
import AgentTerminal from '@/components/AgentTerminal';
import HumanApprovalModal from '@/components/HumanApprovalModal';

// Explicit Types for state management
interface ApprovalPayload {
  agentSource: string;
  conflictType: string;
  description: string;
  proposedBudget: number;
  estimatedWeeks: number;
}

export default function Home() {
  // Input and Workflow state
  const [rawInput, setRawInput] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  // Active Provider & Model Configurations
  const [provider, setProvider] = useState<'featherless' | 'aiml'>('aiml');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [sandboxMode, setSandboxMode] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState<number>(12000);
  const [compliancePolicy, setCompliancePolicy] = useState<string>('');

  // Active Session tracking
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchCompletedSessions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/workflow');
      if (res.ok) {
        const data = await res.json();
        const completed = data.filter((s: any) => s.status === 'COMPLETED');
        setCompletedSessions(completed);
        
        let totalSavings = 0;
        completed.forEach((session: any) => {
          const ledgerLog = session.logs.find((l: any) => l.agentName === 'Ledger Agent' && l.status === 'SUCCESS');
          if (ledgerLog) {
            try {
              const payload = JSON.parse(ledgerLog.payload);
              const total = payload.runway_breakdown?.total_funding_allocated || payload.invoice_milestones?.reduce((acc: number, m: any) => acc + (m.amount || 0), 0) || 10000;
              totalSavings += Math.round(total * 0.15);
            } catch (_) {
              totalSavings += 1500;
            }
          } else {
            totalSavings += 1500;
          }
        });

        setMetrics(m => ({ 
          ...m, 
          completedJobs: completed.length,
          costSaved: totalSavings
        }));
      }
    } catch (err) {
      console.error('Error fetching completed sessions:', err);
    }
  };

  // Flowchart statuses
  const [activeNodeId, setActiveNodeId] = useState<string>('idle');
  const [nodesStatus, setNodesStatus] = useState<Record<string, 'idle' | 'processing' | 'paused' | 'completed'>>({
    scoping: 'idle',
    risk: 'idle',
    hitl: 'idle',
    ledger: 'idle',
  });

  // Logs stream
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Telemetry metric counters
  const [metrics, setMetrics] = useState({
    activeAgents: 0,
    completedJobs: 0,
    pendingApprovals: 0,
    costSaved: 0,
  });

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState<ApprovalPayload>({
    agentSource: 'Risk Agent',
    conflictType: 'Budget Constraint Violation',
    description: '',
    proposedBudget: 0,
    estimatedWeeks: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map backend logs to UI logs format
  const syncLogsAndStates = (sessionData: any) => {
    // 1. Logs Mapping
    const formattedLogs: LogMessage[] = sessionData.logs.map((log: any) => {
      let type: 'info' | 'success' | 'warning' | 'error' = 'info';
      if (log.status === 'SUCCESS') type = 'success';
      if (log.status === 'WARNING') type = 'warning';
      if (log.status === 'ERROR') type = 'error';

      let parsedPayload = null;
      try {
        parsedPayload = log.payload ? JSON.parse(log.payload) : null;
      } catch (_) {}

      return {
        id: log.id,
        timestamp: new Date(log.createdAt).toLocaleTimeString(),
        agent: log.agentName.toLowerCase().replace(' agent', '').replace('system router', 'system') as any,
        message: log.message,
        type,
        metadata: parsedPayload
      };
    });
    setLogs(formattedLogs);

    const newNodesStatus: Record<string, 'idle' | 'processing' | 'paused' | 'completed'> = {
      scoping: 'idle',
      risk: 'idle',
      hitl: 'idle',
      ledger: 'idle'
    };

    let currentActiveNode = 'idle';

    sessionData.logs.forEach((log: any) => {
      const name = log.agentName;
      const status = log.status;

      if (name === 'Scoping Agent') {
        if (status === 'INFO') {
          newNodesStatus.scoping = 'processing';
          currentActiveNode = 'scoping';
        } else if (status === 'SUCCESS') {
          newNodesStatus.scoping = 'completed';
        }
      }

      if (name === 'Risk Agent') {
        if (status === 'INFO') {
          newNodesStatus.risk = 'processing';
          currentActiveNode = 'risk';
        } else if (status === 'SUCCESS') {
          newNodesStatus.risk = 'completed';
        } else if (status === 'WARNING') {
          newNodesStatus.risk = 'paused';
          currentActiveNode = 'risk';
        }
      }

      if (name === 'System Router' && status === 'AWAITING_HUMAN') {
        newNodesStatus.hitl = 'processing';
        currentActiveNode = 'hitl';
      }

      if (name === 'Ledger Agent') {
        if (status === 'INFO') {
          newNodesStatus.ledger = 'processing';
          currentActiveNode = 'ledger';
        } else if (status === 'SUCCESS') {
          newNodesStatus.ledger = 'completed';
        }
      }
    });

    // Check if HITL is completed
    if (sessionData.checkpoints && sessionData.checkpoints.length > 0) {
      newNodesStatus.hitl = 'completed';
    }

    setNodesStatus(newNodesStatus);
    setActiveNodeId(currentActiveNode);

    // 3. Update Metrics
    const pending = sessionData.status === 'AWAITING_HUMAN' ? 1 : 0;
    const active = sessionData.status === 'PROCESSING' ? 1 : 0;
    
    setMetrics(m => ({
      ...m,
      activeAgents: active,
      pendingApprovals: pending,
    }));

    // Trigger manual checkpoint popups
    if (sessionData.status === 'AWAITING_HUMAN' && !isModalOpen && !isAlertOpen && newNodesStatus.hitl === 'processing') {
      const routeLog = sessionData.logs.find((l: any) => l.agentName === 'System Router' && l.status === 'AWAITING_HUMAN');
      if (routeLog) {
        try {
          const payload = JSON.parse(routeLog.payload);
          setModalPayload({
            agentSource: 'Risk Agent',
            conflictType: payload.conflictType,
            description: payload.description,
            proposedBudget: payload.proposedBudget,
            estimatedWeeks: payload.estimatedWeeks
          });
          setIsAlertOpen(true);
        } catch (_) {}
      }
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/workflow/settings')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to load settings');
      })
      .then(data => {
        if (data) {
          if (typeof data.budgetLimit === 'number') {
            setBudgetLimit(data.budgetLimit);
          }
          if (typeof data.compliancePolicy === 'string') {
            setCompliancePolicy(data.compliancePolicy);
          }
        }
      })
      .catch(err => console.error('Error fetching settings:', err));

    fetchCompletedSessions();
  }, []);

  const handleBudgetLimitChange = async (newLimit: number) => {
    setBudgetLimit(newLimit);
    try {
      await fetch('http://localhost:5000/api/workflow/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetLimit: newLimit })
      });
    } catch (err) {
      console.error('Error saving budget limit setting:', err);
    }
  };

  const handleCompliancePolicyChange = async (newPolicy: string) => {
    setCompliancePolicy(newPolicy);
    try {
      await fetch('http://localhost:5000/api/workflow/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compliancePolicy: newPolicy })
      });
    } catch (err) {
      console.error('Error saving compliance policy setting:', err);
    }
  };

  // Poll Session Status
  useEffect(() => {
    if (!activeSessionId || !isProcessing) return;

    let isSubscribed = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/workflow/session/${activeSessionId}`);
        if (!res.ok) throw new Error('Poll failed');
        const sessionData = await res.json();

        if (isSubscribed) {
          syncLogsAndStates(sessionData);

          // Stop polling if session is finalized
          if (sessionData.status === 'COMPLETED' || sessionData.status === 'TERMINATED') {
            setIsProcessing(false);
            setActiveSessionId(null);
            if (sessionData.status === 'COMPLETED') {
              fetchCompletedSessions();
              const ledgerLog = sessionData.logs.find((l: any) => l.agentName === 'Ledger Agent' && l.status === 'SUCCESS');
              let savings = 1500;
              if (ledgerLog) {
                try {
                  const data = JSON.parse(ledgerLog.payload);
                  const total = data.runway_breakdown?.total_funding_allocated || data.invoice_milestones?.reduce((acc: number, m: any) => acc + (m.amount || 0), 0) || 10000;
                  savings = Math.round(total * 0.15);
                } catch (_) {}
              }
              setMetrics(m => ({ ...m, costSaved: m.costSaved + savings }));
            }
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [activeSessionId, isProcessing, isModalOpen, isAlertOpen]);

  // Submit flow to backend
  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (rawInput.trim().length < 20) {
      setValidationError('Input too short. Please provide a detailed enterprise proposal (minimum 20 characters).');
      return;
    }

    if (rawInput.length > 2000000) {
      setValidationError('Input exceeds safe maximum context ceiling (2,000,000 characters). Please condense your text.');
      return;
    }

    if (/<script|javascript:|onerror/i.test(rawInput)) {
      setValidationError('Invalid characters or potential script injection detected. Input blocked for security.');
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setNodesStatus({
      scoping: 'idle',
      risk: 'idle',
      hitl: 'idle',
      ledger: 'idle',
    });

    try {
      const derivedTitle = projectTitle.trim() 
        ? projectTitle.trim()
        : (uploadedFile 
            ? `Doc: ${uploadedFile.name.replace(/\.[^/.]+$/, "")}`
            : (rawInput.trim().split(/\s+/).slice(0, 5).join(' ') || 'Enterprise Allocation') + ' Swarm'
          );

      const res = await fetch('http://localhost:5000/api/workflow/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: derivedTitle,
          rawInput,
          provider,
          model,
          sandboxMode
        })
      });

      if (!res.ok) {
        throw new Error('Failed to initiate swarm session');
      }

      const session = await res.json();
      setActiveSessionId(session.id);
    } catch (err: any) {
      setIsProcessing(false);
      setValidationError(`Failed to start swarm orchestrator: ${err.message}`);
    }
  };

  const handleAlertConfirm = () => {
    setIsAlertOpen(false);
    setIsModalOpen(true);
  };

  const handleHumanOverride = async (updatedData: ApprovalPayload) => {
    setIsModalOpen(false);
    if (!activeSessionId) {
      setNodesStatus(prev => ({ ...prev, risk: 'completed', hitl: 'completed' }));
      setActiveNodeId('hitl');
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp,
          agent: 'hitl',
          message: `Human Override Approved. Parameters adjusted: Budget updated to $${updatedData.proposedBudget}, Schedule locked to ${updatedData.estimatedWeeks} weeks. Resuming pipeline...`,
          type: 'success'
        }
      ]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/workflow/session/${activeSessionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictType: modalPayload.conflictType,
          decision: 'APPROVED',
          modifications: {
            proposedBudget: updatedData.proposedBudget,
            estimatedWeeks: updatedData.estimatedWeeks
          },
          provider,
          model,
          sandboxMode
        })
      });

      if (!res.ok) throw new Error('Approval override failed');
    } catch (err: any) {
      setValidationError(`Override submission error: ${err.message}`);
    }
  };

  const handleHumanTermination = async (reason: string) => {
    setIsModalOpen(false);
    if (!activeSessionId) {
      setNodesStatus({
        scoping: 'idle',
        risk: 'idle',
        hitl: 'idle',
        ledger: 'idle',
      });
      setActiveNodeId('idle');
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp,
          agent: 'hitl',
          message: `Pipeline terminated by Administrator. Verification log: "${reason || 'No reason provided'}"`,
          type: 'error'
        }
      ]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/workflow/session/${activeSessionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictType: modalPayload.conflictType,
          decision: 'REJECTED',
          feedback: reason || 'Terminated by user'
        })
      });

      if (!res.ok) throw new Error('Termination override failed');
    } catch (err: any) {
      setValidationError(`Termination submission error: ${err.message}`);
    }
  };

  const resetAllState = () => {
    setLogs([]);
    setActiveNodeId('idle');
    setNodesStatus({
      scoping: 'idle',
      risk: 'idle',
      hitl: 'idle',
      ledger: 'idle',
    });
    setIsProcessing(false);
    setIsModalOpen(false);
    setIsAlertOpen(false);
    setRawInput('');
    setProjectTitle('');
    setValidationError('');
    setUploadedFile(null);
    setActiveSessionId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Real file upload ingestion using FileReader
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name, size: file.size });
      setValidationError('');
      
      const isTextFile = file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv') || file.name.endsWith('.md');
      const isDocOrPdf = file.name.endsWith('.pdf') || file.name.endsWith('.docx');
      
      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            setRawInput(text);
          }
        };
        reader.onerror = () => {
          setValidationError('Failed to read the uploaded file.');
        };
        reader.readAsText(file);
      } else if (isDocOrPdf) {
        setIsProcessing(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const res = await fetch('http://localhost:5000/api/workflow/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to parse document');
          }
          
          const data = await res.json();
          setRawInput(data.text);
        } catch (err: any) {
          setValidationError(`Document parsing error: ${err.message}`);
          setUploadedFile(null);
        } finally {
          setIsProcessing(false);
        }
      } else {
        setValidationError('Unsupported format. Please upload PDF, DOCX, or text files (.txt, .json, .csv, .md).');
      }
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-cyan-500/20">
      
      {/* Top Header Metrics Bar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Cpu className="w-6 h-6 text-white font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  AetherFlow Multi-Agent Swarm
                </h1>
                <Link href="/history" className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center gap-1 shadow-sm">
                  View History ➜
                </Link>
              </div>
              <p className="text-xs text-slate-500">Visual Control Center & Live-Feed Diagnostics</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-cyan-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Active Agents</div>
                <div className="text-sm font-bold text-slate-800">{metrics.activeAgents}</div>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 hover:bg-slate-100/70 p-1.5 rounded-xl transition-all border border-transparent text-left"
              >
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 select-none">
                    Completed Jobs <span className="text-[8px] text-slate-400">▼</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800">{metrics.completedJobs}</div>
                </div>
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 py-4 space-y-3">
                    <div className="flex justify-between items-center px-2 pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">Job Completion Logs</span>
                      <span className="text-[10px] font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                        {completedSessions.length} total
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {completedSessions.length === 0 ? (
                        <div className="text-[11px] text-slate-400 text-center py-6">
                          No completed projects found in DB.
                        </div>
                      ) : (
                        completedSessions.map((session) => (
                          <Link 
                            key={session.id}
                            href={`/history?id=${session.id}`}
                            className="block p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left group"
                          >
                            <span className="text-xs font-semibold text-slate-700 block line-clamp-1 group-hover:text-cyan-600 transition-colors">
                              {session.title}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                              Finished: {new Date(session.updatedAt).toLocaleDateString()}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Pending Approvals</div>
                <div className="text-sm font-bold text-slate-800">{metrics.pendingApprovals}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-yellow-600">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Operational Savings (ROI)</div>
                <div className="text-sm font-bold text-slate-800">${metrics.costSaved}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* DATA INGESTION FORM PANEL */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              Submit Enterprise Business Proposal Context
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-2xl">
              Upload documents (PDF, DOC) or input unstructured text to deploy data pipelines into the AetherFlow Swarm workspace.
            </p>
          </div>
          
          <form onSubmit={validateAndSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Document upload pane */}
              <div className="md:col-span-1 flex flex-col items-center justify-center border border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-all p-4 text-center group cursor-pointer" onClick={triggerUploadClick}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileUpload} 
                />
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 transition-colors mb-2" />
                <span className="text-xs font-semibold text-slate-700">Upload PDF / DOC</span>
                <span className="text-[10px] text-slate-400 mt-1">Drag and drop files</span>
                
                {uploadedFile && (
                  <div className="mt-3 p-1.5 rounded bg-cyan-50 border border-cyan-200 text-[10px] text-cyan-600 flex items-center gap-1.5">
                     <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[100px]">{uploadedFile.name}</span>
                  </div>
                )}
              </div>

              {/* Text Input area */}
              <div className="md:col-span-3 flex flex-col gap-3">
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Enter Project Title (Optional - auto-summarized if blank)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:bg-white disabled:opacity-50 font-sans transition-colors"
                />
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Paste unstructured project brief parameters here or select file upload to auto-populate layout..."
                  className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:bg-white disabled:opacity-50 font-sans resize-none transition-colors"
                />
                {validationError && (
                  <p className="text-xs text-rose-500 font-mono mt-1 flex items-center gap-1">
                    ⚠️ {validationError}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <span className="text-[11px] text-slate-400 font-mono">
                {rawInput.length.toLocaleString()} / 2,000,000 characters
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white text-slate-600 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Pipeline
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !rawInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-cyan-500 transition-all active:scale-95 shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isProcessing ? 'Swarm Running...' : 'Deploy Context to Swarm'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Dynamic Panels layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Flowchart Panel */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            <SwarmFlowchart activeNodeId={activeNodeId} nodesStatus={nodesStatus} />
          </div>

          {/* Config Detail Panel */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Swarm Engine Config</h3>
              </div>
              <div className="space-y-3 pt-2">
                
                {/* Provider select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">LLM Provider</label>
                  <select 
                    value={provider} 
                    onChange={(e) => {
                      const nextProvider = e.target.value as any;
                      setProvider(nextProvider);
                      if (nextProvider === 'aiml') {
                        setModel('gpt-3.5-turbo');
                      } else {
                        setModel('Qwen/Qwen2.5-7B-Instruct');
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="featherless">Featherless.ai</option>
                    <option value="aiml">AI/ML API</option>
                  </select>
                </div>

                {/* Model Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Active Model ID</label>
                  <input 
                    type="text" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Sandbox Mode (Free Mocks)</span>
                  <input 
                    type="checkbox"
                    checked={sandboxMode}
                    onChange={(e) => setSandboxMode(e.target.checked)}
                    disabled={isProcessing}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-cyan-500 focus:ring-cyan-500/50 accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Guardrail budget settings */}
                <div className="flex flex-col gap-1.5 pt-1.5 border-b border-slate-100 pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Budget Safety Limit ($)</span>
                    <span className="text-[10px] text-cyan-600 font-mono font-bold">${budgetLimit.toLocaleString()}</span>
                  </div>
                  <input 
                    type="number"
                    value={budgetLimit || ''}
                    onChange={(e) => handleBudgetLimitChange(parseInt(e.target.value, 10) || 0)}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>

                {/* Guardrail compliance policy settings */}
                <div className="flex flex-col gap-1.5 pt-1.5 border-b border-slate-100 pb-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Compliance & Regulatory Policy</label>
                  <textarea 
                    value={compliancePolicy}
                    onChange={(e) => handleCompliancePolicyChange(e.target.value)}
                    disabled={isProcessing}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                    placeholder="Define rules (e.g. SOC2, GDPR, Multisig requirements)..."
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Pipeline Validation</span>
                  <span className="font-semibold text-emerald-600">ENABLED</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Band.ai Swarm Info
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                The 3 Swarm agents authenticate via individual Band.ai API Keys. Actions, states, and data payloads are logged back to the SQLite DB. Threshold violations alert the Human Gate.
              </p>
            </div>
          </div>

          {/* Live Scrolling AgentLogs */}
          <div className="lg:col-span-12">
            <AgentLogs logs={logs} onClear={() => setLogs([])} />
          </div>

          {/* Live Agent Terminal/Monitor */}
          <div className="lg:col-span-12">
            <AgentTerminal 
              logs={logs}
              nodesStatus={nodesStatus}
              onIntervene={() => {
                setIsModalOpen(true);
              }} 
            />
          </div>
        </div>
      </main>

      {/* POPUP MODAL ENFORCED - TRIGGER NOTICE */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-amber-50 border border-amber-200 text-amber-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Intervention Awaiting</h4>
              <p className="text-xs text-slate-500 mt-2">
                A pipeline event requires immediate human override parameters. Click below to load manual overrides workspace.
              </p>
            </div>
            <button
              onClick={handleAlertConfirm}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold font-mono transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              Access Gate Parameters
            </button>
          </div>
        </div>
      )}

      {/* HUMAN-IN-THE-LOOP CONTROL GATEWAY MODAL */}
      <HumanApprovalModal 
        isOpen={isModalOpen}
        payload={modalPayload}
        onApprove={handleHumanOverride}
        onReject={handleHumanTermination}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
}
