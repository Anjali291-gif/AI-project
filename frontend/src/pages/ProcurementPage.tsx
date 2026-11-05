import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Star,
  Calendar,
  Layers,
  DollarSign,
  Download,
  Filter,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { ApiService } from '../services/api';
import { ProcurementCard, ProcurementOrder, TimelineSchedule } from '../types';
import { useTheme } from '../context/ThemeContext';

export interface ScenarioData {
  id: string;
  name: string;
  description: string;
  totalVolume: string;
  cards: ProcurementCard[];
  orders: ProcurementOrder[];
  schedules: TimelineSchedule[];
  landedCostInputs: {
    fob: string;
    oceanFreight: string;
    bunkerSurcharge: string;
    canalToll: string;
    portHandling: string;
    insuranceCost: string;
  };
}

const INITIAL_SCENARIOS: Record<string, ScenarioData> = {
  'Scenario A': {
    id: 'SCN-1',
    name: 'Scenario A',
    description: 'Spot + Long Term Parcel Blend',
    totalVolume: '12,837,715 MTS',
    cards: [
      { id: '1', star: true, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Optimal Plan' },
      { id: '2', star: true, from_port: 'La Plata', to_port: 'Corpus Christi', amount_mts: '2,567,543 mts', commodity: 'Ethylene', status: 'In Negotiation' },
      { id: '3', star: true, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Contracted' },
      { id: '4', star: false, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Alternative' },
      { id: '5', star: false, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', status: 'Alternative' }
    ],
    orders: [
      { id: '234 421 345', parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Xylenes', freight_rate_usd: 101.69, landed_cost_usd_t: 412.50, savings_usd_t: 18.40, highlighted: false },
      { id: '234 421 346', parcels: 1, from_region: 'EUR / Cont', from_port: 'Colombo', to_port: 'Zhousan', to_region: 'Asia', amount_mts: '2,567,543 mts', commodity: 'Sulfuric Acid', freight_rate_usd: 101.69, landed_cost_usd_t: 389.20, savings_usd_t: 22.10, highlighted: false },
      { id: '234 421 347', parcels: 1, from_region: 'ECSA', from_port: 'Santos', to_port: 'Marseilles', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Ethylene', freight_rate_usd: 101.69, landed_cost_usd_t: 445.80, savings_usd_t: 14.50, highlighted: false },
      { id: '234 421 348', parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Xylenes', freight_rate_usd: 101.69, landed_cost_usd_t: 398.00, savings_usd_t: 29.80, highlighted: true },
      { id: '234 421 349', parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '2,567,543 mts', commodity: 'Xylenes', freight_rate_usd: 101.69, landed_cost_usd_t: 405.30, savings_usd_t: 16.20, highlighted: false }
    ],
    schedules: [
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
    ],
    landedCostInputs: {
      fob: '310.0',
      oceanFreight: '62.5',
      bunkerSurcharge: '14.8',
      canalToll: '4.2',
      portHandling: '5.8',
      insuranceCost: '1.2'
    }
  },
  'Spot Allocation': {
    id: 'SCN-2',
    name: 'Spot Allocation',
    description: 'Dynamic Short-Term Spot Arbitrage & Tactical Charters',
    totalVolume: '8,450,000 MTS',
    cards: [
      { id: '1', star: true, from_port: 'Dampier', to_port: 'Qingdao', amount_mts: '1,850,000 mts', commodity: 'Iron Ore', status: 'Spot Arbitrage' },
      { id: '2', star: true, from_port: 'Ras Tanura', to_port: 'Chiba', amount_mts: '2,100,000 mts', commodity: 'Crude Oil', status: 'Prompt Loading' },
      { id: '3', star: true, from_port: 'Houston', to_port: 'Rotterdam', amount_mts: '1,600,000 mts', commodity: 'Methanol', status: 'Open Market' },
      { id: '4', star: false, from_port: 'Gladstone', to_port: 'Krishnapatnam', amount_mts: '1,450,000 mts', commodity: 'Met Coal', status: 'Negotiating' },
      { id: '5', star: false, from_port: 'Singapore', to_port: 'Santos', amount_mts: '1,450,000 mts', commodity: 'Chemicals', status: 'Tender Pending' }
    ],
    orders: [
      { id: '418 201 101', parcels: 2, from_region: 'Australia', from_port: 'Dampier', to_port: 'Qingdao', to_region: 'Asia / Pacific', amount_mts: '1,850,000 mts', commodity: 'Iron Ore', freight_rate_usd: 14.50, landed_cost_usd_t: 118.20, savings_usd_t: 12.80, highlighted: false },
      { id: '418 201 102', parcels: 1, from_region: 'ME Gulf', from_port: 'Ras Tanura', to_port: 'Chiba', to_region: 'East Asia', amount_mts: '2,100,000 mts', commodity: 'Crude Oil', freight_rate_usd: 18.20, landed_cost_usd_t: 142.00, savings_usd_t: 16.50, highlighted: false },
      { id: '418 201 103', parcels: 1, from_region: 'US Gulf', from_port: 'Houston', to_port: 'Rotterdam', to_region: 'EUR / Cont', amount_mts: '1,600,000 mts', commodity: 'Methanol', freight_rate_usd: 45.80, landed_cost_usd_t: 340.50, savings_usd_t: 34.20, highlighted: true },
      { id: '418 201 104', parcels: 2, from_region: 'Australia', from_port: 'Gladstone', to_port: 'Krishnapatnam', to_region: 'India / ME', amount_mts: '1,450,000 mts', commodity: 'Met Coal', freight_rate_usd: 16.70, landed_cost_usd_t: 165.40, savings_usd_t: 11.10, highlighted: false },
      { id: '418 201 105', parcels: 1, from_region: 'SE Asia', from_port: 'Singapore', to_port: 'Santos', to_region: 'ECSA', amount_mts: '1,450,000 mts', commodity: 'Chemicals', freight_rate_usd: 58.30, landed_cost_usd_t: 415.00, savings_usd_t: 21.50, highlighted: false }
    ],
    schedules: [
      {
        vessel_name: 'MV ORIENT STAR',
        capacity_info: '42,000 CBM / 38,000 MTS',
        segments: [
          { port: 'DAMPIER', dates: 'Nov 8 - 14', width_pct: 24, start_pct: 0, cargo: 'IRON ORE LOAD' },
          { port: 'QINGDAO', dates: 'Nov 15 - 24', width_pct: 35, start_pct: 25, cargo: 'DISCHARGE / BERTH' },
          { port: 'SINGAPORE', dates: 'Nov 25 - 30', width_pct: 20, start_pct: 65, cargo: 'BUNKER REFILL' }
        ],
        verified: true
      },
      {
        vessel_name: 'MV ATLANTIC SPIRIT',
        capacity_info: '175,000 CBM / 160,000 MTS',
        segments: [
          { port: 'HOUSTON', dates: 'Nov 10 - 18', width_pct: 28, start_pct: 5, cargo: 'METHANOL LOAD' },
          { port: 'ATLANTIC TRANSIT', dates: 'Nov 19 - 26', width_pct: 25, start_pct: 35, cargo: 'OCEAN VOYAGE' },
          { port: 'ROTTERDAM', dates: 'Nov 27 - Dec 4', width_pct: 28, start_pct: 62, cargo: 'DISCHARGE & CUSTOMS' }
        ],
        verified: true
      },
      {
        vessel_name: 'MV PACIFIC TITAN',
        capacity_info: '310,000 CBM / 295,000 MTS',
        segments: [
          { port: 'RAS TANURA', dates: 'Nov 12 - 20', width_pct: 30, start_pct: 10, cargo: 'CRUDE LOADING' },
          { port: 'MALACCA STRAIT', dates: 'Nov 21 - 27', width_pct: 22, start_pct: 42, cargo: 'STRAIT PASSAGE' },
          { port: 'CHIBA', dates: 'Nov 28 - Dec 5', width_pct: 26, start_pct: 66, cargo: 'DISCHARGE TERMINAL' }
        ],
        verified: false
      }
    ],
    landedCostInputs: {
      fob: '275.0',
      oceanFreight: '45.8',
      bunkerSurcharge: '12.5',
      canalToll: '0.0',
      portHandling: '6.2',
      insuranceCost: '1.0'
    }
  },
  'Long Term COA': {
    id: 'SCN-3',
    name: 'Long Term COA',
    description: 'Fixed Multi-Year Volume Commitment & Baseload Hedging',
    totalVolume: '18,200,000 MTS',
    cards: [
      { id: '1', star: true, from_port: 'Tubarao', to_port: 'Rotterdam', amount_mts: '4,500,000 mts', commodity: 'Iron Ore', status: 'Annual COA Tier 1' },
      { id: '2', star: true, from_port: 'Port Hedland', to_port: 'Gwangyang', amount_mts: '5,200,000 mts', commodity: 'Iron Ore', status: 'Fixed Baseload' },
      { id: '3', star: true, from_port: 'Richards Bay', to_port: 'Rotterdam', amount_mts: '3,800,000 mts', commodity: 'Thermal Coal', status: 'Indexed COA' },
      { id: '4', star: false, from_port: 'New Orleans', to_port: 'Alexandria', amount_mts: '2,500,000 mts', commodity: 'Grain / Wheat', status: 'Quarterly Contract' },
      { id: '5', star: false, from_port: 'Jubail', to_port: 'Antwerp', amount_mts: '2,200,000 mts', commodity: 'Caustic Soda', status: 'Industrial Supply' }
    ],
    orders: [
      { id: '639 501 801', parcels: 3, from_region: 'ECSA', from_port: 'Tubarao', to_port: 'Rotterdam', to_region: 'EUR / Cont', amount_mts: '4,500,000 mts', commodity: 'Iron Ore', freight_rate_usd: 19.80, landed_cost_usd_t: 112.40, savings_usd_t: 15.20, highlighted: false },
      { id: '639 501 802', parcels: 4, from_region: 'Australia', from_port: 'Port Hedland', to_port: 'Gwangyang', to_region: 'Asia', amount_mts: '5,200,000 mts', commodity: 'Iron Ore', freight_rate_usd: 11.40, landed_cost_usd_t: 104.80, savings_usd_t: 18.60, highlighted: true },
      { id: '639 501 803', parcels: 3, from_region: 'S. Africa', from_port: 'Richards Bay', to_port: 'Rotterdam', to_region: 'EUR / Cont', amount_mts: '3,800,000 mts', commodity: 'Thermal Coal', freight_rate_usd: 16.90, landed_cost_usd_t: 138.20, savings_usd_t: 14.00, highlighted: false },
      { id: '639 501 804', parcels: 2, from_region: 'US Gulf', from_port: 'New Orleans', to_port: 'Alexandria', to_region: 'Med / Egypt', amount_mts: '2,500,000 mts', commodity: 'Grain / Wheat', freight_rate_usd: 34.50, landed_cost_usd_t: 285.00, savings_usd_t: 24.50, highlighted: false },
      { id: '639 501 805', parcels: 2, from_region: 'ME Gulf', from_port: 'Jubail', to_port: 'Antwerp', to_region: 'EUR / Cont', amount_mts: '2,200,000 mts', commodity: 'Caustic Soda', freight_rate_usd: 68.40, landed_cost_usd_t: 422.00, savings_usd_t: 28.00, highlighted: false }
    ],
    schedules: [
      {
        vessel_name: 'MV BERGE BULKER',
        capacity_info: '260,000 CBM / 250,000 MTS',
        segments: [
          { port: 'TUBARAO', dates: 'Nov 5 - 12', width_pct: 22, start_pct: 0, cargo: 'VLOC IRON ORE' },
          { port: 'CAPE TRANSIT', dates: 'Nov 13 - 22', width_pct: 35, start_pct: 24, cargo: 'GOOD HOPE ROUTE' },
          { port: 'ROTTERDAM', dates: 'Nov 23 - Dec 2', width_pct: 30, start_pct: 61, cargo: 'DISCHARGE EMO' }
        ],
        verified: true
      },
      {
        vessel_name: 'MV GLOBAL ENDURANCE',
        capacity_info: '180,000 CBM / 175,000 MTS',
        segments: [
          { port: 'PORT HEDLAND', dates: 'Nov 8 - 15', width_pct: 25, start_pct: 6, cargo: 'BASELOAD ORE' },
          { port: 'PHILIPPINE SEA', dates: 'Nov 16 - 22', width_pct: 25, start_pct: 33, cargo: 'DIRECT PASSAGE' },
          { port: 'GWANGYANG', dates: 'Nov 23 - Nov 30', width_pct: 28, start_pct: 60, cargo: 'POSCO TERMINAL' }
        ],
        verified: true
      },
      {
        vessel_name: 'MV CAPE PROVIDENCE',
        capacity_info: '175,000 CBM / 165,000 MTS',
        segments: [
          { port: 'RICHARDS BAY', dates: 'Nov 10 - 18', width_pct: 26, start_pct: 8, cargo: 'COAL COA BATCH' },
          { port: 'SOUTH ATLANTIC', dates: 'Nov 19 - 28', width_pct: 30, start_pct: 36, cargo: 'HEADING NORTH' },
          { port: 'ROTTERDAM', dates: 'Nov 29 - Dec 6', width_pct: 26, start_pct: 68, cargo: 'DISCHARGE EECV' }
        ],
        verified: true
      }
    ],
    landedCostInputs: {
      fob: '260.0',
      oceanFreight: '52.0',
      bunkerSurcharge: '11.0',
      canalToll: '3.5',
      portHandling: '5.0',
      insuranceCost: '0.9'
    }
  },
  'Optimal Shuttle': {
    id: 'SCN-4',
    name: 'Optimal Shuttle',
    description: 'Dedicated High-Turnaround Dedicated Shuttle Loop',
    totalVolume: '14,600,000 MTS',
    cards: [
      { id: '1', star: true, from_port: 'Zeebrugge', to_port: 'Rotterdam', amount_mts: '3,600,000 mts', commodity: 'Sulfuric Acid', status: 'Shuttle Loop A' },
      { id: '2', star: true, from_port: 'Antwerp', to_port: 'Le Havre', amount_mts: '3,200,000 mts', commodity: 'Chemical Feedstock', status: 'Coastal Shuttle' },
      { id: '3', star: true, from_port: 'Bilbao', to_port: 'Dunkirk', amount_mts: '2,800,000 mts', commodity: 'Steel Billets', status: 'Dedicated Roundtrip' },
      { id: '4', star: false, from_port: 'Gothenburg', to_port: 'Hamburg', amount_mts: '2,600,000 mts', commodity: 'Biofuels', status: 'Green Corridor' },
      { id: '5', star: false, from_port: 'Wilhelmshaven', to_port: 'Teesport', amount_mts: '2,400,000 mts', commodity: 'Naphtha', status: 'North Sea Shuttle' }
    ],
    orders: [
      { id: '782 301 901', parcels: 2, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Rotterdam', to_region: 'EUR / Cont', amount_mts: '3,600,000 mts', commodity: 'Sulfuric Acid', freight_rate_usd: 28.50, landed_cost_usd_t: 342.10, savings_usd_t: 36.40, highlighted: true },
      { id: '782 301 902', parcels: 2, from_region: 'EUR / Cont', from_port: 'Antwerp', to_port: 'Le Havre', to_region: 'EUR / Cont', amount_mts: '3,200,000 mts', commodity: 'Chemical Feedstock', freight_rate_usd: 32.00, landed_cost_usd_t: 368.50, savings_usd_t: 28.20, highlighted: false },
      { id: '782 301 903', parcels: 1, from_region: 'Biscay', from_port: 'Bilbao', to_port: 'Dunkirk', to_region: 'EUR / Cont', amount_mts: '2,800,000 mts', commodity: 'Steel Billets', freight_rate_usd: 24.80, landed_cost_usd_t: 310.00, savings_usd_t: 32.00, highlighted: false },
      { id: '782 301 904', parcels: 1, from_region: 'Baltic', from_port: 'Gothenburg', to_port: 'Hamburg', to_region: 'EUR / Cont', amount_mts: '2,600,000 mts', commodity: 'Biofuels', freight_rate_usd: 26.40, landed_cost_usd_t: 325.80, savings_usd_t: 25.00, highlighted: false },
      { id: '782 301 905', parcels: 1, from_region: 'North Sea', from_port: 'Wilhelmshaven', to_port: 'Teesport', to_region: 'UK / Cont', amount_mts: '2,400,000 mts', commodity: 'Naphtha', freight_rate_usd: 22.90, landed_cost_usd_t: 298.40, savings_usd_t: 31.60, highlighted: false }
    ],
    schedules: [
      {
        vessel_name: 'MV BALTIC EXPRESS',
        capacity_info: '35,000 CBM / 32,000 MTS',
        segments: [
          { port: 'ZEEBRUGGE', dates: 'Nov 9 - 13', width_pct: 25, start_pct: 0, cargo: 'LOOP LOADING' },
          { port: 'NORTH SEA TRANSIT', dates: 'Nov 14 - 17', width_pct: 22, start_pct: 26, cargo: 'COASTAL FEEDER' },
          { port: 'ROTTERDAM', dates: 'Nov 18 - 22', width_pct: 25, start_pct: 50, cargo: 'RAPID DISCHARGE' },
          { port: 'ZEEBRUGGE', dates: 'Nov 23 - 27', width_pct: 20, start_pct: 77, cargo: 'RETURN SHUTTLE' }
        ],
        verified: true
      },
      {
        vessel_name: 'MV CELTIC RUNNER',
        capacity_info: '25,000 CBM / 22,000 MTS',
        segments: [
          { port: 'ANTWERP', dates: 'Nov 11 - 15', width_pct: 24, start_pct: 5, cargo: 'FEEDSTOCK BATCH' },
          { port: 'CHANNEL PASSAGE', dates: 'Nov 16 - 19', width_pct: 22, start_pct: 31, cargo: 'FEEDER TRANSIT' },
          { port: 'LE HAVRE', dates: 'Nov 20 - 24', width_pct: 26, start_pct: 55, cargo: 'PETRO DISCHARGE' }
        ],
        verified: true
      },
      {
        vessel_name: 'MV NORDIC PIONEER',
        capacity_info: '32,000 CBM / 30,000 MTS',
        segments: [
          { port: 'BILBAO', dates: 'Nov 12 - 16', width_pct: 25, start_pct: 8, cargo: 'STEEL BILLETS' },
          { port: 'BAY OF BISCAY', dates: 'Nov 17 - 21', width_pct: 25, start_pct: 35, cargo: 'NORTHBOUND' },
          { port: 'DUNKIRK', dates: 'Nov 22 - 26', width_pct: 26, start_pct: 62, cargo: 'MILL DISCHARGE' }
        ],
        verified: true
      }
    ],
    landedCostInputs: {
      fob: '290.0',
      oceanFreight: '28.5',
      bunkerSurcharge: '8.2',
      canalToll: '0.0',
      portHandling: '4.5',
      insuranceCost: '0.8'
    }
  }
};

export interface ProcurementPageProps {
  initialCommodity?: string;
}

export const ProcurementPage: React.FC<ProcurementPageProps> = ({ initialCommodity }) => {
  const { theme } = useTheme();

  // Scenarios state
  const [scenarioList, setScenarioList] = useState<string[]>([
    'Scenario A',
    'Spot Allocation',
    'Long Term COA',
    'Optimal Shuttle'
  ]);
  const [scenariosData, setScenariosData] = useState<Record<string, ScenarioData>>(INITIAL_SCENARIOS);
  const [activeTab, setActiveTab] = useState('Scenario A');

  // Selected Order
  const [selectedOrderId, setSelectedOrderId] = useState<string>('234 421 348');

  // Modals
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showAddScenarioModal, setShowAddScenarioModal] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [calculatingLandedCost, setCalculatingLandedCost] = useState(false);
  const [landedCostError, setLandedCostError] = useState<string | null>(null);
  const [isLiveLandedCost, setIsLiveLandedCost] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Controlled String State for Landed Cost Inputs (Issue 1)
  const [fobStr, setFobStr] = useState('310.0');
  const [oceanFreightStr, setOceanFreightStr] = useState('62.5');
  const [bunkerSurchargeStr, setBunkerSurchargeStr] = useState('14.8');
  const [canalTollStr, setCanalTollStr] = useState('4.2');
  const [portHandlingStr, setPortHandlingStr] = useState('5.8');
  const [insuranceCostStr, setInsuranceCostStr] = useState('1.2');

  // New Scenario Modal Form State
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioVolume, setNewScenarioVolume] = useState('10,500,000 MTS');
  const [newScenarioCommodity, setNewScenarioCommodity] = useState('Chemical Feedstock');
  const [newScenarioFromPort, setNewScenarioFromPort] = useState('Rotterdam');
  const [newScenarioToPort, setNewScenarioToPort] = useState('Singapore');
  const [newScenarioFreight, setNewScenarioFreight] = useState('48.50');
  const [newScenarioFob, setNewScenarioFob] = useState('295.00');
  const [newScenarioError, setNewScenarioError] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    loadProcurement();
  }, []);

  useEffect(() => {
    if (initialCommodity) {
      const match = scenarioList.find((s) => {
        const scn = scenariosData[s];
        return (
          scn &&
          (scn.cards.some((c) => c.commodity.toLowerCase().includes(initialCommodity.toLowerCase())) ||
            scn.orders.some((o) => o.commodity.toLowerCase().includes(initialCommodity.toLowerCase())))
        );
      });
      if (match) {
        handleSelectScenario(match);
      }
    }
  }, [initialCommodity]);

  const loadProcurement = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getProcurement();
      if (data && data.procurement_cards && data.orders_table) {
        setScenariosData((prev) => ({
          ...prev,
          'Scenario A': {
            ...prev['Scenario A'],
            cards: data.procurement_cards || prev['Scenario A'].cards,
            orders: data.orders_table || prev['Scenario A'].orders,
            schedules: data.timeline_schedules || prev['Scenario A'].schedules
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Safe Number Parsing Utilities (prevents NaN / Infinity / leading-zero bugs)
  const parseSafeCost = (val: string): number => {
    if (!val || val.trim() === '') return 0;
    const num = parseFloat(val);
    return isFinite(num) && !isNaN(num) && num >= 0 ? num : 0;
  };

  const handleStringChange = (
    rawVal: string,
    setter: (val: string) => void
  ) => {
    if (rawVal === '') {
      setter('');
      return;
    }
    // Allow digits and at most one decimal point
    const clean = rawVal.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    const sanitized = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    setter(sanitized);
  };

  const handleStringBlur = (
    rawVal: string,
    setter: (val: string) => void,
    defaultValue = '0'
  ) => {
    const trimmed = rawVal.trim();
    if (trimmed === '' || isNaN(Number(trimmed))) {
      setter(defaultValue);
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!isFinite(parsed) || isNaN(parsed) || parsed < 0) {
      setter(defaultValue);
    } else {
      setter(String(parsed));
    }
  };

  // Numerical values derived safely from controlled string inputs
  const fobNum = parseSafeCost(fobStr);
  const oceanFreightNum = parseSafeCost(oceanFreightStr);
  const bunkerSurchargeNum = parseSafeCost(bunkerSurchargeStr);
  const canalTollNum = parseSafeCost(canalTollStr);
  const portHandlingNum = parseSafeCost(portHandlingStr);
  const insuranceCostNum = parseSafeCost(insuranceCostStr);

  // Total Landed Cost Formula: FOB + Ocean Freight + BAF + Canal Toll + Terminal Handling + Marine Insurance
  const totalLandedCost = Number(
    (fobNum + oceanFreightNum + bunkerSurchargeNum + canalTollNum + portHandlingNum + insuranceCostNum).toFixed(2)
  );
  const benchmarkCost = 428.5;
  const landedSavings = Number((benchmarkCost - totalLandedCost).toFixed(2));

  // Component percentages totaling 100% (safe against division by zero)
  const calcPct = (comp: number, total: number): number => {
    if (!total || total <= 0 || !isFinite(total) || isNaN(total)) return 0;
    const pct = (comp / total) * 100;
    return isFinite(pct) && !isNaN(pct) ? Number(pct.toFixed(1)) : 0;
  };

  const landedBreakdown = {
    fob: calcPct(fobNum, totalLandedCost),
    ocean_freight: calcPct(oceanFreightNum, totalLandedCost),
    bunker_baf: calcPct(bunkerSurchargeNum, totalLandedCost),
    canal_toll: calcPct(canalTollNum, totalLandedCost),
    port_handling: calcPct(portHandlingNum, totalLandedCost),
    insurance: calcPct(insuranceCostNum, totalLandedCost)
  };

  // Current Active Scenario Data
  const currentScenario = scenariosData[activeTab] || INITIAL_SCENARIOS['Scenario A'];
  const cards = currentScenario.cards;
  const orders = currentScenario.orders;
  const schedules = currentScenario.schedules;
  const totalVolume = currentScenario.totalVolume;

  // Switching Scenarios (Issue 2)
  const handleSelectScenario = (tabName: string) => {
    // Save current scenario's edited inputs before switching
    setScenariosData((prev) => {
      const cur = prev[activeTab];
      if (!cur) return prev;
      return {
        ...prev,
        [activeTab]: {
          ...cur,
          landedCostInputs: {
            fob: fobStr,
            oceanFreight: oceanFreightStr,
            bunkerSurcharge: bunkerSurchargeStr,
            canalToll: canalTollStr,
            portHandling: portHandlingStr,
            insuranceCost: insuranceCostStr
          }
        }
      };
    });

    // Set new active scenario
    setActiveTab(tabName);

    // Restore the target scenario's specific data & inputs
    const target = scenariosData[tabName];
    if (target) {
      setFobStr(target.landedCostInputs.fob);
      setOceanFreightStr(target.landedCostInputs.oceanFreight);
      setBunkerSurchargeStr(target.landedCostInputs.bunkerSurcharge);
      setCanalTollStr(target.landedCostInputs.canalToll);
      setPortHandlingStr(target.landedCostInputs.portHandling);
      setInsuranceCostStr(target.landedCostInputs.insuranceCost);

      const highlightedOrder = target.orders.find((o) => o.highlighted);
      if (highlightedOrder) {
        setSelectedOrderId(highlightedOrder.id);
      } else if (target.orders.length > 0) {
        setSelectedOrderId(target.orders[0].id);
      }
    }
  };

  // Add Scenario Creation Flow (Issue 2)
  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newScenarioName.trim();
    if (!trimmedName) {
      setNewScenarioError('Scenario name is required.');
      return;
    }
    if (scenarioList.includes(trimmedName)) {
      setNewScenarioError('A scenario with this name already exists.');
      return;
    }

    const freightVal = parseSafeCost(newScenarioFreight) || 45.0;
    const fobVal = parseSafeCost(newScenarioFob) || 290.0;
    const bunkerVal = 12.0;
    const canalVal = 3.5;
    const portVal = 5.0;
    const insuranceVal = 1.0;
    const calculatedLanded = Number((fobVal + freightVal + bunkerVal + canalVal + portVal + insuranceVal).toFixed(2));
    const calculatedSavings = Number((benchmarkCost - calculatedLanded).toFixed(2));

    const newId = `SCN-${scenarioList.length + 1}`;
    const newScenario: ScenarioData = {
      id: newId,
      name: trimmedName,
      description: `Custom ${newScenarioCommodity} Scenario (${newScenarioFromPort} → ${newScenarioToPort})`,
      totalVolume: newScenarioVolume.trim() || '10,000,000 MTS',
      cards: [
        { id: '1', star: true, from_port: newScenarioFromPort, to_port: newScenarioToPort, amount_mts: '2,200,000 mts', commodity: newScenarioCommodity, status: 'Primary Contract' },
        { id: '2', star: true, from_port: newScenarioFromPort, to_port: 'Rotterdam', amount_mts: '2,000,000 mts', commodity: newScenarioCommodity, status: 'Flexible Option' },
        { id: '3', star: true, from_port: 'Houston', to_port: newScenarioToPort, amount_mts: '1,800,000 mts', commodity: newScenarioCommodity, status: 'Spot Arb' },
        { id: '4', star: false, from_port: 'Zeebrugge', to_port: 'Amsterdam', amount_mts: '1,500,000 mts', commodity: newScenarioCommodity, status: 'Alternative' },
        { id: '5', star: false, from_port: 'Singapore', to_port: 'Chiba', amount_mts: '1,500,000 mts', commodity: newScenarioCommodity, status: 'Reserve' }
      ],
      orders: [
        { id: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} 001`, parcels: 2, from_region: 'Custom', from_port: newScenarioFromPort, to_port: newScenarioToPort, to_region: 'Target', amount_mts: '2,200,000 mts', commodity: newScenarioCommodity, freight_rate_usd: freightVal, landed_cost_usd_t: calculatedLanded, savings_usd_t: calculatedSavings, highlighted: true },
        { id: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} 002`, parcels: 1, from_region: 'Custom', from_port: newScenarioFromPort, to_port: 'Rotterdam', to_region: 'EUR / Cont', amount_mts: '2,000,000 mts', commodity: newScenarioCommodity, freight_rate_usd: Number((freightVal * 0.95).toFixed(2)), landed_cost_usd_t: Number((calculatedLanded - 2.5).toFixed(2)), savings_usd_t: Number((calculatedSavings + 2.5).toFixed(2)), highlighted: false },
        { id: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} 003`, parcels: 2, from_region: 'US Gulf', from_port: 'Houston', to_port: newScenarioToPort, to_region: 'Target', amount_mts: '1,800,000 mts', commodity: newScenarioCommodity, freight_rate_usd: Number((freightVal * 1.1).toFixed(2)), landed_cost_usd_t: Number((calculatedLanded + 5.0).toFixed(2)), savings_usd_t: Number((calculatedSavings - 5.0).toFixed(2)), highlighted: false },
        { id: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} 004`, parcels: 1, from_region: 'EUR / Cont', from_port: 'Zeebrugge', to_port: 'Amsterdam', to_region: 'EUR / Cont', amount_mts: '1,500,000 mts', commodity: newScenarioCommodity, freight_rate_usd: Number((freightVal * 0.88).toFixed(2)), landed_cost_usd_t: Number((calculatedLanded - 6.0).toFixed(2)), savings_usd_t: Number((calculatedSavings + 6.0).toFixed(2)), highlighted: false },
        { id: `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} 005`, parcels: 1, from_region: 'SE Asia', from_port: 'Singapore', to_port: 'Chiba', to_region: 'East Asia', amount_mts: '1,500,000 mts', commodity: newScenarioCommodity, freight_rate_usd: Number((freightVal * 1.05).toFixed(2)), landed_cost_usd_t: Number((calculatedLanded + 2.0).toFixed(2)), savings_usd_t: Number((calculatedSavings - 2.0).toFixed(2)), highlighted: false }
      ],
      schedules: [
        {
          vessel_name: `MV ${trimmedName.toUpperCase().replace(/[^A-Z0-9 ]/g, '')} CARRIER`,
          capacity_info: '55,000 CBM / 50,000 MTS',
          segments: [
            { port: newScenarioFromPort.toUpperCase(), dates: 'Nov 10 - 16', width_pct: 26, start_pct: 0, cargo: `${newScenarioCommodity.toUpperCase()} LOAD` },
            { port: 'OPEN SEA TRANSIT', dates: 'Nov 17 - 24', width_pct: 32, start_pct: 28, cargo: 'NAVIGATION' },
            { port: newScenarioToPort.toUpperCase(), dates: 'Nov 25 - Dec 2', width_pct: 28, start_pct: 62, cargo: 'DISCHARGE TERMINAL' }
          ],
          verified: true
        },
        {
          vessel_name: 'MV HORIZON ENDEAVOUR',
          capacity_info: '45,000 CBM / 40,000 MTS',
          segments: [
            { port: newScenarioFromPort.toUpperCase(), dates: 'Nov 12 - 18', width_pct: 25, start_pct: 8, cargo: 'BATCH A' },
            { port: 'BUNKER STATION', dates: 'Nov 19 - 22', width_pct: 18, start_pct: 35, cargo: 'BUNKERS' },
            { port: 'ROTTERDAM', dates: 'Nov 23 - 29', width_pct: 25, start_pct: 55, cargo: 'DISCHARGE' }
          ],
          verified: false
        }
      ],
      landedCostInputs: {
        fob: String(fobVal),
        oceanFreight: String(freightVal),
        bunkerSurcharge: String(bunkerVal),
        canalToll: String(canalVal),
        portHandling: String(portVal),
        insuranceCost: String(insuranceVal)
      }
    };

    setScenarioList((prev) => [...prev, trimmedName]);
    setScenariosData((prev) => ({
      ...prev,
      [trimmedName]: newScenario
    }));
    setActiveTab(trimmedName);
    setFobStr(String(fobVal));
    setOceanFreightStr(String(freightVal));
    setBunkerSurchargeStr(String(bunkerVal));
    setCanalTollStr(String(canalVal));
    setPortHandlingStr(String(portVal));
    setInsuranceCostStr(String(insuranceVal));
    setSelectedOrderId(newScenario.orders[0].id);

    setNewScenarioName('');
    setNewScenarioError(null);
    setShowAddScenarioModal(false);
    setToastMessage(`Created and activated scenario "${trimmedName}"!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Landed Cost Calculation via Backend API
  const handleCalculateLandedCost = async () => {
    if (fobNum < 0 || oceanFreightNum < 0) {
      setLandedCostError('Costs cannot be negative.');
      return;
    }
    setCalculatingLandedCost(true);
    setLandedCostError(null);
    try {
      const res = await ApiService.calculateLandedCost({
        commodity: cards[0]?.commodity || 'Sulfuric Acid',
        quantity_mts: 25000,
        fob_price_usd_t: fobNum,
        ocean_freight_usd_t: oceanFreightNum,
        bunker_surcharge_usd_t: bunkerSurchargeNum,
        canal_toll_usd_t: canalTollNum,
        port_handling_usd_t: portHandlingNum,
        insurance_usd_t: insuranceCostNum,
        target_price_per_ton: benchmarkCost
      });
      setIsLiveLandedCost(Boolean(res.is_live));
    } catch (err: any) {
      setLandedCostError(err?.message || 'Error calculating landed cost');
    } finally {
      setCalculatingLandedCost(false);
    }
  };

  // Apply to Procurement Plan (Landed Cost Calculator requirement)
  const handleApplyToPlan = () => {
    setScenariosData((prev) => {
      const cur = prev[activeTab];
      if (!cur) return prev;

      const updatedOrders = cur.orders.map((order) => {
        if (
          order.id === selectedOrderId ||
          (!cur.orders.some((o) => o.id === selectedOrderId) && order.highlighted)
        ) {
          return {
            ...order,
            freight_rate_usd: oceanFreightNum,
            landed_cost_usd_t: totalLandedCost,
            savings_usd_t: landedSavings
          };
        }
        return order;
      });

      return {
        ...prev,
        [activeTab]: {
          ...cur,
          orders: updatedOrders,
          landedCostInputs: {
            fob: fobStr,
            oceanFreight: oceanFreightStr,
            bunkerSurcharge: bunkerSurchargeStr,
            canalToll: canalTollStr,
            portHandling: portHandlingStr,
            insuranceCost: insuranceCostStr
          }
        }
      };
    });

    setToastMessage(`Applied landed cost ($${totalLandedCost}/t) to Order #${selectedOrderId} in ${activeTab}`);
    setShowCalculatorModal(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    const headers = ['Order_ID,Parcels,From_Region,From_Port,To_Port,To_Region,Amount_MTS,Commodity,Freight_Rate_USD,Landed_Cost_USD_per_Ton,Savings_USD_per_Ton,Highlighted'];
    const rows = orders.map((o) =>
      `"${o.id}",${o.parcels},"${o.from_region}","${o.from_port}","${o.to_port}","${o.to_region}","${o.amount_mts}","${o.commodity}",${o.freight_rate_usd},${o.landed_cost_usd_t},${o.savings_usd_t},${o.highlighted ? 'YES' : 'NO'}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `FreightAI_Procurement_${activeTab.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[100000] px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-xl animate-in fade-in slide-in-from-top-3 flex items-center space-x-2 border border-cyan-300">
          <Check size={15} strokeWidth={3} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Scenarios Tabs matching Reference 04 */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 ${
          theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span
            className={`text-[11px] font-mono uppercase mr-2 shrink-0 ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            SCENARIOS:
          </span>
          {scenarioList.map((tab) => (
            <button
              key={tab}
              onClick={() => handleSelectScenario(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeTab === tab
                  ? 'bg-yellow-400 text-slate-950 shadow-md font-bold'
                  : theme === 'dark'
                  ? 'bg-[#161e2e] text-slate-400 hover:text-white border border-white/[0.06]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={() => {
              setNewScenarioError(null);
              setShowAddScenarioModal(true);
            }}
            title="Add Scenario"
            className={`p-1.5 rounded-lg border transition shrink-0 ${
              theme === 'dark'
                ? 'bg-[#161e2e] text-slate-400 hover:text-white hover:border-cyan-500/50 border-white/[0.06]'
                : 'bg-white text-slate-500 hover:text-slate-900 hover:border-cyan-500/50 border-slate-200 shadow-sm'
            }`}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Demo Indicator & Landed Cost Action */}
        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-[11px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
            *Demo Logistics Dataset
          </span>
          <button
            onClick={() => setShowCalculatorModal(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              theme === 'dark'
                ? 'bg-[#161e2e] hover:bg-[#1a253a] border-cyan-500/30 text-cyan-300'
                : 'bg-white hover:bg-slate-50 border-cyan-300 text-cyan-700 shadow-sm'
            }`}
          >
            <DollarSign size={14} />
            <span>Landed Cost Calculator</span>
          </button>
        </div>
      </div>

      {/* Horizontal Procurement Cards Row (Reference 04: 1*, 2*, 3*, 4*, 5*) */}
      <div>
        <div
          className={`text-[11px] font-mono uppercase mb-2 flex items-center justify-between ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          <span>ORDERS & BULK PARCELS:</span>
          <span>Total Volume: {totalVolume}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between group cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#121824] border-white/[0.08] hover:border-cyan-500/30 shadow-subtle-card'
                  : 'bg-white border-slate-200 hover:border-cyan-500/40 shadow-light-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold flex items-center space-x-1 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span>{card.id}</span>
                  <Star size={11} className={card.star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'} />
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    theme === 'dark' ? 'bg-[#161e2e] text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {card.status}
                </span>
              </div>

              <div className="my-2.5 space-y-1">
                <div
                  className={`text-[10px] uppercase tracking-wider ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  FROM → TO
                </div>
                <div
                  className={`text-xs font-bold ${
                    theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {card.from_port} <span className="text-cyan-500">→</span> {card.to_port}
                </div>
              </div>

              <div
                className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                  theme === 'dark' ? 'border-white/[0.04]' : 'border-slate-100'
                }`}
              >
                <div>
                  <div
                    className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    AMOUNT
                  </div>
                  <div
                    className={`font-mono font-semibold ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {card.amount_mts}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    COMMODITY
                  </div>
                  <div className="text-cyan-600 dark:text-cyan-400 font-semibold truncate max-w-[85px]">
                    {card.commodity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders / Supplier Allocation Table (Reference 04: with distinct Gold Highlighted Row) */}
      <div
        className={`rounded-2xl border p-5 transition ${
          theme === 'dark'
            ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
            : 'bg-white border-slate-200 shadow-light-card'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Procurement & Routing Options
            </span>
            <span
              className={`text-[10px] font-mono ${
                theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {currentScenario.description}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              title="Download Scenario Orders as CSV"
              className={`flex items-center space-x-1 p-1.5 px-2.5 rounded-lg border text-[11px] font-semibold transition ${
                theme === 'dark'
                  ? 'bg-[#161e2e] text-slate-400 hover:text-white border-white/[0.08]'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`font-mono text-[11px] border-b ${
                  theme === 'dark'
                    ? 'text-slate-500 border-white/[0.06]'
                    : 'text-slate-400 border-slate-200'
                }`}
              >
                <th className="pb-2.5">ID</th>
                <th className="pb-2.5">PARCELS</th>
                <th className="pb-2.5">FROM REGION</th>
                <th className="pb-2.5">FROM</th>
                <th className="pb-2.5">TO</th>
                <th className="pb-2.5">TO REGION</th>
                <th className="pb-2.5">AMOUNT</th>
                <th className="pb-2.5">COMMODITY</th>
                <th className="pb-2.5">FREIGHT</th>
                <th className="pb-2.5">LANDED COST</th>
                <th className="pb-2.5 text-right">SAVINGS</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                theme === 'dark' ? 'divide-white/[0.04]' : 'divide-slate-100'
              }`}
            >
              {orders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const isHighlighted = order.highlighted;

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`transition-colors cursor-pointer ${
                      isHighlighted
                        ? 'bg-[#fcd34d] text-slate-950 font-bold hover:bg-[#fbbf24]'
                        : isSelected
                        ? theme === 'dark'
                          ? 'bg-cyan-950/30 text-white border-l-2 border-cyan-400'
                          : 'bg-cyan-50 text-slate-900 border-l-2 border-cyan-600'
                        : theme === 'dark'
                        ? 'hover:bg-white/[0.02] text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className={`py-3 font-mono ${isHighlighted ? 'text-slate-950 font-black' : 'text-slate-400'}`}>
                      {order.id}
                    </td>
                    <td className="py-3 font-mono">{order.parcels}</td>
                    <td className="py-3 font-mono">{order.from_region}</td>
                    <td className="py-3 font-semibold">{order.from_port}</td>
                    <td className="py-3 font-semibold">
                      <span className={isHighlighted ? 'text-slate-950' : 'text-cyan-500'}>›</span> {order.to_port}
                    </td>
                    <td className="py-3 font-mono">{order.to_region}</td>
                    <td className="py-3 font-mono">{order.amount_mts}</td>
                    <td className="py-3">{order.commodity}</td>
                    <td className="py-3 font-mono">
                      {order.freight_rate_usd} USD
                    </td>
                    <td className="py-3 font-mono">
                      ${order.landed_cost_usd_t}/t
                    </td>
                    <td className={`py-3 text-right font-mono font-bold ${isHighlighted ? 'text-emerald-950' : 'text-emerald-500'}`}>
                      +${order.savings_usd_t}/t
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedules / Gantt Timeline View (Reference 04 Bottom Section) */}
      <div
        className={`rounded-2xl border p-5 space-y-4 transition ${
          theme === 'dark'
            ? 'bg-[#121824] border-white/[0.08] shadow-subtle-card'
            : 'bg-white border-slate-200 shadow-light-card'
        }`}
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 ${
            theme === 'dark' ? 'border-white/[0.06]' : 'border-slate-100'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2">
              <Calendar size={15} className="text-cyan-500" />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Schedules & Voyage Timeline
              </span>
            </div>
            <p
              className={`text-[11px] mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Multi-parcel vessel allocation & canal transit sequence ({activeTab})
            </p>
          </div>

          <div
            className={`text-xs font-mono ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            November — December 2026 Grid
          </div>
        </div>

        {/* Timeline Header (Days 9 - 30, 1 - 7) */}
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Days row */}
            <div
              className={`flex items-center pl-48 pb-2 border-b text-[10px] font-mono ${
                theme === 'dark'
                  ? 'border-white/[0.04] text-slate-500'
                  : 'border-slate-100 text-slate-400'
              }`}
            >
              {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7].map(
                (day, i) => (
                  <div
                    key={i}
                    className={`flex-1 text-center border-l ${
                      theme === 'dark' ? 'border-white/[0.03]' : 'border-slate-100'
                    }`}
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            {/* Vessel Schedule Rows */}
            <div
              className={`divide-y ${
                theme === 'dark' ? 'divide-white/[0.04]' : 'divide-slate-100'
              }`}
            >
              {schedules.map((sched, idx) => (
                <div key={idx} className="flex items-center py-3 group">
                  {/* Left Vessel Column */}
                  <div className="w-48 pr-4 shrink-0 flex flex-col">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-200 group-hover:text-cyan-300'
                          : 'text-slate-800 group-hover:text-cyan-600'
                      }`}
                    >
                      {sched.vessel_name}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {sched.capacity_info}
                    </span>
                  </div>

                  {/* Gantt Timeline Bar Area */}
                  <div
                    className={`flex-1 relative h-9 rounded-lg overflow-hidden border ${
                      theme === 'dark'
                        ? 'bg-[#161e2e]/60 border-white/[0.04]'
                        : 'bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    {sched.segments.map((seg, sIdx) => (
                      <div
                        key={sIdx}
                        className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[10px] font-mono font-medium border truncate transition-all ${
                          seg.port.includes('PANAMA') || seg.port.includes('STRAIT') || seg.port.includes('CANAL')
                            ? theme === 'dark'
                              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                              : 'bg-purple-100 border-purple-300 text-purple-900'
                            : sIdx % 2 === 0
                            ? theme === 'dark'
                              ? 'bg-slate-800 border-slate-600 text-slate-200'
                              : 'bg-slate-200 border-slate-300 text-slate-800'
                            : theme === 'dark'
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
                            : 'bg-cyan-100 border-cyan-300 text-cyan-900'
                        }`}
                        style={{
                          left: `${seg.start_pct}%`,
                          width: `${seg.width_pct}%`
                        }}
                        title={`${seg.port}: ${seg.dates} (${seg.cargo})`}
                      >
                        <span className="truncate font-semibold">{seg.port}</span>
                        <span className="text-[9px] opacity-75 hidden xl:inline truncate ml-1">
                          {seg.cargo}
                        </span>
                      </div>
                    ))}

                    {/* Verified Checkmark Badge matching Reference 04 */}
                    {sched.verified && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#fcd34d] flex items-center justify-center text-slate-950 shadow-md">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Landed Cost Calculator Modal (React Portal / Z-[99999]) */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 my-auto ${
              theme === 'dark'
                ? 'bg-[#121824] border-cyan-500/30'
                : 'bg-white border-slate-300'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 mb-4 ${
                theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign size={18} className="text-cyan-500" />
                <h3
                  className={`text-base font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Total Landed-Cost Breakdown Calculator
                </h3>
              </div>
              <button
                onClick={() => setShowCalculatorModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* 6 Inputs with Controlled String State (Issue 1) */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-xs text-slate-400">Commodity FOB Origin ($/t)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fobStr}
                  onChange={(e) => handleStringChange(e.target.value, setFobStr)}
                  onBlur={(e) => handleStringBlur(e.target.value, setFobStr, '0')}
                  placeholder="0.0"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Ocean Freight Rate ($/t)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={oceanFreightStr}
                  onChange={(e) => handleStringChange(e.target.value, setOceanFreightStr)}
                  onBlur={(e) => handleStringBlur(e.target.value, setOceanFreightStr, '0')}
                  placeholder="0.0"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Bunker Fuel Surcharge (BAF $/t)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bunkerSurchargeStr}
                  onChange={(e) => handleStringChange(e.target.value, setBunkerSurchargeStr)}
                  onBlur={(e) => handleStringBlur(e.target.value, setBunkerSurchargeStr, '0')}
                  placeholder="0.0"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Canal Transit Toll ($/t)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={canalTollStr}
                  onChange={(e) => handleStringChange(e.target.value, setCanalTollStr)}
                  onBlur={(e) => handleStringBlur(e.target.value, setCanalTollStr, '0')}
                  placeholder="0.0"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Terminal Handling & Port Tariffs ($/t)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={portHandlingStr}
                  onChange={(e) => handleStringChange(e.target.value, setPortHandlingStr)}
                  onBlur={(e) => handleStringBlur(e.target.value, setPortHandlingStr, '0')}
                  placeholder="0.0"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Marine Insurance & Hedging ($/t)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={insuranceCostStr}
                  onChange={(e) => handleStringChange(e.target.value, setInsuranceCostStr)}
                  onBlur={(e) => handleStringBlur(e.target.value, setInsuranceCostStr, '0')}
                  placeholder="0.0"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Live Status and Backend Action */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                isLiveLandedCost
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isLiveLandedCost ? 'Live Backend Landed Cost Engine Active' : 'Offline Mode (Local Maritime Calculator)'}
              </span>
              <button
                onClick={handleCalculateLandedCost}
                disabled={calculatingLandedCost}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold shadow-glow-cyan transition hover:opacity-90 disabled:opacity-50"
              >
                {calculatingLandedCost ? 'Calculating...' : 'Recalculate via Backend API'}
              </button>
            </div>

            {landedCostError && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {landedCostError}
              </div>
            )}

            {/* All Six Component Breakdown Progress Bars (Sum = 100% subject to rounding) */}
            <div className="mb-4 space-y-1.5 p-3 rounded-xl border bg-slate-500/5 border-white/[0.06]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span>Component Share of Landed Cost (6 Cost Factors):</span>
                <span className="font-mono text-cyan-400 text-[10px]">
                  Total: {totalLandedCost > 0 ? (
                    (landedBreakdown.fob + landedBreakdown.ocean_freight + landedBreakdown.bunker_baf + landedBreakdown.canal_toll + landedBreakdown.port_handling + landedBreakdown.insurance).toFixed(1)
                  ) : '0.0'}%
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="w-28 text-slate-400 truncate">FOB Commodity</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(100, landedBreakdown.fob)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-cyan-400">{landedBreakdown.fob}%</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="w-28 text-slate-400 truncate">Ocean Freight</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, landedBreakdown.ocean_freight)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-blue-400">{landedBreakdown.ocean_freight}%</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="w-28 text-slate-400 truncate">Bunker Surcharge</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(100, landedBreakdown.bunker_baf)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-amber-400">{landedBreakdown.bunker_baf}%</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="w-28 text-slate-400 truncate">Canal Transit</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(100, landedBreakdown.canal_toll)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-purple-400">{landedBreakdown.canal_toll}%</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="w-28 text-slate-400 truncate">Terminal / Port</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, landedBreakdown.port_handling)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-emerald-400">{landedBreakdown.port_handling}%</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="w-28 text-slate-400 truncate">Marine Insurance</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-700/30 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${Math.min(100, landedBreakdown.insurance)}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-rose-400">{landedBreakdown.insurance}%</span>
                </div>
              </div>
            </div>

            {/* Total Landed Cost Summary */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                theme === 'dark'
                  ? 'bg-[#161e2e] border-cyan-500/30'
                  : 'bg-cyan-50 border-cyan-200'
              }`}
            >
              <div>
                <span className="text-xs text-slate-400">Total Calculated Landed Cost</span>
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-300 font-mono mt-0.5">
                  ${totalLandedCost} / ton
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Savings vs Market Benchmark ($428.50)</span>
                <div className="text-lg font-bold text-emerald-500 font-mono mt-0.5">
                  +${landedSavings} / ton ({benchmarkCost > 0 ? ((landedSavings / benchmarkCost) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Target Plan: <span className="font-mono font-bold text-cyan-400">Order #{selectedOrderId}</span> ({activeTab})
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCalculatorModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-600/30 text-xs font-semibold hover:bg-slate-500/10 transition text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyToPlan}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-glow-cyan hover:bg-cyan-400 transition"
                >
                  Apply to Procurement Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Scenario Creation Modal (Issue 2) */}
      {showAddScenarioModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-lg border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 my-auto ${
              theme === 'dark'
                ? 'bg-[#121824] border-cyan-500/30'
                : 'bg-white border-slate-300'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b pb-3 mb-4 ${
                theme === 'dark' ? 'border-white/[0.08]' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Plus size={18} className="text-cyan-500" />
                <h3
                  className={`text-base font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Create New Procurement Scenario
                </h3>
              </div>
              <button
                onClick={() => setShowAddScenarioModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateScenario} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-400">Scenario Name *</label>
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., Scenario E - Transpacific Express"
                  className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                    theme === 'dark'
                      ? 'bg-[#161e2e] border-white/[0.08] text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Total Volume (MTS)</label>
                  <input
                    type="text"
                    value={newScenarioVolume}
                    onChange={(e) => setNewScenarioVolume(e.target.value)}
                    placeholder="10,500,000 MTS"
                    className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Primary Commodity</label>
                  <select
                    value={newScenarioCommodity}
                    onChange={(e) => setNewScenarioCommodity(e.target.value)}
                    className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Chemical Feedstock">Chemical Feedstock</option>
                    <option value="Sulfuric Acid">Sulfuric Acid</option>
                    <option value="Ethylene">Ethylene</option>
                    <option value="Iron Ore">Iron Ore</option>
                    <option value="Clean Petroleum">Clean Petroleum</option>
                    <option value="Thermal Coal">Thermal Coal</option>
                    <option value="Grain / Wheat">Grain / Wheat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Origin Port</label>
                  <input
                    type="text"
                    value={newScenarioFromPort}
                    onChange={(e) => setNewScenarioFromPort(e.target.value)}
                    placeholder="e.g. Rotterdam"
                    className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Destination Port</label>
                  <input
                    type="text"
                    value={newScenarioToPort}
                    onChange={(e) => setNewScenarioToPort(e.target.value)}
                    placeholder="e.g. Singapore"
                    className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Est. Ocean Freight ($/t)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newScenarioFreight}
                    onChange={(e) => handleStringChange(e.target.value, setNewScenarioFreight)}
                    onBlur={(e) => handleStringBlur(e.target.value, setNewScenarioFreight, '45.00')}
                    placeholder="48.50"
                    className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Target FOB Price ($/t)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newScenarioFob}
                    onChange={(e) => handleStringChange(e.target.value, setNewScenarioFob)}
                    onBlur={(e) => handleStringBlur(e.target.value, setNewScenarioFob, '290.00')}
                    placeholder="295.00"
                    className={`w-full border text-xs rounded-lg px-3 py-2 mt-1 focus:outline-none focus:border-cyan-500 ${
                      theme === 'dark'
                        ? 'bg-[#161e2e] border-white/[0.08] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {newScenarioError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {newScenarioError}
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddScenarioModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-600/30 text-xs font-semibold hover:bg-slate-500/10 transition text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-glow-cyan hover:bg-cyan-400 transition flex items-center space-x-1.5"
                >
                  <Sparkles size={14} />
                  <span>Create & Activate Scenario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
