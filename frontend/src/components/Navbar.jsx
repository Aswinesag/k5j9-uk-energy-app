import React from 'react';
import { 
  Zap, 
  Activity, 
  BarChart3, 
  ShieldAlert, 
  Calendar, 
  HelpCircle, 
  Sun, 
  Moon, 
  Layers
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isDark, setIsDark, openGlossary, healthData }) {
  const navItems = [
    { id: 'operations', label: 'Day-Ahead Operations', icon: Activity },
    { id: 'accuracy', label: 'Forecast Accuracy & Risk', icon: BarChart3 },
    { id: 'procurement', label: 'Thermal Procurement & Deficits', icon: ShieldAlert },
    { id: 'monthly', label: 'Monthly Summary', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Market Context */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white sm:text-lg">
                Reint<span className="text-cyan-400">Energy</span>
              </span>
              <span className="rounded-md bg-cyan-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-800/50">
                UK Day-Ahead
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Elexon BMRS Wind Analytics &bull; January 2026
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Status, Glossary, Theme Toggle */}
        <div className="flex items-center space-x-2">
          {/* Market Status Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 rounded-full bg-emerald-950/60 px-2.5 py-1 text-xs text-emerald-400 border border-emerald-800/40">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-medium">BMRS LIVE SYNC</span>
          </div>

          {/* Glossary Modal Button */}
          <button
            onClick={openGlossary}
            className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title="Trading Domain Glossary"
          >
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Glossary</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden overflow-x-auto border-t border-slate-800/60 bg-slate-950 px-2 py-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

