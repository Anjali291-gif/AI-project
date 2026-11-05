import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  RotateCcw,
  Sliders,
  TrendingUp,
  Compass,
  Fuel,
  Anchor,
  LucideIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export interface WidgetDefinition {
  id: string;
  name: string;
  desc: string;
  category: string;
  icon: LucideIcon;
  badge?: string;
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  {
    id: 'bdi_stream',
    name: 'Baltic Dry Index (BDI) Live Stream',
    desc: 'Real-time spot freight index composite & Baltic Exchange benchmark rates',
    category: 'Market Telemetry',
    icon: TrendingUp,
    badge: 'Spot Rates'
  },
  {
    id: 'transit_tracker',
    name: 'Red Sea / Suez Canal Transit Tracker',
    desc: 'Security risk factor & alternative Cape routing',
    category: 'Chokepoints',
    icon: Compass,
    badge: 'Security Risk'
  },
  {
    id: 'bunker_hedging',
    name: 'Bunker Hedging & Carbon Offset Costs',
    desc: 'EU ETS and IMO carbon tax projections',
    category: 'Fuel & Carbon',
    icon: Fuel,
    badge: 'EU ETS / IMO'
  },
  {
    id: 'port_congestion',
    name: 'Port Berth Congestion Heatmap',
    desc: 'Live AIS vessel queue at 40 global hubs',
    category: 'Port Operations',
    icon: Anchor,
    badge: 'AIS Queues'
  }
];

export const DEFAULT_WIDGET_IDS = AVAILABLE_WIDGETS.map((w) => w.id);

interface CustomizeWidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWidgets: string[];
  onSaveWidgets: (selectedIds: string[]) => void;
}

export const CustomizeWidgetsModal: React.FC<CustomizeWidgetsModalProps> = ({
  isOpen,
  onClose,
  selectedWidgets,
  onSaveWidgets
}) => {
  const { theme } = useTheme();
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedWidgets);

  // Sync internal state with external prop whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(selectedWidgets);
    }
  }, [isOpen, selectedWidgets]);

  // Lock background body scroll and bind Escape key
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

  const handleToggleWidget = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(AVAILABLE_WIDGETS.map((w) => w.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleResetDefaults = () => {
    setSelectedIds(DEFAULT_WIDGET_IDS);
  };

  const handleSave = () => {
    onSaveWidgets(selectedIds);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-widgets-title"
    >
      <div
        className={`w-full max-w-lg border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200 animate-in zoom-in-95 ${
          theme === 'dark'
            ? 'bg-[#121824] border-cyan-500/30 text-slate-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)]'
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
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
              <Sliders size={16} />
            </div>
            <div>
              <h3 id="customize-widgets-title" className="text-base font-bold leading-tight">
                Customize Operations Dashboard
              </h3>
              <p
                className={`text-[11px] ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Select telemetry widgets to pin to your executive command view
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

        {/* Quick Toolbar: Selected count & batch toggles */}
        <div
          className={`px-6 py-2.5 border-b flex items-center justify-between text-xs shrink-0 ${
            theme === 'dark' ? 'border-white/[0.06] bg-[#0f1420]' : 'border-slate-100 bg-slate-100/60'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span
              className={`font-semibold ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Active Widgets:
            </span>
            <span className="font-mono text-cyan-500 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px]">
              {selectedIds.length} / {AVAILABLE_WIDGETS.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className={`text-[11px] font-medium hover:underline ${
                theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
              }`}
            >
              Select All
            </button>
            <span className="text-slate-400 text-xs">•</span>
            <button
              onClick={handleClearAll}
              className={`text-[11px] font-medium hover:underline ${
                theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable list of widgets without clipping */}
        <div className="px-6 py-4 overflow-y-auto space-y-3 flex-1">
          {AVAILABLE_WIDGETS.map((w) => {
            const isChecked = selectedIds.includes(w.id);
            const Icon = w.icon;

            return (
              <div
                key={w.id}
                onClick={() => handleToggleWidget(w.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none group ${
                  isChecked
                    ? theme === 'dark'
                      ? 'bg-cyan-500/[0.07] border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                      : 'bg-cyan-50/70 border-cyan-300 shadow-sm'
                    : theme === 'dark'
                    ? 'bg-[#161e2e]/70 border-white/[0.06] hover:border-white/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                      isChecked
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : theme === 'dark'
                        ? 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`text-xs font-semibold leading-tight group-hover:text-cyan-500 transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {w.name}
                      </span>
                      {w.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${
                            isChecked
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : theme === 'dark'
                              ? 'bg-white/[0.06] text-slate-400'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {w.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {w.desc}
                    </p>
                  </div>
                </div>

                {/* Checkbox Icon */}
                <div className="shrink-0 pl-1">
                  {isChecked ? (
                    <div className="w-6 h-6 rounded-md bg-cyan-500 text-slate-950 flex items-center justify-center shadow-sm">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                        theme === 'dark'
                          ? 'border-white/20 bg-white/[0.02] group-hover:border-cyan-500/50'
                          : 'border-slate-300 bg-white group-hover:border-cyan-500/50'
                      }`}
                    >
                      <span className="sr-only">Not selected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            theme === 'dark' ? 'border-white/[0.08] bg-[#161e2e]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`text-xs flex items-center space-x-1.5 transition-colors ${
              theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw size={12} />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                theme === 'dark'
                  ? 'bg-transparent hover:bg-white/[0.05] border-white/10 text-slate-300'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-cyan transition flex items-center justify-center space-x-1.5"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>Save Layout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
