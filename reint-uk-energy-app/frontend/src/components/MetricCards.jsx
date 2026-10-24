import React from 'react';
import { 
  Wind, 
  TrendingUp, 
  AlertCircle, 
  Flame, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Gauge
} from 'lucide-react';

export default function MetricCards({ metrics = [], columns = 4 }) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid gap-4 ${colClass}`}>
      {metrics.map((m, idx) => {
        const Icon = m.icon || Wind;
        const isPositive = m.changeType === 'positive';
        const isWarning = m.changeType === 'warning';
        const isDanger = m.changeType === 'danger';
        const isNeutral = m.changeType === 'neutral';

        return (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-500/5 backdrop-blur-sm"
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
                {m.label}
              </span>
              <div className={`rounded-xl p-2 ${m.iconBg || 'bg-slate-800 text-cyan-400'}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            {/* Value */}
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
                {m.value}
              </span>
              {m.unit && (
                <span className="text-xs font-medium text-slate-400 font-mono">
                  {m.unit}
                </span>
              )}
            </div>

            {/* Footer / Context Subtext */}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] truncate" title={m.subtext}>
                {m.subtext}
              </span>
              {m.badge && (
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                  isDanger 
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40' 
                    : isWarning 
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                    : isPositive 
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {m.badge}
                </span>
              )}
            </div>

            {/* Subtle bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${m.accentColor || 'bg-cyan-500/50'}`} />
          </div>
        );
      })}
    </div>
  );
}
