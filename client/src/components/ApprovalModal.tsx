'use client';

import React from 'react';
import { AlertOctagon, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onApprove: (overrideNotes: string) => void;
  onReject: (overrideNotes: string) => void;
  transactionDetails: {
    projectName: string;
    originalBudget: number;
    proposedBudget: number;
    criticalityScore: number;
    complianceFlags: string[];
    riskMitigationText: string;
    features: string[];
  } | null;
}

export default function ApprovalModal({ isOpen, onApprove, onReject, transactionDetails }: ApprovalModalProps) {
  const [overrideNotes, setOverrideNotes] = React.useState('');

  if (!isOpen || !transactionDetails) return null;

  const budgetDifference = transactionDetails.proposedBudget - transactionDetails.originalBudget;
  const isBudgetIncrease = budgetDifference > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner Alert header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Human-in-the-Loop Override Required
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
                Critical
              </span>
            </h3>
            <p className="text-xs text-amber-300/80">
              Risk analysis threshold breached. Manual approval required to ledger this transaction.
            </p>
          </div>
        </div>

        {/* Modal content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Project Header Info */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Project Name</span>
            <h4 className="text-xl font-bold text-slate-200 flex items-center gap-2 mt-0.5">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {transactionDetails.projectName}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Criticality & Compliance */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Risk & Security Audit
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl font-extrabold text-rose-500">{transactionDetails.criticalityScore}/10</div>
                  <div className="text-xs text-slate-400 leading-tight">
                    Criticality score based on automated security, complexity, and compliance checkpoints.
                  </div>
                </div>
              </div>

              {transactionDetails.complianceFlags.length > 0 && (
                <div className="space-y-1.5 mt-2 border-t border-slate-900 pt-3">
                  <div className="text-[10px] font-semibold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    COMPLIANCE FLAGS DETECTED
                  </div>
                  <ul className="text-xs text-rose-300/80 space-y-1 pl-4 list-disc">
                    {transactionDetails.complianceFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Budget Comparison */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Budget Difference Analysis
                </span>
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2">
                  <span>Baseline Budget</span>
                  <span className="font-semibold text-slate-300">${transactionDetails.originalBudget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 pb-2">
                  <span>Proposed Budget</span>
                  <span className="font-semibold text-slate-300">${transactionDetails.proposedBudget.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-300 uppercase">Override Delta</span>
                <div className={`text-base font-bold flex items-center gap-1 ${isBudgetIncrease ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isBudgetIncrease ? '+' : ''}${budgetDifference.toLocaleString()}
                  <span className="text-[10px] font-normal opacity-80">
                    ({((budgetDifference / transactionDetails.originalBudget) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proposed Scoping Features */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-900">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Proposed Scope Features
            </span>
            <div className="flex flex-wrap gap-1.5">
              {transactionDetails.features.map((feature, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Risk Mitigation Text */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-900">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Risk Mitigation Recommendations (from RiskAgent)
            </span>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{transactionDetails.riskMitigationText}"
            </p>
          </div>

          {/* Override Action input */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-xs font-semibold text-slate-300 block">
              Override Authorization Notes <span className="text-slate-500">(Required for audit trail)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              placeholder="Provide justification or mitigation logic for authorizing this budget exception..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950/80 border-t border-slate-900 px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => onReject(overrideNotes)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <XCircle className="w-4 h-4" />
            Reject / Terminate Swarm Flow
          </button>
          <button
            onClick={() => onApprove(overrideNotes)}
            disabled={!overrideNotes.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve & Authorize Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
