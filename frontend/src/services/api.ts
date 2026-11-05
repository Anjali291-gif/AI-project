import {
  ForecastResponse,
  SearchResults,
  SearchPortItem,
  SearchCommodityItem,
  Vessel,
  PortRoute,
  CharterOptimizationResult,
  ProcurementCard,
  ProcurementOrder,
  TimelineSchedule,
  ModelMetadata
} from '../types';

// API Base URL resolution — environment-aware
// Priority:
//   1. VITE_API_URL env var (set at build time for production deployments)
//   2. Empty string — uses relative /api paths, which work with:
//      a) Vite dev proxy (local development)
//      b) Same-origin deployments (backend serves frontend at same domain)
//
// NEVER hardcode a production URL here. Set VITE_API_URL in the deployment
// environment (Render, Netlify, Vercel, etc.) instead.
export const API_BASE_URL: string = (() => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  // Return the env URL if set and non-empty; otherwise use relative paths
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, ''); // strip trailing slash
  }
  // Relative base — works with Vite proxy in dev, and same-origin in prod
  return '';
})();

export class ApiService {
  private static isBackendAvailable: boolean | null = null;
  private static lastCheckTime = 0;

  static async checkHealth(): Promise<{ online: boolean; ml_loaded: boolean; model_name: string }> {
    const now = Date.now();
    // Cache check for 10 seconds
    if (this.isBackendAvailable !== null && now - this.lastCheckTime < 10000) {
      return { online: this.isBackendAvailable, ml_loaded: this.isBackendAvailable, model_name: 'FreightAI-XGBoost-V4' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.isBackendAvailable = true;
        this.lastCheckTime = now;
        return {
          online: true,
          ml_loaded: Boolean(data.ml_model_loaded),
          model_name: data.model_name || 'FreightAI-XGBoost-V4'
        };
      }
    } catch {
      // offline
    }

    this.isBackendAvailable = false;
    this.lastCheckTime = now;
    return { online: false, ml_loaded: false, model_name: 'Heuristic Fallback' };
  }

  static async getDashboard(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (res.ok) {
        const data = await res.json();
        return { ...data, is_live: true };
      }
    } catch {
      // Fallback
    }

