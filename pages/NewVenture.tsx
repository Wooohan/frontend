import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, X, MapPin, Phone, Mail, Hash, Truck, Calendar,
  Download, Activity, Loader2, ChevronDown, ChevronUp, Copy, Check,
  Zap, Shield, Globe, Filter, RefreshCw, Database, AlertTriangle
} from 'lucide-react';
import { NewVentureData, User } from '../types';
import {
  fetchNewVenturesFromBackend,
  startNewVentureScrape,
  NewVentureFilters,
} from '../services/backendApiService';
interface NewVentureProps {
  user: User;
}
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];
const CARRIER_OPERATIONS = [
  'Interstate', 'Intrastate Only (HM)', 'Intrastate Only (Non-HM)'
];
const FilterGroup: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-xs font-black text-indigo-400 uppercase tracking-widest">{icon} {title}</span>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};
const FilterLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">{children}</label>
);
const FilterSelect: React.FC<{ name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[] }> = ({ name, value, onChange, options }) => (
  <select name={name} value={value} onChange={onChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500">
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
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
    <input type="number" name={nameMax} value={valueMax} onChange={onChange} placeholder="Max" min={0}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
  </div>
);
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
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 flex items-center justify-between">
        <span className={selected.length === 0 ? 'text-slate-500' : 'text-white truncate'}>
          {selected.length === 0 ? placeholder : selected.join(', ')}
        </span>
        {open ? <ChevronUp size={14} className="shrink-0 ml-1" /> : <ChevronDown size={14} className="shrink-0 ml-1" />}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 cursor-pointer text-sm text-slate-300">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} className="accent-indigo-500" />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
const val = (v: string | undefined | null): string => (v && v.trim()) ? v.trim() : '-';
const cargoFields: { key: keyof NewVentureData; label: string }[] = [
  { key: 'genfreight', label: 'General Freight' },
  { key: 'household', label: 'Household Goods' },
  { key: 'metalsheet', label: 'Metal Sheets' },
  { key: 'motorveh', label: 'Motor Vehicles' },
  { key: 'drivetow', label: 'Drive/Tow Away' },
  { key: 'logpole', label: 'Logs/Poles' },
  { key: 'bldgmat', label: 'Building Materials' },
  { key: 'mobilehome', label: 'Mobile Homes' },
  { key: 'machlrg', label: 'Large Machinery' },
  { key: 'produce', label: 'Produce' },
  { key: 'liqgas', label: 'Liquids/Gases' },
  { key: 'intermodal', label: 'Intermodal' },
  { key: 'passengers', label: 'Passengers' },
  { key: 'oilfield', label: 'Oilfield' },
  { key: 'livestock', label: 'Livestock' },
  { key: 'grainfeed', label: 'Grain/Feed' },
  { key: 'coalcoke', label: 'Coal/Coke' },
  { key: 'meat', label: 'Meat' },
  { key: 'garbage', label: 'Garbage/Refuse' },
  { key: 'usmail', label: 'US Mail' },
  { key: 'chem', label: 'Chemicals' },
  { key: 'drybulk', label: 'Dry Bulk' },
  { key: 'coldfood', label: 'Refrigerated Food' },
  { key: 'beverages', label: 'Beverages' },
  { key: 'paperprod', label: 'Paper Products' },
  { key: 'utility', label: 'Utilities' },
  { key: 'farmsupp', label: 'Farm Supplies' },
  { key: 'construct', label: 'Construction' },
  { key: 'waterwell', label: 'Water Well' },
  { key: 'cargoothr', label: 'Other' },
];
function downloadNewVentureCSV(data: NewVentureData[]) {
  if (!data.length) return;
  const headers = [
    'DOT#', 'Docket#', 'Name', 'DBA', 'Status', 'Carrier Op', 'Phone', 'Email',
    'City', 'State', 'Zip', 'Power Units', 'Drivers', 'HazMat', 'Add Date',
    'BIPD File', 'Cargo File', 'Bond File', 'Safety Rating'
  ];
  const rows = data.map(r => [
    r.dot_number, r.docket_number, r.name, r.name_dba, r.operating_status,
    r.carrier_operation, r.phy_phone, r.email_address, r.phy_city, r.phy_st,
    r.phy_zip, r.total_pwr, r.total_drivers, r.hm_ind, r.add_date,
    r.bipd_file, r.cargo_file, r.bond_file, r.safety_rating
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `new_ventures_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
export const NewVenture: React.FC<NewVentureProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [ventures, setVentures] = useState<NewVentureData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [availDates, setAvailDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 200;
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVenture, setSelectedVenture] = useState<NewVentureData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [docketSearch, setDocketSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState({
    dotNumber: '',
    active: '',
    states: [] as string[],
    hasEmail: '',
    carrierOperation: [] as string[],
    hazmat: '',
    powerUnitsMin: '',
    powerUnitsMax: '',
    driversMin: '',
    driversMax: '',
    bipdOnFile: '',
    cargoOnFile: '',
    bondOnFile: '',
  });
  const [showScrapePanel, setShowScrapePanel] = useState(false);
  const [scrapeDate, setScrapeDate] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{ success: boolean; message: string } | null>(null);
  useEffect(() => {
    loadVentures({});
  }, []);
  const loadVentures = async (f: NewVentureFilters, page = 0) => {
    setIsLoading(true);
    try {
      const result = await fetchNewVenturesFromBackend({ ...f, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setVentures(result.data);
      setCurrentPage(page);
      setFilteredCount(result.filtered_count);
      setTotalCount(result.total_count);
      setAvailDates(result.available_dates);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRowClick = (v: NewVentureData) => {
    setSelectedVenture(v);
  };
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const buildFilters = useCallback((): NewVentureFilters => {
    const f: NewVentureFilters = {};
    if (docketSearch.trim()) f.docketNumber = docketSearch.trim();
    if (nameSearch.trim()) f.companyName = nameSearch.trim();
    if (filters.dotNumber.trim()) f.dotNumber = filters.dotNumber.trim();
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (filters.active) f.active = filters.active;
    if (filters.states.length > 0) f.state = filters.states.join('|');
    if (filters.hasEmail) f.hasEmail = filters.hasEmail;
    if (filters.carrierOperation.length > 0) f.carrierOperation = filters.carrierOperation.join('|');
    if (filters.hazmat) f.hazmat = filters.hazmat;
    if (filters.powerUnitsMin) f.powerUnitsMin = parseInt(filters.powerUnitsMin);
    if (filters.powerUnitsMax) f.powerUnitsMax = parseInt(filters.powerUnitsMax);
    if (filters.driversMin) f.driversMin = parseInt(filters.driversMin);
    if (filters.driversMax) f.driversMax = parseInt(filters.driversMax);
    if (filters.bipdOnFile) f.bipdOnFile = filters.bipdOnFile;
    if (filters.cargoOnFile) f.cargoOnFile = filters.cargoOnFile;
    if (filters.bondOnFile) f.bondOnFile = filters.bondOnFile;
    return f;
  }, [docketSearch, nameSearch, dateFrom, dateTo, filters]);
  const applyFilters = () => loadVentures(buildFilters(), 0);
  const goToPage = (page: number) => loadVentures(buildFilters(), page);
  const resetAll = () => {
    setDocketSearch('');
    setNameSearch('');
    setDateFrom('');
    setDateTo('');
    setFilters({
      dotNumber: '', active: '', states: [], hasEmail: '',
      carrierOperation: [], hazmat: '',
      powerUnitsMin: '', powerUnitsMax: '',
      driversMin: '', driversMax: '',
      bipdOnFile: '', cargoOnFile: '', bondOnFile: '',
    });
    loadVentures({}, 0);
  };
  const handleScrape = async () => {
    if (!scrapeDate) return;
    setIsScraping(true);
    setScrapeResult(null);
    try {
      const res = await startNewVentureScrape(scrapeDate);
      if (res.success) {
        setScrapeResult({ success: true, message: `Scraped ${res.scraped} records, saved ${res.saved} to database.` });
        loadVentures(buildFilters());
      } else {
        setScrapeResult({ success: false, message: res.error || 'Scrape failed.' });
      }
    } catch (err: any) {
      setScrapeResult({ success: false, message: err.message || 'Scrape failed.' });
    } finally {
      setIsScraping(false);
    }
  };
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const hasActiveFilters = !!(docketSearch.trim() || nameSearch.trim() || dateFrom || dateTo ||
    filters.dotNumber || filters.active || filters.states.length > 0 || filters.hasEmail ||
    filters.carrierOperation.length > 0 || filters.hazmat || filters.powerUnitsMin || filters.powerUnitsMax ||
    filters.driversMin || filters.driversMax || filters.bipdOnFile || filters.cargoOnFile || filters.bondOnFile);
  const yesNoOptions = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];
  const activeStatusOptions = [
    { value: '', label: 'Any' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'authorization_pending', label: 'Authorization Pending' },
    { value: 'not_authorized', label: 'Not Authorized' },
  ];
  const DetailModal: React.FC<{ v: NewVentureData; onClose: () => void }> = ({ v, onClose }) => {
    const [detailTab, setDetailTab] = useState<'overview' | 'cargo' | 'fleet' | 'safety' | 'driver'>('overview');
    const CopyBtn: React.FC<{ text: string; field: string }> = ({ text, field }) => {
      if (!text || text === '-') return null;
      return (
        <button onClick={() => handleCopy(text, field)} className="ml-2 text-slate-500 hover:text-indigo-400 transition-colors">
          {copiedField === field ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
      );
    };
    const InfoRow: React.FC<{ label: string; value: string; copyKey?: string }> = ({ label, value, copyKey }) => (
      <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
        <span className="text-slate-400 text-sm">{label}</span>
        <span className="text-white text-sm font-medium flex items-center">
          {val(value)}
          {copyKey && <CopyBtn text={value} field={copyKey} />}
        </span>
      </div>
    );
    const activeCargo = cargoFields.filter(cf => {
      const v2 = v[cf.key] as string | undefined;
      return v2 && v2.trim().toUpperCase() === 'X';
    });
    const rawVal = (...keys: string[]): string => {
      const raw = v.raw_data || (v as Record<string, any>);
      for (const key of keys) {
        const typedVal = (v as Record<string, any>)[key];
        if (typedVal !== undefined && typedVal !== null && String(typedVal).trim()) return String(typedVal).trim();
        if (raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim()) return String(raw[key]).trim();
      }
      if (v.raw_data) {
        const rawKeys = Object.keys(v.raw_data);
        for (const searchKey of keys) {
          const lower = searchKey.toLowerCase().replace(/[_\s]+/g, '');
          const match = rawKeys.find(k => k.toLowerCase().replace(/[_\s]+/g, '') === lower);
          if (match && v.raw_data[match] !== undefined && v.raw_data[match] !== null && String(v.raw_data[match]).trim()) {
            return String(v.raw_data[match]).trim();
          }
        }
      }
      return '-';
    };
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
        <div className="bg-slate-900 border-2 border-slate-700/50 w-full max-w-7xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
          <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-850/30 flex justify-between items-start">
            <div className="flex gap-4 md:gap-6 items-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/10">
                <Truck size={20} className="md:w-8 md:h-8" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter truncate max-w-[300px] md:max-w-[700px] leading-tight">{val(v.name)}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${
                    v.operating_status?.toUpperCase().includes('AUTHORIZED') && !v.operating_status?.toUpperCase().includes('NOT')
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {v.operating_status?.toUpperCase().includes('AUTHORIZED') && !v.operating_status?.toUpperCase().includes('NOT') ? 'Active Authority' : val(v.operating_status)}
                  </span>
                </div>
                {v.name_dba && <p className="text-slate-400 text-sm">DBA: {v.name_dba}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => handleCopy(v.dot_number || '', 'dot')} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95 shadow-md">
                    <span className="font-black text-[10px] md:text-xs tracking-wide uppercase">DOT {val(v.dot_number)}</span>
                    {copiedField === 'dot' ? <Check size={12} className="text-white" /> : <Copy size={12} className="text-white/60" />}
                  </button>
                  <button onClick={() => handleCopy(v.docket_number || '', 'mc')} className="bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95 shadow-md">
                    <span className="font-black text-[10px] md:text-xs tracking-wide uppercase">MC {val(v.docket_number)}</span>
                    {copiedField === 'mc' ? <Check size={12} className="text-white" /> : <Copy size={12} className="text-white/60" />}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-75"><X size={24} /></button>
          </div>
          <div className="flex border-b border-slate-700 px-6">
            {(['overview', 'cargo', 'fleet', 'safety', 'driver'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                  detailTab === tab
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'driver' ? 'Driver' : tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-900/40 relative">
            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-850/60 p-6 rounded-3xl border border-slate-700/50 space-y-4 shadow-lg group">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 group-hover:text-indigo-400 transition-colors">
                    <Hash size={14} className="text-indigo-400" /> Company Info
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Legal Name" value={v.name || ''} copyKey="name" />
                    <InfoRow label="DBA Name" value={v.name_dba || ''} />
                    <InfoRow label="DOT Number" value={v.dot_number || ''} copyKey="dot" />
                    <InfoRow label="Docket (MC#)" value={v.docket_number || ''} copyKey="mc" />
                    <InfoRow label="Status" value={v.operating_status || ''} />
                    <InfoRow label="Carrier Operation" value={v.carrier_operation || ''} />
                    <InfoRow label="Add Date" value={v.add_date || ''} />
                    <InfoRow label="Officer 1" value={v.company_officer_1 || ''} />
                    <InfoRow label="Officer 2" value={v.company_officer_2 || ''} />
                  </div>
                </div>
                <div className="bg-slate-850/60 p-6 rounded-3xl border border-slate-700/50 space-y-4 shadow-lg group">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 group-hover:text-indigo-400 transition-colors">
                    <Phone size={14} className="text-indigo-400" /> Contact & Location
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="Phone" value={v.phy_phone || ''} copyKey="phone" />
                    <InfoRow label="Cell" value={v.cell_phone || ''} copyKey="cell" />
                    <InfoRow label="Email" value={v.email_address || ''} copyKey="email" />
                    <InfoRow label="Physical Address" value={[v.phy_str, v.phy_city, v.phy_st, v.phy_zip].filter(Boolean).join(', ')} copyKey="addr" />
                    <InfoRow label="Mailing Address" value={[v.mai_str, v.mai_city, v.mai_st, v.mai_zip].filter(Boolean).join(', ')} />
                    <InfoRow label="County" value={v.phy_cnty || ''} />
                    <InfoRow label="Country" value={v.phy_country || ''} />
                  </div>
                </div>
                <div className="bg-slate-850/60 p-6 rounded-3xl border border-slate-700/50 space-y-4 shadow-lg group">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 group-hover:text-indigo-400 transition-colors">
                    <Shield size={14} className="text-indigo-400" /> Insurance
                  </h3>
                  <div className="space-y-3">
                    <InfoRow label="BIPD Required" value={v.bipd_req || ''} />
                    <InfoRow label="BIPD On File" value={v.bipd_file || ''} />
                    <InfoRow label="Cargo Required" value={v.cargo_req || ''} />
                    <InfoRow label="Cargo On File" value={v.cargo_file || ''} />
                    <InfoRow label="Bond Required" value={v.bond_req || ''} />
                    <InfoRow label="Bond On File" value={v.bond_file || ''} />
                  </div>
                </div>
              </div>
            )}
            {detailTab === 'cargo' && (
              <div>
                <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3">Cargo Carried</h3>
                {activeCargo.length === 0 ? (
                  <p className="text-slate-500 text-sm">No cargo types marked.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {activeCargo.map(c => (
                      <span key={c.key as string} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-full">
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
                {v.cargoothr_desc && (
                  <div className="mt-4">
                    <span className="text-xs text-slate-500 uppercase font-bold">Other Description:</span>
                    <p className="text-white text-sm mt-1">{v.cargoothr_desc}</p>
                  </div>
                )}
                <h3 className="text-xs font-bold text-indigo-400 uppercase mb-3 mt-6">HazMat</h3>
                <span className={`text-sm px-3 py-1 rounded-full ${v.hm_ind === 'Y' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                  {v.hm_ind === 'Y' ? 'HazMat Carrier' : 'No HazMat'}
                </span>
              </div>
            )}
            {detailTab === 'fleet' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Trucks', value: v.total_trucks },
                    { label: 'Total Buses', value: v.total_buses },
                    { label: 'Total Power', value: v.total_pwr },
                    { label: 'Fleet Size', value: v.fleetsize },
                    { label: 'Total Drivers', value: v.total_drivers },
                    { label: 'Total CDL', value: v.total_cdl },
                    { label: 'Avg TLD', value: v.avg_tld },
                    { label: 'MCS150 Mileage', value: v.mcs150_mileage },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{item.label}</p>
                      <p className="text-lg font-bold text-white mt-1">{val(item.value)}</p>
                    </div>
                  ))}
                </div>
                <h3 className="text-xs font-bold text-indigo-400 uppercase mt-4">Owned Equipment</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <InfoRow label="Trucks" value={v.owntruck || ''} />
                  <InfoRow label="Tractors" value={v.owntract || ''} />
                  <InfoRow label="Trailers" value={v.owntrail || ''} />
                </div>
              </div>
            )}
            {detailTab === 'safety' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Safety Rating" value={v.safety_rating || ''} />
                  <InfoRow label="Rating Date" value={v.safety_rating_date || ''} />
                  <InfoRow label="Review Type" value={v.review_type || ''} />
                  <InfoRow label="Review Date" value={v.review_date || ''} />
                  <InfoRow label="Crash Rate" value={v.recordable_crash_rate || ''} />
                  <InfoRow label="MCS150 Date" value={v.mcs150_date || ''} />
                </div>
              </div>
            )}
            {detailTab === 'driver' && (() => {
              const toNum = (s: string): number => { const n = parseInt(s, 10); return isNaN(n) ? 0 : n; };
              const interWithin = rawVal('inter_drivers_within100', 'interstate_within_100_miles', 'Interstate within 100 miles', 'interstate_within100', 'inter_within_100');
              const interBeyond = rawVal('inter_drivers_beyond100', 'interstate_beyond_100_miles', 'Interstate beyond 100 miles', 'interstate_beyond100', 'inter_beyond_100');
              const intraWithin = rawVal('intra_drivers_within100', 'intrastate_within_100_miles', 'Intrastate within 100 miles', 'intrastate_within100', 'intra_within_100');
              const intraBeyond = rawVal('intra_drivers_beyond100', 'intrastate_beyond_100_miles', 'Intrastate beyond 100 miles', 'intrastate_beyond100', 'intra_beyond_100');
              const interTotal = toNum(interWithin) + toNum(interBeyond);
              const intraTotal = toNum(intraWithin) + toNum(intraBeyond);
              const grandTotal = interTotal + intraTotal;
              return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-850/40 p-8 rounded-[2rem] border border-slate-800 flex flex-col gap-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-indigo-400" />
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Interstate Drivers</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Within 100 mi</span>
                        <span className="text-lg font-black text-white">{interWithin}</span>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Beyond 100 mi</span>
                        <span className="text-lg font-black text-white">{interBeyond}</span>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-indigo-400 font-black uppercase mb-1">Interstate Total</span>
                        <span className="text-lg font-black text-indigo-300">{interTotal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-slate-800/50" />
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-indigo-400" />
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Intrastate Drivers</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Within 100 mi</span>
                        <span className="text-lg font-black text-white">{intraWithin}</span>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Beyond 100 mi</span>
                        <span className="text-lg font-black text-white">{intraBeyond}</span>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-indigo-400 font-black uppercase mb-1">Intrastate Total</span>
                        <span className="text-lg font-black text-indigo-300">{intraTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-850/40 p-8 rounded-[2rem] border border-slate-800 flex flex-col gap-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Activity size={20} className="text-emerald-400" />
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">Driver Summary</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Avg Leased Drivers/Month</span>
                        <span className="text-2xl font-black text-white">{rawVal('avg_leased_drivers_month', 'avg_tld', 'avg_numer_trip_leased_drivers_month', 'Avg numer trip leased drivers / month', 'avg_trip_leased_drivers_month')}</span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-emerald-400 font-black uppercase mb-1">Grand Total</span>
                        <span className="text-2xl font-black text-emerald-300">{grandTotal}</span>
                      </div>
                    </div>
                    <div className="h-px bg-slate-800/50" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Total with CDL</span>
                        <span className="text-2xl font-black text-white">{rawVal('total_cdl_drivers', 'total_cdl', 'Total with CDL', 'total_with_cdl')}</span>
                      </div>
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Total with Non-CDL</span>
                        <span className="text-2xl font-black text-white">{rawVal('total_non_cdl_drivers', 'Total with Non-CDL', 'total_with_non_cdl', 'total_noncdl')}</span>
                      </div>
                    </div>
                    <div className="h-px bg-slate-800/50" />
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center">
                      <span className="text-[9px] text-slate-500 font-black uppercase mb-1">Total Drivers</span>
                      <span className="text-2xl font-black text-white">{rawVal('total_drivers', 'drivers', 'Drivers')}</span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="p-4 md:p-8 h-screen flex flex-col overflow-hidden relative selection:bg-indigo-500/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 tracking-tight">New Ventures</h1>
          <p className="text-white text-sm font-bold">
            Showing <span className="text-indigo-400 font-bold">{ventures.length}</span> records
            {hasActiveFilters && <span className="text-white"> out of {filteredCount.toLocaleString()}</span>}
            {!hasActiveFilters && totalCount > 0 && <span className="text-white"> of {totalCount.toLocaleString()} total</span>}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={() => setShowScrapePanel(!showScrapePanel)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                showScrapePanel
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20'
              }`}
            >
              <Zap size={16} /> Scrape
            </button>
          )}
          <button onClick={() => loadVentures(buildFilters())}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all border border-slate-700 active:scale-95">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => downloadNewVentureCSV(ventures)}
            disabled={ventures.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all border border-slate-700 active:scale-95"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      {isAdmin && showScrapePanel && (
        <div className="mb-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">Live Scrape from BrokerSnapshot</h3>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Added Date</label>
              <input
                type="date"
                value={scrapeDate}
                onChange={(e) => setScrapeDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={handleScrape}
              disabled={isScraping || !scrapeDate}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              {isScraping ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isScraping ? 'Scraping...' : 'Live Scrape'}
            </button>
            {availDates.length > 0 && (
              <div className="text-xs text-slate-500">
                Scraped dates: {availDates.slice(0, 5).join(', ')}{availDates.length > 5 ? ` +${availDates.length - 5} more` : ''}
              </div>
            )}
          </div>
          {scrapeResult && (
            <div className={`mt-3 px-4 py-2 rounded-xl text-sm ${scrapeResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
              {scrapeResult.message}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3 mb-4">
        <div className="relative group w-52 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Hash size={16} />
          </div>
          <input
            type="text"
            placeholder="Search MC/Docket#..."
            className="w-full bg-slate-850/80 border border-slate-700/50 rounded-2xl pl-9 pr-3 py-3 text-white text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-xl"
            value={docketSearch}
            onChange={(e) => setDocketSearch(e.target.value)}
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
            className="w-full bg-slate-850/80 border border-slate-700/50 rounded-2xl pl-11 pr-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-xl"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
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
          className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 text-sm"
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /> Searching...</>
          ) : (
            <><Search size={16} /> Search</>
          )}
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 p-4 bg-slate-950/80 border border-slate-700/50 rounded-3xl overflow-y-auto max-h-[55vh] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <FilterGroup title="Motor Carrier" icon={<Truck size={12} />}>
              <div>
                <FilterLabel>Active</FilterLabel>
                <FilterSelect name="active" value={filters.active} onChange={handleFilterChange} options={activeStatusOptions} />
              </div>
              <div>
                <FilterLabel>State</FilterLabel>
                <MultiSelect options={US_STATES} selected={filters.states} onChange={vals => setFilters(f => ({ ...f, states: vals }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>DOT Number</FilterLabel>
                <input type="number" name="dotNumber" value={filters.dotNumber} onChange={handleFilterChange} placeholder="" min={0}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <FilterLabel>Has Email</FilterLabel>
                <FilterSelect name="hasEmail" value={filters.hasEmail} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
            </FilterGroup>
            <FilterGroup title="Carrier Operation" icon={<Activity size={12} />}>
              <div>
                <FilterLabel>Carrier Operation</FilterLabel>
                <MultiSelect options={CARRIER_OPERATIONS} selected={filters.carrierOperation} onChange={vals => setFilters(f => ({ ...f, carrierOperation: vals }))} placeholder="All" />
              </div>
              <div>
                <FilterLabel>Hazmat</FilterLabel>
                <FilterSelect name="hazmat" value={filters.hazmat} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Power Units</FilterLabel>
                <MinMaxInputs nameMin="powerUnitsMin" nameMax="powerUnitsMax" valueMin={filters.powerUnitsMin} valueMax={filters.powerUnitsMax} onChange={handleFilterChange} />
              </div>
              <div>
                <FilterLabel>Drivers</FilterLabel>
                <MinMaxInputs nameMin="driversMin" nameMax="driversMax" valueMin={filters.driversMin} valueMax={filters.driversMax} onChange={handleFilterChange} />
              </div>
            </FilterGroup>
            <FilterGroup title="Insurance Policy" icon={<Shield size={12} />}>
              <div>
                <FilterLabel>Has BIPD Insurance</FilterLabel>
                <FilterSelect name="bipdOnFile" value={filters.bipdOnFile} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Has Cargo Insurance</FilterLabel>
                <FilterSelect name="cargoOnFile" value={filters.cargoOnFile} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
              <div>
                <FilterLabel>Has Bond Insurance</FilterLabel>
                <FilterSelect name="bondOnFile" value={filters.bondOnFile} onChange={handleFilterChange} options={yesNoOptions} />
              </div>
            </FilterGroup>
            <FilterGroup title="Date Range" icon={<Calendar size={12} />}>
              <div>
                <FilterLabel>From Date</FilterLabel>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <FilterLabel>To Date</FilterLabel>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
              </div>
            </FilterGroup>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
            <button onClick={resetAll} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all border border-slate-700">
              Reset All
            </button>
            <button onClick={applyFilters} disabled={isLoading}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-sm">
        <div className="overflow-auto h-full custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Company</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">DOT#</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">MC#</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">State</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Phone</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Power</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Drivers</th>
                <th className="text-left px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Add Date</th>
                <th className="text-center px-4 py-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest">View</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading ventures...</p>
                  </td>
                </tr>
              ) : ventures.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-20">
                    <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No records found. Try adjusting your filters or scrape new data.</p>
                  </td>
                </tr>
              ) : (
                ventures.map((v, i) => {
                  const statusUpper = (v.operating_status || '').toUpperCase().trim();
                  const isActive = (statusUpper.includes('AUTHORIZED') && !statusUpper.includes('NOT') && !statusUpper.includes('PENDING')) || statusUpper === 'ACTIVE';
                  const isPending = statusUpper.includes('PENDING');
                  const statusClass = isActive
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold'
                    : isPending
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400';
                  const statusLabel = isActive ? 'Active' : val(v.operating_status);
                  return (
                    <tr
                      key={v.id || i}
                      className="border-b border-slate-800/50 hover:bg-indigo-500/5 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(v)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white truncate max-w-[200px]">{val(v.name)}</div>
                        {v.name_dba && <div className="text-xs text-slate-500 truncate max-w-[200px]">{v.name_dba}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{val(v.dot_number)}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{val(v.docket_number)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{val(v.phy_st)}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{val(v.phy_phone)}</td>
                      <td className="px-4 py-3">
                        {v.email_address ? (
                          <span className="text-indigo-400 text-xs truncate max-w-[150px] block">{v.email_address}</span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs text-center">{val(v.total_pwr)}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs text-center">{val(v.total_drivers)}</td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{val(v.add_date)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowClick(v); }}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!isLoading && ventures.length > 0 && (
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-xs text-white font-bold">
            Page {currentPage + 1} · Showing {currentPage * PAGE_SIZE + 1}–{currentPage * PAGE_SIZE + ventures.length}{hasActiveFilters ? ` of ${filteredCount.toLocaleString()}` : (totalCount > 0 ? ` of ${totalCount.toLocaleString()}` : '')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={ventures.length < PAGE_SIZE}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {selectedVenture && <DetailModal v={selectedVenture} onClose={() => setSelectedVenture(null)} />}
    </div>
  );
};
