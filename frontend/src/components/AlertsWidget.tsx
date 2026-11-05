import React, { useState } from 'react';
import { AlertItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, CloudLightning, Thermometer, Clock, MoreHorizontal, Check, ShieldAlert } from 'lucide-react';

interface AlertsWidgetProps {
  alerts: AlertItem[];
  onAction?: (alertId: string, actionName: string) => void;
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ alerts, onAction }) => {
  const { theme } = useTheme();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [actionDone, setActionDone] = useState<Record<string, string>>({});

  const handleAction = (alertId: string, action: string) => {
    if (action.toLowerCase() === 'dismiss') {
      setDismissed((prev) => [...prev, alertId]);
    } else {
      setActionDone((prev) => ({ ...prev, [alertId]: action }));
      if (onAction) onAction(alertId, action);
    }
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('storm')) return <CloudLightning size={16} className="text-amber-500" />;
    if (title.toLowerCase().includes('temperature')) return <Thermometer size={16} className="text-rose-500" />;
    return <Clock size={16} className="text-emerald-500" />;
  };

  return (
    <div
      className={`h-full rounded-2xl border p-4 flex flex-col space-y-3 transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
          : 'bg-white border-slate-200 shadow-light-card'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`font-bold text-sm tracking-wide ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Alerts
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-mono font-bold">
            {visibleAlerts.length} Active
          </span>
        </div>
        <button
          className={`p-1 rounded-md transition ${
            theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
        {visibleAlerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active maritime fleet alerts. All operations nominal.
          </div>
        ) : (
          visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border transition flex flex-col space-y-2 ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.06] hover:border-white/[0.12]'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2.5">
                  <div
                    className={`p-1.5 rounded-lg border mt-0.5 ${
                      theme === 'dark' ? 'bg-[#121824] border-white/[0.08]' : 'bg-white border-slate-200'
                    }`}
                  >
                    {getIcon(alert.title)}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-semibold tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {alert.title}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {alert.vessel}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {alert.time}
                </span>
              </div>

              {alert.message && (
                <p
                  className={`text-[11px] leading-snug pl-0.5 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {alert.message}
                </p>
              )}

              {/* Action Buttons matching Reference 01 */}
              <div className="flex items-center space-x-2 pt-1">
                {actionDone[alert.id] ? (
                  <span className="text-[11px] text-emerald-500 flex items-center space-x-1 font-mono font-medium">
                    <Check size={13} />
                    <span>Action: {actionDone[alert.id]} submitted</span>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(alert.id, alert.action_primary)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-[11px] font-semibold transition"
                    >
                      {alert.action_primary}
                    </button>
                    <button
                      onClick={() => handleAction(alert.id, alert.action_secondary)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        theme === 'dark'
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white'
                          : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {alert.action_secondary}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