    // Default Fallback matching reference 01
    return {
      is_live: false,
      kpis: {
        active_vessels: { value: 48, change: '+3 today', status: 'normal' },
        in_voyage: { value: 34, change: '+2', status: 'normal' },
        at_berth: { value: 10, change: '0', status: 'normal' },
        under_load: { value: 6, change: '+1', status: 'normal' },
        port_delays: { value: '18%', change: '-4.6%', status: 'good' },
        route_efficiency: { value: '87%', change: '+2.8%', status: 'good' },
        avg_turnaround_time: { value: '22h', change: '-4.5%', status: 'good' },
        fuel_price_vlsfo: { value: '$624/mt', change: '+1.2%', status: 'watch' }
      },
      alerts: [
        {
          id: 'ALT-1',
          type: 'warning',
          title: 'Storm Warning',
          vessel: 'MV Orion Star',
          time: '10:42 AM',
          severity: 'high',
          message: 'Wave heights exceeding 5.2m in East China Sea sector 4. Speed reduction recommended.',
          action_primary: 'Reroute',
          action_secondary: 'View Route'
        },
        {
          id: 'ALT-2',
          type: 'warning',
          title: 'Temperature Drift',
          vessel: 'RF-9921',
          time: '9:15 AM',
          severity: 'medium',
          message: 'Reefer container deck hold #3 reporting +2.4°C drift above cryogenic threshold.',
          action_primary: 'Check Cargo',
          action_secondary: 'Dismiss'
        },
        {
          id: 'ALT-3',
          type: 'info',
          title: 'Early Arrival',
          vessel: 'MV Blue Tide',
          time: '9:10 AM',
          severity: 'low',
          message: 'Berth window secured at Mombasa Port Terminal 2. ETA moved forward by 1h 15m.',
          action_primary: 'Confirm Berth',
          action_secondary: 'Dismiss'
        }
      ],
      vessel_map_markers: this.getFallbackVessels(),
      turnaround_history: [
        { date: '05 Jan', hours: 26, efficiency: 79 },
        { date: '10 Jan', hours: 24, efficiency: 82 },
        { date: '15 Jan', hours: 25, efficiency: 81 },
        { date: '20 Jan', hours: 28, efficiency: 77 },
        { date: '25 Jan', hours: 31, efficiency: 74 },
        { date: '30 Jan', hours: 27, efficiency: 83 },
        { date: '05 Feb', hours: 22, efficiency: 87 },
        { date: '10 Feb', hours: 24, efficiency: 85 },
        { date: '15 Feb', hours: 21, efficiency: 89 }
      ],
      current_operations: this.getFallbackVessels().slice(0, 5),
      routes: this.getFallbackRoutes()
    };
  }

  static async getForecast(payload: any): Promise<ForecastResponse> {
    // Step 1: Attempt live backend call
    let backendError: string | null = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }

      // Check for 422 validation error
      if (res.status === 422) {
        let msg = 'Validation error: ';
        try {
          const errBody = await res.json();
          if (Array.isArray(errBody?.detail)) {
            msg += errBody.detail.map((e: any) => `${e.loc?.slice(-1)[0] ?? 'field'}: ${e.msg}`).join('; ');
          } else {
            msg += errBody?.detail || 'Invalid parameters';
          }
        } catch {
          msg += 'Invalid request parameters';
        }
        throw new Error(msg);
      }

      let errorDetail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        errorDetail = errBody?.detail ?? errorDetail;
      } catch { /* ignore */ }
      backendError = `Backend error: ${errorDetail}`;
    } catch (e: any) {
      if (e?.message && e.message.startsWith('Validation error')) {
        throw e;
      }
      if (e?.name === 'AbortError') {
        backendError = 'Backend request timed out (>8s). Using offline estimate.';
      } else {
        backendError = 'Backend unreachable. Using offline heuristic estimate.';
      }
    }

    // Step 2: Input-sensitive offline heuristic fallback
    const DWT_MAP: Record<string, number> = {
      'Handysize': 38000, 'Supramax': 58000, 'Ultramax': 63000,
      'Panamax': 75000, 'Kamsarmax': 82000, 'Capesize': 180000,
      'Newcastlemax': 210000, 'MR2': 50000, 'LR1': 74000,
      'LR2': 115000, 'LR3': 160000, 'VLCC': 310000
    };
    const distNm      = Number(payload.distance_nm) || 10550;
    const bunker      = Number(payload.bunker_price_usd_t) || 624;
    const congestion  = Number(payload.port_congestion_days) || 2.5;
    const weather     = Number(payload.weather_risk_index) || 2.4;
    const demandIdx   = Number(payload.cargo_demand_index) || 112;
    const canalFlag   = Number(payload.canal_transit) || 0;
    const vDWT        = DWT_MAP[payload.vessel_class] || 75000;
    const horizonDays = Number(payload.forecast_horizon_days) || 30;

    const speedKnots  = 13.5;
    const voyageDays  = distNm / (speedKnots * 24) + congestion;
    const fuelDaily   = 32.0 * Math.pow(vDWT / 75000, 0.65);
    const fuelCost    = voyageDays * fuelDaily * bunker;
    const dailyHire   = 18000 * Math.pow(vDWT / 75000, 0.75);
    const hireCost    = voyageDays * dailyHire;
    const canalCost   = canalFlag > 0 ? 250000 : 0;
    const portFees    = 80000;
    const totalCosts  = fuelCost + hireCost + canalCost + portFees;
    const demandMult  = (demandIdx / 100) * (1 + (weather - 2.5) * 0.03);
    const baseRate    = Math.round((totalCosts * demandMult) / (vDWT * 0.88) * 100) / 100;

    const RMSE        = 1.544;
    const margin      = Math.round(1.96 * RMSE * 100) / 100;
    const minVal      = Math.max(Math.round((baseRate - margin) * 100) / 100, 1.0);
    const maxVal      = Math.round((baseRate + margin) * 100) / 100;
    const change      = 5.0;

    const timeSeries: any[] = [];
    const today = new Date();
    const histCount = 7;
    const futureCount = Math.max(5, Math.min(horizonDays / 5, 14));

    for (let i = histCount; i > 0; i--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - i * Math.floor(horizonDays / histCount));
      const variation = (Math.random() - 0.5) * baseRate * 0.06;
      const rate = Math.round((baseRate * 0.95 + variation) * 100) / 100;
      timeSeries.push({
        date: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        full_date: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        iso_date: dt.toISOString().split('T')[0],
        historical_rate: rate,
        predicted_rate: null,
        lower_bound: null,
        upper_bound: null,
        is_future: false
      });
    }

    // Today transition point (current prediction date)
    timeSeries.push({
      date: today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      full_date: today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      iso_date: today.toISOString().split('T')[0],
      historical_rate: null,
      predicted_rate: baseRate,
      lower_bound: minVal,
      upper_bound: maxVal,
      is_future: true
    });

    for (let i = 1; i <= futureCount; i++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() + Math.round((horizonDays / futureCount) * i));
      const prog = i / futureCount;
      const targetVal = Math.round((baseRate * (1 + 0.05 * Math.sin(prog * Math.PI))) * 100) / 100;
      const spread = Math.round(margin * (0.6 + 0.4 * prog) * 100) / 100;
      timeSeries.push({
        date: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        full_date: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        iso_date: dt.toISOString().split('T')[0],
        historical_rate: null,
        predicted_rate: targetVal,
        lower_bound: Math.max(Math.round((targetVal - spread) * 100) / 100, 1.0),
        upper_bound: Math.round((targetVal + spread) * 100) / 100,
        is_future: true
      });
    }

    return {
      predicted_freight_rate: baseRate,
      market_rate_change_pct: change,
      predicted_average: baseRate,
      predicted_range: { min: minVal, max: maxVal },
      confidence_score: 0.82,
      model_used: `DEMO OFFLINE — ${backendError ?? 'Backend unavailable'}`,
      is_live_ml: false,
      influencing_factors: [
        { factor: 'Bunker Fuel (VLSFO)', impact_pct: 34.2, direction: 'up', detail: `$${bunker}/mt — fuel drives ~42% of voyage OPEX for ${payload.vessel_class || 'vessel'}` },
        { factor: 'Port Congestion & Laytime', impact_pct: 21.8, direction: 'up', detail: `${congestion} days avg delay adds demurrage & idle fuel burn` },
        { factor: 'Voyage Distance & Canal', impact_pct: 18.5, direction: 'neutral', detail: `${distNm.toLocaleString()} nm route${canalFlag ? ' via canal (toll applied)' : ' (no canal transit)'}` },
        { factor: 'Vessel Class DWT Capacity', impact_pct: -12.4, direction: 'down', detail: `${payload.vessel_class || 'Vessel'} at ${vDWT.toLocaleString()} DWT — scale affects hire & fuel` },
        { factor: 'Cargo Demand Index', impact_pct: 8.7, direction: 'up', detail: `BDI-linked demand at ${demandIdx} (baseline=100); ${demandIdx > 100 ? 'above' : 'below'} neutral` },
        { factor: 'Weather & Sea State', impact_pct: 4.4, direction: weather > 3.0 ? 'up' : 'neutral', detail: `Risk index ${weather}/5.0 — ${weather > 3.5 ? 'adverse conditions add deviation risk' : 'moderate sea state, minimal impact'}` }
      ],
      time_series: timeSeries,
      summary: `DEMO OFFLINE ESTIMATE — ${payload.vessel_class || 'Vessel'} carrying ${payload.commodity || 'Cargo'} (${distNm.toLocaleString()} nm): estimated $${baseRate}/t, CI $${minVal}–$${maxVal}. ${backendError ?? ''}`
    };
  }

  static async getVessels(params?: { vessel_class?: string; risk?: string; query?: string }): Promise<{ count: number; vessels: Vessel[]; reference_routes: PortRoute[] }> {
    try {
      const url = new URL(`${API_BASE_URL}/api/vessels`);
      if (params?.vessel_class && params.vessel_class !== 'all') url.searchParams.set('vessel_class', params.vessel_class);
      if (params?.risk && params.risk !== 'all') url.searchParams.set('risk', params.risk);
      if (params?.query) url.searchParams.set('query', params.query);

      const res = await fetch(url.toString());
      if (res.ok) return await res.json();
    } catch {
      // offline fallback
    }

    let list = this.getFallbackVessels();
    if (params?.vessel_class && params.vessel_class !== 'all') {
      list = list.filter(v => v.vessel_class.toLowerCase() === params.vessel_class?.toLowerCase());
    }
    if (params?.risk && params.risk !== 'all') {
      list = list.filter(v => v.risk_level.toLowerCase() === params.risk?.toLowerCase());
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.current_port.toLowerCase().includes(q) || v.destination_port.toLowerCase().includes(q));
    }

    return {
      count: list.length,
      vessels: list,
      reference_routes: this.getFallbackRoutes()
    };
  }

  static async optimizeChartering(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chartering-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { ...data, is_live: true };
      }
      if (res.status === 422) {
        const errBody = await res.json();
        const msg = Array.isArray(errBody?.detail)
          ? errBody.detail.map((e: any) => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join('; ')
          : 'Invalid charter parameters';
        throw new Error(msg);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err;
      // network offline fallback
    }

    const vessels = this.getFallbackVessels();
    return {
      status: 'offline_fallback',
      is_live: false,
      origin_port: payload.origin_port || 'Rotterdam [NL]',
      destination_port: payload.destination_port || 'Lagos [NG]',
      cargo_quantity_mts: payload.cargo_quantity_mts || 150000,
      priority: payload.priority || 'cost',
      priority_label: (payload.priority === 'speed' ? 'Fastest ETA' : (payload.priority === 'cii' ? 'Greenest (CII A)' : 'Lowest Cost')),
      recommended_vessel: {
        vessel: vessels[1], // MV Baltic Wave
        composite_score: 96.8,
        cost_per_ton: 25.74,
        total_voyage_cost: 3861000,
        fuel_cost: 348000,
        hire_cost: 468000,
        voyage_days: 15.6,
        eta_days: 15.6,
        recommendation: 'Strong Recommend'
      },
      ranked_vessels: vessels.map((v, i) => ({
        vessel: v,
        composite_score: Number((96.8 - i * 4.2).toFixed(1)),
        cost_per_ton: Number((25.74 + i * 2.1).toFixed(2)),
        total_voyage_cost: Math.round(3861000 + i * 280000),
        fuel_cost: 340000 + i * 30000,
        hire_cost: 450000 + i * 50000,
        voyage_days: 14 + i,
        eta_days: 14 + i,
        recommendation: i === 0 ? 'Strong Recommend' : (i < 3 ? 'Viable Alternate' : 'Suboptimal')
      })),
      executive_rationale: `MV Baltic Wave (LR3, 160,000 DWT) ranked #1 based on lowest unit rate ($25.74/t), exceptional fuel performance, CII Rating A compliance, and direct availability at open laycan. (Offline Demo)`,
      benchmark_saving_usd: 485000
    };
  }

  static async getProcurement(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/procurement/scenarios`);
      if (res.ok) {
        const data = await res.json();
        return { ...data, is_live: true };
      }
    } catch {
      // fallback
    }

    return {
      is_live: false,
      active_scenario: 'Scenario A - Global Petrochemical & Bulk Allocation',
      scenarios: [
        { id: 'SCN-1', name: 'Scenario A', description: 'Spot + Long Term Parcel Blend', active: true },
        { id: 'SCN-2', name: 'Scenario B', description: 'High Frequency Handy Batching', active: false },
        { id: 'SCN-3', name: 'Scenario C', description: 'Dedicated Capesize Shuttle', active: false }
      ],
      procurement_cards: [
        { id: '1', star: true, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Optimal Plan' },
        { id: '2', star: true, from_port: 'La Plata', to_port: 'Corpus Christi', amount_mts: '2,567,543 mts', commodity: 'Ethylene', status: 'In Negotiation' },
        { id: '3', star: true, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Contracted' },
        { id: '4', star: false, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Alternative' },
        { id: '5', star: false, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Alternative' }
      ],
      orders_table: [
        { id: '234 421 345', parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Xylenes', freight_rate_usd: 101.69, landed_cost_usd_t: 412.50, savings_usd_t: 18.40, highlighted: false },
        { id: '234 421 346', parcels: 1, from_region: 'EUR / Cont', from_port: 'Colombo', to_port: 'Zhousan', to_region: 'Asia', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', freight_rate_usd: 101.69, landed_cost_usd_t: 389.20, savings_usd_t: 22.10, highlighted: false },
        { id: '234 421 347', parcels: 1, from_region: 'ECSA', from_port: 'Santos', to_port: 'Marseilles', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Ethylene', freight_rate_usd: 101.69, landed_cost_usd_t: 445.80, savings_usd_t: 14.50, highlighted: false },
        { id: '234 421 348', parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Xylenes', freight_rate_usd: 101.69, landed_cost_usd_t: 398.00, savings_usd_t: 29.80, highlighted: true },
        { id: '234 421 349', parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Xylenes', freight_rate_usd: 101.69, landed_cost_usd_t: 405.30, savings_usd_t: 16.20, highlighted: false }
      ],
      timeline_schedules: [
        {
          vessel_name: 'MV PACIFIC VOYAGER',
          capacity_info: '44,543 CBM / 39,999 MTS',
          segments: [
            { port: 'SANTO TOMAS', dates: 'Nov 9 - 14', width_pct: 22, start_pct: 0, cargo: '2* BUTADIENE (6,726 MTS)' },
            { port: 'LA PLATA', dates: 'Nov 15 - 22', width_pct: 28, start_pct: 23, cargo: 'SULPHURIC ACID (6,726 MTS)' },
            { port: 'PANAMA CANAL', dates: 'Nov 23 - 26', width_pct: 18, start_pct: 52, cargo: 'CANAL TRANSIT' },
            { port: 'SANTO TOMAS', dates: 'Nov 27 - 30', width_pct: 25, start_pct: 72, cargo: 'RICE (6,726 MTS)' }
          ],
          verified: true
        },
        {
          vessel_name: 'MV ZEPHYR LEADER',
          capacity_info: '44,543 CBM / 39,999 MTS',
          segments: [
            { port: 'SANTO TOMAS', dates: 'Nov 11 - 16', width_pct: 20, start_pct: 8, cargo: 'ETHYLENE' },
            { port: 'LA PLATA', dates: 'Nov 17 - 24', width_pct: 32, start_pct: 30, cargo: 'PARAXILENE' },
            { port: 'PANAMA CANAL', dates: 'Nov 25 - 28', width_pct: 16, start_pct: 64, cargo: 'TRANSIT' },
            { port: 'SANTO TOMAS', dates: 'Nov 29 - Dec 3', width_pct: 18, start_pct: 81, cargo: 'DISCHARGE' }
          ],
          verified: false
        },
        {
          vessel_name: 'MV NORDIC TRADER',
          capacity_info: '52,100 CBM / 45,000 MTS',
          segments: [
            { port: 'ZEEBRUGGE', dates: 'Nov 10 - 15', width_pct: 25, start_pct: 5, cargo: 'CHEMICAL PARCEL A' },
            { port: 'AMSTERDAM', dates: 'Nov 16 - 22', width_pct: 30, start_pct: 32, cargo: 'CHEMICAL PARCEL B' },
            { port: 'ROTTERDAM', dates: 'Nov 24 - 29', width_pct: 24, start_pct: 66, cargo: 'REFILL' }
          ],
          verified: true
        }
      ]
    };
  }

  static async calculateLandedCost(payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/procurement/calculate-landed-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { ...data, is_live: true };
      }
      if (res.status === 422) {
        const errBody = await res.json();
        const msg = Array.isArray(errBody?.detail) ? errBody.detail.map((e: any) => e.msg).join('; ') : 'Validation error';
        throw new Error(msg);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) throw err;
    }

    // Offline local calculation fallback
    const total = Number((
      (payload.fob_price_usd_t || 0) +
      (payload.ocean_freight_usd_t || 0) +
      (payload.bunker_surcharge_usd_t || 0) +
      (payload.canal_toll_usd_t || 0) +
      (payload.port_handling_usd_t || 0) +
      (payload.insurance_usd_t || 0)
    ).toFixed(2));
    const target = payload.target_price_per_ton || 428.5;
    return {
      status: 'offline_fallback',
      is_live: false,
      total_landed_cost_usd_t: total,
      benchmark_cost_usd_t: target,
      savings_usd_t: Number((target - total).toFixed(2)),
      savings_pct: Number((((target - total) / target) * 100).toFixed(1)),
      total_shipment_value_usd: Number((total * (payload.quantity_mts || 25000)).toFixed(2)),
      is_viable: total <= target,
      cost_breakdown_pct: {
        fob: total > 0 ? Number(((payload.fob_price_usd_t / total) * 100).toFixed(1)) : 0,
        ocean_freight: total > 0 ? Number(((payload.ocean_freight_usd_t / total) * 100).toFixed(1)) : 0,
        bunker_baf: total > 0 ? Number(((payload.bunker_surcharge_usd_t / total) * 100).toFixed(1)) : 0,
        canal_toll: total > 0 ? Number(((payload.canal_toll_usd_t / total) * 100).toFixed(1)) : 0,
        port_handling: total > 0 ? Number(((payload.port_handling_usd_t / total) * 100).toFixed(1)) : 0,
        insurance: total > 0 ? Number(((payload.insurance_usd_t / total) * 100).toFixed(1)) : 0,
      }
    };
  }

  static async getAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics`);
      if (res.ok) {
        const data = await res.json();
        return { ...data, is_live: true };
      }
    } catch {
      // offline fallback
    }
    return {
      is_live: false,
      summary: "Baltic Dry Index & Tanker Freight Analytics 2026 (Offline)",
      fuel_bunker_trend: [
        { month: "May 2026", vlsfo: 590, mgo: 780 },
        { month: "Jun 2026", vlsfo: 605, mgo: 810 },
        { month: "Jul 2026", vlsfo: 618, mgo: 825 },
        { month: "Aug 2026", vlsfo: 630, mgo: 840 },
        { month: "Sep 2026", vlsfo: 615, mgo: 815 },
        { month: "Oct 2026", vlsfo: 624, mgo: 830 }
      ],
      port_congestion_index: [
        { port: "Singapore", wait_hours: 36, vessels_waiting: 42 },
        { port: "Rotterdam", wait_hours: 18, vessels_waiting: 14 },
        { port: "Shanghai", wait_hours: 48, vessels_waiting: 58 },
        { port: "Houston", wait_hours: 24, vessels_waiting: 19 },
        { port: "Antwerp", wait_hours: 16, vessels_waiting: 11 }
      ]
    };
  }

  static async getModels(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    return {
      status: 'ready',
      active_version: 'Version 4 (Production)',
      backend_engine: 'FastAPI + XGBoost Regressor (Scikit-Learn)',
      is_real_ml: false,
      registered_models_count: 3,
      primary_model: 'FreightAI-XGBoost-V4',
      model_metadata: {
        model_name: 'FreightAI-XGBoost-V4',
        algorithm: 'Extreme Gradient Boosting (XGBoost)',
        training_samples: 5200,
        test_samples: 1300,
        trained_at: '2026-10-28T09:19:38',
        metrics: {
          mae: 1.11,
          rmse: 1.54,
          r2: 0.9676,
          mape_percent: 7.45
        },
        comparison_models: [
          {
            name: 'FreightAI-XGBoost-V4 (Selected)',
            algorithm: 'XGBoost Regressor (180 trees, depth 6)',
            mae: 1.11,
            rmse: 1.54,
            r2: 0.9676,
            mape_percent: 7.45,
            latency_ms: 1.4,
            status: 'Production Active'
          },
          {
            name: 'Random-Forest-Baseline-V2',
            algorithm: 'Random Forest Regressor (120 trees)',
            mae: 1.28,
            rmse: 1.76,
            r2: 0.9582,
            mape_percent: 8.35,
            latency_ms: 4.8,
            status: 'Candidate'
          },
          {
            name: 'Linear-Ridge-Benchmark-V1',
            algorithm: 'Ridge Regularized Linear Regression',
            mae: 3.42,
            rmse: 4.85,
            r2: 0.8124,
            mape_percent: 11.2,
            latency_ms: 0.5,
            status: 'Deprecated'
          }
        ],
        top_features: [
          { feature: 'bunker_price_usd_t', importance: 0.342 },
          { feature: 'distance_nm', importance: 0.185 },
          { feature: 'port_congestion_days', importance: 0.148 },
          { feature: 'cargo_demand_index', importance: 0.124 },
          { feature: 'vessel_dwt', importance: 0.089 },
          { feature: 'weather_risk_index', importance: 0.052 },
          { feature: 'canal_transit', importance: 0.038 },
          { feature: 'commodity_Clean Petroleum', importance: 0.022 }
        ],
        business_drivers: {
          'Bunker Fuel Price (VLSFO)': 0.342,
          'Voyage Distance & Canal': 0.223,
          'Port Congestion Delays': 0.148,
          'Cargo Demand Index': 0.124,
          'Vessel Class & DWT Capacity': 0.089,
          'Adverse Weather & Sea State': 0.052,
          'Commodity Handling': 0.022
        }
      }
    };
  }

  static async getDatasetPreview(page: number = 1, pageSize: number = 10): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/dataset?page=${page}&page_size=${pageSize}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch dataset preview from backend:', e);
    }
    return null;
  }

  static async testModelPrediction(payload: {
    model_name: string;
    distance_nm: number;
    vessel_class: string;
    commodity: string;
    bunker_price: number;
    port_congestion_days: number;
    weather_risk_index: number;
    cargo_demand_index: number;
    canal_transit: number;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/models/predict-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    } catch (e: any) {
      throw new Error(e?.message || 'Prediction request failed');
    }
  }

  static getFallbackRoutes(): PortRoute[] {
    return [
      {
        id: 'R01',
        origin: 'Rotterdam [NL]',
        origin_coords: [51.9244, 4.4777],
        destination: 'Lagos [NG]',
        destination_coords: [6.4654, 3.4064],
        vessel_class: 'LR3',
        distance_nm: 4120,
        transit_time_days: 15.6,
        base_rate: 25.74,
        change_pct: 5.0,
        commodity: 'Clean Petroleum',
        via: 'Direct Atlantic',
        canal_fee: 0
      },
      {
        id: 'R02',
        origin: 'Rotterdam [NL]',
        origin_coords: [51.9244, 4.4777],
        destination: 'Fujairah [AE]',
        destination_coords: [25.1288, 56.3265],
        vessel_class: 'LR3',
        distance_nm: 4246,
        transit_time_days: 13.6,
        base_rate: 25.74,
        lumpsum_m: 3.71,
        change_pct: 5.0,
        commodity: 'Clean Petroleum',
        via: 'Via - Cape of Good Hope',
        canal_fee: 180000
      },
      {
        id: 'R03',
        origin: 'Houston, TX [US]',
        origin_coords: [29.7604, -95.3698],
        destination: 'Antwerp [BE]',
        destination_coords: [51.2194, 4.4025],
        vessel_class: 'MR2',
        distance_nm: 4850,
        transit_time_days: 16.2,
        base_rate: 38.88,
        lumpsum_m: 1.66,
        change_pct: 5.0,
        commodity: 'Clean',
        via: 'North Atlantic Direct',
        canal_fee: 0
      },
      {
        id: 'R04',
        origin: 'Fujairah [AE]',
        origin_coords: [25.1288, 56.3265],
        destination: 'Mombasa [KE]',
        destination_coords: [-4.0435, 39.6682],
        vessel_class: 'LR2',
        distance_nm: 2383,
        transit_time_days: 7.6,
        base_rate: 18.14,
        lumpsum_m: 1.63,
        change_pct: -5.0,
        commodity: 'Clean',
        via: 'Arabian Sea Direct',
        canal_fee: 0
      },
      {
        id: 'R05',
        origin: 'Singapore [SG]',
        origin_coords: [1.3521, 103.8198],
        destination: 'Mombasa [KE]',
        destination_coords: [-4.0435, 39.6682],
        vessel_class: 'MR2',
        distance_nm: 3950,
        transit_time_days: 12.8,
        base_rate: 27.87,
        lumpsum_m: 1.19,
        change_pct: 5.0,
        commodity: 'Clean',
        via: 'Indian Ocean Direct',
        canal_fee: 0
      },
      {
        id: 'R06',
        origin: 'Singapore [SG]',
        origin_coords: [1.3521, 103.8198],
        destination: 'Chittagong [BD]',
        destination_coords: [22.3569, 91.7832],
        vessel_class: 'LR1',
        distance_nm: 1680,
        transit_time_days: 5.4,
        base_rate: 13.49,
        lumpsum_m: 0.98,
        change_pct: 0.0,
        commodity: 'Clean',
        via: 'Bay of Bengal Direct',
        canal_fee: 0
      },
      {
        id: 'R07',
        origin: 'Jubail [SA]',
        origin_coords: [27.0046, 49.6592],
        destination: 'Vizag [IN]',
        destination_coords: [17.6868, 83.2185],
        vessel_class: 'MR2',
        distance_nm: 2680,
        transit_time_days: 8.9,
        base_rate: 22.64,
        lumpsum_m: 0.96,
        change_pct: 5.0,
        commodity: 'Clean',
        via: 'Persian Gulf to Bay of Bengal',
        canal_fee: 0
      },
      {
        id: 'R08',
        origin: 'Jubail [SA]',
        origin_coords: [27.0046, 49.6592],
        destination: 'Vizag [IN]',
        destination_coords: [17.6868, 83.2185],
        vessel_class: 'LR1',
        distance_nm: 2680,
        transit_time_days: 8.9,
        base_rate: 22.64,
        lumpsum_m: 1.38,
        change_pct: 5.0,
        commodity: 'Clean',
        via: 'Persian Gulf to Bay of Bengal',
        canal_fee: 0
      },
      {
        id: 'R09',
        origin: 'Sikka [IN]',
        origin_coords: [22.4333, 69.8333],
        destination: 'Le Havre [FR]',
        destination_coords: [49.4944, 0.1079],
        vessel_class: 'LR3',
        distance_nm: 6300,
        transit_time_days: 19.5,
        base_rate: 44.83,
        lumpsum_m: 6.46,
        change_pct: 5.0,
        commodity: 'Clean',
        via: 'Via - Cape of Good Hope',
        canal_fee: 0
      }
    ];
  }

  static getFallbackVessels(): Vessel[] {
    return [
      {
        id: 'V-101',
        name: 'MV Orion Star',
        imo: '9842104',
        vessel_class: 'Capesize',
        dwt: 182400,
        year_built: 2021,
        flag: 'Panama',
        current_port: 'Shanghai [CN]',
        destination_port: 'Rotterdam [NL]',
        status: 'Delayed',
        eta_deviation: '+6h',
        risk_level: 'High',
        speed_knots: 13.8,
        fuel_consumption_t_day: 43.5,
        cii_rating: 'B',
        daily_charter_rate: 25800,
        open_date: '2026-11-02',
        route_compatibility: 94,
        coords: [22.4, 118.2],
        heading: 245,
        cargo: 'Iron Ore',
        cargo_capacity_pct: 92
      },
      {
        id: 'V-102',
        name: 'MV Baltic Wave',
        imo: '9765412',
        vessel_class: 'LR3',
        dwt: 160000,
        year_built: 2023,
        flag: 'Liberia',
        current_port: 'Hamburg [DE]',
        destination_port: 'Antwerp [BE]',
        status: 'On Schedule',
        eta_deviation: '0h',
        risk_level: 'Low',
        speed_knots: 14.2,
        fuel_consumption_t_day: 41.0,
        cii_rating: 'A',
        daily_charter_rate: 31200,
        open_date: '2026-10-30',
        route_compatibility: 98,
        coords: [53.5, 8.2],
        heading: 260,
        cargo: 'Clean Petroleum',
        cargo_capacity_pct: 88
      },
      {
        id: 'V-103',
        name: 'MV Pacific Jet',
        imo: '9812984',
        vessel_class: 'Panamax',
        dwt: 76500,
        year_built: 2020,
        flag: 'Marshall Islands',
        current_port: 'Singapore [SG]',
        destination_port: 'Dubai [AE]',
        status: 'At Berth',
        eta_deviation: '+2h',
        risk_level: 'Low',
        speed_knots: 13.4,
        fuel_consumption_t_day: 27.5,
        cii_rating: 'A',
        daily_charter_rate: 17400,
        open_date: '2026-11-01',
        route_compatibility: 91,
        coords: [1.29, 103.85],
        heading: 0,
        cargo: 'Grain',
        cargo_capacity_pct: 95
      },
      {
        id: 'V-104',
        name: 'MV Atlantic Crown',
        imo: '9789345',
        vessel_class: 'MR2',
        dwt: 49999,
        year_built: 2019,
        flag: 'Cyprus',
        current_port: 'Houston, TX [US]',
        destination_port: 'Antwerp [BE]',
        status: 'En Route',
        eta_deviation: '-3h',
        risk_level: 'Medium',
        speed_knots: 14.0,
        fuel_consumption_t_day: 23.0,
        cii_rating: 'B',
        daily_charter_rate: 18900,
        open_date: '2026-11-04',
        route_compatibility: 89,
        coords: [28.5, -90.2],
        heading: 85,
        cargo: 'Chemicals / Sulfuric Acid',
        cargo_capacity_pct: 84
      },
      {
        id: 'V-105',
        name: 'MV Sea Challenger',
        imo: '9654321',
        vessel_class: 'Supramax',
        dwt: 58000,
        year_built: 2018,
        flag: 'Panama',
        current_port: 'Fujairah [AE]',
        destination_port: 'Mombasa [KE]',
        status: 'En Route',
        eta_deviation: '+1h',
        risk_level: 'Low',
        speed_knots: 13.2,
        fuel_consumption_t_day: 24.5,
        cii_rating: 'C',
        daily_charter_rate: 14500,
        open_date: '2026-10-31',
        route_compatibility: 93,
        coords: [15.2, 58.4],
        heading: 205,
        cargo: 'Clean Petroleum',
        cargo_capacity_pct: 90
      },
      {
        id: 'V-106',
        name: 'MV Nordic Bulk',
        imo: '9723456',
        vessel_class: 'LR2',
        dwt: 115000,
        year_built: 2022,
        flag: 'Norway',
        current_port: 'Jubail [SA]',
        destination_port: 'Vizag [IN]',
        status: 'En Route',
        eta_deviation: '0h',
        risk_level: 'Low',
        speed_knots: 13.9,
        fuel_consumption_t_day: 35.0,
        cii_rating: 'A',
        daily_charter_rate: 28500,
        open_date: '2026-11-03',
        route_compatibility: 96,
        coords: [22.1, 62.8],
        heading: 110,
        cargo: 'Crude Oil',
        cargo_capacity_pct: 93
      },
      {
        id: 'V-107',
        name: 'MV Global Pioneer',
        imo: '9890123',
        vessel_class: 'VLCC',
        dwt: 318000,
        year_built: 2023,
        flag: 'Liberia',
        current_port: 'Ras Tanura [SA]',
        destination_port: 'Ningbo [CN]',
        status: 'En Route',
        eta_deviation: '-5h',
        risk_level: 'Low',
        speed_knots: 15.1,
        fuel_consumption_t_day: 58.0,
        cii_rating: 'A',
        daily_charter_rate: 48000,
        open_date: '2026-11-06',
        route_compatibility: 99,
        coords: [6.1, 95.2],
        heading: 75,
        cargo: 'Crude Oil',
        cargo_capacity_pct: 96
      }
    ];
  }

  static async search(query: string): Promise<SearchResults> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.results) {
          return data.results;
        }
      }
    } catch (e) {
      console.error('Search API fetch error:', e);
    }

    // Client-side fallback search using known catalog
    const q = query.trim().toLowerCase();
    if (!q) {
      return { vessels: [], ports: [], routes: [], commodities: [] };
    }
    const words = q.split(/\s+/).filter(Boolean);
    const vessels = this.getFallbackVessels().filter((v) => {
      const h = `${v.name} ${v.vessel_class} ${v.status} ${v.cargo} ${v.current_port} ${v.destination_port} ${v.dwt}`.toLowerCase();
      return words.every((w) => h.includes(w));
    });
    const routes = this.getFallbackRoutes().filter((r) => {
      const h = `${r.id} ${r.origin} ${r.destination} ${r.vessel_class} ${r.commodity} ${r.origin} to ${r.destination}`.toLowerCase();
      return words.every((w) => h.includes(w));
    });
    const ports: SearchPortItem[] = [
      { name: 'Rotterdam', fullName: 'Rotterdam [NL]', code: 'NLRTM', country: 'Netherlands', coords: [51.9244, 4.4777] as [number, number] },
      { name: 'Shanghai', fullName: 'Far East Main (Shanghai) [CN]', code: 'CNSHA', country: 'China', coords: [31.2304, 121.4737] as [number, number] },
      { name: 'Lagos', fullName: 'Lagos [NG]', code: 'NGLOS', country: 'Nigeria', coords: [6.4654, 3.4064] as [number, number] },
      { name: 'Fujairah', fullName: 'Fujairah [AE]', code: 'AEFJR', country: 'United Arab Emirates', coords: [25.1288, 56.3265] as [number, number] },
      { name: 'Houston', fullName: 'Houston, TX [US]', code: 'USHOU', country: 'United States', coords: [29.7604, -95.3698] as [number, number] },
      { name: 'Antwerp', fullName: 'Antwerp [BE]', code: 'BEANR', country: 'Belgium', coords: [51.2194, 4.4025] as [number, number] },
      { name: 'Mombasa', fullName: 'Mombasa [KE]', code: 'KEMBA', country: 'Kenya', coords: [-4.0435, 39.6682] as [number, number] },
      { name: 'Singapore', fullName: 'Singapore [SG]', code: 'SGSIN', country: 'Singapore', coords: [1.3521, 103.8198] as [number, number] },
      { name: 'Jubail', fullName: 'Jubail [SA]', code: 'SAJUB', country: 'Saudi Arabia', coords: [27.0046, 49.6592] as [number, number] },
      { name: 'Vizag', fullName: 'Vizag [IN]', code: 'INVTZ', country: 'India', coords: [17.6868, 83.2185] as [number, number] },
      { name: 'Hamburg', fullName: 'Hamburg [DE]', code: 'DEHAM', country: 'Germany', coords: [53.5511, 9.9937] as [number, number] },
      { name: 'Santos', fullName: 'Santos [BR]', code: 'BRSSZ', country: 'Brazil', coords: [-23.9608, -46.3331] as [number, number] },
      { name: 'Ningbo', fullName: 'Ningbo [CN]', code: 'CNNGB', country: 'China', coords: [29.8683, 121.5440] as [number, number] }
    ].filter((p) => {
      const h = `${p.name} ${p.fullName || ''} ${p.code} ${p.country}`.toLowerCase();
      return words.every((w) => h.includes(w));
    }).map((p) => {
      const availRoutes = this.getFallbackRoutes().filter(r => r.origin.toLowerCase().includes(p.name.toLowerCase()) || r.destination.toLowerCase().includes(p.name.toLowerCase()));
      const actVessels = this.getFallbackVessels().filter(v => v.current_port.toLowerCase().includes(p.name.toLowerCase()) || v.destination_port.toLowerCase().includes(p.name.toLowerCase()));
      return {
        ...p,
        available_routes_count: availRoutes.length,
        active_vessels_count: actVessels.length,
        available_routes: availRoutes,
        active_vessels: actVessels
      };
    });
    const commodities: SearchCommodityItem[] = [
      { name: 'Iron Ore', category: 'Major Dry Bulk', default_vessel_class: 'Capesize', top_routes: ['Far East Main (Shanghai) [CN] → North Europe Main (Rotterdam) [NL]'] },
      { name: 'Clean Petroleum', category: 'Liquid Bulk / Tanker', default_vessel_class: 'LR3', top_routes: ['Rotterdam [NL] → Lagos [NG]', 'Singapore [SG] → Mombasa [KE]'] },
      { name: 'Chemicals', category: 'Liquid Chemicals / Bulk', default_vessel_class: 'MR2', top_routes: ['Houston, TX [US] → Antwerp [BE]'] },
      { name: 'Crude Oil', category: 'Wet Bulk / Tanker', default_vessel_class: 'VLCC', top_routes: ['Jubail [SA] → Vizag [IN]'] },
      { name: 'Grain', category: 'Agricultural Dry Bulk', default_vessel_class: 'Panamax', top_routes: ['Santos [BR] → Antwerp [BE]'] },
      { name: 'Coal', category: 'Major Dry Bulk', default_vessel_class: 'Capesize', top_routes: ['Richards Bay → Rotterdam'] },
      { name: 'Steel Coils', category: 'Breakbulk & Steel', default_vessel_class: 'Supramax', top_routes: ['Busan [KR] → Los Angeles [US]'] }
    ].filter((c) => {
      const h = `${c.name} ${c.category} ${c.default_vessel_class}`.toLowerCase();
      return words.every((w) => h.includes(w));
    });

    return { vessels, ports, routes, commodities };
  }

}
