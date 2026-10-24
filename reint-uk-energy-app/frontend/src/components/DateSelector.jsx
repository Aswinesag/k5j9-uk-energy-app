import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Wind, AlertTriangle, Snowflake, CloudRain, SunMedium } from 'lucide-react';

export default function DateSelector({ selectedDate, setSelectedDate, availableDates = [], currentRegime }) {
  // Preset scenarios that energy traders monitor closely
  const scenarios = [
    { date: '2026-01-02', label: 'Jan 02: Storm Inflow', icon: Wind, color: 'text-teal-400' },
    { date: '2026-01-11', label: 'Jan 11: Dunkelflaute Lull', icon: Snowflake, color: 'text-amber-400' },
    { date: '2026-01-15', label: 'Jan 15: Rapid Ramp Miss', icon: AlertTriangle, color: 'text-rose-400' },
    { date: '2026-01-19', label: 'Jan 19: Storm Cut-out', icon: CloudRain, color: 'text-cyan-400' },
    { date: 'all', label: 'Full Month (31 Days)', icon: Calendar, color: 'text-purple-400' },
  ];

  const handlePrevDay = () => {
    if (selectedDate === 'all') {
      setSelectedDate('2026-01-31');
      return;
    }
    const day = parseInt(selectedDate.split('-')[2], 10);
    if (day > 1) {
      const prevDayStr = String(day - 1).padStart(2, '0');
      setSelectedDate(`2026-01-${prevDayStr}`);
    }
  };

  const handleNextDay = () => {
    if (selectedDate === 'all') {
      setSelectedDate('2026-01-01');
      return;
    }
    const day = parseInt(selectedDate.split('-')[2], 10);
    if (day < 31) {
      const nextDayStr = String(day + 1).padStart(2, '0');
      setSelectedDate(`2026-01-${nextDayStr}`);
    } else {
      setSelectedDate('all');
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 shadow-inner">
            <button
              onClick={handlePrevDay}
              disabled={selectedDate === '2026-01-01'}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-2 px-2.5">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-purple-300">
                  Full Month (January 1–31, 2026)
                </option>
                <optgroup label="Daily Settlement Dates (Jan 2026)" className="bg-slate-900 text-slate-200">
                  {Array.from({ length: 31 }, (_, i) => {
                    const dayStr = String(i + 1).padStart(2, '0');
                    const fullDate = `2026-01-${dayStr}`;
                    return (
                      <option key={fullDate} value={fullDate} className="bg-slate-900 text-slate-200">
                        {fullDate} (Day {i + 1} &bull; 48 SPs)
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            <button
              onClick={handleNextDay}
              disabled={selectedDate === 'all'}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Current Weather Regime Tag */}
          {currentRegime && (
            <div className="flex items-center space-x-2 rounded-xl border border-cyan-900/40 bg-cyan-950/30 px-3 py-1.5 text-xs text-cyan-300">
              <Wind className="h-3.5 w-3.5 text-cyan-400" />
              <span>Regime: <strong className="font-semibold text-white">{currentRegime}</strong></span>
            </div>
          )}
        </div>

        {/* Quick Scenario Jumps */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 hidden sm:inline">Event Presets:</span>
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = selectedDate === sc.date;
            return (
              <button
                key={sc.date}
                onClick={() => setSelectedDate(sc.date)}
                className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800/80'
                }`}
              >
                <Icon className={`h-3 w-3 ${sc.color}`} />
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
