import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import {
  CustomizeWidgetsModal,
  DEFAULT_WIDGET_IDS
} from './components/CustomizeWidgetsModal';
import { ForecastPage } from './pages/ForecastPage';
import { VesselCharteringPage } from './pages/VesselCharteringPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { ModelInsightsPage } from './pages/ModelInsightsPage';
import { ApiService } from './services/api';
import { NavigationPage, Vessel, PortRoute, SearchPortItem } from './types';
import { PortDetailsModal } from './components/PortDetailsModal';
import { useTheme } from './context/ThemeContext';
import {
  Ship,
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const VALID_PAGES: NavigationPage[] = ['dashboard', 'forecast', 'chartering', 'procurement', 'models'];

const getPageFromUrl = (): NavigationPage => {
  if (typeof window === 'undefined') return 'dashboard';
  // Check pathname first (e.g. /forecast, /chartering)
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (VALID_PAGES.includes(path as NavigationPage)) {
    return path as NavigationPage;
  }
  // Check hash (e.g. #/forecast or #forecast)
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (VALID_PAGES.includes(hash as NavigationPage)) {
    return hash as NavigationPage;
  }
  return 'dashboard';
};

const STORAGE_KEY = 'freightai_dashboard_widgets';

const getSavedWidgets = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse saved widgets from localStorage:', err);
  }
  return DEFAULT_WIDGET_IDS;
};

