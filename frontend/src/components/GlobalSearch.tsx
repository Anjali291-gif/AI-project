import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Ship,
  Anchor,
  Compass,
  Boxes,
  ArrowRight,
  TrendingUp,
  Clock,
  Loader2,
  SearchX,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ApiService } from '../services/api';
import {
  Vessel,
  PortRoute,
  SearchPortItem,
  SearchCommodityItem,
  SearchResults,
  NavigationPage
} from '../types';
import { useTheme } from '../context/ThemeContext';

interface GlobalSearchProps {
  onSelectVessel: (vessel: Vessel) => void;
  onSelectPort: (port: SearchPortItem) => void;
  onSelectRoute: (route: PortRoute) => void;
  onSelectCommodity: (commodity: string) => void;
  onNavigate: (page: NavigationPage) => void;
}

type SearchItem =
  | { type: 'vessel'; data: Vessel }
  | { type: 'port'; data: SearchPortItem }
  | { type: 'route'; data: PortRoute }
  | { type: 'commodity'; data: SearchCommodityItem };

const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>;
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return <span>{text}</span>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-cyan-500/30 text-cyan-400 dark:text-cyan-300 font-bold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSelectVessel,
  onSelectPort,
  onSelectRoute,
  onSelectCommodity,
  onNavigate
}) => {
  const { theme } = useTheme();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResults>({
    vessels: [],
    ports: [],
    routes: [],
    commodities: []
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Position for Portaled Dropdown
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 560 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<any>(null);

  // Flattened items for unified Arrow navigation
  const flattenedItems = useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [];
    results.vessels.forEach((v) => list.push({ type: 'vessel', data: v }));
    results.ports.forEach((p) => list.push({ type: 'port', data: p }));
    results.routes.forEach((r) => list.push({ type: 'route', data: r }));
    results.commodities.forEach((c) => list.push({ type: 'commodity', data: c }));
    return list;
  }, [results]);

  // Calculate and update position directly relative to viewport
  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const preferredWidth = Math.min(580, window.innerWidth - 32);
      let left = rect.left;
      if (left + preferredWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - preferredWidth - 16);
      }
      setDropdownPos({
        top: rect.bottom + 8,
        left: Math.max(16, left),
        width: preferredWidth
      });
    }
  }, []);

  // Update position when opened, resized, or scrolled
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleReposition = () => updatePosition();
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Global keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle outside click: inside click does NOT close prematurely
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search query fetching with debouncing
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ vessels: [], ports: [], routes: [], commodities: [] });
      setLoading(false);
      setErrorMsg(null);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await ApiService.search(trimmed);
        setResults(res || { vessels: [], ports: [], routes: [], commodities: [] });
        setSelectedIndex(0);
      } catch (err: any) {
        console.error('Search error:', err);
        setErrorMsg('Error loading live search telemetry');
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const executeItemAction = (item: SearchItem) => {
    setIsOpen(false);
    if (item.type === 'vessel') {
      onSelectVessel(item.data);
      onNavigate('chartering');
    } else if (item.type === 'port') {
      onSelectPort(item.data);
    } else if (item.type === 'route') {
      onSelectRoute(item.data);
      onNavigate('forecast');
    } else if (item.type === 'commodity') {
      onSelectCommodity(item.data.name);
      onNavigate('procurement');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flattenedItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flattenedItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flattenedItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flattenedItems.length) % flattenedItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedItems.length > 0 && selectedIndex < flattenedItems.length) {
        executeItemAction(flattenedItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ vessels: [], ports: [], routes: [], commodities: [] });
    inputRef.current?.focus();
  };

  const totalMatches =
    results.vessels.length +
    results.ports.length +
    results.routes.length +
    results.commodities.length;

  let runningIndex = 0;

  // Dropdown Content
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
        zIndex: 99999
      }}
      className={`rounded-2xl border shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
        theme === 'dark'
          ? 'bg-[#121824]/95 border-white/[0.12] text-slate-100 shadow-cyan-950/40 ring-1 ring-cyan-500/30'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/50 ring-1 ring-slate-300'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
          theme === 'dark' ? 'border-white/[0.06] text-slate-400' : 'border-slate-100 text-slate-500'
        }`}
      >
        <span>
          {query.trim()
            ? `${totalMatches} result${totalMatches === 1 ? '' : 's'} for "${query}"`
            : 'QUICK DISCOVERY & MARITIME SEARCH'}
        </span>
        <span className="text-[10px] opacity-75">Use ↑↓ keys, Enter to open, Esc to close</span>
      </div>

      <div className="max-h-[460px] overflow-y-auto divide-y divide-white/[0.04]">
        {/* Loading State */}
        {loading && (
          <div className="p-3 text-center text-xs text-cyan-400 flex items-center justify-center space-x-2 font-mono">
            <Loader2 size={14} className="animate-spin" />
            <span>Searching maritime telemetry...</span>
          </div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div className="p-3 text-center text-xs text-red-400 flex items-center justify-center space-x-2">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* INITIAL EMPTY STATE: Quick Suggestions */}
        {!query.trim() && (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                <span>Popular Maritime Searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'MV Baltic Wave',
                  'MV Orion Star',
                  'Rotterdam',
                  'Shanghai',
                  'Lagos',
                  'Singapore',
                  'Rotterdam to Lagos',
                  'Shanghai to Rotterdam',
                  'Capesize',
                  'Panamax',
                  'Handysize',
                  'Iron Ore',
                  'Chemicals',
                  'Sulfuric Acid'
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      inputRef.current?.focus();
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-slate-300 hover:text-white hover:border-cyan-500/50 hover:bg-cyan-950/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-cyan-500/50 hover:bg-cyan-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
              <div
                className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#161e2e] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="font-bold text-cyan-400 block mb-1">Vessel Fleet Registry</span>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Search active Capesize, Panamax, LR3, and Supramax vessels with live AIS telemetry, CII ratings and charter rates.
                </p>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#161e2e] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="font-bold text-cyan-400 block mb-1">Port Corridors & Arbitrage</span>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Instant lookup for major international ports, historical corridors, and bulk cargo procurement allocations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NO RESULTS STATE */}
        {query.trim() && totalMatches === 0 && !loading && (
          <div className="p-8 text-center space-y-2">
            <SearchX size={32} className="mx-auto text-slate-500 stroke-1" />
            <div className="text-sm font-bold text-slate-200">
              No matching maritime results found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No vessels, ports, routes, or commodities matched <span className="font-mono text-cyan-400 font-semibold">"{query}"</span>.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Try searching for <span className="text-slate-400 cursor-pointer underline" onClick={() => setQuery('MV Baltic Wave')}>MV Baltic Wave</span>, <span className="text-slate-400 cursor-pointer underline" onClick={() => setQuery('Rotterdam')}>Rotterdam</span>, <span className="text-slate-400 cursor-pointer underline" onClick={() => setQuery('Capesize')}>Capesize</span>, or <span className="text-slate-400 cursor-pointer underline" onClick={() => setQuery('Iron Ore')}>Iron Ore</span>.
            </div>
          </div>
        )}

        {/* GROUP 1: VESSELS */}
        {results.vessels.length > 0 && (
          <div className="p-2">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Ship size={12} className="text-cyan-400" />
                <span>Vessels ({results.vessels.length})</span>
              </div>
              <span className="text-[9px] text-slate-500">Opens Chartering & Details</span>
            </div>

            <div className="space-y-1">
              {results.vessels.map((vessel) => {
                const currentIndex = runningIndex++;
                const isSelected = selectedIndex === currentIndex;

                return (
                  <div
                    key={vessel.id}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    onClick={() => executeItemAction({ type: 'vessel', data: vessel })}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
                          : 'bg-cyan-50 border-cyan-300 text-slate-900'
                        : theme === 'dark'
                        ? 'border-transparent hover:bg-white/[0.03]'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Ship size={16} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold">
                            <HighlightMatch text={vessel.name} query={query} />
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
                            {vessel.vessel_class}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-medium ${
                              vessel.status === 'On Schedule'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {vessel.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                          <span>{vessel.dwt.toLocaleString()} DWT</span>
                          <span>•</span>
                          <span>
                            {vessel.current_port} → {vessel.destination_port}
                          </span>
                          <span>•</span>
                          <span className="text-cyan-400 font-semibold">{vessel.cargo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ${vessel.daily_charter_rate.toLocaleString()}/d
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        CII: {vessel.cii_rating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GROUP 2: PORTS */}
        {results.ports.length > 0 && (
          <div className="p-2">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Anchor size={12} className="text-cyan-400" />
                <span>Ports & Terminals ({results.ports.length})</span>
              </div>
              <span className="text-[9px] text-slate-500">Opens Port Modal & Connected Corridors</span>
            </div>

            <div className="space-y-1">
              {results.ports.map((port) => {
                const currentIndex = runningIndex++;
                const isSelected = selectedIndex === currentIndex;

                return (
                  <div
                    key={port.name}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    onClick={() => executeItemAction({ type: 'port', data: port })}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
                          : 'bg-cyan-50 border-cyan-300 text-slate-900'
                        : theme === 'dark'
                        ? 'border-transparent hover:bg-white/[0.03]'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Anchor size={16} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold">
                            <HighlightMatch text={port.name} query={query} />
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                            {port.code}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {port.country}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {port.coords[0].toFixed(2)}° N, {port.coords[1].toFixed(2)}° E
                          {port.available_routes_count ? ` • ${port.available_routes_count} Reference Routes` : ''}
                          {port.active_vessels_count ? ` • ${port.active_vessels_count} Vessels in Vicinity` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-400 text-xs">
                      <span className="text-[10px] font-medium hidden sm:inline">View Details</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GROUP 3: ROUTES */}
        {results.routes.length > 0 && (
          <div className="p-2">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Compass size={12} className="text-cyan-400" />
                <span>Shipping Routes ({results.routes.length})</span>
              </div>
              <span className="text-[9px] text-slate-500">Opens Freight Forecast</span>
            </div>

            <div className="space-y-1">
              {results.routes.map((route) => {
                const currentIndex = runningIndex++;
                const isSelected = selectedIndex === currentIndex;

                return (
                  <div
                    key={route.id}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    onClick={() => executeItemAction({ type: 'route', data: route })}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
                          : 'bg-cyan-50 border-cyan-300 text-slate-900'
                        : theme === 'dark'
                        ? 'border-transparent hover:bg-white/[0.03]'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Compass size={16} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-xs font-bold">
                          <span>
                            <HighlightMatch text={route.origin} query={query} />
                          </span>
                          <ArrowRight size={12} className="text-cyan-500" />
                          <span>
                            <HighlightMatch text={route.destination} query={query} />
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-semibold font-sans">
                            {route.vessel_class}
                          </span>
                          <span>•</span>
                          <span>{route.commodity}</span>
                          <span>•</span>
                          <span>{route.distance_nm.toLocaleString()} nm</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-cyan-400">
                        ${route.base_rate}/t
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {route.transit_time_days} days
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GROUP 4: COMMODITIES */}
        {results.commodities.length > 0 && (
          <div className="p-2">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Boxes size={12} className="text-cyan-400" />
                <span>Commodities ({results.commodities.length})</span>
              </div>
              <span className="text-[9px] text-slate-500">Opens Bulk Cargo Procurement</span>
            </div>

            <div className="space-y-1">
              {results.commodities.map((comm) => {
                const currentIndex = runningIndex++;
                const isSelected = selectedIndex === currentIndex;

                return (
                  <div
                    key={comm.name}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    onClick={() => executeItemAction({ type: 'commodity', data: comm })}
                    className={`p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-white'
                          : 'bg-cyan-50 border-cyan-300 text-slate-900'
                        : theme === 'dark'
                        ? 'border-transparent hover:bg-white/[0.03]'
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Boxes size={16} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold">
                            <HighlightMatch text={comm.name} query={query} />
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                            {comm.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Default Vessel: <span className="font-semibold text-slate-300">{comm.default_vessel_class}</span>
                          {comm.top_routes ? ` • Corridors: ${comm.top_routes.join(', ')}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-400 text-xs">
                      <span className="text-[10px] font-medium hidden sm:inline">Procurement</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Bar */}
      <div
        className={`px-4 py-2 border-t text-[10px] font-mono flex items-center justify-between ${
          theme === 'dark' ? 'border-white/[0.06] bg-[#0e141f] text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
        }`}
      >
        <span>FreightAI Global Maritime Registry</span>
        <div className="flex items-center space-x-3">
          <span>ESC to dismiss</span>
          <span>•</span>
          <span>ENTER to select</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Search Input Bar */}
      <div className="relative">
        <Search
          size={14}
          className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            isOpen ? 'text-cyan-500' : 'text-slate-400'
          }`}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            updatePosition();
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search vessels, routes, ports..."
          className={`w-64 sm:w-80 md:w-84 lg:w-96 h-9 pl-9 pr-14 rounded-lg border text-xs focus:outline-none focus:border-cyan-500 transition-all ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] text-slate-200 placeholder-slate-500 focus:bg-[#161e2e]'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white shadow-sm'
          }`}
        />

        {/* Clear Button (X) or Loading Spinner */}
        <div className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {loading ? (
            <Loader2 size={13} className="animate-spin text-cyan-500" />
          ) : query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition"
              title="Clear search"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* Keyboard shortcut hint */}
        <kbd
          onClick={() => {
            inputRef.current?.focus();
            setIsOpen(true);
          }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition select-none ${
            theme === 'dark'
              ? 'bg-slate-800 text-slate-400 border-white/[0.08] hover:border-cyan-500/40 hover:text-cyan-300'
              : 'bg-slate-200 text-slate-500 border-slate-300 hover:border-slate-400'
          }`}
        >
          /
        </kbd>
      </div>

      {/* Render Dropdown via React Portal attached directly to document.body to prevent any stacking/clipping issues */}
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
};
