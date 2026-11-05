import React, { useState } from 'react';
import {
  Ship,
  Navigation,
  Anchor,
  Box,
  Clock,
  Compass,
  Filter,
  TrendingUp,
  Fuel,
  Sliders
} from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { WorldMap } from '../components/WorldMap';
import { AlertsWidget } from '../components/AlertsWidget';
import { Vessel, PortRoute, AlertItem, NavigationPage } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface DashboardPageProps {
  dashboardData: any;
  onNavigate: (page: NavigationPage) => void;
  onSelectVessel: (vessel: Vessel) => void;
  onSelectRoute: (route: PortRoute) => void;
  activeWidgets?: string[];
  onOpenWidgetModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  dashboardData,
  onNavigate,
  onSelectVessel,
  onSelectRoute,
  activeWidgets = ['bdi_stream', 'transit_tracker', 'bunker_hedging', 'port_congestion'],
  onOpenWidgetModal
}) => {
  const { theme } = useTheme();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const kpis = dashboardData?.kpis || {};
  const vessels: Vessel[] = dashboardData?.vessel_map_markers || [];
  const alerts: AlertItem[] = dashboardData?.alerts || [];
  const routes: PortRoute[] = dashboardData?.routes || [];
  const turnaroundHistory = dashboardData?.turnaround_history || [];
  const currentOps: Vessel[] = dashboardData?.current_operations || vessels.slice(0, 5);

  const filteredOps = currentOps.filter((v) => {
    if (filterStatus === 'all') return true;
    return v.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Global Fleet &amp; Freight Operations Command
          </h1>
          <p
            className={`text-xs mt-1 flex items-center space-x-2 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span>Real-Time Fleet Intelligence & Voyage Analytics</span>
            <span>•</span>
            <span className="font-mono text-cyan-500 font-semibold">SIH 2026 P23 Intelligent Engine</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('forecast')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-glow-cyan transition"
          >
            <TrendingUp size={15} />
            <span>New AI Forecast</span>
          </button>
          <button
            onClick={() => onNavigate('chartering')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition ${
              theme === 'dark'
                ? 'bg-[#161e2e] hover:bg-[#1a253a] border-white/[0.08] text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <Ship size={15} />
            <span>Charter Optimizer</span>
          </button>
          {onOpenWidgetModal && (
            <button
              onClick={onOpenWidgetModal}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition ${
                theme === 'dark'
                  ? 'bg-[#161e2e] hover:bg-[#1a253a] border-white/[0.08] text-cyan-400 hover:border-cyan-500/40'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-cyan-700 shadow-sm hover:border-cyan-300'
              }`}
              title="Customize Pinned Dashboard Telemetry Widgets"
            >
              <Sliders size={15} />
              <span>Customize Layout</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left KPIs (2x3) + Middle Map + Right Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 6 Compact KPI Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
          <KPICard
            title="Active Vessels"
            value={kpis.active_vessels?.value ?? 48}
            change={kpis.active_vessels?.change ?? '+3 today'}
            icon={Ship}
            sparklineData={[42, 43, 45, 44, 46, 45, 48]}
          />
          <KPICard
            title="In Voyage"
            value={kpis.in_voyage?.value ?? 34}
            icon={Navigation}
            sparklineData={[30, 31, 32, 33, 31, 34]}
          />
          <KPICard
            title="At Berth"
            value={kpis.at_berth?.value ?? 10}
            icon={Anchor}
            sparklineData={[8, 9, 11, 10, 10, 10]}
          />
          <KPICard
            title="Under Load"
            value={kpis.under_load?.value ?? 6}
            icon={Box}
            sparklineData={[4, 5, 5, 6, 5, 6]}
          />
          <KPICard
            title="Port Delays"
            value={kpis.port_delays?.value ?? '18%'}
            change={kpis.port_delays?.change ?? '-4.6%'}
            changeType="positive"
            icon={Clock}
            sparklineData={[24, 22, 21, 19, 20, 18]}
          />
          <KPICard
            title="Route Efficiency"
            value={kpis.route_efficiency?.value ?? '87%'}
            change={kpis.route_efficiency?.change ?? '+2.8%'}
            changeType="positive"
            icon={Compass}
            sparklineData={[81, 82, 84, 85, 86, 87]}
          />
        </div>

        {/* Center: Real Interactive World Map with Coastlines and AIS Telemetry */}
        <div className="lg:col-span-5 h-[350px]">
          <WorldMap
            vessels={vessels}
            routes={routes}
            onSelectVessel={onSelectVessel}
            onSelectRoute={onSelectRoute}
            heightClass="h-full"
            showRoutes={true}
          />
        </div>

        {/* Right: Fleet Alerts Panel */}
        <div className="lg:col-span-3 h-[350px]">
          <AlertsWidget alerts={alerts} />
        </div>
      </div>

      {/* ── Pinned Operations & Telemetry Widgets ── */}
      {activeWidgets.length === 0 ? (
        <div
          className={`p-4 rounded-2xl border border-dashed flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition ${
            theme === 'dark'
              ? 'bg-[#121824]/40 border-white/10 text-slate-400'
              : 'bg-slate-50 border-slate-300 text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Sliders size={16} className="text-cyan-500 shrink-0" />
            <span className="text-xs">
              All optional operations telemetry widgets are currently hidden from your command view.
            </span>
          </div>
          {onOpenWidgetModal && (
            <button
              onClick={onOpenWidgetModal}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
            >
              + Customize Layout &amp; Add Widgets
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders size={15} className="text-cyan-500" />
              <h2
                className={`text-sm font-bold tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Pinned Operations &amp; Market Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                {activeWidgets.length} Active
              </span>
            </div>

            {onOpenWidgetModal && (
              <button
                onClick={onOpenWidgetModal}
                className={`text-xs flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition ${
                  theme === 'dark'
                    ? 'bg-[#161e2e] border-white/[0.08] text-slate-300 hover:text-white hover:border-cyan-500/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
                }`}
              >
                <Sliders size={12} />
                <span>Customize</span>
              </button>
            )}
          </div>

          <div
            className={`grid gap-4 ${
              activeWidgets.length === 1
                ? 'grid-cols-1'
                : activeWidgets.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : activeWidgets.length === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {/* Widget 1: Baltic Dry Index (BDI) Live Stream */}
            {activeWidgets.includes('bdi_stream') && (
              <div
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
                    : 'bg-white border-slate-200 shadow-light-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
                        <TrendingUp size={14} />
                      </div>
                      <span className="text-xs font-bold leading-tight">Baltic Dry Index (BDI)</span>
                    </div>
                    <span className="flex items-center space-x-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2.5 my-2">
                    <span className="text-2xl font-extrabold font-mono text-cyan-400">2,148</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">+38 pts (+1.8%)</span>
                  </div>

                  <div
                    className={`grid grid-cols-3 gap-1.5 p-2 rounded-xl border text-[10px] font-mono my-2.5 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.05] text-slate-300'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-slate-500 block text-[9px]">Capesize</span>
                      <span className="font-bold">3,412</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Panamax</span>
                      <span className="font-bold">1,825</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Supramax</span>
                      <span className="font-bold">1,310</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                    theme === 'dark' ? 'border-white/[0.06] text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="font-mono">BALTIC EXCHANGE BENCHMARK</span>
                  <span className="text-cyan-500 font-semibold">24 Corridors</span>
                </div>
              </div>
            )}

            {/* Widget 2: Red Sea / Suez Canal Transit Tracker */}
            {activeWidgets.includes('transit_tracker') && (
              <div
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-amber-500/30 ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
                    : 'bg-white border-slate-200 shadow-light-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                        <Compass size={14} />
                      </div>
                      <span className="text-xs font-bold leading-tight">Red Sea / Suez Tracker</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      RISK: HIGH
                    </span>
                  </div>

                  <div className="my-2">
                    <span className="text-xs font-semibold text-amber-400">Bab el-Mandeb Chokepoint Alert</span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      68% dry bulk tonnage diverted via Cape of Good Hope
                    </div>
                  </div>

                  <div
                    className={`space-y-1.5 p-2 rounded-xl border text-[11px] font-mono my-2.5 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.05] text-slate-300'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cape Deviation:</span>
                      <span className="font-bold text-amber-400">+11.4 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">War Risk Surcharge:</span>
                      <span className="font-bold text-rose-400">+$418,000 / voyage</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                    theme === 'dark' ? 'border-white/[0.06] text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="font-mono">SECURITY TELEMETRY</span>
                  <span className="text-amber-500 font-semibold">Cape Routing Rec.</span>
                </div>
              </div>
            )}

            {/* Widget 3: Bunker Hedging & Carbon Offset Costs */}
            {activeWidgets.includes('bunker_hedging') && (
              <div
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
                    : 'bg-white border-slate-200 shadow-light-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
                        <Fuel size={14} />
                      </div>
                      <span className="text-xs font-bold leading-tight">Bunker &amp; Carbon Costs</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      EU ETS / IMO
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2 my-2">
                    <span className="text-2xl font-extrabold font-mono text-cyan-400">$594</span>
                    <span className="text-[11px] text-slate-400 font-mono">/MT VLSFO (Rotterdam)</span>
                  </div>

                  <div
                    className={`space-y-1.5 p-2 rounded-xl border text-[11px] font-mono my-2.5 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.05] text-slate-300'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="text-slate-400">MGO Benchmark:</span>
                      <span className="font-bold">$778 / MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">EU ETS Carbon EUA:</span>
                      <span className="font-bold text-emerald-400">€74.80 / t CO₂</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Maritime Offset:</span>
                      <span className="font-bold text-cyan-400">$8.40 / DWT</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                    theme === 'dark' ? 'border-white/[0.06] text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="font-mono">65% Q4 HEDGED</span>
                  <span className="text-emerald-500 font-semibold">CII Compliant</span>
                </div>
              </div>
            )}

            {/* Widget 4: Port Berth Congestion Heatmap */}
            {activeWidgets.includes('port_congestion') && (
              <div
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${
                  theme === 'dark'
                    ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
                    : 'bg-white border-slate-200 shadow-light-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
                        <Anchor size={14} />
                      </div>
                      <span className="text-xs font-bold leading-tight">Port Berth Congestion</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      40 HUBS
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2 my-2">
                    <span className="text-2xl font-extrabold font-mono text-amber-400">28.6h</span>
                    <span className="text-[11px] text-slate-400 font-mono">Global Avg Wait</span>
                  </div>

                  <div
                    className={`space-y-1.5 p-2 rounded-xl border text-[11px] font-mono my-2.5 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.05] text-slate-300'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Shanghai:</span>
                      </span>
                      <span className="font-bold text-rose-400">48h (High)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Singapore:</span>
                      </span>
                      <span className="font-bold text-amber-400">36h (Med)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Rotterdam:</span>
                      </span>
                      <span className="font-bold text-emerald-400">18h (Low)</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                    theme === 'dark' ? 'border-white/[0.06] text-slate-500' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="font-mono">AIS QUEUE TELEMETRY</span>
                  <span className="text-cyan-500 font-semibold">84.2% Efficiency</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Grid: Avg Turnaround Time / History Chart + Current Operations Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Avg Turnaround Time Chart */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
              : 'bg-white border-slate-200 shadow-light-card'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Avg Turnaround Time
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span
                  className={`text-2xl font-bold font-sans ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {kpis.avg_turnaround_time?.value ?? '22h'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                  {kpis.avg_turnaround_time?.change ?? '-4.5%'}
                </span>
              </div>
            </div>
            <div
              className={`text-[11px] font-mono ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Port Turnaround Dwell
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnaroundHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  domain={[15, 35]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#161e2e' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  formatter={(value: any, name: string) => [
                    `${value} ${name === 'hours' ? 'hours' : '%'}`,
                    name === 'hours' ? 'Turnaround' : 'Efficiency'
                  ]}
                />
                <Bar dataKey="hours" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {turnaroundHistory.map((_item: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === turnaroundHistory.length - 1
                          ? '#06b6d4'
                          : theme === 'dark'
                          ? '#1e3a5f'
                          : '#93c5fd'
                      }
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Current Operations Table */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-5 transition-all flex flex-col justify-between ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
              : 'bg-white border-slate-200 shadow-light-card'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Current Operations
              </span>
              <p
                className={`text-[11px] mt-0.5 ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Real-time voyage status & risk telemetry
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`border text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 ${
                  theme === 'dark'
                    ? 'bg-[#161e2e] border-white/[0.08] text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">All Status</option>
                <option value="Delayed">Delayed</option>
                <option value="On Schedule">On Schedule</option>
                <option value="At Berth">At Berth</option>
                <option value="En Route">En Route</option>
              </select>

              <button
                className={`p-1.5 rounded-lg border transition ${
                  theme === 'dark'
                    ? 'bg-[#161e2e] border-white/[0.08] text-slate-400 hover:text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Filter size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b font-mono text-[11px] ${
                    theme === 'dark'
                      ? 'border-white/[0.06] text-slate-500'
                      : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <th className="pb-2.5 font-medium">Vessel</th>
                  <th className="pb-2.5 font-medium">Route</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">ETA Deviation</th>
                  <th className="pb-2.5 font-medium text-right">Risk</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  theme === 'dark' ? 'divide-white/[0.04]' : 'divide-slate-100'
                }`}
              >
                {filteredOps.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => onSelectVessel(v)}
                    className={`transition-colors cursor-pointer group ${
                      theme === 'dark' ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5">
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold group-hover:text-cyan-500 transition-colors ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {v.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {v.vessel_class}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-2.5 font-mono text-[11px] ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {v.current_port.split(' ')[0]} <span className="text-cyan-500">→</span> {v.destination_port.split(' ')[0]}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          v.status === 'Delayed'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : v.status === 'On Schedule'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : v.status === 'At Berth'
                            ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 font-mono ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <span className={v.eta_deviation.includes('+') ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                        {v.eta_deviation}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      <span
                        className={`inline-flex items-center space-x-1 ${
                          v.risk_level === 'High'
                            ? 'text-rose-500 font-bold'
                            : v.risk_level === 'Medium'
                            ? 'text-amber-500 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        <span className="text-xs">•</span>
                        <span>{v.risk_level}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
