/**
 * API service client for UK Energy Day-Ahead Purchasing Analytics Platform.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API fetch error on ${endpoint}:`, err);
    throw err;
  }
}

export const energyApi = {
  getOverview: (date = '2026-01-15') => fetchJson(`/api/energy/overview?date=${encodeURIComponent(date)}`),
  getMetrics: (date = '2026-01-15') => fetchJson(`/api/energy/metrics?date=${encodeURIComponent(date)}`),
  getDeficits: (date = '2026-01-15') => fetchJson(`/api/energy/deficits?date=${encodeURIComponent(date)}`),
  getDates: () => fetchJson('/api/energy/dates'),
  getMonthlySummary: () => fetchJson('/api/energy/monthly-summary'),
  getHealth: () => fetchJson('/api/health'),
};

