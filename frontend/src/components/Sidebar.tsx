import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Ship,
  Boxes,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Compass
} from 'lucide-react';
import { NavigationPage } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  backendOnline: boolean;
  isRealML: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  backendOnline,
  isRealML
}) => {
  const { theme } = useTheme();

  const navItems = [
    {
      id: 'dashboard' as NavigationPage,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      id: 'forecast' as NavigationPage,
      label: 'AI Freight Forecast',
      icon: TrendingUp,
      badge: 'ML v4',
      badgeColor: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    },
    {
      id: 'chartering' as NavigationPage,
      label: 'Vessel Chartering',
      icon: Ship,
      badge: 'Optimizer',
      badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    {
      id: 'procurement' as NavigationPage,
      label: 'Bulk Procurement',
      icon: Boxes,
      badge: 'Gantt',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      id: 'models' as NavigationPage,
      label: 'Model Insights',
      icon: Cpu,
      badge: isRealML ? 'XGB' : 'SageMaker',
      badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 transition-all duration-300 ease-in-out flex flex-col border-r backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-[#0b0f17]/95 border-white/[0.08]'
          : 'bg-white/95 border-slate-200 shadow-sm'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center justify-between px-4 border-b ${
          theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
        }`}
      >
        <div
          className="flex items-center space-x-3 overflow-hidden cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan shrink-0">
            <div className="flex items-center space-x-0.5">
              <div className="w-1.5 h-3.5 bg-white rounded-sm rotate-12" />
              <div className="w-1.5 h-3.5 bg-white/80 rounded-sm -rotate-12" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span
                  className={`font-extrabold tracking-tight text-lg font-sans ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Marine<span className="text-cyan-500">X</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                  SIH26
                </span>
              </div>
              <span
                className={`text-[10px] tracking-wider ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                FreightAI Enterprise
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg transition ${
            theme === 'dark'
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {!collapsed && (
          <div
            className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Maritime Systems
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center rounded-xl transition-all group relative ${
                collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 justify-between'
              } ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'bg-cyan-50 text-cyan-900 border border-cyan-300 font-semibold shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  size={19}
                  className={`transition-colors shrink-0 ${
                    isActive
                      ? 'text-cyan-500'
                      : theme === 'dark'
                      ? 'text-slate-400 group-hover:text-slate-200'
                      : 'text-slate-500 group-hover:text-slate-900'
                  }`}
                />
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide">
                    {item.label}
                  </span>
                )}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <div
                  className={`absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shadow-xl border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] text-slate-200 border-white/10'
                      : 'bg-white text-slate-800 border-slate-200 shadow-md'
                  }`}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Engine & Status Footer */}
      <div
        className={`p-3 border-t ${
          theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
        }`}
      >
        {!collapsed ? (
          <div
            className={`p-3 rounded-xl border flex flex-col space-y-2 ${
              theme === 'dark'
                ? 'bg-[#121824] border-white/[0.06]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold flex items-center space-x-1.5 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <Compass size={14} className="text-cyan-500" />
                <span>Engine Status</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </div>
            <div
              className={`text-[11px] leading-tight ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {backendOnline
                ? isRealML
                  ? 'FastAPI + XGBoost ML Connected'
                  : 'FastAPI Backend Connected'
                : 'Demo Mode (Safe Fallback)'}
            </div>
            <div
              className={`pt-1 flex items-center justify-between text-[10px] font-mono ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span>SIH 2026 P23</span>
              <span className="text-cyan-500">v1.4.0</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title={backendOnline ? 'API Connected' : 'Demo Fallback'}>
            <span
              className={`w-3 h-3 rounded-full border-2 ${
                theme === 'dark' ? 'border-[#0b0f17]' : 'border-white'
              } ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
