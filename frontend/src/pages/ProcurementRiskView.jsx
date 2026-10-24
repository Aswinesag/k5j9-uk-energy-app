import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  ShieldAlert,
  Flame,
  Zap,
  TrendingDown,
  Scale,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import MetricCards from '../components/MetricCards';

export default function ProcurementRiskView({ deficitsData, loading, selectedDate }) {
  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">Computing residual demand & thermal backup procurement...</p>
      </div>
    );
  }

  if (!deficitsData || !deficitsData.totals) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <div>
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
          <h3 className="mt-2 text-base font-bold text-white">No Deficit Data Available</h3>
          <p className="mt-1 text-xs text-slate-400">Please choose another date.</p>
        </div>
      </div>
    );
  }

  const { totals, timeseries = [] } = deficitsData;

  // Imbalance Net Volume
  const netImbalanceMWh = (totals.actualThermalProcuredMWh || 0) - (totals.plannedThermalProcuredMWh || 0);
  const isUtilityShort = netImbalanceMWh > 0;

  const procurementCards = [
    {
      label: 'Total Electricity Demand',
      value: (totals.totalDemandMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }),
      unit: 'GWh',
      subtext: `Peak Load: ${(totals.peakDemandMW || 0).toLocaleString()} MW`,
      icon: Zap,
      iconBg: 'bg-slate-800 text-slate-300',
      badge: 'Consumer Base',
      changeType: 'neutral',
      accentColor: 'bg-slate-500',
    },
    {
      label: 'Delivered Wind Supply',
      value: (totals.actualWindMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }),
      unit: 'GWh',
      subtext: `Planned DA: ${(totals.forecastWindMWh / 1000).toFixed(1)} GWh`,
      icon: Scale,
      iconBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50',
      badge: `${((totals.actualWindMWh / (totals.totalDemandMWh || 1)) * 100).toFixed(1)}% of Demand`,
      changeType: 'positive',
      accentColor: 'bg-emerald-500',
    },
    {
      label: 'Actual Thermal Needed',
      value: (totals.actualThermalProcuredMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }),
      unit: 'GWh',
      subtext: `Peak Thermal Dispatch: ${(totals.peakResidualMW || 0).toLocaleString()} MW`,
      icon: Flame,
      iconBg: 'bg-amber-950/80 text-amber-400 border border-amber-800/50',
      badge: 'CCGT / Peakers',
      changeType: 'warning',
      accentColor: 'bg-amber-500',
    },
    {
      label: 'DA Thermal Procured',
      value: (totals.plannedThermalProcuredMWh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }),
      unit: 'GWh',
      subtext: 'Purchased Day-Ahead based on Wind Forecast',
      icon: Clock,
      iconBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50',
      badge: '11:00 UTC Auction',
      changeType: 'neutral',
      accentColor: 'bg-cyan-500',
    },
    {
      label: 'Net Imbalance Volume',
      value: `${isUtilityShort ? '+' : ''}${(netImbalanceMWh / 1000).toFixed(2)}`,
      unit: 'GWh',
      subtext: isUtilityShort ? 'Utility was SHORT (Under-procured)' : 'Utility was LONG (Surplus procured)',
      icon: ShieldAlert,
      iconBg: isUtilityShort 
        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50' 
        : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/50',
      badge: isUtilityShort ? 'Cash-Out Penalty Risk' : 'Surplus Spill',
      changeType: isUtilityShort ? 'danger' : 'positive',
      accentColor: isUtilityShort ? 'bg-rose-500' : 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top 5 Metric Cards */}
      <MetricCards metrics={procurementCards} columns={5} />

      {/* Chart 1: Generation Stack meeting Demand (Wind + Thermal Residual) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Stack Generation: Wind + Thermal Peakers Meeting Demand</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                Stacked Dispatch (MW)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes the exact thermal generation dispatch required on top of variable wind to satisfy UK demand.
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span>
              <span>Wind Actual</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400">
              <span className="h-2.5 w-2.5 rounded bg-amber-500"></span>
              <span>Thermal Residual Required</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeseries}
              margin={{ top: 10, right: 15, left: -5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="settlementPeriod"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(sp) => `SP ${sp}`}
                label={{ value: 'Settlement Period (1–48)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)} GW`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-xl backdrop-blur-md text-xs font-mono">
                        <p className="font-bold text-cyan-400 font-sans mb-1">
                          SP {d.settlementPeriod} &bull; {d.startTime ? d.startTime.slice(11, 16) : ''} UTC
                        </p>
                        <p className="text-slate-300">Total Demand: <strong>{d.demandMW.toLocaleString()} MW</strong></p>
                        <p className="text-emerald-400">Delivered Wind: <strong>{d.actualWindMW.toLocaleString()} MW</strong></p>
                        <p className="text-amber-400">Thermal Needed: <strong>{d.actualResidualMW.toLocaleString()} MW</strong></p>
                        <p className="text-cyan-300">DA Planned Thermal: <strong>{d.plannedResidualMW.toLocaleString()} MW</strong></p>
                        {d.procurementShortfallMW > 0 && (
                          <p className="text-rose-400 border-t border-slate-800 pt-1 mt-1 font-bold">
                            Shortfall Risk: +{d.procurementShortfallMW.toLocaleString()} MW
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Stacked Areas */}
              <Area
                type="monotone"
                dataKey="actualWindMW"
                stackId="1"
                fill="#10b981"
                stroke="#10b981"
                fillOpacity={0.85}
                name="Wind Generation"
              />
              <Area
                type="monotone"
                dataKey="actualResidualMW"
                stackId="1"
                fill="#f59e0b"
                stroke="#f59e0b"
                fillOpacity={0.85}
                name="Thermal Generation"
              />
              {/* Total Demand Reference Line */}
              <Line
                type="monotone"
                dataKey="demandMW"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                name="Gross Demand"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Half-Hourly Imbalance / Procurement Shortfall Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Day-Ahead Procurement Mis-alignment: Shortfalls vs. Surpluses</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
                Imbalance (MW)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Shortfalls (Red) mean the utility under-purchased thermal power. Surpluses (Blue) mean excess thermal power was bought.
            </p>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-rose-400">
              <span className="h-2.5 w-2.5 rounded bg-rose-500"></span>
              <span>Shortfall Deficit (Utility Short)</span>
            </span>
            <span className="flex items-center space-x-1 text-indigo-400">
              <span className="h-2.5 w-2.5 rounded bg-indigo-500"></span>
              <span>Procurement Surplus (Utility Long)</span>
            </span>
          </div>
        </div>

        <div className="mt-4 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeseries}
              margin={{ top: 10, right: 15, left: -5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="settlementPeriod"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(sp) => `SP ${sp}`}
                label={{ value: 'Settlement Period (1–48)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k MW`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
                        <p className="font-bold text-cyan-400 font-sans">
                          SP {d.settlementPeriod} &bull; {d.startTime ? d.startTime.slice(11, 16) : ''} UTC
                        </p>
                        <div className="mt-1 space-y-1">
                          {d.procurementShortfallMW > 0 ? (
                            <p className="text-rose-400 font-bold">
                              Shortfall: +{d.procurementShortfallMW.toLocaleString()} MW (Utility Short)
                            </p>
                          ) : (
                            <p className="text-indigo-400 font-bold">
                              Surplus: -{d.procurementSurplusMW.toLocaleString()} MW (Utility Long)
                            </p>
                          )}
                          <p className="text-slate-400">Wind Error: {d.errorMW > 0 ? `+${d.errorMW}` : d.errorMW} MW</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
              <Bar dataKey="procurementShortfallMW" fill="#f43f5e" name="Shortfall Deficit" radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

