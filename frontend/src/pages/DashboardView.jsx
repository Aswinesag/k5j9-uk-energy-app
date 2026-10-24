import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  Wind, 
  Flame, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  CheckCircle2,
  Zap
} from 'lucide-react';
import MetricCards from '../components/MetricCards';
import SettlementTable from '../components/SettlementTable';

export default function DashboardView({ overviewData, loading, selectedDate }) {
  // Series visibility toggles
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showDemand, setShowDemand] = useState(true);
  const [showResidual, setShowResidual] = useState(true);
  const [showDeficit, setShowDeficit] = useState(true);

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">Loading Elexon BMRS day-ahead forecast stream...</p>
      </div>
    );
  }

  if (!overviewData || !overviewData.timeseries || overviewData.timeseries.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div>
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
          <h3 className="mt-2 text-base font-bold text-white">No Generation Data Available</h3>
          <p className="mt-1 text-xs text-slate-400">Please choose another date or select 'Full Month'.</p>
        </div>
      </div>
    );
  }

  const { summary, timeseries } = overviewData;

  // Calculate high-impact operational KPIs
  const totalActualMWh = timeseries.reduce((acc, curr) => acc + (curr.actualGenerationMW || 0) * 0.5, 0);
  const totalForecastMWh = timeseries.reduce((acc, curr) => acc + (curr.forecastGenerationMW || 0) * 0.5, 0);
  const totalShortfallMWh = timeseries.reduce((acc, curr) => acc + (curr.procurementShortfallMW || 0) * 0.5, 0);
  const peakResidualMW = Math.max(...timeseries.map((r) => r.actualResidualMW || 0));

  const kpis = [
    {
      label: 'Peak Wind Actual',
      value: summary.peakActualMW ? summary.peakActualMW.toLocaleString() : '0',
      unit: 'MW',
      subtext: `Avg: ${(summary.meanActualMW || 0).toLocaleString()} MW`,
      icon: Wind,
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50',
      badge: 'Actuals (FUELHH)',
      changeType: 'positive',
      accentColor: 'bg-emerald-500',
    },
    {
      label: 'Latest DA Forecast Peak',
      value: summary.peakForecastMW ? summary.peakForecastMW.toLocaleString() : '0',
      unit: 'MW',
      subtext: `Avg: ${(summary.meanForecastMW || 0).toLocaleString()} MW`,
      icon: TrendingUp,
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50',
      badge: 'D-1 Gate 11:00 UTC',
      changeType: 'neutral',
      accentColor: 'bg-cyan-500',
    },
    {
      label: 'Peak Thermal Dispatch Needed',
      value: peakResidualMW.toLocaleString(),
      unit: 'MW',
      subtext: 'Max Net Load (Demand - Wind)',
      icon: Flame,
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-800/50',
      badge: 'Thermal Peakers',
      changeType: 'warning',
      accentColor: 'bg-amber-500',
    },
    {
      label: 'Procurement Shortfall Risk',
      value: totalShortfallMWh.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      unit: 'MWh',
      subtext: `MAE: ${(summary.maeMW || 0).toFixed(0)} MW | Bias: ${(summary.meanBiasMW || 0) > 0 ? '+' : ''}${(summary.meanBiasMW || 0).toFixed(0)} MW`,
      icon: ShieldAlert,
      iconBg: 'bg-rose-950/80 text-rose-400 border border-rose-800/50',
      badge: totalShortfallMWh > 2000 ? 'High Imbalance Risk' : 'Manageable',
      changeType: totalShortfallMWh > 2000 ? 'danger' : 'neutral',
      accentColor: 'bg-rose-500',
    },
  ];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const actual = data.actualGenerationMW || 0;
      const forecast = data.forecastGenerationMW || 0;
      const error = data.errorMW || (forecast - actual);
      const demand = data.demandMW || 0;
      const residual = data.actualResidualMW || 0;
      const shortfall = data.procurementShortfallMW || 0;

      return (
        <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-cyan-400 font-sans">
              Settlement Period {data.settlementPeriod}
            </span>
            <span className="text-slate-400 text-[11px]">
              {data.startTime ? data.startTime.replace('T', ' ').slice(0, 16) : ''} UTC
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between space-x-6 text-emerald-400">
              <span className="font-sans text-slate-400 flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block mr-1"></span>
                Actual Wind:
              </span>
              <span className="font-bold">{actual.toLocaleString()} MW</span>
            </div>

            <div className="flex items-center justify-between space-x-6 text-cyan-300">
              <span className="font-sans text-slate-400 flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block mr-1"></span>
                Forecast Wind:
              </span>
              <span className="font-bold">{forecast.toLocaleString()} MW</span>
            </div>

            <div className="flex items-center justify-between space-x-6 text-slate-300">
              <span className="font-sans text-slate-400 flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-slate-400 inline-block mr-1"></span>
                Electricity Demand:
              </span>
              <span>{demand.toLocaleString()} MW</span>
            </div>

            <div className="flex items-center justify-between space-x-6 text-amber-400">
              <span className="font-sans text-slate-400 flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 inline-block mr-1"></span>
                Residual Thermal Req:
              </span>
              <span className="font-bold">{residual.toLocaleString()} MW</span>
            </div>

            <div className="border-t border-slate-800/80 pt-1.5 mt-1 flex items-center justify-between">
              <span className="font-sans text-slate-400">Forecast Error (Fc - Act):</span>
              <span className={`font-bold ${error > 0 ? 'text-rose-400' : 'text-indigo-400'}`}>
                {error > 0 ? `+${error.toFixed(1)} MW (Over)` : `${error.toFixed(1)} MW (Under)`}
              </span>
            </div>

            {shortfall > 0 && (
              <div className="rounded bg-rose-950/60 p-1 text-[11px] text-rose-300 font-sans border border-rose-800/50 flex items-center justify-between">
                <span>Thermal Procure Shortfall:</span>
                <span className="font-mono font-bold">+{shortfall.toFixed(0)} MW</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <MetricCards metrics={kpis} columns={4} />

      {/* Main Operational Chart Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        {/* Chart Header & Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">
                Day-Ahead Wind Generation vs. Demand & Residual Thermal Deficits
              </h2>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                30-Min Resolution
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluating Elexon BMRS actual generation (FUELHH) against latest day-ahead forecast (WINDFOR) and resulting thermal dispatch gap.
            </p>
          </div>

          {/* Interactive Series Legend / Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center space-x-1.5 cursor-pointer text-emerald-400 hover:text-emerald-300">
              <input
                type="checkbox"
                checked={showActual}
                onChange={() => setShowActual(!showActual)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-200">Actual Wind</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-cyan-400 hover:text-cyan-300">
              <input
                type="checkbox"
                checked={showForecast}
                onChange={() => setShowForecast(!showForecast)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
              />
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              <span className="font-medium text-slate-200">DA Forecast</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={showDemand}
                onChange={() => setShowDemand(!showDemand)}
                className="rounded border-slate-700 bg-slate-950 text-slate-400 focus:ring-0"
              />
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              <span className="font-medium text-slate-200">System Demand</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-amber-400 hover:text-amber-300">
              <input
                type="checkbox"
                checked={showResidual}
                onChange={() => setShowResidual(!showResidual)}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
              />
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="font-medium text-slate-200">Residual Thermal</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-rose-400 hover:text-rose-300">
              <input
                type="checkbox"
                checked={showDeficit}
                onChange={() => setShowDeficit(!showDeficit)}
                className="rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0"
              />
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="font-medium text-slate-200">Shortfall Deficit</span>
            </label>
          </div>
        </div>

        {/* Recharts Multi-line & Area Chart */}
        <div className="mt-4 h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeseries}
              margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="residualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="shortfallGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.50} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

              <XAxis
                dataKey="settlementPeriod"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(sp) => `SP ${sp}`}
                label={{ value: 'Settlement Period (1–48 Half-Hours)', position: 'insideBottom', offset: -15, fill: '#64748b', fontSize: 11 }}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
                domain={[0, 'auto']}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Shaded Area for Residual Thermal Generation Demand */}
              {showResidual && (
                <Area
                  type="monotone"
                  dataKey="actualResidualMW"
                  name="Residual Thermal Required"
                  fill="url(#residualGrad)"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                />
              )}

              {/* Shaded Area for Unplanned Shortfall Deficit */}
              {showDeficit && (
                <Area
                  type="monotone"
                  dataKey="procurementShortfallMW"
                  name="Procurement Shortfall"
                  fill="url(#shortfallGrad)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                />
              )}

              {/* Baseline Grid Electricity Demand */}
              {showDemand && (
                <Line
                  type="monotone"
                  dataKey="demandMW"
                  name="System Demand"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}

              {/* Day-Ahead Forecasted Wind Generation */}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecastGenerationMW"
                  name="DA Wind Forecast"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
              )}

              {/* Actual Wind Generation (Primary) */}
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actualGenerationMW"
                  name="Actual Wind"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 2, fill: '#10b981' }}
                  activeDot={{ r: 5, fill: '#34d399' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Operational Context Subtext */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>
              Decision Horizon: <strong>D-1 11:00 UTC Auction Gate Closure</strong> &bull; Total Day Energy:{' '}
              <strong className="text-white">{(totalActualMWh / 1000).toFixed(1)} GWh Wind</strong> /{' '}
              <strong className="text-amber-400">{((totalActualMWh + totalShortfallMWh) / 1000).toFixed(1)} GWh Residual</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            *Red shaded peaks indicate periods where wind under-performed forecast, requiring peaker thermal procurement.
          </span>
        </div>
      </div>

      {/* 48 Half-Hour Settlement Period Data Table */}
      <SettlementTable data={timeseries} selectedDate={selectedDate} />
    </div>
  );
}