export const AppContent: React.FC = () => {
  const { theme } = useTheme();

  // Default to URL path or dashboard landing page (/)
  const [currentPage, setCurrentPage] = useState<NavigationPage>(getPageFromUrl);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isRealML, setIsRealML] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Selected Vessel Detail Drawer
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  // Global Search State & Handlers
  const [selectedPort, setSelectedPort] = useState<SearchPortItem | null>(null);
  const [forecastPrefill, setForecastPrefill] = useState<{
    origin?: string;
    destination?: string;
    vesselClass?: string;
    commodity?: string;
  } | null>(null);
  const [charteringPrefill, setCharteringPrefill] = useState<{
    origin?: string;
    destination?: string;
    vessel?: string;
    commodity?: string;
  } | null>(null);
  const [procurementCommodity, setProcurementCommodity] = useState<string | null>(null);

  const mapToForecastPort = (portStr: string): string => {
    const p = portStr.toLowerCase();
    if (p.includes('rotterdam')) return 'Rotterdam [NL]';
    if (p.includes('shanghai') || p.includes('far east')) return 'Far East Main';
    if (p.includes('houston')) return 'Houston, TX [US]';
    if (p.includes('fujairah')) return 'Fujairah [AE]';
    if (p.includes('singapore')) return 'Singapore [SG]';
    if (p.includes('santos')) return 'Santos [BR]';
    if (p.includes('jubail')) return 'Jubail [SA]';
    if (p.includes('lagos')) return 'Lagos [NG]';
    if (p.includes('mombasa')) return 'Mombasa [KE]';
    if (p.includes('vizag')) return 'Vizag [IN]';
    if (p.includes('antwerp')) return 'North Europe Main';
    if (p.includes('dubai')) return 'Dubai [AE]';
    if (p.includes('los angeles') || p.includes('la')) return 'US West Coast (LA)';
    return portStr;
  };

  const handleSelectVesselFromSearch = (vessel: Vessel) => {
    setSelectedVessel(vessel);
    setCharteringPrefill({
      vessel: vessel.name,
      origin: vessel.current_port,
      destination: vessel.destination_port,
      commodity: vessel.cargo
    });
    showToast(`Viewing Vessel: ${vessel.name} (${vessel.vessel_class})`);
  };

  const handleSelectPortFromSearch = (port: SearchPortItem) => {
    setSelectedPort(port);
  };

  const handleSelectRouteFromSearch = (route: PortRoute) => {
    const origMapped = mapToForecastPort(route.origin);
    const destMapped = mapToForecastPort(route.destination);
    setForecastPrefill({
      origin: origMapped,
      destination: destMapped,
      vesselClass: route.vessel_class,
      commodity: route.commodity
    });
    navigateTo('forecast');
    showToast(`Loaded Route: ${route.origin} → ${route.destination} into Forecast`);
  };

  const handleSelectCommodityFromSearch = (commodity: string) => {
    setProcurementCommodity(commodity);
    navigateTo('procurement');
    showToast(`Loaded Commodity: ${commodity} into Bulk Procurement`);
  };

  // Add Widget Modal & Layout
  const [showWidgetModal, setShowWidgetModal] = useState<boolean>(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(getSavedWidgets);

  const handleSaveWidgets = (selectedIds: string[]) => {
    setActiveWidgets(selectedIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch (err) {
      console.error('Failed to save widgets to localStorage:', err);
    }
    showToast(`Dashboard layout saved (${selectedIds.length} widgets active)`);
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Synchronize browser URL with navigation page
  const navigateTo = useCallback((page: NavigationPage) => {
    setCurrentPage(page);
    const targetUrl = page === 'dashboard' ? '/' : `/${page}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ page }, '', targetUrl);
    }
  }, []);

  // Handle browser Back / Forward navigation and page refreshes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      const health = await ApiService.checkHealth();
      setBackendOnline(health.online);
      setIsRealML(health.ml_loaded);

      const dData = await ApiService.getDashboard();
      setDashboardData(dData);
      showToast('Telemetry refreshed from live maritime feeds');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      ApiService.checkHealth().then((h) => {
        setBackendOnline(h.online);
        setIsRealML(h.ml_loaded);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectVessel = (vessel: Vessel) => {
    setSelectedVessel(vessel);
  };

  const handleSelectRoute = (route: PortRoute) => {
    showToast(`Selected Corridor: ${route.origin} → ${route.destination}`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-cyan-500/20 selection:text-cyan-500 ${
        theme === 'dark' ? 'bg-[#0b0f17] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        backendOnline={backendOnline}
        isRealML={isRealML}
      />

      {/* Header */}
      <Header
        currentPage={currentPage}
        onNavigate={navigateTo}
        collapsed={sidebarCollapsed}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
        backendOnline={backendOnline}
        isRealML={isRealML}
        onOpenWidgetModal={() => setShowWidgetModal(true)}
        onSelectVessel={handleSelectVesselFromSearch}
        onSelectPort={handleSelectPortFromSearch}
        onSelectRoute={handleSelectRouteFromSearch}
        onSelectCommodity={handleSelectCommodityFromSearch}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 pt-20 px-6 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              dashboardData={dashboardData}
              onNavigate={navigateTo}
              onSelectVessel={handleSelectVessel}
              onSelectRoute={handleSelectRoute}
              activeWidgets={activeWidgets}
              onOpenWidgetModal={() => setShowWidgetModal(true)}
            />
          )}

          {currentPage === 'forecast' && (
            <ForecastPage
              initialOrigin={forecastPrefill?.origin}
              initialDestination={forecastPrefill?.destination}
              initialVesselClass={forecastPrefill?.vesselClass}
              initialCommodity={forecastPrefill?.commodity}
            />
          )}

          {currentPage === 'chartering' && (
            <VesselCharteringPage
              initialSearchQuery={charteringPrefill?.vessel}
              initialOriginPort={charteringPrefill?.origin}
              initialDestPort={charteringPrefill?.destination}
              initialCommodity={charteringPrefill?.commodity}
              onSelectVessel={handleSelectVessel}
            />
          )}

          {currentPage === 'procurement' && (
            <ProcurementPage initialCommodity={procurementCommodity || undefined} />
          )}

          {currentPage === 'models' && <ModelInsightsPage />}
        </div>
      </main>

      {/* Vessel Detail Slide-out Drawer */}
      {selectedVessel && (
        <div className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm flex justify-end">
          <div
            className={`w-full max-w-md border-l h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right ${
              theme === 'dark'
                ? 'bg-[#121824] border-white/[0.08] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div>
              <div
                className={`flex items-center justify-between border-b pb-4 mb-5 ${
                  theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                    <Ship size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{selectedVessel.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      IMO: {selectedVessel.imo} • {selectedVessel.flag}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVessel(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status and KPIs */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div
                  className={`p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-[#161e2e] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block mb-1">Status</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedVessel.status === 'Delayed'
                        ? 'bg-rose-500/10 text-rose-500'
                        : selectedVessel.status === 'On Schedule'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-cyan-500/10 text-cyan-500'
                    }`}
                  >
                    {selectedVessel.status}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-[#161e2e] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block mb-1">Route Match</span>
                  <span className="text-sm font-bold text-cyan-500 font-mono">
                    {selectedVessel.route_compatibility}%
                  </span>
                </div>
              </div>

              {/* Vessel Specs */}
              <div
                className={`p-4 rounded-xl border mb-5 space-y-2.5 ${
                  theme === 'dark' ? 'bg-[#161e2e] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Class &amp; DWT</span>
                  <span className="font-semibold">
                    {selectedVessel.vessel_class} ({selectedVessel.dwt.toLocaleString()} MT)
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Year Built</span>
                  <span className="font-semibold">{selectedVessel.year_built}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Speed</span>
                  <span className="font-mono">{selectedVessel.speed_knots} kts</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Fuel Consumption</span>
                  <span className="font-mono">{selectedVessel.fuel_consumption_t_day} t/day</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">CII Rating</span>
                  <span className="font-bold text-emerald-500">{selectedVessel.cii_rating}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Daily Charter Rate</span>
                  <span className="font-mono font-bold text-cyan-500">
                    ${selectedVessel.daily_charter_rate.toLocaleString()}/day
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Open Date</span>
                  <span className="font-mono">{selectedVessel.open_date}</span>
                </div>
              </div>

              {/* Route Corridor */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  theme === 'dark' ? 'bg-[#161e2e] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Corridor</span>
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>{selectedVessel.current_port}</span>
                  <ArrowRight size={14} className="text-cyan-500 mx-2" />
                  <span>{selectedVessel.destination_port}</span>
                </div>
                <div
                  className={`text-[11px] pt-1 border-t ${
                    theme === 'dark' ? 'border-white/[0.04] text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Manifest: <span className="font-semibold">{selectedVessel.cargo}</span> ({selectedVessel.cargo_capacity_pct}% full)
                </div>
              </div>
            </div>

            <div
              className={`space-y-2 pt-4 border-t ${
                theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
              }`}
            >
              <button
                onClick={() => {
                  setSelectedVessel(null);
                  navigateTo('chartering');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs shadow-glow-cyan transition"
              >
                Charter This Vessel in Optimizer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Port Details Modal */}
      <PortDetailsModal
        port={selectedPort}
        onClose={() => setSelectedPort(null)}
        onSelectRoute={handleSelectRouteFromSearch}
        onSelectVessel={handleSelectVesselFromSearch}
        onNavigate={navigateTo}
      />

      {/* Add Widget Modal (Portaled with z-[99999] so map never overlaps) */}
      <CustomizeWidgetsModal
        isOpen={showWidgetModal}
        onClose={() => setShowWidgetModal(false)}
        selectedWidgets={activeWidgets}
        onSaveWidgets={handleSaveWidgets}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 border text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom ${
            theme === 'dark'
              ? 'bg-[#161e2e]/95 backdrop-blur-md border-cyan-500/40 text-cyan-300'
              : 'bg-white/95 backdrop-blur-md border-cyan-500 text-cyan-800 shadow-md'
          }`}
        >
          <CheckCircle2 size={16} className="text-cyan-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};
