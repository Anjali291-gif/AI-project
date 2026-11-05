import React, { useEffect } from 'react';
import {
  Anchor,
  X,
  Compass,
  Ship,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SearchPortItem, PortRoute, Vessel, NavigationPage } from '../types';
import { useTheme } from '../context/ThemeContext';

interface PortDetailsModalProps {
  port: SearchPortItem | null;
  onClose: () => void;
  onSelectRoute: (route: PortRoute) => void;
  onSelectVessel: (vessel: Vessel) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const PortDetailsModal: React.FC<PortDetailsModalProps> = ({
  port,
  onClose,
  onSelectRoute,
  onSelectVessel,
  onNavigate
}) => {
  const { theme } = useTheme();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!port) return null;

  const routes = port.available_routes || [];
  const vessels = port.active_vessels || [];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col ${
          theme === 'dark'
            ? 'bg-[#121824] border-cyan-500/30 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-4 mb-4 ${
            theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Anchor size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">
                  {port.fullName || port.name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
                  {port.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span>{port.country}</span>
                <span>•</span>
                <span className="font-mono">
                  {port.coords[0].toFixed(4)}° N, {port.coords[1].toFixed(4)}° E
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`p-3 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.06]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-mono">Connected Routes</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {routes.length} Available
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.06]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-mono">Active Vessels</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {vessels.length} Moored / En Route
              </div>
            </div>
            <div
              className={`p-3 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.06]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase font-mono">Hub Status</span>
              <div className="text-sm font-bold text-slate-200 mt-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate">Tier-1 Terminal</span>
              </div>
            </div>
          </div>

          {/* Connected Routes Section */}
          <div>
            <div className="flex items-center space-x-2 mb-2.5">
              <Compass size={15} className="text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Connected Corridors & Shipping Routes ({routes.length})
              </h4>
            </div>

            {routes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-white/[0.1] text-center text-xs text-slate-400">
                No predefined reference routes terminating directly at this port in catalog.
              </div>
            ) : (
              <div className="space-y-2">
                {routes.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.06] hover:border-cyan-500/40'
                        : 'bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold">
                        <span>{r.origin}</span>
                        <ArrowRight size={13} className="text-cyan-500" />
                        <span>{r.destination}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-sans font-semibold">
                          {r.vessel_class}
                        </span>
                        <span>•</span>
                        <span>{r.commodity}</span>
                        <span>•</span>
                        <span>{r.distance_nm.toLocaleString()} nm</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">${r.base_rate}/t</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectRoute(r);
                          onNavigate('forecast');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition"
                      >
                        Forecast
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectRoute(r);
                          onNavigate('chartering');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                      >
                        Charter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Vessels Section */}
          {vessels.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2.5">
                <Ship size={15} className="text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Active Vessels Near / Destined for this Port ({vessels.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {vessels.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      onClose();
                      onSelectVessel(v);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.06] hover:border-cyan-500/40'
                        : 'bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{v.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {v.vessel_class}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {v.current_port} → {v.destination_port}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        ${v.daily_charter_rate.toLocaleString()}/day • Status: {v.status}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`pt-4 border-t mt-4 flex items-center justify-between ${
            theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
          }`}
        >
          <button
            onClick={() => {
              onClose();
              onSelectRoute({
                id: 'custom',
                origin: port.fullName || port.name,
                origin_coords: port.coords,
                destination: 'North Europe Main (Rotterdam) [NL]',
                destination_coords: [51.9244, 4.4777],
                vessel_class: 'Capesize',
                distance_nm: 8500,
                transit_time_days: 20,
                base_rate: 28.5,
                change_pct: 0,
                commodity: 'Clean Petroleum',
                via: 'Direct',
                canal_fee: 0
              });
              onNavigate('forecast');
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs shadow-glow-cyan hover:opacity-90 transition"
          >
            Run Forecast from {port.name}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-600/30 text-xs font-semibold hover:bg-slate-500/10 transition text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
