import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  sublabel?: string;
  sparklineData?: number[];
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  sublabel,
  sparklineData = [12, 14, 13, 16, 18, 17, 21, 24]
}) => {
  const { theme } = useTheme();

  const getBadgeStyle = () => {
    if (!change) return null;
    const isDelay = title.toLowerCase().includes('delays');
    if (change.startsWith('+') || changeType === 'positive') {
      return isDelay
        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
    if (change.startsWith('-')) {
      return isDelay
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  // Generate SVG Sparkline path
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 64;
  const height = 24;
  const points = sparklineData
    .map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
        theme === 'dark'
          ? 'bg-[#121824] border-white/[0.08] hover:border-cyan-500/30 shadow-subtle-card'
          : 'bg-white border-slate-200 hover:border-cyan-500/40 shadow-light-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center space-x-2 transition-colors ${
            theme === 'dark'
              ? 'text-slate-400 group-hover:text-cyan-400'
              : 'text-slate-500 group-hover:text-cyan-600'
          }`}
        >
          <Icon size={16} />
          <span className="text-xs font-semibold">{title}</span>
        </div>
        {change && (
          <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}>
            {change}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div
            className={`text-2xl font-bold tracking-tight font-sans ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            {value}
          </div>
          {sublabel && (
            <span
              className={`text-[11px] font-mono ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {sublabel}
            </span>
          )}
        </div>

        {/* Mini SVG Sparkline */}
        <div className="w-16 h-6 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
