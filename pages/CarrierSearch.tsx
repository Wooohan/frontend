import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, X, MapPin, Phone, Mail, Hash, Truck, Calendar, ShieldCheck, Download, ShieldAlert, Activity, Info, Globe, Map as MapIcon, Boxes, Shield, ExternalLink, CheckCircle2, AlertTriangle, Zap, Loader2, ChevronDown, ChevronUp, Copy, Check, Database } from 'lucide-react';
import { CarrierData, InsuranceHistoryFiling } from '../types';
import { downloadCSV } from '../services/mockService';
import { fetchCarriersFromSupabase, getCarrierCountFromSupabase, CarrierFiltersSupabase } from '../services/supabaseClient';
interface CarrierSearchProps {
  onNavigateToInsurance: () => void;
}
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];
const OPERATION_CLASSIFICATIONS = [
  'Auth. For Hire','Exempt For Hire','Private(Property)',
  'Private(Passenger)','Migrant','U.S. Mail','Federal Government',
  'State Government','Local Government','Indian Tribe'
];
const CARRIER_OPERATIONS = [
  'Interstate','Intrastate Only (HM)','Intrastate Only (Non-HM)'
];
const CARGO_TYPES = [
  'General Freight','Household Goods','Metal: Sheets, Coils, Rolls',
  'Motor Vehicles','Drive/Tow Away','Logs, Poles, Beams, Lumber',
  'Building Materials','Mobile Homes','Machinery, Large Objects',
  'Fresh Produce','Liquids/Gases','Intermodal Cont.',
  'Passengers','Oilfield Equipment','Livestock',
  'Grain, Feed, Hay','Coal/Coke','Meat',
  'Garbage/Refuse','US Mail','Chemicals',
  'Commodities Dry Bulk','Refrigerated Food','Beverages',
  'Paper Products','Utilities','Agricultural/Farm Supplies',
  'Construction','Water Well','Other'
];
const INSURANCE_REQUIRED_TYPES = ['BI&PD','CARGO','BOND','TRUST FUND'];

const INSURANCE_COMPANIES = [
  'GREAT WEST CASUALTY',
  'UNITED FINANCIAL CASUALTY',
  'GEICO MARINE',
  'NORTHLAND INSURANCE',
  'ARTISAN & TRUCKERS',
  'CANAL INSURANCE',
  'PROGRESSIVE',
  'BERKSHIRE HATHAWAY',
  'OLD REPUBLIC',
  'SENTRY',
  'TRAVELERS',
];

