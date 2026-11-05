/**
 * WorldMap.tsx — FreightAI Interactive Maritime World Map
 * Uses OpenStreetMap standard tiles as primary basemap with optional Satellite overlay.
 * Uses honest DEMO labels for simulated AIS telemetry and port data.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vessel, PortRoute } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Anchor, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Globe, X, Ship, MapPin, Clock, Gauge, Package,
  RotateCcw, Navigation
} from 'lucide-react';

// ─── Port Interface & Static Data ──────────────────────────────────────────────
export interface PortData {
  name: string;
  country: string;
  code: string;
  coords: [number, number];
  congestion: string;
  congestionLevel: 'low' | 'medium' | 'high';
  throughput: string;
  anchorage: string;
  labelPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const MAJOR_PORTS: PortData[] = [
  {
    name: 'Rotterdam',
    country: 'Netherlands',
    code: 'NL',
    coords: [51.9244, 4.4777],
    congestion: 'Low — 18% berth utilization',
    congestionLevel: 'low',
    throughput: '14.5 M TEU/yr',
    anchorage: '12 h avg',
    labelPosition: 'top-right'
  },
  {
    name: 'Antwerp',
    country: 'Belgium',
    code: 'BE',
    coords: [51.2194, 4.4025],
    congestion: 'Low — 14 h avg wait',
    congestionLevel: 'low',
    throughput: '12.0 M TEU/yr',
    anchorage: '14 h avg',
    labelPosition: 'bottom-left' // Staggered opposite Rotterdam
  },
  {
    name: 'Shanghai',
    country: 'China',
    code: 'CN',
    coords: [31.2304, 121.4737],
    congestion: 'High — 48 h avg wait',
    congestionLevel: 'high',
    throughput: '47.3 M TEU/yr',
    anchorage: '48 h avg',
    labelPosition: 'bottom-left' // Staggered opposite Busan
  },
  {
    name: 'Busan',
    country: 'South Korea',
    code: 'KR',
    coords: [35.1028, 129.0400],
    congestion: 'Low — efficient ops',
    congestionLevel: 'low',
    throughput: '21.7 M TEU/yr',
    anchorage: '12 h avg',
    labelPosition: 'top-right'
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    code: 'SG',
    coords: [1.2644, 103.8221],
    congestion: 'Medium — 36 h avg wait',
    congestionLevel: 'medium',
    throughput: '37.5 M TEU/yr',
    anchorage: '36 h avg',
    labelPosition: 'bottom-right'
  },
  {
    name: 'Mumbai',
    country: 'India',
    code: 'IN',
    coords: [18.9388, 72.8354],
    congestion: 'Medium — 30 h avg wait',
    congestionLevel: 'medium',
    throughput: '6.1 M TEU/yr',
    anchorage: '30 h avg',
    labelPosition: 'top-left'
  },
  {
    name: 'Fujairah',
    country: 'UAE',
    code: 'AE',
    coords: [25.1288, 56.3265],
    congestion: 'Low — bunkering hub',
    congestionLevel: 'low',
    throughput: '1.2 M TEU/yr',
    anchorage: '8 h avg',
    labelPosition: 'top-right'
  },
  {
    name: 'Mombasa',
    country: 'Kenya',
    code: 'KE',
    coords: [-4.0435, 39.6682],
    congestion: 'Medium — 24–36 h wait',
    congestionLevel: 'medium',
    throughput: '1.4 M TEU/yr',
    anchorage: '28 h avg',
    labelPosition: 'bottom-right'
  },
  {
    name: 'Lagos',
    country: 'Nigeria',
    code: 'NG',
    coords: [6.4531, 3.3958],
    congestion: 'High — 72 h+ avg wait',
    congestionLevel: 'high',
    throughput: '1.8 M TEU/yr',
    anchorage: '72 h avg',
    labelPosition: 'bottom-left'
  },
  {
    name: 'Houston',
    country: 'USA',
    code: 'US',
    coords: [29.7604, -95.3698],
    congestion: 'Low — efficient ops',
    congestionLevel: 'low',
    throughput: '3.6 M TEU/yr',
    anchorage: '10 h avg',
    labelPosition: 'top-right'
  }
];

const CONGESTION_COLOR: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444'
};

const STATUS_PAL: Record<string, { bg: string; glow: string; text: string }> = {
  Delayed: { bg: '#ef4444', glow: 'rgba(239,68,68,0.5)', text: '#ef4444' },
  'On Schedule': { bg: '#10b981', glow: 'rgba(16,185,129,0.5)', text: '#10b981' },
  'At Berth': { bg: '#06b6d4', glow: 'rgba(6,182,212,0.5)', text: '#06b6d4' },
  'En Route': { bg: '#3b82f6', glow: 'rgba(59,130,246,0.5)', text: '#3b82f6' },
  Moored: { bg: '#10b981', glow: 'rgba(16,185,129,0.5)', text: '#10b981' },
  'Under Load': { bg: '#f59e0b', glow: 'rgba(245,158,11,0.5)', text: '#f59e0b' },
  Alongside: { bg: '#06b6d4', glow: 'rgba(6,182,212,0.5)', text: '#06b6d4' },
  Full: { bg: '#3b82f6', glow: 'rgba(59,130,246,0.5)', text: '#3b82f6' },
  Loading: { bg: '#f59e0b', glow: 'rgba(245,158,11,0.5)', text: '#f59e0b' },
  Empty: { bg: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', text: '#8b5cf6' }
};
const DEFAULT_PAL = STATUS_PAL['En Route'];

const ROUTE_COLORS = ['#06b6d4', '#38bdf8', '#a78bfa', '#34d399', '#fb923c'];

const DEFAULT_ROUTES: PortRoute[] = [
  {
    id: 'R01',
    origin: 'Shanghai [CN]',
    origin_coords: [31.2304, 121.4737],
    destination: 'Rotterdam [NL]',
    destination_coords: [51.9244, 4.4777],
    vessel_class: 'Capesize',
    distance_nm: 10550,
    transit_time_days: 32.5,
    base_rate: 2150.0,
    change_pct: 5.2,
    commodity: 'Iron Ore',
    via: 'Suez Corridor',
    canal_fee: 320000
  },
  {
    id: 'R02',
    origin: 'Rotterdam [NL]',
    origin_coords: [51.9244, 4.4777],
    destination: 'Lagos [NG]',
    destination_coords: [6.4531, 3.3958],
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
    id: 'R03',
    origin: 'Fujairah [AE]',
    origin_coords: [25.1288, 56.3265],
    destination: 'Mombasa [KE]',
    destination_coords: [-4.0435, 39.6682],
    vessel_class: 'LR2',
    distance_nm: 2383,
    transit_time_days: 7.6,
    base_rate: 18.14,
    change_pct: -5.0,
    commodity: 'Clean Products',
    via: 'Arabian Sea Direct',
    canal_fee: 0
  },
  {
    id: 'R04',
    origin: 'Houston [US]',
    origin_coords: [29.7604, -95.3698],
    destination: 'Rotterdam [NL]',
    destination_coords: [51.9244, 4.4777],
    vessel_class: 'VLCC',
    distance_nm: 5400,
    transit_time_days: 18.2,
    base_rate: 32.40,
    change_pct: 2.1,
    commodity: 'Crude Oil',
    via: 'North Atlantic Route',
    canal_fee: 0
  },
  {
    id: 'R05',
    origin: 'Mumbai [IN]',
    origin_coords: [18.9388, 72.8354],
    destination: 'Singapore [SG]',
    destination_coords: [1.2644, 103.8221],
    vessel_class: 'Panamax',
    distance_nm: 1985,
    transit_time_days: 6.8,
    base_rate: 14.60,
    change_pct: -1.2,
    commodity: 'Grain / Refined Products',
    via: 'Bay of Bengal to Malacca',
    canal_fee: 0
  }
];

export interface WorldMapProps {
  vessels?: Vessel[];
  routes?: PortRoute[];
  selectedVesselId?: string | null;
  onSelectVessel?: (vessel: Vessel) => void;
  selectedRouteId?: string | null;
  onSelectRoute?: (route: PortRoute) => void;
  heightClass?: string;
  showRoutes?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  vessels = [],
  routes = [],
  selectedVesselId,
  onSelectVessel,
  selectedRouteId,
  onSelectRoute,
  heightClass = 'h-[360px]',
  showRoutes = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [map, setMap] = useState<L.Map | null>(null);
  const [mapLayer, setMapLayer] = useState<'osm' | 'satellite'>('osm');
  const [tilesLoading, setTilesLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected Detail Panels
  const [panelVessel, setPanelVessel] = useState<Vessel | null>(null);
  const [panelPort, setPanelPort] = useState<PortData | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const activeRoutes = routes.length > 0 ? routes : DEFAULT_ROUTES;

  // ── 1. Initialize Map Instance ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const instance = L.map(mapContainerRef.current, {
      center: [22.0, 42.0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: false // Disabled to prevent duplicate half-viewport tile jumping
    });

    instance.attributionControl.setPrefix('');

    // Responsive invalidation ensures full coverage across flex/grid containers
    const invalidate = () => {
      if (instance && mapContainerRef.current) {
        instance.invalidateSize();
      }
    };

    requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);

    const observer = new ResizeObserver(() => {
      invalidate();
    });
    observer.observe(mapContainerRef.current);

    setMap(instance);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      instance.remove();
      setMap(null);
    };
  }, []);

  // ── 2. Primary Tile Layer (OpenStreetMap standard / Satellite) ───────────────
  useEffect(() => {
    if (!map) return;

    setTilesLoading(true);

    // Ensure ONLY ONE base tile layer is active at any time
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl: string;
    let attribution: string;
    let subdomains: string[] = ['a', 'b', 'c'];
    let maxNativeZoom = 19;

    if (mapLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = ['a'];
      attribution = '&copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> World Imagery';
      maxNativeZoom = 18;
    } else {
      // OpenStreetMap standard tiles as PRIMARY basemap
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = ['a', 'b', 'c']; // Explicitly a, b, c only
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
      maxNativeZoom = 19;
    }

    // Toggle CSS class on tile pane for dark satellite view
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      if (mapLayer === 'satellite') {
        tilePane.classList.add('satellite-tiles');
      } else {
        tilePane.classList.remove('satellite-tiles');
      }
    }

    const tileLayer = L.tileLayer(tileUrl, {
      subdomains,
      maxZoom: 19,
      maxNativeZoom,
      attribution,
      crossOrigin: true
    });

    tileLayer.on('load', () => {
      setTilesLoading(false);
    });

    tileLayer.addTo(map);
    tileLayer.bringToBack();
    tileLayerRef.current = tileLayer;

    const timeout = setTimeout(() => setTilesLoading(false), 5000);

    return () => {
      clearTimeout(timeout);
      if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
    };
  }, [map, mapLayer]);

  // ── 3. Render 10 Major Ports with Staggered Labels ───────────────────────────
  useEffect(() => {
    if (!map) return;

    const portLayer = L.layerGroup().addTo(map);

    const labelBg = isDark ? 'rgba(13, 19, 31, 0.94)' : 'rgba(255, 255, 255, 0.96)';
    const labelColor = isDark ? '#f8fafc' : '#0f172a';
    const labelBorder = isDark ? 'rgba(6, 182, 212, 0.5)' : '#94a3b8';

    MAJOR_PORTS.forEach((port) => {
      const c = CONGESTION_COLOR[port.congestionLevel];

      let offsetStyles = '';
      if (port.labelPosition === 'top-right') {
        offsetStyles = 'top: -24px; left: 14px;';
      } else if (port.labelPosition === 'top-left') {
        offsetStyles = 'top: -24px; right: 14px;';
      } else if (port.labelPosition === 'bottom-left') {
        offsetStyles = 'top: 14px; right: 14px;';
      } else {
        offsetStyles = 'top: 14px; left: 14px;';
      }

      const iconHtml = `
        <div style="position: relative; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Port Diamond Icon -->
          <div style="
            width: 10px; height: 10px;
            background: ${c};
            border: 2px solid #ffffff;
            border-radius: 2px;
            transform: rotate(45deg);
            box-shadow: 0 0 8px ${c}, 0 0 14px ${c}55;
          "></div>

          <!-- Staggered Always-Visible Location Label -->
          <div style="
            position: absolute;
            ${offsetStyles}
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${labelBg};
            color: ${labelColor};
            border: 1px solid ${labelBorder};
            border-radius: 5px;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            pointer-events: none;
            user-select: none;
            line-height: 1.3;
          ">
            <span>${port.name}</span>
            <span style="opacity: 0.65; font-size: 9.5px; font-weight: 500;">${port.code}</span>
          </div>
        </div>
      `;

      const portIcon = L.divIcon({
        className: 'port-marker-div',
        html: iconHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker(port.coords, { icon: portIcon, zIndexOffset: 400 });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <div style="width: 10px; height: 10px; background: ${c}; border-radius: 2px; transform: rotate(45deg);"></div>
            <strong style="font-size: 14px; color: ${isDark ? '#ffffff' : '#0f172a'};">${port.name} Port</strong>
            <span style="font-size: 11px; color: #94a3b8;">(${port.country})</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 10px; font-family: monospace; color: #64748b;">
            Coords: ${port.coords[0].toFixed(4)}°N, ${port.coords[1].toFixed(4)}°E
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 6px;">
            <div style="color: #94a3b8;">Berth Congestion:</div>
            <div style="font-weight: 700; color: ${c}; text-align: right;">${port.congestionLevel.toUpperCase()}</div>
            <div style="color: #94a3b8;">Throughput:</div>
            <div style="font-weight: 600; text-align: right; color: ${isDark ? '#e2e8f0' : '#1e293b'};">${port.throughput}</div>
            <div style="color: #94a3b8;">Avg Anchorage:</div>
            <div style="font-weight: 600; text-align: right; color: ${isDark ? '#e2e8f0' : '#1e293b'};">${port.anchorage}</div>
          </div>
          <div style="padding: 4px; background: ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}; border-radius: 6px; font-size: 11px; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 6px;">
            ${port.congestion}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; padding-top: 4px; font-size: 9px; font-family: monospace; color: #64748b;">
            <span>PORT BENCHMARK</span>
            <span style="color: #f59e0b; font-weight: bold;">DEMO PORT DATA</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        setPanelPort(port);
        setPanelVessel(null);
      });

      portLayer.addLayer(marker);
    });

    return () => {
      map.removeLayer(portLayer);
    };
  }, [map, isDark]);

  // ── 4. Render Shipping Routes (Polylines + Tooltips) ──────────────────────────
  useEffect(() => {
    if (!map || !showRoutes) return;

    const routesLayer = L.layerGroup().addTo(map);

    activeRoutes.forEach((route, idx) => {
      const isSelected = selectedRouteId === route.id;
      const color = isSelected ? '#06b6d4' : ROUTE_COLORS[idx % ROUTE_COLORS.length];
      const weight = isSelected ? 3.5 : 2.2;
      const opacity = isSelected ? 1.0 : 0.75;
      const dashArray = isSelected ? undefined : '8, 6';

      const polyline = L.polyline([route.origin_coords, route.destination_coords], {
        color,
        weight,
        opacity,
        dashArray
      });

      polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectRoute) onSelectRoute(route);
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 240px; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px; color: ${isDark ? '#f8fafc' : '#0f172a'}; margin-bottom: 4px;">
            ${route.origin} &rarr; ${route.destination}
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
            ${route.vessel_class} &bull; ${route.transit_time_days} days &bull; ${route.distance_nm.toLocaleString()} nm
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; padding-top: 6px; margin-bottom: 6px;">
            <span style="color: #94a3b8;">Commodity:</span>
            <span style="text-align: right; font-weight: 600; color: ${isDark ? '#e2e8f0' : '#1e293b'};">${route.commodity}</span>
            <span style="color: #94a3b8;">Freight Spot:</span>
            <strong style="text-align: right; color: #06b6d4;">$${route.base_rate.toLocaleString()}/t</strong>
            <span style="color: #94a3b8;">Routing Via:</span>
            <span style="text-align: right; color: ${isDark ? '#e2e8f0' : '#1e293b'};">${route.via}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; padding-top: 4px; font-size: 9px; font-family: monospace; color: #64748b;">
            <span>ACTIVE CORRIDOR</span>
            <span style="color: #f59e0b; font-weight: bold;">DEMO ROUTE DATA</span>
          </div>
        </div>
      `;

      polyline.bindPopup(popupHtml, { maxWidth: 280 });

      routesLayer.addLayer(polyline);
    });

    return () => {
      map.removeLayer(routesLayer);
    };
  }, [map, activeRoutes, selectedRouteId, showRoutes, isDark, onSelectRoute]);

  // ── 5. Render Vessels with Labels & Telemetry Pings ──────────────────────────
  useEffect(() => {
    if (!map) return;

    const vesselLayer = L.layerGroup().addTo(map);

    const defaultVesselsList: Vessel[] = [
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
        coords: [56.2, 5.8],
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
        name: 'MV Atlas One',
        imo: '9790119',
        vessel_class: 'Supramax',
        dwt: 58300,
        year_built: 2019,
        flag: 'Singapore',
        current_port: 'Busan [KR]',
        destination_port: 'USA LA [US]',
        status: 'En Route',
        eta_deviation: '+2h',
        risk_level: 'Medium',
        speed_knots: 13.1,
        fuel_consumption_t_day: 23.8,
        cii_rating: 'B',
        daily_charter_rate: 14800,
        open_date: '2026-11-12',
        route_compatibility: 86,
        coords: [33.8, 140.1],
        heading: 85,
        cargo: 'Steel Coils',
        cargo_capacity_pct: 80
      },
      {
        id: 'V-105',
        name: 'MV Blue Tide',
        imo: '9887714',
        vessel_class: 'MR2',
        dwt: 49999,
        year_built: 2022,
        flag: 'Malta',
        current_port: 'Fujairah [AE]',
        destination_port: 'Mombasa [KE]',
        status: 'Moored',
        eta_deviation: '-1h',
        risk_level: 'Low',
        speed_knots: 13.6,
        fuel_consumption_t_day: 21.0,
        cii_rating: 'A',
        daily_charter_rate: 18200,
        open_date: '2026-10-29',
        route_compatibility: 96,
        coords: [25.1, 56.4],
        heading: 180,
        cargo: 'Clean Products',
        cargo_capacity_pct: 100
      }
    ];

    const displayVessels = vessels.length > 0 ? vessels : defaultVesselsList;

    displayVessels.forEach((v) => {
      const pal = STATUS_PAL[v.status] || DEFAULT_PAL;
      const isSelected = selectedVesselId === v.id;
      const size = isSelected ? 28 : 22;

      const vesselHtml = `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Radar Ping Glow -->
          <div class="vessel-ping" style="
            position: absolute;
            width: ${size + 6}px; height: ${size + 6}px;
            border-radius: 50%;
            background: ${pal.glow};
          "></div>

          <!-- Vessel Center Dot -->
          <div style="
            position: relative;
            width: ${isSelected ? 14 : 11}px; height: ${isSelected ? 14 : 11}px;
            border-radius: 50%;
            background: ${pal.bg};
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${pal.bg};
          "></div>

          ${
            isSelected
              ? `<div style="position: absolute; inset: -4px; border: 2px dashed #06b6d4; border-radius: 50%;"></div>`
              : ''
          }

          <!-- Vessel Name Label Pill -->
          <div style="
            position: absolute;
            top: ${size}px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${isDark ? 'rgba(13, 19, 31, 0.94)' : 'rgba(255, 255, 255, 0.96)'};
            color: ${isDark ? '#f8fafc' : '#0f172a'};
            border: 1px solid ${isSelected ? '#06b6d4' : isDark ? 'rgba(255,255,255,0.18)' : '#cbd5e1'};
            border-radius: 4px;
            padding: 1px 5px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            pointer-events: none;
            user-select: none;
          ">
            <span>${v.name}</span>
          </div>
        </div>
      `;

      const vesselIcon = L.divIcon({
        className: 'vessel-marker-div',
        html: vesselHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker(v.coords, {
        icon: vesselIcon,
        zIndexOffset: isSelected ? 1000 : 500
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: ${isDark ? '#f8fafc' : '#0f172a'}; font-size: 13px;">${v.name}</strong>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${pal.glow}; color: ${pal.bg}; font-weight: 700;">${v.status}</span>
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
            IMO: ${v.imo || 'N/A'} &bull; ${v.vessel_class} &bull; ${v.dwt.toLocaleString()} DWT
          </div>
          <div style="font-size: 11px; margin-bottom: 4px;">
            <span style="color: #64748b;">Route:</span>
            <span style="font-weight: 600; color: ${isDark ? '#cbd5e1' : '#334155'};">
              ${v.current_port.split(' ')[0]} &rarr; ${v.destination_port.split(' ')[0]}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-top: 4px;">
            <span style="color: #64748b;">Speed:</span>
            <span style="text-align: right; font-weight: 600; color: ${isDark ? '#e2e8f0' : '#1e293b'};">${v.speed_knots} kts</span>
            <span style="color: #64748b;">ETA Dev:</span>
            <span style="text-align: right; font-weight: 700; color: ${v.eta_deviation.includes('+') ? '#f59e0b' : '#10b981'}; font-family: monospace;">${v.eta_deviation}</span>
          </div>
          <div style="margin-top: 6px; border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}; padding-top: 4px; display: flex; justify-content: space-between; font-size: 9px; font-family: monospace; color: #64748b;">
            <span>AIS: SIMULATED</span>
            <span style="color: #f59e0b; font-weight: bold;">DEMO AIS DATA</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('click', () => {
        setPanelVessel(v);
        setPanelPort(null);
        if (onSelectVessel) onSelectVessel(v);
      });

      vesselLayer.addLayer(marker);
    });

    return () => {
      map.removeLayer(vesselLayer);
    };
  }, [map, vessels, selectedVesselId, isDark, onSelectVessel]);

  // ── 6. Controls Handlers ──────────────────────────────────────────────────────
  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleReset = () => {
    map?.setView([22.0, 42.0], 2);
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((f) => {
      setTimeout(() => map?.invalidateSize(), 150);
      return !f;
    });
  }, [map]);

  const toggleLayer = () => {
    setMapLayer((prev) => (prev === 'osm' ? 'satellite' : 'osm'));
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${isFullscreen ? '' : heightClass} rounded-2xl overflow-hidden border transition-all duration-300 select-none shadow-subtle-card group ${
        isDark
          ? 'bg-[#0d131f] border-white/[0.08]'
          : 'bg-[#f1f5f9] border-slate-200 shadow-light-card'
      }`}
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              borderRadius: 0,
              height: '100dvh',
              width: '100dvw'
            }
          : {}
      }
    >
      {/* ── Top-Left Status Header ────────────────────────────────────────────── */}
      <div
        className={`absolute top-3 left-4 z-[500] flex items-center space-x-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition ${
          isDark
            ? 'bg-[#121824]/90 border-white/[0.08] text-slate-200'
            : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <Anchor size={14} className="text-cyan-500" />
        <span className="text-xs font-semibold tracking-wide">Live AIS Corridors &amp; Vessels</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
          {vessels.length > 0 ? vessels.length : 5} Active
        </span>
      </div>

      {/* ── Top-Right Map Controls ────────────────────────────────────────────── */}
      <div
        className={`absolute top-3 right-4 z-[500] flex flex-col space-y-1.5 p-1.5 rounded-xl border backdrop-blur-md transition ${
          isDark
            ? 'bg-[#121824]/90 border-white/[0.08]'
            : 'bg-white/90 border-slate-200 shadow-sm'
        }`}
      >
        <button
          onClick={handleZoomIn}
          className={`p-1.5 rounded-lg transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          className={`p-1.5 rounded-lg transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={handleReset}
          className={`p-1.5 rounded-lg transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Reset Global View"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={toggleLayer}
          className={`p-1.5 rounded-lg transition ${
            mapLayer === 'satellite'
              ? 'text-cyan-400 bg-cyan-500/10'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={`Basemap: ${mapLayer === 'osm' ? 'OpenStreetMap (Click for Satellite)' : 'Satellite (Click for OSM)'}`}
        >
          <Globe size={14} />
        </button>
        <button
          onClick={toggleFullscreen}
          className={`p-1.5 rounded-lg transition ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* ── Leaflet DOM Node ──────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full relative" />

      {/* ── Bottom Legend ─────────────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-3 left-4 z-[500] hidden sm:flex flex-wrap items-center gap-x-3.5 gap-y-1 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-[11px] transition ${
          isDark
            ? 'bg-[#121824]/90 border-white/[0.08] text-slate-400'
            : 'bg-white/90 border-slate-200 text-slate-600 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
          <span>At Berth</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          <span>En Route</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span>On Schedule</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
          <span>Delayed</span>
        </div>
        <span className={`w-px h-3 mx-0.5 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-[2px] bg-[#10b981] rotate-45" />
          <span>Port Low</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-[2px] bg-[#f59e0b] rotate-45" />
          <span>Port Med</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-[2px] bg-[#ef4444] rotate-45" />
          <span>Port High</span>
        </div>
      </div>

      {/* ── Bottom-Right Honest Demo Badge ────────────────────────────────────── */}
      <div className="absolute bottom-3 right-4 z-[500] px-2 py-0.5 rounded font-mono text-[9px] text-slate-500 bg-transparent select-none">
        DEMO AIS TELEMETRY
      </div>

      {/* ── Slide-In Vessel Detail Panel ──────────────────────────────────────── */}
      {panelVessel && (
        <div
          className={`absolute top-0 right-0 bottom-0 z-[600] w-72 overflow-y-auto border-l transition-all duration-300 backdrop-blur-md ${
            isDark
              ? 'bg-[#0d131f]/96 border-white/[0.08]'
              : 'bg-white/96 border-slate-200 shadow-2xl'
          }`}
        >
          {/* Panel Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b sticky top-0 ${
              isDark ? 'bg-[#0d131f]/98 border-white/[0.08]' : 'bg-white/98 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Ship size={14} className="text-cyan-500" />
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Vessel Details
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                DEMO AIS
              </span>
              <button
                onClick={() => setPanelVessel(null)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? 'text-slate-500 hover:text-white hover:bg-white/[0.08]'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="px-4 pt-4 pb-6 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div
                  className={`text-base font-bold leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {panelVessel.name}
                </div>
                <div
                  className={`text-xs font-mono mt-0.5 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  IMO {panelVessel.imo || 'N/A'} &bull; {panelVessel.vessel_class}
                </div>
              </div>
              <span
                className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  background: (STATUS_PAL[panelVessel.status] || DEFAULT_PAL).glow,
                  color: (STATUS_PAL[panelVessel.status] || DEFAULT_PAL).bg,
                  borderColor: (STATUS_PAL[panelVessel.status] || DEFAULT_PAL).bg + '40'
                }}
              >
                {panelVessel.status}
              </span>
            </div>

            {/* Route & Progress */}
            <div
              className={`rounded-xl p-3 border ${
                isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Route Corridor
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={12} className="text-cyan-500 shrink-0" />
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {panelVessel.current_port} <span className="text-cyan-500 mx-1">&rarr;</span>{' '}
                  {panelVessel.destination_port}
                </span>
              </div>
              <div>
                <div
                  className={`flex justify-between text-[10px] mb-1 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>Voyage Progress</span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    {panelVessel.cargo_capacity_pct ?? 78}%
                  </span>
                </div>
                <div
                  className={`h-1.5 rounded-full overflow-hidden ${
                    isDark ? 'bg-white/[0.06]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${panelVessel.cargo_capacity_pct ?? 78}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Key Telemetry */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Gauge, label: 'Speed', val: `${panelVessel.speed_knots} kts` },
                { icon: Navigation, label: 'Heading', val: `${panelVessel.heading ?? 245}°` },
                { icon: Package, label: 'Cargo', val: panelVessel.cargo || 'General Cargo' },
                { icon: Clock, label: 'ETA Dev', val: panelVessel.eta_deviation }
              ].map(({ icon: Icon, label, val }) => (
                <div
                  key={label}
                  className={`rounded-xl p-2.5 border ${
                    isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={10} className="text-cyan-500" />
                    <span
                      className={`text-[9px] uppercase tracking-widest font-semibold ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Vessel Specifications */}
            <div
              className={`rounded-xl p-3 border space-y-1 ${
                isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Vessel Specs
              </div>
              {[
                ['Deadweight (DWT)', `${panelVessel.dwt.toLocaleString()} MT`],
                ['Flag State', panelVessel.flag],
                ['Year Built', String(panelVessel.year_built)],
                ['CII Carbon Rating', panelVessel.cii_rating],
                ['Fuel Cons.', `${panelVessel.fuel_consumption_t_day} t/day`],
                ['Risk Index', panelVessel.risk_level]
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-0.5">
                  <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  <span
                    className={`text-[11px] font-semibold font-mono ${
                      label === 'Risk Index'
                        ? val === 'High'
                          ? 'text-rose-400'
                          : val === 'Medium'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                        : isDark
                        ? 'text-slate-200'
                        : 'text-slate-700'
                    }`}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Daily Charter Hire */}
            <div
              className={`rounded-xl p-3 border ${
                isDark ? 'bg-cyan-500/[0.06] border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'
              }`}
            >
              <div
                className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Daily Charter Rate
              </div>
              <div className="text-lg font-bold text-cyan-500">
                ${panelVessel.daily_charter_rate.toLocaleString()}
                <span
                  className={`text-xs font-normal ml-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  /day
                </span>
              </div>
              <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Open Position: {panelVessel.open_date}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-In Port Detail Panel ────────────────────────────────────────── */}
      {panelPort && !panelVessel && (
        <div
          className={`absolute top-0 right-0 bottom-0 z-[600] w-64 overflow-y-auto border-l backdrop-blur-md ${
            isDark
              ? 'bg-[#0d131f]/96 border-white/[0.08]'
              : 'bg-white/96 border-slate-200 shadow-2xl'
          }`}
        >
          <div
            className={`flex items-center justify-between px-4 py-3 border-b sticky top-0 ${
              isDark ? 'bg-[#0d131f]/98 border-white/[0.08]' : 'bg-white/98 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Anchor size={14} className="text-cyan-500" />
              <span
                className={`text-xs font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Port Profile
              </span>
            </div>
            <button
              onClick={() => setPanelPort(null)}
              className={`p-1 rounded-lg ${
                isDark
                  ? 'text-slate-500 hover:text-white hover:bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X size={13} />
            </button>
          </div>

          <div className="px-4 pt-4 pb-6 space-y-3">
            <div>
              <div
                className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {panelPort.name}
              </div>
              <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {panelPort.country} ({panelPort.code})
              </div>
              <div
                className={`text-[10px] font-mono mt-0.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {panelPort.coords[0].toFixed(4)}°N, {panelPort.coords[1].toFixed(4)}°E
              </div>
            </div>

            {/* Congestion Status */}
            <div
              className={`rounded-xl p-3 border ${
                isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div
                className={`text-[10px] uppercase tracking-widest font-semibold mb-1.5 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Berth Congestion
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0 rotate-45"
                  style={{ background: CONGESTION_COLOR[panelPort.congestionLevel] }}
                />
                <span
                  className="text-sm font-bold capitalize"
                  style={{ color: CONGESTION_COLOR[panelPort.congestionLevel] }}
                >
                  {panelPort.congestionLevel}
                </span>
              </div>
              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {panelPort.congestion}
              </div>
            </div>

            {[
              ['Annual Throughput', panelPort.throughput],
              ['Avg Anchorage Wait', panelPort.anchorage]
            ].map(([label, val]) => (
              <div
                key={label}
                className={`rounded-xl p-3 border ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div
                  className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {label}
                </div>
                <div
                  className={`text-sm font-bold font-mono ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {val}
                </div>
              </div>
            ))}

            <div
              className={`text-[9px] font-mono text-center pt-2 ${
                isDark ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              SIMULATED PORT BENCHMARK &bull; DEMO
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
