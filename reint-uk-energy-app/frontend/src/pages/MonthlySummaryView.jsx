import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { 
  Layers, 
  Wind, 
  Flame, 
  Calendar, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import MetricCards from '../components/MetricCards';
import { energyApi } from '../services/api';

export default function MonthlySummaryView({ onSelectDate }) {
  const [datesSummary, setDatesSummary] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const [datesRes, monthlyRes] = await Promise.all([
          energyApi.getDates(),
          energyApi.getMonthlySummary()
        ]);
        setDatesSummary(datesRes.dates || []);
        setMonthlyTotals(monthlyRes);
      } catch (err) {
        console.error('Failed to load monthly summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">Compiling 31-day portfolio analytics for January 2026...</p>
      </div>
    );
  }

  const accuracy = monthlyTotals?.accuracyMetrics || {};
  const energy = monthlyTotals?.energyProcurementTotals || {};

  const monthlyCards = [
    {
      label: 'Month Total Wind Generation',
      value: (energy.actualWindMWh / 1000000).toFixed(2),
      unit: 'TWh',
      subtext: `1,488 Settlement Periods across 31 days`,
      icon: Wind,
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50',
      badge: 'BMRS FUELHH',
      changeType: 'positive',
      accentColor: 'bg-emerald-500',
    },
    {
      label: 'Month Thermal Dispatch',
      value: (energy.actualThermalProcuredMWh / 1000000).toFixed(2),
      unit: 'TWh',
      subtext: `Peak Dispatch: ${(energy.peakResidualMW || 0).toLocaleString()} MW`,
      icon: Flame,
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-800/50',
      badge: 'CCGT / Peakers',
      changeType: 'warning',
      accentColor: 'bg-amber-500',
    },
    {
      label: 'Portfolio Monthly MAE',
      value: (accuracy.maeMW || 0).toLocaleString(),
      unit: 'MW',
      subtext: `Normalized nMAE: ${(accuracy.nmaePercent || 0).toFixed(1)}%`,
      icon: Target,
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50',
      badge: 'Forecast Accuracy',
      changeType: 'neutral',
      accentColor: 'bg-cyan-500',
    },
    {
      label: 'Month Overall Bias',
      value: `${(accuracy.meanBiasMW || 0) > 0 ? '+' : ''}${(accuracy.meanBiasMW || 0).toLocaleString()}`,
      unit: 'MW',
      subtext: `${(accuracy.percentageBias || 0).toFixed(2)}% Overall Over-Forecasting`,
      icon: TrendingUp,
      iconBg: 'bg-rose-950/80 text-rose-400 border border-rose-800/50',
      badge: 'Net System Imbalance',
      changeType: 'danger',
      accentColor: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Month Portfolio KPIs */}
      <MetricCards metrics={monthlyCards} columns={4} />

      {/* Chart: Daily MAE & Peak Deficits Across January 2026 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>January 2026 Daily Forecast Error (MAE) & Wind Output</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                31 Settlement Days
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any daily bar to jump directly into that day's 48-period operational breakdown.
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="h-2.5 w-2.5 rounded bg-cyan-500"></span>
              <span>Daily MAE (MW)</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span>
              <span>Avg Wind (MW)</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datesSummary}
              margin={{ top: 10, right: 15, left: -5, bottom: 20 }}
              onClick={(state) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clickedDate = state.activePayload[0].payload.date;
                  if (clickedDate && onSelectDate) onSelectDate(clickedDate);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(d) => `Jan ${d}`}
                label={{ value: 'January 2026 Days (1–31)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
              />
              <Tooltip
                cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-xl backdrop-blur-md text-xs font-mono">
                        <p className="font-bold text-cyan-400 font-sans mb-1">
                          {d.date} &bull; {d.weatherRegime}
                        </p>
                        <p className="text-emerald-400">Avg Wind: <strong>{d.avgActualMW.toLocaleString()} MW</strong></p>
                        <p className="text-cyan-300">Daily MAE: <strong>{d.maeMW.toLocaleString()} MW</strong></p>
                        <p className={d.meanBiasMW > 0 ? 'text-rose-400' : 'text-indigo-400'}>
                          Mean Bias: <strong>{d.meanBiasMW > 0 ? `+${d.meanBiasMW}` : d.meanBiasMW} MW</strong>
                        </p>
                        <p className="text-amber-400">Max Shortfall: <strong>+{d.maxShortfallMW.toLocaleString()} MW</strong></p>
                        <p className="mt-1 text-[11px] text-cyan-400 font-sans flex items-center space-x-1">
                          <span>Click to open Day {d.day} detailed view</span>
                          <ArrowRight className="h-3 w-3" />
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgActualMW" fill="#10b981" name="Avg Wind Generation" radius={[3, 3, 0, 0]} opacity={0.65} />
              <Bar dataKey="maeMW" fill="#38bdf8" name="MAE" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 31-Day Weather Regime & Volatility Calendar Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-3">
          January 2026 Daily Trading Calendar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {datesSummary.map((d) => (
            <button
              key={d.date}
              onClick={() => onSelectDate && onSelectDate(d.date)}
              className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left transition-all hover:border-cyan-500 hover:bg-slate-800/80"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-bold text-white">Jan {d.day}</span>
                <span className="text-[10px] text-slate-400 font-mono">{(d.avgActualMW / 1000).toFixed(1)} GW</span>
              </div>
              <span className="mt-1 text-[10px] text-slate-300 font-sans truncate w-full" title={d.weatherRegime}>
                {d.weatherRegime}
              </span>
              <div className="mt-1 flex items-center justify-between w-full text-[10px]">
                <span className="text-cyan-400 font-mono">MAE: {d.maeMW.toFixed(0)}</span>
                <span className={`font-mono ${d.meanBiasMW > 0 ? 'text-rose-400' : 'text-indigo-400'}`}>
                  {d.meanBiasMW > 0 ? `+${d.meanBiasMW.toFixed(0)}` : d.meanBiasMW.toFixed(0)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
