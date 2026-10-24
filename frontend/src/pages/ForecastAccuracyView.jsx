import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  AlertOctagon, 
  CheckCircle2, 
  Compass, 
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import MetricCards from '../components/MetricCards';

export default function ForecastAccuracyView({ metricsData, loading, selectedDate }) {
  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">Calculating quantitative forecast errors & distributions...</p>
      </div>
    );
  }

  if (!metricsData || !metricsData.metrics) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div>
          <AlertOctagon className="mx-auto h-12 w-12 text-amber-400" />
          <h3 className="mt-2 text-base font-bold text-white">No Metrics Data Available</h3>
          <p className="mt-1 text-xs text-slate-400">Please select another date.</p>
        </div>
      </div>
    );
  }

  const { metrics, diurnalProfile = [] } = metricsData;

  // Quantitative Error Scorecards
  const accuracyCards = [
    {
      label: 'MAE (Mean Absolute Error)',
      value: (metrics.maeMW || 0).toLocaleString(),
      unit: 'MW',
      subtext: `Normalized: ${(metrics.nmaePercent || 0).toFixed(1)}% of mean generation`,
      icon: Target,
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50',
      badge: `${(metrics.nmaePercent || 0).toFixed(1)}% nMAE`,
      changeType: metrics.nmaePercent < 10 ? 'positive' : 'warning',
      accentColor: 'bg-cyan-500',
    },
    {
      label: 'RMSE (Root Mean Square Error)',
      value: (metrics.rmseMW || 0).toLocaleString(),
      unit: 'MW',
      subtext: `Volatility Penalty: ${(metrics.nrmsePercent || 0).toFixed(1)}% nRMSE`,
      icon: Activity,
      iconBg: 'bg-purple-950/80 text-purple-400 border border-purple-800/50',
      badge: 'Tail Risk',
      changeType: 'neutral',
      accentColor: 'bg-purple-500',
    },
    {
      label: 'Forecast Bias (Mean Error)',
      value: `${(metrics.meanBiasMW || 0) > 0 ? '+' : ''}${(metrics.meanBiasMW || 0).toLocaleString()}`,
      unit: 'MW',
      subtext: `${(metrics.percentageBias || 0) > 0 ? '+' : ''}${(metrics.percentageBias || 0).toFixed(2)}% Overall Bias`,
      icon: TrendingUp,
      iconBg: (metrics.meanBiasMW || 0) > 0 
        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50' 
        : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/50',
      badge: (metrics.meanBiasMW || 0) > 0 ? 'Over-Forecasting (Risk)' : 'Under-Forecasting (Safe)',
      changeType: (metrics.meanBiasMW || 0) > 0 ? 'danger' : 'positive',
      accentColor: (metrics.meanBiasMW || 0) > 0 ? 'bg-rose-500' : 'bg-indigo-500',
    },
    {
      label: 'Goodness of Fit (R²)',
      value: (metrics.rSquared || 0).toFixed(4),
      unit: '',
      subtext: `Pearson Correlation: ${(metrics.correlation || 0).toFixed(4)}`,
      icon: Layers,
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50',
      badge: (metrics.rSquared || 0) > 0.85 ? 'High Correlation' : 'Moderate',
      changeType: 'positive',
      accentColor: 'bg-emerald-500',
    },
    {
      label: 'Ramp Direction Accuracy',
      value: `${(metrics.directionalAccuracyPercent || 0).toFixed(1)}`,
      unit: '%',
      subtext: 'Half-hourly ramp trajectory hit rate',
      icon: Compass,
      iconBg: 'bg-teal-950/80 text-teal-400 border border-teal-800/50',
      badge: 'Ramp Predictability',
      changeType: 'positive',
      accentColor: 'bg-teal-500',
    },
    {
      label: 'Peak Forecast Deviation',
      value: `+${(metrics.maxOverForecastMW || 0).toLocaleString()}`,
      unit: 'MW',
      subtext: `Max Under-Forecast: -${(metrics.maxUnderForecastMW || 0).toLocaleString()} MW`,
      icon: AlertOctagon,
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-800/50',
      badge: 'Extreme Outlier',
      changeType: 'warning',
      accentColor: 'bg-amber-500',
    },
  ];

  // Tooltip for Histogram
  const HistogramTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <p className="font-bold text-cyan-400 font-sans">
            Error Interval: [{d.binStart.toLocaleString()} to {d.binEnd.toLocaleString()} MW]
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-slate-200">
              Frequency: <span className="font-bold text-white">{d.count} Settlement Periods</span> ({d.frequency}%)
            </p>
            <p className={`text-[11px] font-sans ${d.binCenter > 0 ? 'text-rose-400' : 'text-indigo-400'}`}>
              {d.binCenter > 0 ? 'Over-Forecast: Grid utility was short' : 'Under-Forecast: Grid had surplus wind'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip for Scatter
  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <p className="font-bold text-cyan-400 font-sans">
            SP {d.settlementPeriod} &bull; {d.settlementDate || selectedDate}
          </p>
          <div className="mt-1 space-y-1">
            <p className="text-emerald-400">Actual Wind: <strong className="text-white">{d.actual.toLocaleString()} MW</strong></p>
            <p className="text-cyan-400">Forecast Wind: <strong className="text-white">{d.forecast.toLocaleString()} MW</strong></p>
            <p className={d.error > 0 ? 'text-rose-400' : 'text-indigo-400'}>
              Error (Fc - Act): <strong>{d.error > 0 ? `+${d.error}` : d.error} MW</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 6-Card Statistical Accuracy Grid */}
      <MetricCards metrics={accuracyCards} columns={6} />

      {/* Row 1: Error Distribution Histogram & Actual vs Forecast Scatter */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Error Distribution Histogram */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Forecast Error Distribution</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                  Histogram (MW)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency of over-forecasting (right of 0) vs under-forecasting (left of 0)
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-sans">
              <span className="flex items-center space-x-1 text-indigo-400">
                <span className="h-2.5 w-2.5 rounded bg-indigo-500"></span>
                <span>Under</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-400">
                <span className="h-2.5 w-2.5 rounded bg-rose-500"></span>
                <span>Over (Deficit Risk)</span>
              </span>
            </div>
          </div>

          <div className="mt-4 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.errorDistribution || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="binCenter"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)}k`}
                  label={{ value: 'Forecast Error = (Forecast - Actual) [MW]', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Count (SPs)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<HistogramTooltip />} />
                <ReferenceLine x={0} stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(metrics.errorDistribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.binCenter >= 0 ? '#f43f5e' : '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 text-center">
            Zero-line (dashed) marks perfect parity. Rightward shift represents systematic over-estimation bias.
          </p>
        </div>

        {/* Scatter Plot: Actual vs. Forecast */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Actual vs. Day-Ahead Forecast Scatter</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                  y = x Parity Line
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates linearity and dispersion across half-hourly settlement periods
              </p>
            </div>
            <span className="rounded-md bg-emerald-950/60 px-2 py-0.5 text-xs font-mono text-emerald-400 border border-emerald-800/40">
              R² = {(metrics.rSquared || 0).toFixed(4)}
            </span>
          </div>

          <div className="mt-4 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 10, right: 15, left: -5, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="Actual Wind"
                  unit=" MW"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Actual Wind Generation (MW)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="forecast"
                  name="Forecast Wind"
                  unit=" MW"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Forecasted Wind (MW)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<ScatterTooltip />} />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: 30000, y: 30000 }]}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
                <Scatter
                  name="Half-Hours"
                  data={metrics.scatterSample || []}
                  fill="#10b981"
                  opacity={0.8}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 text-center">
            Dashed diagonal is 1:1 perfect forecast parity. Points above line = Under-forecast; points below = Over-forecast.
          </p>
        </div>
      </div>

      {/* Row 2: Diurnal Error Profile Across 48 Settlement Periods */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Diurnal Settlement Period Error Profile (24-Hour Cycle)</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                SP 1 to 48
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies whether forecast models suffer systematic time-of-day bias during morning ramps (07:30–09:30) or evening peak (17:30–19:30).
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span>MAE (MW)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              <span>Mean Bias (MW)</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={diurnalProfile}
              margin={{ top: 10, right: 15, left: -5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="settlementPeriod"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(sp) => `SP ${sp}`}
                label={{ value: 'Settlement Period (Half-Hour Intervals across Day)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v) => `${v.toLocaleString()} MW`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
                        <p className="font-bold text-cyan-400 font-sans">
                          SP {d.settlementPeriod} ({d.timeLabel} UTC)
                        </p>
                        <div className="mt-1 space-y-1">
                          <p className="text-cyan-300">MAE: <strong>{d.maeMW.toLocaleString()} MW</strong></p>
                          <p className="text-purple-300">RMSE: <strong>{d.rmseMW.toLocaleString()} MW</strong></p>
                          <p className={d.avgErrorMW > 0 ? 'text-rose-400' : 'text-indigo-400'}>
                            Mean Bias: <strong>{d.avgErrorMW > 0 ? `+${d.avgErrorMW}` : d.avgErrorMW} MW</strong>
                          </p>
                          <p className="text-slate-400">Over-Forecast Ratio: {d.overForecastRatio}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="maeMW"
                name="MAE"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="avgErrorMW"
                name="Mean Bias"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

