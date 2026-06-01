'use client';

import React, { useState, useRef } from 'react';
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
  AlertCircle
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

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
    costSaved: 1240,
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

  // Helper to add log entries
  const addLog = (agent: 'scoping' | 'risk' | 'hitl' | 'ledger' | 'system', message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', metadata?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp,
        agent,
        message,
        type,
        metadata,
      },
    ]);
  };

  // Client-side Input Validation & Security Gate (Anti-Exploitation)
  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // 1. Length Check
    if (rawInput.trim().length < 20) {
      setValidationError('Input too short. Please provide a detailed enterprise proposal (minimum 20 characters).');
      return;
    }

    // 2. Maximum Payload Boundary
    if (rawInput.length > 4000) {
      setValidationError('Input exceeds safe maximum context ceiling (4,000 characters). Please condense your text.');
      return;
    }

    // 3. Simple Script Injection Block
    if (/<script|javascript:|onerror/i.test(rawInput)) {
      setValidationError('Invalid characters or potential script injection detected. Input blocked for security.');
      return;
    }

    // Lock UI and kick off pipeline sequence
    setIsProcessing(true);
    setLogs([]);
    
    // Reset agent nodes
    setNodesStatus({
      scoping: 'idle',
      risk: 'idle',
      hitl: 'idle',
      ledger: 'idle',
    });

    addLog('system', 'Initializing Multi-Agent Pipeline Swarm orchestration...', 'info');
    if (uploadedFile) {
      addLog('system', `Ingesting file: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`, 'info');
    }
    
    // Step 1: Gateway Ingest
    setTimeout(() => {
      addLog('system', 'Raw text ingested, validated, and persisted securely to local SQLite instance.', 'success');
      setActiveNodeId('scoping');
      setNodesStatus(prev => ({ ...prev, scoping: 'processing' }));
      setMetrics(m => ({ ...m, activeAgents: 1 }));
      addLog('scoping', 'Ingesting project instructions. Parsing feature requests.', 'info');
    }, 1000);

    // Step 2: Scoping completes features
    setTimeout(() => {
      setNodesStatus(prev => ({ ...prev, scoping: 'completed' }));
      addLog('scoping', 'Scope analysis finalized: 5 components, estimated 6 development weeks.', 'success', {
        projectName: uploadedFile ? `Doc-Parsed: ${uploadedFile.name.replace(/\.[^/.]+$/, "")}` : 'Enterprise Core Integration',
        features: ['Multisig Safe Integration', 'Cross-chain router', 'Telemetry Logging', 'Prisma Schema Mapping'],
        estimatedWeeks: 6,
        baseCostEstimate: 12500,
      });
    }, 3000);

    // Step 3: Risk Agent starts compliance audit
    setTimeout(() => {
      setActiveNodeId('risk');
      setNodesStatus(prev => ({ ...prev, risk: 'processing' }));
      addLog('risk', 'Running compliance security checks on features matrix...', 'info');
    }, 4500);

    // Step 4: Conflict Triggered -> Alert Popup -> Open Human Gate
    setTimeout(() => {
      setNodesStatus(prev => ({ ...prev, risk: 'paused' }));
      setMetrics(m => ({ ...m, activeAgents: 0, pendingApprovals: 1 }));
      addLog('risk', 'CRITICAL CHECKPOINT TRIGGERED: High-throughput API rate-limit limits budget bounds.', 'warning');
      addLog('risk', 'Suspending runtime pipeline. Forwarding override query to gateway.', 'warning');

      setModalPayload({
        agentSource: 'Risk Agent',
        conflictType: 'API Rate-Limit Cost Threat',
        description: uploadedFile 
          ? `The uploaded document "${uploadedFile.name}" outlines high-throughput parallel data pipelines. Evaluations estimate runtime fees will surpass target boundaries by 24% under current structures.`
          : 'The Scoping Agent proposed a system requiring parallel data pipelines. Operational evaluations estimate runtime fees will surpass the project target boundary by 24% under current configurations.',
        proposedBudget: 13500,
        estimatedWeeks: 6
      });
      
      // Enforce the user alert check, then open approval window
      setIsAlertOpen(true);
    }, 6500);
  };

  const handleAlertConfirm = () => {
    setIsAlertOpen(false);
    setIsModalOpen(true);
  };

  const handleHumanOverride = (updatedData: ApprovalPayload) => {
    setIsModalOpen(false);
    setMetrics(m => ({ ...m, pendingApprovals: 0, activeAgents: 1 }));
    setNodesStatus(prev => ({ ...prev, risk: 'completed', hitl: 'completed' }));
    setActiveNodeId('hitl');

    addLog('hitl', `Human Override Approved. Parameters adjusted: Budget updated to $${updatedData.proposedBudget}, Schedule locked to ${updatedData.estimatedWeeks} weeks. Resuming pipeline...`, 'success');

    // Step 5: Ledger Agent finalizes database commits
    setTimeout(() => {
      setActiveNodeId('ledger');
      setNodesStatus(prev => ({ ...prev, ledger: 'processing' }));
      addLog('ledger', 'Calculating final budget breakdowns & milestone distributions.', 'info');
    }, 1500);

    setTimeout(() => {
      setNodesStatus(prev => ({ ...prev, ledger: 'completed' }));
      setMetrics(m => ({ 
        ...m, 
        activeAgents: 0, 
        completedJobs: m.completedJobs + 1, 
        costSaved: m.costSaved + 3500 
      }));
      setActiveNodeId('idle');
      setIsProcessing(false);
      addLog('ledger', 'Financial ledger metrics saved to database. Swarm pipeline finalized successfully.', 'success', {
        status: 'AUTHORIZED_BY_ADMIN',
        txHash: '0x3e7a1f...9b42dc',
        finalBudget: updatedData.proposedBudget,
        timelineWeeks: updatedData.estimatedWeeks
      });
    }, 4000);
  };

  const handleHumanTermination = (reason: string) => {
    setIsModalOpen(false);
    setIsProcessing(false);
    setMetrics(m => ({ ...m, pendingApprovals: 0, activeAgents: 0 }));
    setNodesStatus({
      scoping: 'idle',
      risk: 'idle',
      hitl: 'idle',
      ledger: 'idle',
    });
    setActiveNodeId('idle');
    addLog('hitl', `Pipeline terminated by Administrator. Verification log: "${reason || 'No reason provided'}"`, 'error');
    addLog('system', 'Workflow terminated.', 'error');
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
    setValidationError('');
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mocking file upload ingestion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({ name: file.name, size: file.size });
      setValidationError('');
      
      // Simulate file reading and pre-populating context based on document metadata
      const mockBrief = `[INGESTED DOCUMENT: ${file.name}]
Enterprise multi-agent systems deployment specification brief.
Goal: Mount dynamic API orchestration routes in front of high-capacity databases.
Target Budget: $10,000 baseline constraint.
Required Core Integrations:
1. Multi-chain Router logic for transaction logs
2. Telemetry tracking schema inside SQLite database
3. Human-in-the-Loop gateway verification modal for adjustments.
Estimated delivery timeframe: 4-6 development weeks.`;
      setRawInput(mockBrief);
      addLog('system', `Parsed uploaded document: ${file.name}. Injected template context.`, 'info');
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      
      {/* Top Header Metrics Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AetherFlow Multi-Agent Swarm
              </h1>
              <p className="text-xs text-slate-400">Visual Control Center & Live-Feed Diagnostics</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-cyan-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Active Agents</div>
                <div className="text-sm font-semibold">{metrics.activeAgents}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Completed Jobs</div>
                <div className="text-sm font-semibold">{metrics.completedJobs}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Pending Approvals</div>
                <div className="text-sm font-semibold">{metrics.pendingApprovals}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-yellow-500">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Cost Savings</div>
                <div className="text-sm font-semibold">${metrics.costSaved}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport Content Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        
        {/* DATA INGESTION FORM PANEL */}
        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Submit Enterprise Business Proposal Context
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-4 max-w-2xl">
              Upload documents (PDF, DOC) or input unstructured text to deploy data pipelines into the AetherFlow Swarm workspace.
            </p>
          </div>
          
          <form onSubmit={validateAndSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Document upload pane */}
              <div className="md:col-span-1 flex flex-col items-center justify-center border border-slate-800 border-dashed rounded-xl bg-slate-900/50 hover:bg-slate-900/80 transition-all p-4 text-center group cursor-pointer" onClick={triggerUploadClick}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileUpload} 
                />
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
                <span className="text-xs font-semibold text-slate-300">Upload PDF / DOC</span>
                <span className="text-[10px] text-slate-500 mt-1">Drag and drop files</span>
                
                {uploadedFile && (
                  <div className="mt-3 p-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[100px]">{uploadedFile.name}</span>
                  </div>
                )}
              </div>

              {/* Text Input area */}
              <div className="md:col-span-3">
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Paste unstructured project brief parameters here or select file upload to auto-populate layout..."
                  className="w-full h-28 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50 font-sans resize-none transition-colors"
                />
                {validationError && (
                  <p className="text-xs text-rose-400 font-mono mt-1 flex items-center gap-1">
                    ⚠️ {validationError}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-900/50 pt-4">
              <span className="text-[11px] text-slate-500 font-mono">
                {rawInput.length} / 4000 characters
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAllState}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Pipeline
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !rawInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 hover:bg-cyan-300 disabled:opacity-50 disabled:hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
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

          {/* Metrics side detail panel */}
          <div className="lg:col-span-5 xl:col-span-4 bg-slate-950/50 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Swarm Engine Config</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">Active Orchestration Model</span>
                  <span className="font-semibold text-cyan-400">Llama-3-8B-Instruct</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">Provider Endpoint</span>
                  <span className="font-semibold text-slate-300">Featherless.ai (APIv1)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">Total Transaction Cost limit</span>
                  <span className="font-semibold text-slate-300">$100,000 (Auth required)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900">
                  <span className="text-slate-400">Pipeline Strict Validation</span>
                  <span className="font-semibold text-emerald-400">ENABLED</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-950 rounded-xl border border-slate-900">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                System Status Note
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                AetherFlow matches scoping features directly with budget allocations. Any deviation exceeding $+15\%$ over baseline limits alerts the Risk Agent compliance mechanism and halts ledger writes until human overrides are authorized.
              </p>
            </div>
          </div>

          {/* Real-Time Scrolling AgentLogs */}
          <div className="lg:col-span-12">
            <AgentLogs logs={logs} onClear={() => setLogs([])} />
          </div>

          {/* Static Monitor Panel */}
          <div className="lg:col-span-12">
            <AgentTerminal />
          </div>
        </div>
      </main>

      {/* POPUP MODAL ENFORCED - TRIGGER NOTICE */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">Intervention Awaiting</h4>
              <p className="text-xs text-slate-400 mt-2">
                A pipeline event requires immediate human override parameters. Click below to load manual overrides workspace.
              </p>
            </div>
            <button
              onClick={handleAlertConfirm}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold font-mono transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
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
      />

    </div>
  );
}
