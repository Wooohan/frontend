import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Calendar, Search, Filter, ChevronDown, ExternalLink, AlertCircle, X, Database, CheckCircle2, TrendingUp, BarChart3, Clock, ArrowRight } from 'lucide-react';
import { saveFMCSARegisterEntries, fetchFMCSARegisterByExtractedDate } from '../services/fmcsaRegisterService';
import { getToken } from '../services/backendApiService';

interface FMCSARegisterEntry {
  number: string;
  title: string;
  decided: string;
  category: string;
  extracted_date?: string;
}

const categories = [
  'NAME CHANGE', 'CERTIFICATE, PERMIT, LICENSE', 'CERTIFICATE OF REGISTRATION',
  'DISMISSAL', 'WITHDRAWAL', 'REVOCATION', 'TRANSFERS', 'MISCELLANEOUS'
];

function getTodayDate(): string { return new Date().toISOString().split('T')[0]; }
function formatDateForAPI(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(date.getUTCDate()).padStart(2,'0')}-${months[date.getUTCMonth()]}-${String(date.getUTCFullYear()).slice(-2)}`;
}

const inputCls = 'input-field px-3 py-2 text-sm';

export const FMCSARegister: React.FC = () => {
  const [registerData, setRegisterData] = useState<FMCSARegisterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedCategory, setSelectedCategory] = useState('NAME CHANGE');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const stats: Record<string, number> = {};
    registerData.forEach(e => { stats[e.category] = (stats[e.category] || 0) + 1; });
    setCategoryStats(stats);
  }, [registerData]);

  const handleSearch = async () => {
    setIsSearching(true); setError('');
    try {
      const data = await fetchFMCSARegisterByExtractedDate(selectedDate, { category: selectedCategory, searchTerm: searchTerm || undefined });
      if (data?.length > 0) { setRegisterData(data); setLastUpdated(`Loaded ${data.length} records from database`); }
      else { setRegisterData([]); setError(`No data for ${selectedDate}. Try "Fetch Live".`); }
    } catch { setError('Error searching database.'); }
    setIsSearching(false);
  };

  const fetchLive = async () => {
    setIsLoading(true); setError('');
    try {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'https://backend-production-475c.up.railway.app'}/api/fmcsa-register?date=${formatDateForAPI(selectedDate)}`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const entries: FMCSARegisterEntry[] = (data.entries || data || []).map((e: any) => ({
        number: e.number || e['ORDER/DOCKET NO.'] || '',
        title: e.title || e['PROCEEDING TITLE'] || '',
        decided: e.decided || e['DATE DECIDED'] || '',
        category: e.category || selectedCategory,
      }));
      setRegisterData(entries);
      setLastUpdated(`Fetched ${entries.length} live records`);
    } catch (e: any) { setError(`Fetch failed: ${e.message}`); }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!registerData.length) return;
    setSaveStatus('saving');
    try {
      await saveFMCSARegisterEntries(registerData.map(e => ({ ...e, extracted_date: selectedDate })));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 2500); }
  };

  const filteredData = registerData.filter(e =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topCats = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="heading-display text-2xl text-white">FMCSA Register</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Browse daily federal register decisions and authority changes</p>
        </div>
        <div className="flex gap-2">
          {registerData.length > 0 && (
            <button onClick={handleSave} disabled={saveStatus === 'saving'} className="btn-ghost px-4 py-2 text-sm flex items-center gap-2 rounded-xl">
              {saveStatus === 'saving' ? <><RefreshCw size={14} className="animate-spin" /> Saving...</>
               : saveStatus === 'saved' ? <><CheckCircle2 size={14} style={{ color: 'var(--green-text)' }} /> Saved</>
               : <><Database size={14} /> Save to DB</>}
            </button>
          )}
          <button onClick={fetchLive} disabled={isLoading} className="btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-xl">
            {isLoading ? <><RefreshCw size={14} className="animate-spin" /> Fetching...</> : <><TrendingUp size={14} /> Fetch Live</>}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="section-label">Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={`${inputCls} w-40`} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="section-label">Category</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={`${inputCls} w-56`}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-40">
          <label className="section-label">Search Title / Number</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filter results..." className={`${inputCls} w-full pl-8`} />
          </div>
        </div>
        <button onClick={handleSearch} disabled={isSearching} className="btn-primary px-5 py-2 text-sm rounded-xl flex items-center gap-2">
          {isSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
          {isSearching ? 'Searching...' : 'Search DB'}
        </button>
      </div>

      {/* Category mini stats */}
      {topCats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {topCats.map(([cat, count]) => (
            <div key={cat} className="card p-4 cursor-pointer" onClick={() => setSelectedCategory(cat)}
              style={{ borderColor: selectedCategory === cat ? 'var(--border-accent)' : undefined, background: selectedCategory === cat ? 'var(--accent-dim)' : undefined }}>
              <p className="section-label mb-1 truncate">{cat}</p>
              <p className="heading-display text-xl text-white">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status/Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm" style={{ background: 'var(--red-dim)', border: '1px solid var(--red-border)', color: 'var(--red-text)' }}>
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {lastUpdated && !error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm" style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green-text)' }}>
          <Clock size={13} /> {lastUpdated}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <FileText size={15} style={{ color: 'var(--accent-light)' }} />
          <span className="text-sm font-semibold text-white">Register Entries</span>
          {filteredData.length > 0 && <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{filteredData.length} results</span>}
        </div>
        {isLoading || isSearching ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin mr-3" /> Loading register data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={36} className="mb-4 opacity-20" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No register entries. Set a date and click "Fetch Live" or "Search DB".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid var(--border)', background: 'rgba(15,17,24,0.8)' }}>
                <tr>
                  {['Order/Docket', 'Proceeding Title', 'Date Decided', 'Category', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left section-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>{entry.number}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-white truncate">{entry.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{entry.decided}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--border-accent)' }}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`https://www.fmcsa.dot.gov/`} target="_blank" rel="noopener noreferrer"
                        className="btn-ghost px-2 py-1 text-xs rounded-lg flex items-center gap-1 w-fit">
                        <ExternalLink size={11} /> View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
