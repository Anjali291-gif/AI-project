import React from 'react';
import {
  RotateCw,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import { NavigationPage, Vessel, PortRoute, SearchPortItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  collapsed: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  backendOnline: boolean;
  isRealML: boolean;
  onOpenWidgetModal?: () => void;
  onSelectVessel?: (vessel: Vessel) => void;
  onSelectPort?: (port: SearchPortItem) => void;
  onSelectRoute?: (route: PortRoute) => void;
  onSelectCommodity?: (commodity: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onRefresh,
  isRefreshing,
  backendOnline,
  isRealML,
  onOpenWidgetModal,
  onSelectVessel,
  onSelectPort,
  onSelectRoute,
  onSelectCommodity
}) => {
  const { theme, toggleTheme } = useTheme();

  const pageNames: Record<NavigationPage, string> = {
    dashboard: 'Dashboard',
    forecast: 'AI Freight Forecast',
    chartering: 'Vessel Chartering',
    procurement: 'Bulk Cargo Procurement',
    models: 'Model Insights'
  };

  return (
    <header
      className={`fixed top-0 right-0 z-50 h-16 transition-all duration-300 flex items-center justify-between px-6 border-b backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-[#0b0f17]/90 border-white/[0.08]'
          : 'bg-white/90 border-slate-200 shadow-sm'
      } ${collapsed ? 'left-20' : 'left-64'}`}
    >
      {/* Left: Active Page Navigation Pill & Fast Links */}
      <div className="flex items-center space-x-3">
        <div
          className={`px-3.5 py-1.5 rounded-lg border text-sm font-semibold flex items-center space-x-2 shadow-sm ${
            theme === 'dark'
              ? 'bg-[#161e2e] border-cyan-500/30 text-cyan-300'
              : 'bg-cyan-50 border-cyan-200 text-cyan-800'
          }`}
        >
          <span>{pageNames[currentPage]}</span>
        </div>

        {/* Quick shortcut pills */}
        <div className="hidden lg:flex items-center space-x-1.5 pl-2">
          {(['dashboard', 'forecast', 'chartering', 'procurement', 'models'] as NavigationPage[]).map((p) => {
            if (p === currentPage) return null;
            return (
              <button
                key={p}
                onClick={() => onNavigate(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {pageNames[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center space-x-3.5">
        {/* Full-featured Global Search Bar */}
        <GlobalSearch
          onSelectVessel={onSelectVessel || (() => {})}
          onSelectPort={onSelectPort || (() => {})}
          onSelectRoute={onSelectRoute || (() => {})}
          onSelectCommodity={onSelectCommodity || (() => {})}
          onNavigate={onNavigate}
        />

        {/* THEME TOGGLE BUTTON (Sun/Moon) */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg border transition ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] text-amber-400 hover:text-amber-300 hover:border-amber-400/40'
              : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-600 hover:border-slate-300 shadow-sm'
          }`}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-lg border transition disabled:opacity-50 ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] text-slate-400 hover:text-white hover:border-slate-600'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
          }`}
          title="Refresh Maritime Telemetry & Forecasts"
        >
          <RotateCw size={15} className={isRefreshing ? 'animate-spin text-cyan-500' : ''} />
        </button>

        {/* Backend API Health Status */}
        <div
          className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-mono border transition ${
            backendOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}
          title={
            backendOnline
              ? isRealML
                ? 'Connected to live FastAPI backend running XGBoost ML Pipeline'
                : 'Connected to live FastAPI backend'
              : 'Backend offline: Running in interactive Demo Mode with safe fallback data'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="hidden sm:inline font-sans font-medium text-[11px]">
            {backendOnline ? (isRealML ? 'FastAPI + ML Live' : 'API Online') : 'Demo Fallback'}
          </span>
        </div>

        {/* Add Widget Button */}
        <button
          onClick={onOpenWidgetModal}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-glow-cyan transition"
        >
          <Plus size={14} />
          <span>Add Widget</span>
        </button>
      </div>
    </header>
  );
};
