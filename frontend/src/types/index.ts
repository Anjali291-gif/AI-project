export type NavigationPage = 'dashboard' | 'forecast' | 'chartering' | 'procurement' | 'models';

export interface KPIItem {
  value: string | number;
  change: string;
  status: 'normal' | 'good' | 'watch' | 'alert';
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  vessel: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  action_primary: string;
  action_secondary: string;
}

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  vessel_class: string;
  dwt: number;
  year_built: number;
  flag: string;
  current_port: string;
  destination_port: string;
  status: 'Delayed' | 'On Schedule' | 'At Berth' | 'En Route' | 'Moored' | 'Under Load';
  eta_deviation: string;
  risk_level: 'High' | 'Medium' | 'Low';
  speed_knots: number;
  fuel_consumption_t_day: number;
  cii_rating: string;
  daily_charter_rate: number;
  open_date: string;
  route_compatibility: number;
  coords: [number, number];
  heading: number;
  cargo: string;
  cargo_capacity_pct: number;
}

export interface PortRoute {
  id: string;
  origin: string;
  origin_coords: [number, number];
  destination: string;
  destination_coords: [number, number];
  vessel_class: string;
  distance_nm: number;
  transit_time_days: number;
  base_rate: number;
  lumpsum_m?: number;
  change_pct: number;
  commodity: string;
  via: string;
  canal_fee: number;
}

export interface InfluencingFactor {
  factor: string;
  impact_pct: number;
  direction: 'up' | 'down' | 'neutral';
  detail: string;
}

export interface TimeSeriesPoint {
  date: string;
  full_date: string;
  iso_date?: string;
  historical_rate: number | null;
  predicted_rate: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
  is_future: boolean;
}

export interface ForecastResponse {
  predicted_freight_rate: number;
  market_rate_change_pct: number;
  predicted_average: number;
  predicted_range: {
    min: number;
    max: number;
  };
  confidence_score: number;
  model_used: string;
  is_live_ml: boolean;
  influencing_factors: InfluencingFactor[];
  time_series: TimeSeriesPoint[];
  summary: string;
}

export interface CharterOptimizationResult {
  vessel: Vessel;
  composite_score: number;
  cost_per_ton: number;
  total_voyage_cost: number;
  fuel_cost: number;
  hire_cost: number;
  voyage_days: number;
  eta_days: number;
  recommendation: string;
}

export interface ProcurementCard {
  id: string;
  star: boolean;
  from_port: string;
  to_port: string;
  amount_mts: string;
  commodity: string;
  status: string;
}

export interface ProcurementOrder {
  id: string;
  parcels: number;
  from_region: string;
  from_port: string;
  to_port: string;
  to_region: string;
  amount_mts: string;
  commodity: string;
  freight_rate_usd: number;
  landed_cost_usd_t: number;
  savings_usd_t: number;
  highlighted: boolean;
}

export interface TimelineSchedule {
  vessel_name: string;
  capacity_info: string;
  segments: {
    port: string;
    dates: string;
    width_pct: number;
    start_pct: number;
    cargo: string;
  }[];
  verified: boolean;
}

export interface ModelMetadata {
  model_name: string;
  algorithm: string;
  training_samples: number;
  test_samples: number;
  trained_at: string;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
    mape_percent: number;
  };
  comparison_models: {
    name: string;
    algorithm: string;
    mae: number;
    rmse: number;
    r2: number;
    mape_percent: number;
    latency_ms: number;
    status: string;
  }[];
  top_features: {
    feature: string;
    importance: number;
  }[];
  business_drivers: Record<string, number>;
  feature_columns?: string[];
  dataset_summary?: {
    file_name: string;
    file_path: string;
    file_size_bytes: number;
    total_records: number;
    training_samples: number;
    test_samples: number;
    split_ratio: string;
    random_state: number;
    target_column: string;
    raw_columns_count: number;
    feature_columns_count: number;
    missing_values_count: number;
    columns?: {
      name: string;
      type: string;
      dtype?: string;
      missing: number;
    }[];
  };
}

export interface SearchPortItem {
  name: string;
  fullName?: string;
  code: string;
  country: string;
  coords: [number, number];
  available_routes_count?: number;
  active_vessels_count?: number;
  available_routes?: PortRoute[];
  active_vessels?: Vessel[];
}

export interface SearchCommodityItem {
  name: string;
  category: string;
  default_vessel_class: string;
  top_routes?: string[];
}

export interface SearchResults {
  vessels: Vessel[];
  ports: SearchPortItem[];
  routes: PortRoute[];
  commodities: SearchCommodityItem[];
}
