'use client';

import React, { useState } from 'react';

interface ApprovalPayload {
  agentSource: string;
  conflictType: string;
  description: string;
  proposedBudget: number;
  estimatedWeeks: number;
}

interface HumanApprovalModalProps {
  isOpen: boolean;
  payload: ApprovalPayload;
  onApprove: (updatedPayload: ApprovalPayload) => void;
  onReject: (reason: string) => void;
  onClose?: () => void;
}

export default function HumanApprovalModal({ isOpen, payload, onApprove, onReject, onClose }: HumanApprovalModalProps) {
  const [adjustedBudget, setAdjustedBudget] = useState(payload.proposedBudget);
  const [adjustedWeeks, setAdjustedWeeks] = useState(payload.estimatedWeeks);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Sync state with incoming props dynamically
  React.useEffect(() => {
    if (isOpen) {
      setAdjustedBudget(payload.proposedBudget);
      setAdjustedWeeks(payload.estimatedWeeks);
      setRejectionReason('');
      setIsRejecting(false);
    }
  }, [payload, isOpen]);

  if (!isOpen) return null;

  const handleApproveSubmit = () => {
    onApprove({
      ...payload,
      proposedBudget: adjustedBudget,
      estimatedWeeks: adjustedWeeks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden font-sans">
        
        {/* Banner Indicator */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <h3 className="text-sm font-mono font-bold text-rose-600 tracking-wider uppercase">
                Band Room Gateway: HITL Intervention Required
              </h3>
              <p className="text-xs text-slate-500">Pipeline suspended by {payload.agentSource}</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xs font-mono border border-slate-200 hover:border-slate-300 rounded px-2 py-0.5 transition-all bg-white"
            >
              Exit
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">
              Conflict: {payload.conflictType}
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">{payload.description}</p>
          </div>

          {!isRejecting ? (
            /* Interactive Modification Block */
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide">
                Modify Agent Proposed Metrics Before Dispatch:
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Proposed Budget ($)</label>
                  <input 
                    type="number" 
                    value={adjustedBudget}
                    onChange={(e) => setAdjustedBudget(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Timeline (Weeks)</label>
                  <input 
                    type="number" 
                    value={adjustedWeeks}
                    onChange={(e) => setAdjustedWeeks(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Rejection Input */
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-500">Reason for Termination Handoff</label>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback context for the upstream agents to self-correct..."
                className="w-full h-24 bg-white border border-slate-200 rounded p-3 text-sm text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          {isRejecting ? (
            <>
              <button 
                onClick={() => setIsRejecting(false)}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                Back to parameters
              </button>
              <button 
                onClick={() => onReject(rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded text-xs font-medium font-mono transition-colors"
              >
                Confirm Termination
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsRejecting(true)}
                className="px-4 py-2 bg-transparent hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded text-xs font-medium font-mono transition-colors"
              >
                Reject Stack
              </button>
              <button 
                onClick={handleApproveSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium font-mono transition-colors shadow-sm"
              >
                Override & Resume Swarm
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
