import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Sparkles,
  X,
  AlertCircle,
  TrendingUp,
  Fuel,
  Ship,
  CheckCircle2,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CharterOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargoQty: number;
  setCargoQty: (qty: number) => void;
  originPort: string;
  setOriginPort: (port: string) => void;
  destPort: string;
  setDestPort: (port: string) => void;
  commodity: string;
  setCommodity: (c: string) => void;
  priority: string;
  setPriority: (p: string) => void;
  optimizationResult: any;
  optimizing: boolean;
  optimizerError: string | null;
  onRecalculate: () => void;
}

export const CharterOptimizerModal: React.FC<CharterOptimizerModalProps> = ({
  isOpen,
  onClose,
  cargoQty,
  setCargoQty,
  originPort,
  setOriginPort,
  destPort,
  setDestPort,
  commodity,
  setCommodity,
  priority,
  setPriority,
  optimizationResult,
  optimizing,
  optimizerError,
  onRecalculate
}) => {
  const { theme } = useTheme();

  // Prevent background scrolling and attach Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="charter-optimizer-title"
    >
      <div
        className={`w-full max-w-4xl border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200 animate-in zoom-in-95 ${
          theme === 'dark'
            ? 'bg-[#121824] border-cyan-500/30 text-slate-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_24px_rgba(6,182,212,0.15)]'
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
            theme === 'dark' ? 'border-white/[0.08] bg-[#161e2e]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20 shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h3
                id="charter-optimizer-title"
                className="text-base font-bold leading-tight"
              >
                AI Multi-Objective Vessel Chartering Optimizer
              </h3>
              <p
                className={`text-xs mt-0.5 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Multi-attribute ranking evaluating DWT fit, fuel economy, CII ratings (A–E), and voyage OPEX
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Live Status and Optimization Goal Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono border font-semibold flex items-center space-x-1.5 ${
                optimizationResult?.status === 'success' || optimizationResult?.is_live
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {optimizationResult?.status === 'success'
                  ? 'Live Backend Optimizer: Multi-Attribute Maritime Ranking Active'
                  : 'Offline Maritime Engine: Fleet Catalog Active'}
              </span>
            </span>

            {optimizationResult?.priority_label && (
              <span
                className={`font-mono text-xs ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Priority Strategy:{' '}
                <strong className="text-cyan-500 dark:text-cyan-400">
                  {optimizationResult.priority_label}
                </strong>
              </span>
            )}
          </div>

          {/* Validation / Error Alert */}
          {optimizerError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{optimizerError}</span>
            </div>
          )}

          {/* Input Controls Grid */}
          <div
            className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${
              theme === 'dark'
                ? 'bg-[#161e2e]/60 border-white/[0.06]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1">
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Origin Port
              </label>
              <input
                type="text"
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
                placeholder="e.g. Rotterdam [NL]"
                className={`w-full border text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] text-white focus:bg-[#161e2e]'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Destination Port
              </label>
              <input
                type="text"
                value={destPort}
                onChange={(e) => setDestPort(e.target.value)}
                placeholder="e.g. Lagos [NG]"
                className={`w-full border text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] text-white focus:bg-[#161e2e]'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Cargo Quantity (MTS)
              </label>
              <input
                type="number"
                min="1000"
                step="5000"
                value={cargoQty}
                onChange={(e) => setCargoQty(Number(e.target.value))}
                placeholder="150000"
                className={`w-full border text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500 transition ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] text-white focus:bg-[#161e2e]'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label
                className={`text-[11px] font-semibold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Optimization Goal
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={`w-full border text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="cost">Lowest Voyage Cost ($/t)</option>
                <option value="speed">Fastest Transit ETA</option>
                <option value="cii">Greenest (CII A Rating)</option>
              </select>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-mono ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Commodity: <strong className="font-semibold text-cyan-500">{commodity}</strong>
            </span>
            <button
              onClick={onRecalculate}
              disabled={optimizing}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-glow-cyan transition disabled:opacity-50"
            >
              <Sparkles size={14} className={optimizing ? 'animate-spin' : ''} />
              <span>{optimizing ? 'Calculating Solutions...' : 'Recalculate Optimal Vessels'}</span>
            </button>
          </div>

          {/* Results: Executive Summary & Full Vessel Ranking Table */}
          {optimizationResult && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-300">
              {/* Executive Rationale Banner */}
              <div
                className={`p-4 rounded-xl border transition ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-cyan-950/40 via-[#161e2e] to-blue-950/40 border-cyan-500/40 shadow-sm'
                    : 'bg-cyan-50/80 border-cyan-200 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-1.5">
                  <Sparkles size={14} />
                  <span>AI Executive Decision Summary</span>
                </div>
                <p
                  className={`text-xs leading-relaxed font-sans ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {optimizationResult.executive_rationale}
                </p>
                {optimizationResult.benchmark_saving_usd != null && (
                  <div className="mt-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center space-x-1.5">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>
                      Estimated Benchmark Savings: $
                      {Number(optimizationResult.benchmark_saving_usd).toLocaleString()} USD vs next viable option
                    </span>
                  </div>
                )}
              </div>

              {/* Ranked Fleet Table */}
              <div
                className={`rounded-xl border overflow-hidden ${
                  theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200 shadow-sm'
                }`}
              >
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
                    theme === 'dark' ? 'bg-[#161e2e] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="font-bold">
                    Ranked Candidates ({optimizationResult.ranked_vessels?.length || 0} vessels evaluated)
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Sorted by AI Composite Fit Score
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr
                        className={`font-mono text-[11px] border-b ${
                          theme === 'dark'
                            ? 'bg-[#121824] text-slate-400 border-white/[0.06]'
                            : 'bg-slate-100/70 text-slate-600 border-slate-200'
                        }`}
                      >
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Vessel</th>
                        <th className="py-2.5 px-3">Class &amp; DWT</th>
                        <th className="py-2.5 px-3">CII Rating</th>
                        <th className="py-2.5 px-3">Voyage Days</th>
                        <th className="py-2.5 px-3">Unit Rate ($/t)</th>
                        <th className="py-2.5 px-3">Total OPEX</th>
                        <th className="py-2.5 px-3 text-right">AI Score</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        theme === 'dark' ? 'divide-white/[0.04]' : 'divide-slate-100'
                      }`}
                    >
                      {optimizationResult.ranked_vessels?.map((item: any, idx: number) => {
                        const isBest = idx === 0;
                        return (
                          <tr
                            key={item.vessel.id || idx}
                            className={`transition-colors ${
                              isBest
                                ? theme === 'dark'
                                  ? 'bg-cyan-500/[0.09] font-medium'
                                  : 'bg-cyan-50/80 font-medium'
                                : theme === 'dark'
                                ? 'hover:bg-white/[0.02]'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono">
                              {isBest ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] shadow-sm">
                                  #1 BEST
                                </span>
                              ) : (
                                <span className="text-slate-400">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col">
                                <span
                                  className={`font-semibold ${
                                    isBest
                                      ? 'text-cyan-500 dark:text-cyan-400'
                                      : theme === 'dark'
                                      ? 'text-white'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {item.vessel.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  IMO: {item.vessel.imo} • {item.vessel.flag}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {item.vessel.vessel_class} ({Number(item.vessel.dwt).toLocaleString()} MT)
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] border ${
                                  item.vessel.cii_rating === 'A'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : item.vessel.cii_rating === 'B'
                                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                }`}
                              >
                                Grade {item.vessel.cii_rating}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              {item.voyage_days}d
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-300">
                              ${Number(item.cost_per_ton).toFixed(2)}/t
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">
                              ${(Number(item.total_voyage_cost) / 1000).toFixed(0)}k
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span
                                className={
                                  isBest
                                    ? 'text-cyan-500 dark:text-cyan-400 text-sm'
                                    : theme === 'dark'
                                    ? 'text-slate-200'
                                    : 'text-slate-700'
                                }
                              >
                                {item.composite_score}/100
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3.5 border-t flex items-center justify-between shrink-0 ${
            theme === 'dark' ? 'border-white/[0.08] bg-[#161e2e]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <span
            className={`text-xs ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Multi-Objective Pareto Decision Matrix &bull; SIH 2026 P23 Engine
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition border ${
              theme === 'dark'
                ? 'bg-transparent hover:bg-white/[0.05] border-white/10 text-slate-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
            }`}
          >
            Close Optimizer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
