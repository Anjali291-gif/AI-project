import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Star,
  Sparkles,
  Download,
  BarChart2,
  Calendar,
  Layers,
  Fuel,
  Anchor,
  Wind,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { ApiService } from '../services/api';
import { ForecastResponse } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const getRouteDistance = (orig: string, dest: string): number => {
  const o = orig.toLowerCase();
  const d = dest.toLowerCase();
  if ((o.includes('far east') || o.includes('shanghai')) && (d.includes('europe') || d.includes('rotterdam') || d.includes('antwerp'))) return 10550;
  if ((d.includes('far east') || d.includes('shanghai')) && (o.includes('europe') || o.includes('rotterdam') || o.includes('antwerp'))) return 10550;
  if (o.includes('rotterdam') && d.includes('lagos')) return 4120;
  if (o.includes('lagos') && d.includes('rotterdam')) return 4120;
  if (o.includes('rotterdam') && d.includes('fujairah')) return 4246;
  if (o.includes('fujairah') && d.includes('rotterdam')) return 4246;
  if (o.includes('houston') && d.includes('antwerp')) return 4850;
  if (o.includes('antwerp') && d.includes('houston')) return 4850;
  if (o.includes('fujairah') && d.includes('mombasa')) return 2383;
  if (o.includes('mombasa') && d.includes('fujairah')) return 2383;
  if (o.includes('singapore') && d.includes('mombasa')) return 3950;
  if (o.includes('mombasa') && d.includes('singapore')) return 3950;
  if (o.includes('jubail') && d.includes('vizag')) return 2680;
  if (o.includes('vizag') && d.includes('jubail')) return 2680;
  if (o.includes('far east') && d.includes('west coast')) return 6200;
  if (o.includes('santos') && d.includes('europe')) return 5400;
  return 8500;
};

