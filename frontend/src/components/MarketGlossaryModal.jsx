import React from 'react';
import { X, BookOpen, AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function MarketGlossaryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const terms = [
    {
      term: 'Day-Ahead Power Market (DAM)',
      desc: 'The wholesale auction market (EPEX SPOT UK / Nord Pool) where electricity is bought and sold 24 hours ahead of delivery day. Clearing typically happens at 11:00 or 12:00 UTC on Day D-1.',
    },
    {
      term: 'Elexon BMRS',
      desc: 'Balancing Mechanism Reporting Service governed by Elexon under the Balancing and Settlement Code (BSC). It provides market participants with national-level electricity data, generation by fuel, and system balance signals.',
    },
    {
      term: 'FUELHH Dataset',
      desc: 'Half-hourly actual generation outturn broken down by fuel type (e.g., WIND, CCGT, NUCLEAR, BIOMASS). Streamed in 30-minute intervals across 48 Settlement Periods per day.',
    },
    {
      term: 'WINDFOR Dataset',
      desc: 'National wind generation forecast published at multiple horizons. For day-ahead purchasing decisions, the latest forecast published before the D-1 gate cutoff (~11:00 UTC) is the operational benchmark.',
    },
    {
      term: 'Settlement Period (SP)',
      desc: 'The UK grid operates on 48 half-hour trading blocks each day (SP 1 is 00:00-00:30 UTC, SP 48 is 23:30-24:00 UTC). Imbalance settlement occurs on this half-hour granularity.',
    },
    {
      term: 'Residual Thermal Procurement (Net Load)',
      desc: 'Consumer Demand minus Renewable (Wind) Generation. This is the exact capacity the utility must buy from dispatchable thermal plants (CCGT/OCGT peakers) or interconnectors to keep customer lights on.',
    },
    {
      term: 'MAE (Mean Absolute Error)',
      desc: 'Mean Absolute Error: (1/n) * Σ |Actual - Forecast|. Measures the average absolute magnitude of forecast errors in MW without regard to direction.',
    },
    {
      term: 'RMSE (Root Mean Square Error)',
      desc: 'Square root of mean squared errors: sqrt((1/n) * Σ (Actual - Forecast)^2). Heavily penalizes large swings, rapid ramp misses, and storm cut-out errors.',
    },
    {
      term: 'Forecast Bias (Mean Error)',
      desc: '(1/n) * Σ (Forecast - Actual). Positive values mean systematic Over-Forecasting (surplus wind expected; risk of thermal under-procurement). Negative values mean Under-Forecasting.',
    },
    {
      term: 'Dunkelflaute',
      desc: 'A German meteorological term ("dark lull") denoting sustained periods of cold, low-wind, and cloudy winter weather under anticyclonic high pressure systems, causing wind output to drop drastically across Europe.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-cyan-950 p-2 text-cyan-400 border border-cyan-800/50">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">UK Power Market & BMRS Reference</h2>
              <p className="text-xs text-slate-400">Day-Ahead Wholesale Electricity & Forecast Valuation Terminology</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {terms.map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3.5 hover:border-slate-700 transition-colors">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                  {item.term}
                </h4>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-xs text-amber-200/90 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-300">Trader Risk Rule of Thumb:</strong>
              <p className="mt-1 leading-relaxed text-amber-200/80">
                Over-forecasting wind generation leaves the utility short of power in real-time, forcing cash-out in the BM (System Buy Price), which can spike up to &pound;4,000/MWh during cold winter evening peaks.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-950/60 rounded-b-2xl">
          <span className="text-[11px] text-slate-400">
            Official Elexon BMRS API: <code>data.elexon.co.uk/bmrs/api/v1</code>
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}