const RENEWAL_MONTH_OPTIONS = [
  { value: '', label: 'All' },
  { value: '1', label: '1st Month' },
  { value: '2', label: '2nd Month' },
  { value: '3', label: '3rd Month' },
  { value: '4', label: '4th Month' },
  { value: '5', label: '5th Month' },
];
const calculateYearsInBusiness = (mcs150Date: string | undefined): number | null => {
  if (!mcs150Date || mcs150Date === 'N/A') return null;
  try {
    const date = new Date(mcs150Date);
    if (isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch (e) {
    return null;
  }
};
const MultiSelect: React.FC<{
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}> = ({ options, selected, onChange, placeholder = 'All' }) => {
  const [open, setOpen] = useState(false);
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-field w-full px-3 py-2 text-sm flex items-center justify-between"
      >
        <span className={selected.length === 0 ? 'text-slate-500' : 'text-white truncate'}>
          {selected.length === 0 ? placeholder : selected.join(', ')}
        </span>
        {open ? <ChevronUp size={14} className="shrink-0 ml-1" /> : <ChevronDown size={14} className="shrink-0 ml-1" />}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          {options.map(opt => (
            <label key={opt} style={{display:"flex", alignItems:"center", gap:8, padding:"6px 12px", cursor:"pointer", fontSize:13, color:"#94A3B8", transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="rgba(124,92,252,0.08)")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-indigo-500"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
const FilterGroup: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{background:'rgba(19,21,30,0.9)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16}}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-widest">
          {icon} {title}
        </span>
        {open ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};
const FilterLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block section-label mb-1 ml-1">{children}</label>
);
const FilterSelect: React.FC<{ name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[] }> = ({ name, value, onChange, options }) => (
  <select name={name} value={value} onChange={onChange} className="input-field w-full px-3 py-2 text-sm">
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const MinMaxInputs: React.FC<{
  nameMin: string; nameMax: string;
  valueMin: string; valueMax: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ nameMin, nameMax, valueMin, valueMax, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    <input type="number" name={nameMin} value={valueMin} onChange={onChange} placeholder="Min" min={0}
      className="input-field w-full px-3 py-2 text-sm" />
    <input type="number" name={nameMax} value={valueMax} onChange={onChange} placeholder="Max" min={0}
      className="input-field w-full px-3 py-2 text-sm" />
  </div>
);
export const CarrierSearch: React.FC<CarrierSearchProps> = ({ onNavigateToInsurance }) => {
  
  const [carriers, setCarriers] = useState<CarrierData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const PAGE_SIZE = 200;
  const [currentPage, setCurrentPage] = useState(0);
  const [mcSearchTerm, setMcSearchTerm] = useState('');
  const [nameSearchTerm, setNameSearchTerm] = useState('');
  const [selectedDot, setSelectedDot] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inspections' | 'crashes'>('inspections');
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [activeInsurance, setActiveInsurance] = useState<InsuranceHistoryFiling[]>([]);
  const [filters, setFilters] = useState({
    entityType: '',
    active: '',
    state: [] as string[],
    dot: '',
    yearsInBusinessMin: '',
    yearsInBusinessMax: '',
    hasEmail: '',
    hasBoc3: '',
    hasCompanyRep: '',
    classification: [] as string[],
    carrierOperation: [] as string[],
    hazmat: '',
    powerUnitsMin: '',
    powerUnitsMax: '',
    driversMin: '',
    driversMax: '',
    cargo: [] as string[],
    insuranceRequired: [] as string[],
    insuranceCompany: [] as string[],
    insEffectiveDateFrom: '',
    insEffectiveDateTo: '',
    renewalPolicyMonths: '',
    renewalDateFrom: '',
    renewalDateTo: '',
    bipdMin: '',
    bipdMax: '',
    bipdOnFile: '',
    cargoOnFile: '',
    bondOnFile: '',
    trustFundOnFile: '',
    insCancellationDateFrom: '',
    insCancellationDateTo: '',
    oosMin: '', oosMax: '',
    crashesMin: '', crashesMax: '',
    injuriesMin: '', injuriesMax: '',
    fatalitiesMin: '', fatalitiesMax: '',
    towawayMin: '', towawayMax: '',
    inspectionsMin: '', inspectionsMax: '',
  });
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  useEffect(() => {
    getCarrierCountFromSupabase().then(setTotalCount);
    loadCarriers({});
  }, []);
  useEffect(() => {
    if (selectedDot) {
      const carrier = carriers.find(c => c.dotNumber === selectedDot);
      setActiveInsurance(carrier?.insuranceHistoryFilings || []);
    } else {
      setActiveInsurance([]);
    }
  }, [selectedDot, carriers]);
  const loadCarriers = async (f: CarrierFiltersSupabase, page = 0) => {
    setIsLoading(true);
    try {
      const result = await fetchCarriersFromSupabase({ ...f, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setCarriers(result.data);
      setCurrentPage(page);
      setFilteredCount(result.filtered_count);
    } finally {
      setIsLoading(false);
    }
  };
  const buildFilters = useCallback((): CarrierFiltersSupabase => {
    const f: CarrierFiltersSupabase = {};
    if (mcSearchTerm.trim()) f.mcNumber = mcSearchTerm.trim();
    if (nameSearchTerm.trim()) f.legalName = nameSearchTerm.trim();
    if (filters.dot.trim()) f.dotNumber = filters.dot.trim();
    if (filters.entityType) f.entityType = filters.entityType;
    if (filters.active) f.active = filters.active;
    if (filters.state.length > 0) f.state = filters.state.join('|'); 
    if (filters.hasEmail) f.hasEmail = filters.hasEmail;
    if (filters.hasBoc3) f.hasBoc3 = filters.hasBoc3;
    if (filters.hasCompanyRep) f.hasCompanyRep = filters.hasCompanyRep;
    
    if (filters.yearsInBusinessMin !== '') f.yearsInBusinessMin = parseInt(filters.yearsInBusinessMin);
    if (filters.yearsInBusinessMax !== '') f.yearsInBusinessMax = parseInt(filters.yearsInBusinessMax);
    if (filters.powerUnitsMin !== '') f.powerUnitsMin = parseInt(filters.powerUnitsMin);
    if (filters.powerUnitsMax !== '') f.powerUnitsMax = parseInt(filters.powerUnitsMax);
    if (filters.driversMin !== '') f.driversMin = parseInt(filters.driversMin);
    if (filters.driversMax !== '') f.driversMax = parseInt(filters.driversMax);
    if (filters.insEffectiveDateFrom) f.insEffectiveDateFrom = filters.insEffectiveDateFrom;
    if (filters.insEffectiveDateTo) f.insEffectiveDateTo = filters.insEffectiveDateTo;
    if (filters.bipdMin !== '') f.bipdMin = parseInt(filters.bipdMin);
    if (filters.bipdMax !== '') f.bipdMax = parseInt(filters.bipdMax);
    
    if (filters.oosMin !== '') f.oosMin = parseInt(filters.oosMin);
    if (filters.oosMax !== '') f.oosMax = parseInt(filters.oosMax);
    if (filters.crashesMin !== '') f.crashesMin = parseInt(filters.crashesMin);
    if (filters.crashesMax !== '') f.crashesMax = parseInt(filters.crashesMax);
    if (filters.injuriesMin !== '') f.injuriesMin = parseInt(filters.injuriesMin);
    if (filters.injuriesMax !== '') f.injuriesMax = parseInt(filters.injuriesMax);
    if (filters.fatalitiesMin !== '') f.fatalitiesMin = parseInt(filters.fatalitiesMin);
    if (filters.fatalitiesMax !== '') f.fatalitiesMax = parseInt(filters.fatalitiesMax);
    if (filters.towawayMin !== '') f.towawayMin = parseInt(filters.towawayMin);
    if (filters.towawayMax !== '') f.towawayMax = parseInt(filters.towawayMax);
    if (filters.inspectionsMin !== '') f.inspectionsMin = parseInt(filters.inspectionsMin);
    if (filters.inspectionsMax !== '') f.inspectionsMax = parseInt(filters.inspectionsMax);
    if (filters.classification.length > 0) f.classification = filters.classification;
    if (filters.carrierOperation.length > 0) f.carrierOperation = filters.carrierOperation;
    if (filters.hazmat) f.hazmat = filters.hazmat;
    if (filters.cargo.length > 0) f.cargo = filters.cargo;
    if (filters.insuranceCompany.length > 0) f.insuranceCompany = filters.insuranceCompany;
    if (filters.renewalPolicyMonths) f.renewalPolicyMonths = filters.renewalPolicyMonths;
    if (filters.renewalDateFrom) f.renewalDateFrom = filters.renewalDateFrom;
    if (filters.renewalDateTo) f.renewalDateTo = filters.renewalDateTo;
    if (filters.insuranceRequired.length > 0) f.insuranceRequired = filters.insuranceRequired;
    if (filters.bipdOnFile) f.bipdOnFile = filters.bipdOnFile;
    if (filters.cargoOnFile) f.cargoOnFile = filters.cargoOnFile;
    if (filters.bondOnFile) f.bondOnFile = filters.bondOnFile;
    if (filters.trustFundOnFile) f.trustFundOnFile = filters.trustFundOnFile;
    if (filters.insCancellationDateFrom) f.insCancellationDateFrom = filters.insCancellationDateFrom;
    if (filters.insCancellationDateTo) f.insCancellationDateTo = filters.insCancellationDateTo;
    
    return f;
  }, [mcSearchTerm, nameSearchTerm, filters]);
  const applyFilters = () => loadCarriers(buildFilters(), 0);
  const goToPage = (page: number) => loadCarriers(buildFilters(), page);
  const resetAll = () => {
    setMcSearchTerm('');
    setNameSearchTerm('');
    setFilters({
      entityType: '', active: '', state: [], dot: '', yearsInBusinessMin: '', yearsInBusinessMax: '',
      hasEmail: '', hasBoc3: '', hasCompanyRep: '',
      classification: [], carrierOperation: [], hazmat: '',
      powerUnitsMin: '', powerUnitsMax: '', driversMin: '', driversMax: '', cargo: [],
      insuranceCompany: [], insuranceRequired: [], insEffectiveDateFrom: '', insEffectiveDateTo: '', renewalPolicyMonths: '', renewalDateFrom: '', renewalDateTo: '', insCancellationDateFrom: '', insCancellationDateTo: '', bipdMin: '', bipdMax: '', bipdOnFile: '', cargoOnFile: '', bondOnFile: '', trustFundOnFile: '',
      oosMin: '', oosMax: '', crashesMin: '', crashesMax: '',
      injuriesMin: '', injuriesMax: '', fatalitiesMin: '', fatalitiesMax: '',
      towawayMin: '', towawayMax: '', inspectionsMin: '', inspectionsMax: '',
    });
    loadCarriers({}, 0);
  };
  const selectedCarrier = selectedDot ? carriers.find(c => c.dotNumber === selectedDot) : null;
  const yesNoOptions = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];
  const yesNoNumOptions = [
    { value: '', label: 'Any' },
    { value: '1', label: 'Yes' },
    { value: '0', label: 'No' },
  ];
  return (
    <div className="p-6 md:p-8 h-screen flex flex-col overflow-hidden relative" style={{fontFamily:"DM Sans, sans-serif"}}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 tracking-tight">Carrier Database</h1>
          <p className="text-slate-400 text-sm">
            Showing <span className="text-indigo-400 font-bold">{carriers.length}</span> records
            {filteredCount > 0 && <span className="text-white font-bold"> of {filteredCount.toLocaleString()} total</span>}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={onNavigateToInsurance}
            className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <ShieldAlert size={16} /> Batch Enrichment Pipeline
          </button>
          <button
            onClick={() => downloadCSV(carriers)}
            disabled={carriers.length === 0}
            className="btn-ghost flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative group w-52 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Hash size={16} />
          </div>
          <input
            type="text"
            placeholder="Search MC#..."
            className="input-field w-full pl-9 pr-3 py-3 text-sm"
            value={mcSearchTerm}
            onChange={(e) => setMcSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by Business Name..."
            className="input-field w-full pl-11 pr-4 py-3 text-sm"
            value={nameSearchTerm}
            onChange={(e) => setNameSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 border text-sm ${showFilters ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
        >
          <Zap size={16} className={showFilters ? 'fill-white' : ''} />
          {showFilters ? 'Hide Filters' : 'Advanced Filters'}
        </button>
        <button
          onClick={applyFilters}
          disabled={isLoading}
          className="btn-primary px-7 py-3 flex items-center gap-2 text-sm disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Searching...</>
          ) : (
            <><Search size={16} /> Search</>
          )}
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 p-4 filter-panel overflow-y-auto max-h-[55vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FilterGroup title="Motor Carrier" icon={<Truck size={12} />}>
              <div>
                <FilterLabel>Entity Type</FilterLabel>
                <FilterSelect name="entityType" value={filters.entityType} onChange={handleFilterChange} options={[
                  { value: '', label: 'All' },
                  { value: 'CARRIER', label: 'Carrier' },
                  { value: 'BROKER', label: 'Broker' },
                ]} />
              </div>
              <div>
                <FilterLabel>Active</FilterLabel>
                <FilterSelect name="active" value={filters.active} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>State</FilterLabel>
                <MultiSelect options={US_STATES} selected={filters.state} onChange={v => setFilters(p => ({ ...p, state: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>DOT Number</FilterLabel>
                <input type="number" name="dot" value={filters.dot} onChange={handleFilterChange} placeholder="" min={0}
                  className="input-field w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <FilterLabel>Years in Business</FilterLabel>
                <MinMaxInputs nameMin="yearsInBusinessMin" nameMax="yearsInBusinessMax"
                  valueMin={filters.yearsInBusinessMin} valueMax={filters.yearsInBusinessMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Has Email</FilterLabel>
                <FilterSelect name="hasEmail" value={filters.hasEmail} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Has BOC-3</FilterLabel>
                <FilterSelect name="hasBoc3" value={filters.hasBoc3} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Company Rep. Available</FilterLabel>
                <FilterSelect name="hasCompanyRep" value={filters.hasCompanyRep} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
            </FilterGroup>
            <FilterGroup title="Carrier Operation" icon={<Activity size={12} />}>
              <div>
                <FilterLabel>Classification</FilterLabel>
                <MultiSelect options={OPERATION_CLASSIFICATIONS} selected={filters.classification} onChange={v => setFilters(p => ({ ...p, classification: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Carrier Operation</FilterLabel>
                <MultiSelect options={CARRIER_OPERATIONS} selected={filters.carrierOperation} onChange={v => setFilters(p => ({ ...p, carrierOperation: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Hazmat</FilterLabel>
                <FilterSelect name="hazmat" value={filters.hazmat} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Power Units</FilterLabel>
                <MinMaxInputs nameMin="powerUnitsMin" nameMax="powerUnitsMax"
                  valueMin={filters.powerUnitsMin} valueMax={filters.powerUnitsMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Drivers</FilterLabel>
                <MinMaxInputs nameMin="driversMin" nameMax="driversMax"
                  valueMin={filters.driversMin} valueMax={filters.driversMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Cargo</FilterLabel>
                <MultiSelect options={CARGO_TYPES} selected={filters.cargo} onChange={v => setFilters(p => ({ ...p, cargo: v }))} placeholder="All" />
              </div>
            </FilterGroup>
            <FilterGroup title="Insurance Policy" icon={<Shield size={12} />}>
              <div>
                <FilterLabel>Required</FilterLabel>
                <MultiSelect options={INSURANCE_REQUIRED_TYPES} selected={filters.insuranceRequired} onChange={v => setFilters(p => ({ ...p, insuranceRequired: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Insurance Company</FilterLabel>
                <MultiSelect options={INSURANCE_COMPANIES} selected={filters.insuranceCompany} onChange={v => setFilters(p => ({ ...p, insuranceCompany: v }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Renewal Policy Monthly</FilterLabel>
                <FilterSelect name="renewalPolicyMonths" value={filters.renewalPolicyMonths} onChange={handleFilterChange} options={RENEWAL_MONTH_OPTIONS} />
              </div>
              <div>
                <FilterLabel>Renewal Policy Date</FilterLabel>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" name="renewalDateFrom" value={filters.renewalDateFrom} onChange={handleFilterChange}
                    className="input-field w-full px-3 py-2 text-sm" />
                  <input type="date" name="renewalDateTo" value={filters.renewalDateTo} onChange={handleFilterChange}
                    className="input-field w-full px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <FilterLabel>Insurance Effective Date</FilterLabel>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" name="insEffectiveDateFrom" value={filters.insEffectiveDateFrom} onChange={handleFilterChange}
                    className="input-field w-full px-3 py-2 text-sm" />
                  <input type="date" name="insEffectiveDateTo" value={filters.insEffectiveDateTo} onChange={handleFilterChange}
                    className="input-field w-full px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <FilterLabel>Insurance Cancellation Date</FilterLabel>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" name="insCancellationDateFrom" value={filters.insCancellationDateFrom} onChange={handleFilterChange}
                    className="input-field w-full px-3 py-2 text-sm" />
                  <input type="date" name="insCancellationDateTo" value={filters.insCancellationDateTo} onChange={handleFilterChange}
                    className="input-field w-full px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <FilterLabel>Required Amount</FilterLabel>
                <MinMaxInputs nameMin="bipdMin" nameMax="bipdMax"
                  valueMin={filters.bipdMin} valueMax={filters.bipdMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Has BIPD Insurance</FilterLabel>
                <FilterSelect name="bipdOnFile" value={filters.bipdOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
              <div>
                <FilterLabel>Has Cargo Insurance</FilterLabel>
                <FilterSelect name="cargoOnFile" value={filters.cargoOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
              <div>
                <FilterLabel>Has Bond Insurance</FilterLabel>
                <FilterSelect name="bondOnFile" value={filters.bondOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
              <div>
                <FilterLabel>Has Trust Fund Insurance</FilterLabel>
                <FilterSelect name="trustFundOnFile" value={filters.trustFundOnFile} onChange={handleFilterChange} options={yesNoNumOptions} />
              </div>
            </FilterGroup>
            <FilterGroup title="Safety" icon={<ShieldCheck size={12} />}>
              <div>
                <FilterLabel>OOS Violations</FilterLabel>
                <MinMaxInputs nameMin="oosMin" nameMax="oosMax" valueMin={filters.oosMin} valueMax={filters.oosMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Crashes</FilterLabel>
                <MinMaxInputs nameMin="crashesMin" nameMax="crashesMax" valueMin={filters.crashesMin} valueMax={filters.crashesMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Injuries</FilterLabel>
                <MinMaxInputs nameMin="injuriesMin" nameMax="injuriesMax" valueMin={filters.injuriesMin} valueMax={filters.injuriesMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Fatalities</FilterLabel>
                <MinMaxInputs nameMin="fatalitiesMin" nameMax="fatalitiesMax" valueMin={filters.fatalitiesMin} valueMax={filters.fatalitiesMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Towaway</FilterLabel>
                <MinMaxInputs nameMin="towawayMin" nameMax="towawayMax" valueMin={filters.towawayMin} valueMax={filters.towawayMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Inspections</FilterLabel>
                <MinMaxInputs nameMin="inspectionsMin" nameMax="inspectionsMax" valueMin={filters.inspectionsMin} valueMax={filters.inspectionsMax} onChange={handleFilterChange} />
              </div>
            </FilterGroup>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
            <button onClick={resetAll} className="btn-ghost px-6 py-2.5 text-sm">
              Reset All
            </button>
            <button onClick={applyFilters} disabled={isLoading}
              className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2">
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 card overflow-hidden flex flex-col min-h-0" style={{borderRadius:20}}>
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-sm text-slate-300">
            <thead style={{background:"rgba(19,21,30,0.97)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:10, borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <tr>
                <th className="p-4 section-label">#</th>
                <th className="p-4 section-label">MC Number</th>
                <th className="p-4 section-label">Legal Name</th>
                <th className="p-4 section-label">DOT</th>
                <th className="p-4 section-label">Status</th>
                <th className="p-4 section-label">Entity</th>
                <th className="p-4 section-label text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading carriers...</p>
                  </td>
                </tr>
              ) : carriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No results found. Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                carriers.map((carrier, idx) => (
                  <tr key={idx} className="table-row group cursor-pointer" onClick={() => setSelectedDot(carrier.dotNumber)}>
                    <td className="p-4 text-xs text-slate-600">{idx + 1}</td>
                    <td className="p-4 font-mono text-sm" style={{color:"#9B7EFD", fontWeight:600}}>{carrier.mcNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-white group-hover:text-indigo-200 transition-colors truncate max-w-[250px]">{carrier.legalName}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{carrier.dotNumber}</td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight border ${carrier.status?.includes('AUTHORIZED') && !carrier.status?.includes('NOT') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {carrier.status?.includes('AUTHORIZED') && !carrier.status?.includes('NOT') ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tight border ${carrier.entityType?.toUpperCase().includes('BROKER') ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {carrier.entityType?.toUpperCase().includes('BROKER') ? 'BROKER' : 'CARRIER'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDot(carrier.dotNumber); }}
                        className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl transition-all shadow-lg active:scale-95"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {!isLoading && carriers.length > 0 && (
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-xs text-white font-bold">
            Page {currentPage + 1} · Showing {currentPage * PAGE_SIZE + 1}–{currentPage * PAGE_SIZE + carriers.length}{filteredCount > 0 ? ` of ${filteredCount.toLocaleString()}` : (totalCount > 0 ? ` of ${totalCount.toLocaleString()}` : '')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="btn-ghost px-3 py-1.5 text-xs rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={carriers.length < PAGE_SIZE}
              className="btn-ghost px-3 py-1.5 text-xs rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {selectedCarrier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-fade-up">
          <div style={{background:"#13151E", border:"1px solid rgba(255,255,255,0.08)", borderRadius:28, boxShadow:"0 40px 120px rgba(0,0,0,0.7)"}} className="w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col relative">
            <div style={{padding:"20px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(19,21,30,0.95)", display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div className="flex gap-4 md:gap-6 items-center">
                <div style={{width:52, height:52, background:"linear-gradient(135deg, #7C5CFC, #A78BFA)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(124,92,252,0.35)"}}>
                  <Truck size={20} className="md:w-8 md:h-8" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter truncate max-w-[300px] md:max-w-[700px] leading-tight">{selectedCarrier.legalName}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${selectedCarrier.status?.includes('NOT AUTHORIZED') ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                      {selectedCarrier.status?.includes('NOT AUTHORIZED') ? 'Unauthorized' : 'Active Authority'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => handleCopy(selectedCarrier.dotNumber, 'dot')}
                      className="bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95 shadow-md"
                    >
                      <span className="font-black text-[10px] md:text-xs tracking-wide uppercase">
                        DOT {selectedCarrier.dotNumber}
                      </span>
                      {copiedField === 'dot' ? <Check size={12} className="text-white" /> : <Copy size={12} className="text-white/60" />}
                    </button>
                    <button 
                      onClick={() => handleCopy(selectedCarrier.mcNumber || '', 'mc')}
                      className="bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95 shadow-md"
                    >
                      <span className="font-black text-[10px] md:text-xs tracking-wide uppercase">
                        MC {selectedCarrier.mcNumber}
                      </span>
                      {copiedField === 'mc' ? <Check size={12} className="text-white" /> : <Copy size={12} className="text-white/60" />}
                    </button>
                    <div className={`${selectedCarrier.entityType?.toUpperCase().includes('BROKER') ? 'bg-orange-500' : 'bg-emerald-500'} text-white rounded-lg px-3 py-1.5 shadow-md`}>
                      <span className="font-black text-[10px] md:text-xs uppercase tracking-wide">
                        {selectedCarrier.entityType?.toUpperCase().includes('BROKER') ? 'BROKER' : 'CARRIER'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDot(null)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-75">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-900/40">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div style={{background:"rgba(255,255,255,0.03)", padding:24, borderRadius:20, border:"1px solid rgba(255,255,255,0.06)"}} className="space-y-4">
                  <h3 className="section-label flex items-center gap-2 mb-1">
                    <Hash size={14} style={{color:"#9B7EFD"}} /> Identification
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-black uppercase">MC/MX Number</span><span className="text-base font-black text-indigo-400 font-mono tracking-tight">{selectedCarrier.mcNumber}</span></div>
                    <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-black uppercase">USDOT Number</span><span className="text-base font-black text-white font-mono tracking-tight">{selectedCarrier.dotNumber}</span></div>
                    <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-black uppercase">DUNS Number</span><span className="text-sm font-bold text-slate-400">{selectedCarrier.dunsNumber || '--'}</span></div>
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.03)", padding:24, borderRadius:20, border:"1px solid rgba(255,255,255,0.06)"}} className="space-y-4">
                  <h3 className="section-label flex items-center gap-2 mb-1">
                    <Phone size={14} style={{color:"#9B7EFD"}} /> Contact Info
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-indigo-400 shrink-0" />
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-black uppercase">Phone</span><span className="text-base font-black text-white">{selectedCarrier.phone || 'N/A'}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-indigo-400 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] text-slate-500 font-black uppercase">Email</span>
                        <span className="text-sm font-black text-indigo-300 truncate">{selectedCarrier.email || 'None Registered'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-indigo-400 shrink-0" />
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-black uppercase">Location</span><span className="text-xs font-bold text-slate-300 leading-tight">{selectedCarrier.physicalAddress}</span></div>
                    </div>
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,0.03)", padding:24, borderRadius:20, border:"1px solid rgba(255,255,255,0.06)"}} className="space-y-4">
                  <h3 className="section-label flex items-center gap-2 mb-1">
                    <Calendar size={14} style={{color:"#9B7EFD"}} /> Compliance
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800 shadow-inner">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] text-slate-500 font-black uppercase">MCS-150 Form Date</span>
                        {calculateYearsInBusiness(selectedCarrier.mcs150Date) !== null && (
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
                            {calculateYearsInBusiness(selectedCarrier.mcs150Date)} Years in Business
                          </span>
                        )}
                      </div>
                      <span className="text-base font-black text-white">{selectedCarrier.mcs150Date || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800 shadow-inner">
                      <span className="text-[9px] text-slate-500 font-black uppercase block mb-1">Mileage / VMT</span>
                      <span className="text-sm font-bold text-slate-300">{selectedCarrier.mcs150Mileage || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-850/40 p-8 rounded-[2rem] border border-slate-800 flex flex-col gap-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-indigo-400" />
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Operation Information</h4>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Classifications</h5>
                      <p className="text-sm font-bold text-slate-200 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                        {selectedCarrier.operationClassification?.join(', ') || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Operating Territory</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedCarrier.carrierOperation?.map((op, idx) => (
                          <span key={idx} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/20 font-bold text-[10px] uppercase">{op}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo Carried</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedCarrier.cargoCarried?.map((cargo, idx) => (
                          <div key={idx} className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                            <Truck size={14} className="text-slate-600" />
                            <span className="text-xs font-bold text-slate-300">{cargo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`w-full py-4 rounded-2xl flex items-center justify-center font-black tracking-widest text-xs border-2 ${selectedCarrier.cargoCarried?.some(c => c.toLowerCase().includes('haz')) ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {selectedCarrier.cargoCarried?.some(c => c.toLowerCase().includes('haz')) ? 'HAZMAT INDICATOR: YES' : 'HAZMAT INDICATOR: NON-HAZMAT'}
                    </div>
                    <div className="h-px bg-slate-800/50 my-2" />
                    <div>
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fleet Information</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                          <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Power Units</span>
                          <span className="text-lg font-black text-white">{selectedCarrier.powerUnits || '0'}</span>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                          <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Drivers</span>
                          <span className="text-lg font-black text-white">{selectedCarrier.drivers || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-850/40 p-8 rounded-[2rem] border border-slate-800 flex flex-col shadow-2xl">
                  <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Insurance History</h4>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {activeInsurance.length > 0 ? (
                      activeInsurance.map((p, i) => (
                        <div key={i} className={`bg-slate-900 p-6 rounded-[1.5rem] border shadow-sm group/policy hover:border-indigo-500/30 transition-all ${p.canclEffectiveDate ? 'border-red-800/40' : 'border-slate-800'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/10 px-2 py-0.5 rounded-lg">{p.type}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${p.canclEffectiveDate ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}`}>{p.status}</span>
                              <span className="text-xl font-black text-white">{p.coverageAmount}</span>
                            </div>
                          </div>
                          <p className="text-sm font-black text-slate-200 mb-4 truncate leading-tight group-hover/policy:text-indigo-300 transition-colors uppercase">{p.carrier}</p>
                          <div className="flex gap-3 mb-4">
                            {p.formCode && <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg uppercase">Form: {p.formCode}</span>}
                            {p.transDate && <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg uppercase">Trans: {p.transDate}</span>}
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                            <span className="text-sm font-bold text-white">#{p.policyNumber}</span>
                            <span className="text-sm font-bold text-white">EFF: {p.effectiveDate}</span>
                          </div>
                          {p.effectiveDate && p.effectiveDate !== 'N/A' && !p.canclEffectiveDate && (() => {
                            try {
                              const parts = p.effectiveDate.split('/');
                              if (parts.length === 3) {
                                const month = parseInt(parts[0], 10);
                                const day = parseInt(parts[1], 10);
                                const now = new Date();
                                let renewalYear = now.getFullYear();
                                const candidate = new Date(renewalYear, month - 1, day);
                                if (candidate <= now) renewalYear += 1;
                                const renewal = new Date(renewalYear, month - 1, day);
                                const renewalStr = `${String(renewal.getMonth() + 1).padStart(2, '0')}/${String(renewal.getDate()).padStart(2, '0')}/${renewal.getFullYear()}`;
                                return (
                                  <div className="mt-1">
                                    <span className="text-sm font-bold text-indigo-300">Renewal: {renewalStr}</span>
                                  </div>
                                );
                              }
                            } catch { /* ignore parse errors */ }
                            return null;
                          })()}
                          {p.canclEffectiveDate && (
                            <div className="mt-3 pt-3 border-t border-red-800/30">
                              <span className="text-[13px] font-bold text-red-400 uppercase">Cancellation: {p.canclEffectiveDate}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-700 text-center">
                        <Info size={48} className="opacity-10 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">No Insurance Records</p>
                        <p className="text-[10px] text-slate-600 max-w-[180px] leading-relaxed italic">No insurance records found in the database.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-850/40 p-8 rounded-[2rem] border border-slate-800 flex flex-col gap-6 shadow-2xl relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={20} className="text-indigo-400" />
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">Safety Information</h4>
                    </div>
                    <a href={`https://ai.fmcsa.dot.gov/SMS/Carrier/${selectedCarrier.dotNumber}/CompleteProfile.aspx`} target="_blank" className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 hover:text-white transition-colors">
                      <ExternalLink size={12} /> View FMCSA Source
                    </a>
                  </div>
                  {selectedCarrier.safetyRating && selectedCarrier.safetyRating !== 'N/A' ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <div className="flex justify-between items-start">
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-100">Safety Rating</h5>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                              <CheckCircle2 size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-200 leading-tight uppercase">{selectedCarrier.safetyRating}</p>
                              <p className="text-[11px] text-slate-500 font-medium font-mono">ENRICHED: {selectedCarrier.safetyRatingDate}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 max-w-[180px] space-y-4">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-100">OOS Rates</h5>
                            <p className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase">Last 24 Months Activity</p>
                          </div>
                          {selectedCarrier.oosRates?.map((oos, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-slate-500 truncate mr-2">{oos.type}</span>
                                <span className="text-emerald-400">{oos.rate}</span>
                              </div>
                              <div className="w-full bg-slate-800/50 rounded-full h-1 relative overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${parseFloat(oos.rate) || 0}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-px bg-slate-800/50" />
                      <div className="space-y-4">
                        <h5 className="text-xs font-black text-slate-100 uppercase tracking-widest opacity-80">BASIC Performance</h5>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          {selectedCarrier.basicScores?.map((score, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 truncate max-w-[120px]">{score.category}</span>
                              <span className="text-slate-300 font-bold font-mono">{score.measure}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-700 text-center space-y-4">
                      <div className="p-6 bg-slate-800/30 rounded-full"><ShieldAlert size={48} className="opacity-20 text-indigo-500" /></div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Record Not Enriched</p>
                      <button onClick={() => { setSelectedDot(null); onNavigateToInsurance(); }} className="text-[10px] font-black text-indigo-400 hover:text-white uppercase transition-colors bg-indigo-500/5 px-4 py-2 rounded-lg border border-indigo-500/10">Launch Pipeline now</button>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-[2rem] p-8 flex flex-col shadow-xl text-slate-900">
                  <div className="flex items-center gap-3 mb-6">
                    <Activity size={20} className="text-slate-700" />
                    <h4 className="text-xl font-black uppercase tracking-tight">Inspections & Crashes</h4>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button 
                      onClick={() => setActiveTab('inspections')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inspections' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Inspections
                    </button>
                    <button 
                      onClick={() => setActiveTab('crashes')}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'crashes' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Crashes
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total</span>
                      <span className="text-xl font-black">{activeTab === 'inspections' ? selectedCarrier.inspections?.length || 0 : selectedCarrier.crashes?.length || 0}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                      <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">Violations</span>
                      <span className="text-xl font-black text-blue-600">
                        {selectedCarrier.inspections?.reduce((acc, curr) => acc + (curr.violationList?.length || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">OOS</span>
                      <span className="text-xl font-black text-red-600">
                        {selectedCarrier.inspections?.reduce((acc, curr) => acc + (curr.oosViolations || 0), 0) || 0}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Crashes</span>
                      <span className="text-xl font-black">{selectedCarrier.crashes?.length || 0}</span>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'inspections' ? (
                      selectedCarrier.inspections?.map((insp, i) => (
                        <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden group">
                          <div 
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedInspection(expandedInspection === insp.reportNumber ? null : insp.reportNumber)}
                          >
                            <div>
                              <p className="text-sm font-black">{insp.date}</p>
                              <p className="text-[11px] text-slate-500">{insp.location}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {insp.violationList?.length > 0 && (
                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                  {insp.violationList.length} Violations
                                </span>
                              )}
                              {insp.oosViolations > 0 && (
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg text-[10px] font-black">OOS</span>
                              )}
                              {expandedInspection === insp.reportNumber ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          
                          {expandedInspection === insp.reportNumber && (
                            <div className="px-4 pb-4 pt-4 border-t border-slate-100 bg-[#F8F9FA]">
                              <div className="grid grid-cols-3 grid-rows-2 gap-y-4 gap-x-6 mb-6">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)]">Report #:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-[oklch(0.372_0.044_257.287)]">{insp.reportNumber}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)]">Location:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-[oklch(0.372_0.044_257.287)]">{insp.location}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)]">OOS Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-[oklch(0.372_0.044_257.287)]">{insp.oosViolations}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)]">Driver Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-[oklch(0.372_0.044_257.287)]">{insp.driverViolations}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)]">Vehicle Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-[oklch(0.372_0.044_257.287)]">{insp.vehicleViolations}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)]">Hazmat Violations:</span>
                                  <span className="text-[14px] leading-[20px] font-medium text-[oklch(0.372_0.044_257.287)]">{insp.hazmatViolations}</span>
                                </div>
                              </div>
                              {insp.violationList?.length > 0 && (
                                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                                  <span className="text-[12px] leading-[16px] font-normal text-[oklch(0.554_0.046_257.417)] uppercase tracking-wider">Violation Details</span>
                                  {insp.violationList.map((v: any, vi: number) => (
                                    <div key={vi} className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] relative group/viol shadow-sm">
                                      <div className="flex justify-between font-bold mb-1">
                                        <span className="text-blue-600">{v.label}</span>
                                        <span className="text-slate-400">Weight: {v.weight}</span>
                                      </div>
                                      <p className="text-slate-600 leading-relaxed">{v.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      selectedCarrier.crashes?.map((crash: any, i: number) => (
                        <div key={i} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-sm font-black">{crash.date}</p>
                            <p className="text-[11px] text-slate-500">{crash.state} | {crash.number}</p>
                          </div>
                          <div className="flex gap-2">
                            {parseInt(crash.fatal) > 0 && <span className="bg-red-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">FATAL</span>}
                            {parseInt(crash.injuries) > 0 && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">INJURY</span>}
                          </div>
                        </div>
                      )) || <p className="text-center py-10 text-slate-400 italic">No crash records found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