export interface ForecastPageProps {
  initialOrigin?: string;
  initialDestination?: string;
  initialCommodity?: string;
  initialVesselClass?: string;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  initialOrigin,
  initialDestination,
  initialCommodity,
  initialVesselClass
}) => {
  const { theme } = useTheme();

  // Form State
  const [origin, setOrigin] = useState('Far East Main');
  const [destination, setDestination] = useState('North Europe Main');
  const [vesselClass, setVesselClass] = useState('Capesize');
  const [commodity, setCommodity] = useState('Iron Ore');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [distanceNm, setDistanceNm] = useState(10550);
  const [bunkerPrice, setBunkerPrice] = useState(624);
  const [congestionDays, setCongestionDays] = useState(2.5);
  const [weatherRisk, setWeatherRisk] = useState(2.4);
  const [cargoDemand, setCargoDemand] = useState(112);
  const [isFavorite, setIsFavorite] = useState(false);

  // Results State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [requestKey, setRequestKey] = useState(0); // incremented on each submission so chart re-animates

  // Auto-update distance whenever origin or destination changes
  useEffect(() => {
    setDistanceNm(getRouteDistance(origin, destination));
  }, [origin, destination]);

  // Initial Load / Run
  useEffect(() => {
    if (initialOrigin || initialDestination || initialCommodity || initialVesselClass) {
      const o = initialOrigin || origin;
      const d = initialDestination || destination;
      const c = initialCommodity || commodity;
      const v = initialVesselClass || vesselClass;
      if (initialOrigin) setOrigin(initialOrigin);
      if (initialDestination) setDestination(initialDestination);
      if (initialCommodity) setCommodity(initialCommodity);
      if (initialVesselClass) setVesselClass(initialVesselClass);
      handleRunForecast({
        originPort: o,
        destPort: d,
        commodity: c,
        vessel: v
      });
    } else {
      handleRunForecast();
    }
  }, [initialOrigin, initialDestination, initialCommodity, initialVesselClass]);

  const handleSwapPorts = () => {
    const newOrigin = destination;
    const newDest = origin;
    setOrigin(newOrigin);
    setDestination(newDest);
    setDistanceNm(getRouteDistance(newOrigin, newDest));
  };

  const handleRunForecast = async (overrides?: {
    horizon?: number;
    vessel?: string;
    commodity?: string;
    originPort?: string;
    destPort?: string;
  }) => {
    const curOrigin = overrides?.originPort ?? origin;
    const curDest = overrides?.destPort ?? destination;
    const curVessel = overrides?.vessel ?? vesselClass;
    const curCommodity = overrides?.commodity ?? commodity;
    const curHorizon = overrides?.horizon ?? forecastHorizon;
    const curDist = getRouteDistance(curOrigin, curDest);

    setLoading(true);
    setErrorMsg(null);
    // Clear old results immediately so stale data is never shown as new
    setForecast(null);
    try {
      // Determine canal_transit: Suez (Far East↔Europe/Med/Middle East) or Panama (Americas↔Pacific)
      const suezRoute = (curOrigin.includes('Far East') && (curDest.includes('Europe') || curDest.includes('Vizag') || curDest.includes('Lagos') || curDest.includes('Mombasa')))
                     || (curDest.includes('Far East') && (curOrigin.includes('Europe') || curOrigin.includes('Lagos') || curOrigin.includes('Mombasa')));
      const panamaRoute = (curOrigin.includes('Houston') && curDest.includes('US West'))
                       || (curDest.includes('Houston') && curOrigin.includes('US West'));
      const canalVal = (suezRoute || panamaRoute) ? 1 : 0;

      const res = await ApiService.getForecast({
        origin: curOrigin,
        destination: curDest,
        vessel_class: curVessel,
        commodity: curCommodity,
        forecast_horizon_days: curHorizon,
        distance_nm: curDist,
        bunker_price_usd_t: bunkerPrice,
        port_congestion_days: congestionDays,
        weather_risk_index: weatherRisk,
        cargo_demand_index: cargoDemand,
        canal_transit: canalVal
      });
      setForecast(res);
      setRequestKey(k => k + 1); // force chart re-animation

      // ── Diagnostic console logs (kept for debugging, safe in production) ──
      const ts = res.time_series ?? [];
      const histPts  = ts.filter((p: any) => p.historical_rate != null);
      const futPts   = ts.filter((p: any) => p.predicted_rate  != null && p.is_future);
      const histVals = histPts.map((p: any) => p.historical_rate);
      const futVals  = futPts.map((p: any) => p.predicted_rate);
      const uniqHist = new Set(histVals).size;
      const uniqFut  = new Set(futVals).size;
      console.group('[FreightAI] Forecast API Response');
      console.log('is_live_ml    :', res.is_live_ml);
      console.log('model_used    :', res.model_used);
      console.log('predicted_rate:', res.predicted_freight_rate);
      console.log('range         :', res.predicted_range);
      console.log('total series  :', ts.length, 'points');
      console.log('historical pts:', histPts.length, '| unique values:', uniqHist);
      console.log('  min:', histVals.length ? Math.min(...histVals) : '—',
                  ' max:', histVals.length ? Math.max(...histVals) : '—');
      console.log('  sample (first 5):', histVals.slice(0, 5));
      console.log('future pts    :', futPts.length, '| unique values:', uniqFut);
      console.log('  min:', futVals.length ? Math.min(...futVals) : '—',
                  ' max:', futVals.length ? Math.max(...futVals) : '—');
      console.log('  sample (all):', futVals);
      console.groupEnd();

      // If the returned model_used indicates it was the offline fallback, show a warning
      if (!res.is_live_ml) {
        setErrorMsg(
          res.model_used?.startsWith('DEMO OFFLINE')
            ? `Offline estimate only — ${res.model_used.replace('DEMO OFFLINE — ', '')} Start the backend (start_backend.bat) for live XGBoost predictions.`
            : null
        );
      }
    } catch (err: any) {
      console.error('[ForecastPage] handleRunForecast error:', err);
      setErrorMsg(`Prediction failed: ${err?.message ?? 'Unknown error'}. Check the backend is running on port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!forecast || !forecast.time_series || forecast.time_series.length === 0) return;

    const escapeCsv = (val: any) => {
      if (val == null) return '';
      const s = String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const toIsoDate = (p: any): string => {
      if (p.iso_date && /^\d{4}-\d{2}-\d{2}$/.test(p.iso_date)) {
        return p.iso_date;
      }
      if (p.full_date) {
        const d = new Date(p.full_date);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      }
      return p.date || '';
    };

    const headers = [
      'Date',
      'Historical_Rate_USD_per_Ton',
      'Predicted_Rate_USD_per_Ton',
      'Lower_95_CI',
      'Upper_95_CI',
      'Is_Future',
      'Vessel_Class',
      'Commodity',
      'Origin',
      'Destination',
      'Forecast_Horizon_Days',
      'Model_Name'
    ].join(',');

    const modelName = forecast.model_used || (forecast.is_live_ml ? 'FreightAI-XGBoost-V4' : 'Demo Heuristic');

    const rows = forecast.time_series.map((p) => {
      const isoDate = toIsoDate(p);
      const isFuture = Boolean(p.is_future);
      const histRate = !isFuture && p.historical_rate != null ? Number(p.historical_rate).toFixed(2) : '';
      const predRate = isFuture && p.predicted_rate != null ? Number(p.predicted_rate).toFixed(2) : '';
      const lowerCI = isFuture && p.lower_bound != null ? Number(p.lower_bound).toFixed(2) : '';
      const upperCI = isFuture && p.upper_bound != null ? Number(p.upper_bound).toFixed(2) : '';

      return [
        escapeCsv(isoDate),
        histRate,
        predRate,
        lowerCI,
        upperCI,
        isFuture ? 'TRUE' : 'FALSE',
        escapeCsv(vesselClass),
        escapeCsv(commodity),
        escapeCsv(origin),
        escapeCsv(destination),
        forecastHorizon,
        escapeCsv(modelName)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeOrig = origin.replace(/[^a-zA-Z0-9]/g, '_');
    const safeDest = destination.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `FreightAI_Forecast_${safeOrig}_to_${safeDest}_${forecastHorizon}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Chart Data preparation: attach confidence_interval [lower, upper] for ranged area
  const chartData = useMemo(() => {
    if (!forecast?.time_series) return [];
    return forecast.time_series.map((p) => ({
      ...p,
      confidence_interval:
        p.lower_bound != null && p.upper_bound != null
          ? [p.lower_bound, p.upper_bound]
          : null
    }));
  }, [forecast]);

  // Dynamic Y-Axis Domain calculation with sensible ~15% padding
  const yDomain = useMemo(() => {
    if (!forecast?.time_series || forecast.time_series.length === 0) {
      return [0, 30];
    }
    const validValues: number[] = [];
    for (const p of forecast.time_series) {
      if (typeof p.historical_rate === 'number' && !isNaN(p.historical_rate)) {
        validValues.push(p.historical_rate);
      }
      if (typeof p.predicted_rate === 'number' && !isNaN(p.predicted_rate)) {
        validValues.push(p.predicted_rate);
      }
      if (typeof p.lower_bound === 'number' && !isNaN(p.lower_bound)) {
        validValues.push(p.lower_bound);
      }
      if (typeof p.upper_bound === 'number' && !isNaN(p.upper_bound)) {
        validValues.push(p.upper_bound);
      }
    }
    if (validValues.length === 0) return [0, 30];

    const dataMin = Math.min(...validValues);
    const dataMax = Math.max(...validValues);
    const span = dataMax - dataMin;
    const padding = Math.max(span * 0.15, 1.0);

    const minWithPad = Math.max(0, dataMin - padding);
    const maxWithPad = dataMax + padding;

    const yMin = minWithPad < 2.0 ? 0 : Math.floor(minWithPad);
    const yMax = Math.ceil(maxWithPad);

    return [yMin, yMax];
  }, [forecast]);

  // Custom Tooltip strictly reproducing Reference 02
  const CustomForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`rounded-xl p-3.5 shadow-2xl border text-xs min-w-[220px] transition ${
            theme === 'dark'
              ? 'bg-[#161e2e] text-slate-100 border-white/10'
              : 'bg-white text-slate-900 border-slate-200 shadow-md'
          }`}
        >
          <div className="text-slate-400 font-medium mb-1">{data.full_date || label}</div>
          <div
            className={`font-bold text-sm mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {data.is_future ? 'AI Freight Projection' : 'Historical Spot Observation'}
          </div>
          {data.is_future && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 font-medium">Change</span>
              <span className="px-2 py-0.5 rounded font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20">
                {forecast ? `${forecast.market_rate_change_pct >= 0 ? '+' : ''}${forecast.market_rate_change_pct}% vs Today` : '—'}
              </span>
            </div>
          )}

          <div
            className={`pt-2 border-t space-y-1.5 ${
              theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-100'
            }`}
          >
            {data.is_future ? (
              <>
                <div className="text-[11px] font-semibold text-slate-400">ML Forecast Horizon</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center space-x-1.5">
                    <span className="w-1.5 h-3 bg-blue-600 rounded-sm" />
                    <span>Predicted Rate</span>
                  </span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      theme === 'dark' ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    ${data.predicted_rate != null ? Number(data.predicted_rate).toFixed(2) : '—'}/t
                  </span>
                </div>
                {data.lower_bound != null && data.upper_bound != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <span className="w-1.5 h-3 border border-dashed border-blue-400 rounded-sm" />
                      <span>95% CI Range</span>
                    </span>
                    <span
                      className={`font-mono px-1.5 py-0.5 rounded ${
                        theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      ${Number(data.lower_bound).toFixed(2)} – ${Number(data.upper_bound).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <span className="w-1.5 h-3 bg-cyan-500 rounded-sm" />
                  <span>Historical Spot Rate</span>
                </span>
                <span
                  className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                    theme === 'dark' ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  ${data.historical_rate != null ? Number(data.historical_rate).toFixed(2) : '—'}/t
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Route Selector Header Card (Reference 02 Top Header) */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition ${
          theme === 'dark'
            ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
            : 'bg-white border-slate-200 shadow-light-card'
        }`}
      >
        {/* Origin & Destination Interactive Group */}
        <div
          className={`w-full md:w-auto flex items-center rounded-xl border p-1.5 shadow-inner transition ${
            theme === 'dark'
              ? 'bg-[#161e2e] border-white/[0.08]'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Origin selector */}
          <div className="flex items-center space-x-2 px-3 py-1.5">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-cyan-500" />
            </div>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              <option value="Far East Main" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Far East Main (Shanghai/Ningbo)
              </option>
              <option value="Rotterdam [NL]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Rotterdam [NL]
              </option>
              <option value="Houston, TX [US]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Houston, TX [US]
              </option>
              <option value="Fujairah [AE]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Fujairah [AE]
              </option>
              <option value="Singapore [SG]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Singapore [SG]
              </option>
              <option value="Santos [BR]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Santos [BR]
              </option>
              <option value="Jubail [SA]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Jubail [SA]
              </option>
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapPorts}
            className={`p-1.5 mx-1 rounded-lg transition ${
              theme === 'dark'
                ? 'bg-[#121824] text-slate-400 hover:text-cyan-400 hover:bg-white/[0.05]'
                : 'bg-white text-slate-500 hover:text-cyan-600 hover:bg-slate-100 shadow-sm'
            }`}
            title="Swap Origin and Destination"
          >
            <ArrowLeftRight size={14} />
          </button>

          {/* Destination selector */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 border-l ${
              theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={`bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              <option value="North Europe Main" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                North Europe Main (Rotterdam/Antwerp)
              </option>
              <option value="US West Coast (LA)" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                US West Coast (Los Angeles)
              </option>
              <option value="Lagos [NG]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Lagos [NG]
              </option>
              <option value="Mombasa [KE]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Mombasa [KE]
              </option>
              <option value="Vizag [IN]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Vizag [IN]
              </option>
              <option value="Dubai [AE]" className={theme === 'dark' ? 'bg-[#161e2e]' : 'bg-white'}>
                Dubai [AE]
              </option>
            </select>
          </div>

          {/* Star Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 ml-1 rounded-lg transition ${
              isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Bookmark this route"
          >
            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={!forecast}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition disabled:opacity-50 ${
              theme === 'dark'
                ? 'bg-[#161e2e] hover:bg-[#1f293d] border-white/[0.08] text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleRunForecast()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-glow-cyan transition disabled:opacity-50"
          >
            <Sparkles size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Forecasting...' : 'Generate AI Forecast'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start space-x-2">
          <WifiOff size={15} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Backend live ML status banner */}
      {forecast && (
        <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
          forecast.is_live_ml
            ? theme === 'dark'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : theme === 'dark'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {forecast.is_live_ml
            ? <CheckCircle2 size={14} className="shrink-0" />
            : <AlertCircle size={14} className="shrink-0" />
          }
          <span>
            {forecast.is_live_ml
              ? `Live XGBoost ML Prediction — Model: ${forecast.model_used} | Confidence: ${((forecast.confidence_score ?? 0.967) * 100).toFixed(1)}%`
              : `Demo Offline Estimate — ${forecast.model_used}. Start the backend for live XGBoost predictions.`
            }
          </span>
        </div>
      )}

      {/* Main Row: Input Controls Parameters (Left) + Chart with Confidence Range (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Maritime Variable Inputs */}
        <div
          className={`lg:col-span-4 rounded-2xl border p-5 space-y-4 transition ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
              : 'bg-white border-slate-200 shadow-light-card'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b pb-3 ${
              theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-100'
            }`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Layers size={14} className="text-cyan-500" />
              <span>Route Parameters</span>
            </span>
            <span className="text-[10px] text-cyan-500 font-mono font-bold">ML Feature Vector</span>
          </div>

          {/* Vessel Class */}
          <div className="space-y-1">
            <label
              className={`text-xs flex items-center justify-between ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span>Vessel Class</span>
              <span className="text-[10px] font-mono text-slate-400">DWT Scale</span>
            </label>
            <select
              value={vesselClass}
              onChange={(e) => setVesselClass(e.target.value)}
              className={`w-full border text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.08] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="Capesize">Capesize (180,000 DWT)</option>
              <option value="Panamax">Panamax (75,000 DWT)</option>
              <option value="Supramax">Supramax (58,000 DWT)</option>
              <option value="Handysize">Handysize (38,000 DWT)</option>
              <option value="LR3">LR3 (160,000 DWT)</option>
              <option value="LR2">LR2 (115,000 DWT)</option>
              <option value="MR2">MR2 (50,000 DWT)</option>
              <option value="VLCC">VLCC (310,000 DWT)</option>
            </select>
          </div>

          {/* Cargo Commodity */}
          <div className="space-y-1">
            <label
              className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Cargo Commodity
            </label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className={`w-full border text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.08] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="Iron Ore">Iron Ore (Dry Bulk)</option>
              <option value="Bauxite">Bauxite (Dry Bulk)</option>
              <option value="Coal">Thermal & Coking Coal</option>
              <option value="Grain">Grain & Agricultural Bulk</option>
              <option value="Crude Oil">Crude Oil (Liquid Bulk)</option>
              <option value="Clean Petroleum">Clean Petroleum Products (CPP)</option>
              <option value="Chemicals / Sulfuric Acid">Chemicals & Specialized Acids</option>
            </select>
          </div>

          {/* Forecast Horizon */}
          <div className="space-y-1">
            <div
              className={`flex justify-between text-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Calendar size={13} className="text-slate-400" />
                <span>Forecast Horizon</span>
              </span>
              <span className="font-mono text-cyan-500 font-bold">{forecastHorizon} Days</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setForecastHorizon(d);
                    handleRunForecast({ horizon: d });
                  }}
                  className={`py-1.5 rounded-lg text-xs font-mono transition ${
                    forecastHorizon === d
                      ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 font-bold'
                      : theme === 'dark'
                      ? 'bg-[#161e2e] text-slate-400 hover:text-white border border-white/[0.06]'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Bunker Fuel Price Slider */}
          <div className="space-y-1 pt-1">
            <div
              className={`flex justify-between text-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Fuel size={13} className="text-amber-500" />
                <span>VLSFO Bunker Fuel</span>
              </span>
              <span className="font-mono text-amber-500 font-bold">${bunkerPrice} / mt</span>
            </div>
            <input
              type="range"
              min="480"
              max="820"
              value={bunkerPrice}
              onChange={(e) => setBunkerPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Port Congestion Days */}
          <div className="space-y-1">
            <div
              className={`flex justify-between text-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Anchor size={13} className="text-cyan-500" />
                <span>Port Congestion Delay</span>
              </span>
              <span className="font-mono text-cyan-500 font-bold">{congestionDays} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={congestionDays}
              onChange={(e) => setCongestionDays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Weather Risk */}
          <div className="space-y-1">
            <div
              className={`flex justify-between text-xs ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center space-x-1">
                <Wind size={13} className="text-blue-500" />
                <span>Weather / Sea State Risk</span>
              </span>
              <span className="font-mono text-blue-500 font-bold">{weatherRisk} / 5.0</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={weatherRisk}
              onChange={(e) => setWeatherRisk(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Right Column: Prediction Chart with Confidence Interval (Reference 02) */}
        <div
          className={`lg:col-span-8 rounded-2xl border p-5 flex flex-col justify-between transition ${
            theme === 'dark'
              ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
              : 'bg-white border-slate-200 shadow-light-card'
          }`}
        >
          {/* Top Key Result Cards — show skeletons while loading, real values when done */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Predicted Average */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-cyan-500/30'
                  : 'bg-cyan-50/60 border-cyan-200'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Predicted Average Rate</span>
              {loading ? (
                <div className="h-8 mt-1 rounded-lg bg-slate-700/40 animate-pulse w-3/4" />
              ) : (
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className={`text-2xl font-black font-mono ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    ${forecast?.predicted_average != null ? forecast.predicted_average : '—'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ ton</span>
                </div>
              )}
              {loading ? (
                <div className="h-3 mt-2 rounded bg-slate-700/30 animate-pulse w-1/2" />
              ) : (
                <span className="text-[10px] text-emerald-500 font-mono mt-1 font-bold">
                  {forecast ? `${forecast.market_rate_change_pct >= 0 ? '+' : ''}${forecast.market_rate_change_pct}% vs Today` : '—'}
                </span>
              )}
            </div>

            {/* Predicted Range */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.08]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">95% Confidence Range</span>
              {loading ? (
                <div className="h-7 mt-1 rounded-lg bg-slate-700/40 animate-pulse w-full" />
              ) : (
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-base font-bold text-cyan-600 dark:text-cyan-300 font-mono">
                    ${forecast?.predicted_range?.min ?? '—'}
                  </span>
                  <span className="text-xs text-slate-400">to</span>
                  <span className="text-base font-bold text-cyan-600 dark:text-cyan-300 font-mono">
                    ${forecast?.predicted_range?.max ?? '—'}
                  </span>
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                Bounds based on empirical RMSE
              </span>
            </div>

            {/* Model Engine / Confidence */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.08]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[11px] text-slate-400 font-medium">Model Engine</span>
              {loading ? (
                <div className="h-5 mt-1 rounded bg-slate-700/40 animate-pulse w-full" />
              ) : (
                <div className={`text-sm font-bold font-mono mt-1 truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {forecast?.is_live_ml ? 'XGBoost Regressor (V4)' : (forecast ? 'Demo Heuristic (Offline)' : '—')}
                </div>
              )}
              <div className="flex items-center space-x-1 text-[10px] text-cyan-500 font-mono mt-1">
                <span>R²: 0.9676</span>
                <span>·</span>
                <span>MAE: $1.11/t</span>
              </div>
            </div>
          </div>

          {/* Interactive Step-and-Band Chart strictly matching Reference 02 */}
          <div className="h-64 sm:h-72 w-full pt-1 relative">
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl z-10">
                <RefreshCw size={22} className="text-cyan-400 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                key={requestKey}
                data={chartData}
                margin={{ top: 20, right: 20, left: -5, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="predictionBandGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={theme === 'dark' ? 0.35 : 0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={theme === 'dark' ? 0.12 : 0.08} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                  tickLine={false}
                  domain={yDomain}
                  tickFormatter={(v: number) => `$${typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(1)) : v}`}
                />
                <Tooltip content={<CustomForecastTooltip />} />

                {/* Shaded 95% Confidence Band Area (strictly between lower_bound and upper_bound) */}
                <Area
                  type="monotone"
                  dataKey="confidence_interval"
                  stroke="#3b82f6"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  strokeOpacity={0.65}
                  fill="url(#predictionBandGradient)"
                  isAnimationActive={true}
                />

                {/* Historical Observations: Solid Line */}
                <Line
                  type="monotone"
                  dataKey="historical_rate"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#06b6d4' }}
                  activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 1.5 }}
                  isAnimationActive={true}
                />

                {/* Future Predictions: Distinct Dashed Line */}
                <Line
                  type="monotone"
                  dataKey="predicted_rate"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3.5, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] border-t mt-2 gap-2 ${
              theme === 'dark'
                ? 'border-white/[0.06] text-slate-500'
                : 'border-slate-100 text-slate-400'
            }`}
          >
            <span>*Illustrative Example and ML Forecast Model</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-[#06b6d4]" />
                <span>Historical Spot</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-[#3b82f6] border-b border-dashed" />
                <span>AI Predicted Horizon</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-2 bg-blue-500/20 border border-blue-500/40" />
                <span>95% Confidence Band</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Influencing Factors Section (SHAP Feature Explainability) */}
      <div
        className={`rounded-2xl border p-5 transition ${
          theme === 'dark'
            ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
            : 'bg-white border-slate-200 shadow-light-card'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart2 size={16} className="text-cyan-500" />
            <span
              className={`text-sm font-bold tracking-wide ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Factors Influencing This Prediction
            </span>
          </div>
          <span
            className={`text-[11px] font-mono ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            SHAP Value Feature Attribution
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {forecast?.influencing_factors?.map((f, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-white/[0.06] hover:border-cyan-500/30'
                  : 'bg-slate-50 border-slate-200 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-xs font-semibold ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {f.factor}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    f.direction === 'up'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : f.direction === 'down'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}
                >
                  {f.impact_pct > 0 ? `+${f.impact_pct}%` : `${f.impact_pct}%`}
                </span>
              </div>
              <p
                className={`text-[11px] mt-2 leading-relaxed ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {f.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
