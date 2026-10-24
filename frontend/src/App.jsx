import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DateSelector from './components/DateSelector';
import DashboardView from './pages/DashboardView';
import ForecastAccuracyView from './pages/ForecastAccuracyView';
import ProcurementRiskView from './pages/ProcurementRiskView';
import MonthlySummaryView from './pages/MonthlySummaryView';
import MarketGlossaryModal from './components/MarketGlossaryModal';
import { energyApi } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('operations');
  const [selectedDate, setSelectedDate] = useState('2026-01-15');
  const [isDark, setIsDark] = useState(true);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [deficitsData, setDeficitsData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [healthData, setHealthData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync dark class on html root element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load available dates once on mount
  useEffect(() => {
    async function initPlatform() {
      try {
        const [datesRes, healthRes] = await Promise.all([
          energyApi.getDates().catch(() => ({ dates: [] })),
          energyApi.getHealth().catch(() => null)
        ]);
        setAvailableDates(datesRes.dates || []);
        setHealthData(healthRes);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initPlatform();
  }, []);

  // Fetch data whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;
    async function loadDateData() {
      try {
        setLoading(true);
        setError(null);
        const [overviewRes, metricsRes, deficitsRes] = await Promise.all([
          energyApi.getOverview(selectedDate),
          energyApi.getMetrics(selectedDate),
          energyApi.getDeficits(selectedDate),
        ]);
        if (isMounted) {
          setOverviewData(overviewRes);
          setMetricsData(metricsRes);
          setDeficitsData(deficitsRes);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching data for date:', selectedDate, err);
          setError(err.message || 'Failed to connect to backend API');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDateData();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const currentRegime = overviewData?.summary?.weatherRegime || '';

  const handleSelectDateFromSummary = (dateStr) => {
    setSelectedDate(dateStr);
    setActiveTab('operations');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors dark:bg-slate-950 dark:text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        openGlossary={() => setIsGlossaryOpen(true)}
        healthData={healthData}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Error notification banner if any */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span><strong>Connection Error:</strong> {error}</span>
            </div>
            <button
              onClick={() => setSelectedDate(selectedDate)}
              className="flex items-center space-x-1 rounded bg-rose-900/60 px-2.5 py-1 text-white hover:bg-rose-800"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Date Selector Header (Hidden only on monthly overview) */}
        {activeTab !== 'monthly' && (
          <DateSelector
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            availableDates={availableDates}
            currentRegime={currentRegime}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'operations' && (
          <DashboardView
            overviewData={overviewData}
            loading={loading}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'accuracy' && (
          <ForecastAccuracyView
            metricsData={metricsData}
            loading={loading}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementRiskView
            deficitsData={deficitsData}
            loading={loading}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlySummaryView
            onSelectDate={handleSelectDateFromSummary}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Reint AI &bull; UK Wholesale Energy Day-Ahead Purchasing Analytics &copy; 2026. Data sourced from Elexon BMRS (FUELHH & WINDFOR).
          </p>
          <p className="text-slate-400">
            Target Horizon: January 2026 &bull; 48 Settlement Periods (Half-Hourly)
          </p>
        </div>
      </footer>

      {/* Domain Knowledge Modal */}
      <MarketGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}

