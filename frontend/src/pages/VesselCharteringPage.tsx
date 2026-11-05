import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Ship,
  Search,
  Award,
  DollarSign,
  TrendingUp,
  Layers,
  CheckCircle2,
  Calendar,
  Fuel
} from 'lucide-react';
import { ApiService } from '../services/api';
import { PortRoute, Vessel } from '../types';
import { WorldMap } from '../components/WorldMap';
import { CharterOptimizerModal } from '../components/CharterOptimizerModal';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export interface VesselCharteringPageProps {
  initialSearchQuery?: string;
  initialOriginPort?: string;
  initialDestPort?: string;
  initialCommodity?: string;
  onSelectVessel?: (vessel: Vessel) => void;
}

export const VesselCharteringPage: React.FC<VesselCharteringPageProps> = ({
  initialSearchQuery,
  initialOriginPort,
  initialDestPort,
  initialCommodity,
  onSelectVessel
}) => {
  const { theme } = useTheme();

  const [routes, setRoutes] = useState<PortRoute[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>('R02');
  const [multiSelect, setMultiSelect] = useState<boolean>(true);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(['R01', 'R04']);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // AI Optimizer State
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [cargoQty, setCargoQty] = useState(150000);
  const [commodity, setCommodity] = useState('Clean Petroleum');
  const [originPort, setOriginPort] = useState('Rotterdam [NL]');
  const [destPort, setDestPort] = useState('Lagos [NG]');
  const [priority, setPriority] = useState('cost');
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizerError, setOptimizerError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
    if (initialOriginPort) setOriginPort(initialOriginPort);
    if (initialDestPort) setDestPort(initialDestPort);
    if (initialCommodity) setCommodity(initialCommodity);
  }, [initialSearchQuery, initialOriginPort, initialDestPort, initialCommodity]);

  const loadData = async () => {
    const res = await ApiService.getVessels();
    setVessels(res.vessels);
    setRoutes(res.reference_routes);
  };

  const toggleRouteSelection = (id: string) => {
    if (selectedRouteIds.includes(id)) {
      if (selectedRouteIds.length > 1) {
        setSelectedRouteIds(selectedRouteIds.filter((r) => r !== id));
      }
    } else {
      setSelectedRouteIds([...selectedRouteIds, id]);
    }
  };

  const handleRunOptimizer = async () => {
    if (!cargoQty || cargoQty <= 0) {
      setOptimizerError('Cargo quantity must be a positive number greater than 0.');
      return;
    }
    if (!originPort.trim() || !destPort.trim()) {
      setOptimizerError('Please specify valid origin and destination ports.');
      return;
    }
    setOptimizing(true);
    setOptimizerError(null);
    try {
      const res = await ApiService.optimizeChartering({
        origin_port: originPort.trim(),
        destination_port: destPort.trim(),
        cargo_quantity_mts: cargoQty,
        commodity,
        laycan_start: '2026-11-01',
        laycan_end: '2026-11-05',
        priority
      });
      setOptimizationResult(res);
    } catch (e: any) {
      console.error(e);
      setOptimizerError(e?.message || 'Failed to calculate optimal vessel fixture.');
    } finally {
      setOptimizing(false);
    }
  };

  // Historical data for multi-line route comparison matching Reference 03
  const routeHistoricalData = [
    { date: 'Jun 7, 2026', 'Rotterdam -> Lagos': 28.5, 'Fujairah -> Mombasa': 24.2 },
    { date: 'Jun 19, 2026', 'Rotterdam -> Lagos': 21.0, 'Fujairah -> Mombasa': 16.5 },
    { date: 'Jul 1, 2026', 'Rotterdam -> Lagos': 19.8, 'Fujairah -> Mombasa': 22.0 },
    { date: 'Jul 13, 2026', 'Rotterdam -> Lagos': 23.4, 'Fujairah -> Mombasa': 14.8 },
    { date: 'Jul 25, 2026', 'Rotterdam -> Lagos': 17.5, 'Fujairah -> Mombasa': 16.2 },
    { date: 'Aug 6, 2026', 'Rotterdam -> Lagos': 26.8, 'Fujairah -> Mombasa': 29.5 },
    { date: 'Aug 18, 2026', 'Rotterdam -> Lagos': 32.4, 'Fujairah -> Mombasa': 25.1 },
    { date: 'Aug 30, 2026', 'Rotterdam -> Lagos': 33.8, 'Fujairah -> Mombasa': 24.8 }
  ];

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vessel_class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.commodity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || r.vessel_class.toLowerCase() === classFilter.toLowerCase();
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Title Bar matching Reference 03 ("Anywhere Freight Pricing") */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-extrabold tracking-tight font-sans ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Anywhere Freight Pricing & Vessel Chartering
          </h1>
          <p
            className={`text-xs mt-0.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Real-time market voyage fixture comparison, route economics & multi-attribute fleet ranking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className={`h-8 text-xs rounded-lg px-2 border focus:outline-none focus:border-cyan-500 ${
              theme === 'dark'
                ? 'bg-[#121824] border-white/[0.08] text-slate-300'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <option value="all">All Vessel Classes</option>
            <option value="LR3">LR3 (160k DWT)</option>
            <option value="LR2">LR2 (115k DWT)</option>
            <option value="LR1">LR1 (74k DWT)</option>
            <option value="MR2">MR2 (50k DWT)</option>
          </select>

          {/* Search vessels */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routes or vessels..."
              className={`w-52 h-8 pl-8 pr-3 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 ${
                theme === 'dark'
                  ? 'bg-[#121824] border-white/[0.08] text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>

          {/* Launch Optimizer Button */}
          <button
            onClick={() => {
              setShowOptimizerModal(true);
              if (!optimizationResult) handleRunOptimizer();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-glow-cyan transition"
          >
            <Sparkles size={14} />
            <span>Charter Optimizer</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid (Reference 03: Left Table / Right Charts & Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Routes & Vessel Fixtures Table (7 cols) */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-5 flex flex-col justify-between transition ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
              : 'bg-white border-slate-200 shadow-light-card'
          }`}
        >
          <div>
            {/* Table Header Controls matching Reference 03 */}
            <div
              className={`flex items-center justify-between mb-3 border-b pb-3 ${
                theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Routes
                </span>
                <span className="text-[11px] text-slate-400 font-mono">as of Mon Mar 25, 2026</span>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 text-xs text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={multiSelect}
                    onChange={(e) => setMultiSelect(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Multi-select</span>
                </label>

                <button
                  onClick={() => setShowOptimizerModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
                >
                  <Plus size={13} />
                  <span>Add route</span>
                </button>

                <button
                  className={`p-1 rounded transition ${
                    theme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Download size={15} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`font-mono text-[11px] border-b ${
                      theme === 'dark'
                        ? 'text-slate-500 border-white/[0.04]'
                        : 'text-slate-400 border-slate-100'
                    }`}
                  >
                    <th className="pb-2 pl-2"></th>
                    <th className="pb-2 font-medium">Origin</th>
                    <th className="pb-2 font-medium">Destination</th>
                    <th className="pb-2 font-medium">Vessel class</th>
                    <th className="pb-2 font-medium">Rate ($/t)</th>
                    <th className="pb-2 font-medium">Lumpsum ($)</th>
                    <th className="pb-2 font-medium">Change</th>
                    <th className="pb-2 font-medium">Product</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    theme === 'dark' ? 'divide-white/[0.04]' : 'divide-slate-100'
                  }`}
                >
                  {filteredRoutes.map((route) => {
                    const isExpanded = expandedRouteId === route.id;
                    const isSelected = selectedRouteIds.includes(route.id);

                    return (
                      <React.Fragment key={route.id}>
                        <tr
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? theme === 'dark'
                                ? 'bg-cyan-950/20'
                                : 'bg-cyan-50'
                              : theme === 'dark'
                              ? 'hover:bg-white/[0.03]'
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => {
                            if (multiSelect) toggleRouteSelection(route.id);
                            setExpandedRouteId(isExpanded ? null : route.id);
                          }}
                        >
                          <td className="py-3 pl-2 text-slate-400">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td
                            className={`py-3 font-semibold ${
                              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {route.origin}
                          </td>
                          <td
                            className={`py-3 font-semibold ${
                              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {route.destination}
                          </td>
                          <td className="py-3 font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                            {route.vessel_class}
                          </td>
                          <td
                            className={`py-3 font-mono font-bold ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            ${route.base_rate}
                          </td>
                          <td className="py-3 font-mono text-slate-500">
                            {route.lumpsum_m ? `$${route.lumpsum_m}m` : '-'}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                route.change_pct > 0
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : route.change_pct < 0
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  : 'bg-slate-500/10 text-slate-400'
                              }`}
                            >
                              {route.change_pct > 0 ? `+${route.change_pct}%` : `${route.change_pct}%`}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {route.commodity}
                          </td>
                        </tr>

                        {/* Expandable Assumed Costs Row matching Reference 03 */}
                        {isExpanded && (
                          <tr
                            className={`border-b ${
                              theme === 'dark'
                                ? 'bg-[#0f1522] border-white/[0.06]'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <td colSpan={8} className="p-4 pl-8">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div
                                    className={`font-bold text-xs ${
                                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                                    }`}
                                  >
                                    {route.origin} → {route.destination}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {route.via} • {route.transit_time_days} days • {route.distance_nm.toLocaleString()} nm • {route.vessel_class}
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 text-right font-mono text-[11px]">
                                  <div>
                                    <div className="text-slate-400 text-[10px]">Origin Port</div>
                                    <div
                                      className={`font-semibold ${
                                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                      }`}
                                    >
                                      $0.41 /t
                                    </div>
                                    <div className="text-slate-400 text-[10px]">$15.32k</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-[10px]">Dest Port</div>
                                    <div
                                      className={`font-semibold ${
                                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                      }`}
                                    >
                                      $1.53 /t
                                    </div>
                                    <div className="text-slate-400 text-[10px]">$56.58k</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-[10px]">Canal Toll</div>
                                    <div
                                      className={`font-semibold ${
                                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                      }`}
                                    >
                                      {route.canal_fee > 0 ? `$${route.canal_fee.toLocaleString()}` : '$0'}
                                    </div>
                                    <div className="text-slate-400 text-[10px]">Suez / Panama</div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-[10px]">Total Voyage</div>
                                    <div className="text-cyan-500 font-bold">
                                      ${((route.base_rate * 150000) / 1000000).toFixed(2)}M
                                    </div>
                                    <div className="text-emerald-500 text-[10px]">Optimal</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Stacked Historical Chart (Top) & Real Interactive Map (Bottom) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Top: Route Historical Line Chart (Reference 03) */}
          <div
            className={`rounded-2xl border p-5 transition ${
              theme === 'dark'
                ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
                : 'bg-white border-slate-200 shadow-light-card'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Route Historical
              </span>
              <div className="flex items-center space-x-3 text-[10px] font-mono">
                <span className="flex items-center space-x-1 text-cyan-500">
                  <span className="w-2.5 h-0.5 bg-[#06b6d4]" />
                  <span>Rotterdam → Lagos</span>
                </span>
                <span className="flex items-center space-x-1 text-purple-500">
                  <span className="w-2.5 h-0.5 bg-[#a855f7]" />
                  <span>Fujairah → Mombasa</span>
                </span>
              </div>
            </div>

            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={routeHistoricalData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === 'dark' ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10 }}
                    axisLine={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}
                    tickLine={false}
                    domain={[0, 40]}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#161e2e' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                    }}
                    formatter={(v) => [`$${v}/t`, 'Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="Rotterdam -> Lagos"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Fujairah -> Mombasa"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom: Real Interactive Geographic World Map with Route Arcs */}
          <div className="h-[290px]">
            <WorldMap
              vessels={vessels}
              routes={routes}
              selectedRouteId={selectedRouteIds[0]}
              heightClass="h-full"
              showRoutes={true}
            />
          </div>
        </div>
      </div>

      {/* AI Charter Recommendation Modal (Portaled with z-[99999] above background map) */}
      <CharterOptimizerModal
        isOpen={showOptimizerModal}
        onClose={() => setShowOptimizerModal(false)}
        cargoQty={cargoQty}
        setCargoQty={setCargoQty}
        originPort={originPort}
        setOriginPort={setOriginPort}
        destPort={destPort}
        setDestPort={setDestPort}
        commodity={commodity}
        setCommodity={setCommodity}
        priority={priority}
        setPriority={setPriority}
        optimizationResult={optimizationResult}
        optimizing={optimizing}
        optimizerError={optimizerError}
        onRecalculate={handleRunOptimizer}
      />
    </div>
  );
};
