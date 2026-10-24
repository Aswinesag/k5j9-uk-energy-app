import React, { useState, useMemo } from 'react';
import { Download, Filter, Search, ArrowUpDown, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function SettlementTable({ data = [], selectedDate = '' }) {
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('settlementPeriod');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter and sort records
  const filteredData = useMemo(() => {
    return data
      .filter((row) => {
        const sp = row.settlementPeriod;
        if (filterPeriod === 'morning') return sp >= 14 && sp <= 20; // 06:30 - 10:00
        if (filterPeriod === 'evening') return sp >= 34 && sp <= 40; // 16:30 - 20:00
        if (filterPeriod === 'night') return sp >= 1 && sp <= 12;   // 00:00 - 06:00
        return true;
      })
      .filter((row) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          row.startTime.toLowerCase().includes(q) ||
          String(row.settlementPeriod).includes(q) ||
          String(row.actualGenerationMW || row.actualWindMW).includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA - valB) : (valB - valA);
      });
  }, [data, filterPeriod, searchQuery, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    if (!data.length) return;
    const headers = [
      'Settlement Date',
      'Settlement Period',
      'Start Time (UTC)',
      'Actual Wind Generation (MW)',
      'Forecast Wind Generation (MW)',
      'Forecast Error (MW)',
      'Baseline Demand (MW)',
      'Actual Residual Thermal (MW)',
      'Planned Residual Thermal (MW)',
      'Procurement Shortfall (MW)',
    ];

    const rows = data.map((r) => [
      r.settlementDate,
      r.settlementPeriod,
      r.startTime,
      r.actualGenerationMW ?? r.actualWindMW ?? 0,
      r.forecastGenerationMW ?? r.forecastWindMW ?? 0,
      r.errorMW ?? (r.forecastGenerationMW - r.actualGenerationMW) ?? 0,
      r.demandMW ?? 0,
      r.actualResidualMW ?? 0,
      r.plannedResidualMW ?? 0,
      r.procurementShortfallMW ?? 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `elexon_wind_procurement_${selectedDate || 'jan_2026'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format UTC start time to HH:MM
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
      {/* Table Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Settlement Period Breakdown</span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-mono text-cyan-400">
              {filteredData.length} Intervals
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Half-hourly Elexon BMRS settlement actuals vs day-ahead gate closure forecast
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Buttons */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`rounded px-2.5 py-1 transition-colors ${
                filterPeriod === 'all' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All 48 SPs
            </button>
            <button
              onClick={() => setFilterPeriod('morning')}
              className={`rounded px-2.5 py-1 transition-colors ${
                filterPeriod === 'morning' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Morning Peak (SP 14-20)
            </button>
            <button
              onClick={() => setFilterPeriod('evening')}
              className={`rounded px-2.5 py-1 transition-colors ${
                filterPeriod === 'evening' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Evening Peak (SP 34-40)
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            title="Download CSV for Excel/Trading Models"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-3 py-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('settlementPeriod')}>
                <div className="flex items-center space-x-1">
                  <span>SP</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>
              <th className="px-3 py-2.5">Time (UTC)</th>
              <th className="px-3 py-2.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('actualGenerationMW')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual Wind (MW)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('forecastGenerationMW')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast Wind (MW)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('errorMW')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast Error (MW)</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-500" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-right">Demand (MW)</th>
              <th className="px-3 py-2.5 text-right">Residual Thermal (MW)</th>
              <th className="px-3 py-2.5 text-center">Trading Position Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredData.map((row) => {
              const actual = row.actualGenerationMW ?? row.actualWindMW ?? 0;
              const forecast = row.forecastGenerationMW ?? row.forecastWindMW ?? 0;
              const error = row.errorMW ?? (forecast - actual);
              const shortfall = row.procurementShortfallMW ?? (error > 0 ? error : 0);
              const residual = row.actualResidualMW ?? 0;
              const demand = row.demandMW ?? 0;

              // Error badge category
              const isShortfall = shortfall > 150;
              const isAccurate = Math.abs(error) <= 300;
              const isSurplus = error < -300;

              return (
                <tr key={`${row.settlementDate}-${row.settlementPeriod}`} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2 text-cyan-400 font-bold">
                    SP {row.settlementPeriod}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {formatTime(row.startTime)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-400">
                    {actual.toLocaleString('en-GB', { maximumFractionDigits: 1 })}
                  </td>
                  <td className="px-3 py-2 text-right text-cyan-300">
                    {forecast.toLocaleString('en-GB', { maximumFractionDigits: 1 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                      isAccurate
                        ? 'bg-slate-800 text-slate-300'
                        : error > 0
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                        : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/40'
                    }`}>
                      {error > 0 ? `+${error.toFixed(1)}` : error.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {demand.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-amber-400">
                    {residual.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isShortfall ? (
                      <span className="inline-flex items-center space-x-1 rounded-full bg-rose-950/60 px-2 py-0.5 text-[10px] text-rose-400 border border-rose-800/40 font-sans font-semibold">
                        <AlertCircle className="h-3 w-3" />
                        <span>Deficit (+{shortfall.toFixed(0)} MW)</span>
                      </span>
                    ) : isSurplus ? (
                      <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-950/60 px-2 py-0.5 text-[10px] text-indigo-400 border border-indigo-800/40 font-sans font-semibold">
                        <span>Surplus Wind</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-800/40 font-sans font-semibold">
                        <CheckCircle className="h-3 w-3" />
                        <span>Balanced</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
