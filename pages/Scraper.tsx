import React, { useState, useRef, useEffect } from 'react';
import { Play, Download, Pause, Activity, Terminal as TerminalIcon, AlertCircle, CheckCircle2, ShieldCheck, Zap, Lock, Database } from 'lucide-react';
import { CarrierData, ScraperConfig, User } from '../types';
import { downloadCSV } from '../services/mockService';
import {
  startScraperTask,
  stopScraperTask,
  getScraperStatus,
  getScraperData,
  getActiveTask,
  TaskStatus,
} from '../services/backendService';
const POLL_INTERVAL = 1500;
const TASK_ID_KEY = 'hussfix_active_scraper_task_id';
const RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1500;
interface ScraperProps {
  user: User;
  onUpdateUsage: (count: number) => void;
  onUpgrade: () => void;
}
export const Scraper: React.FC<ScraperProps> = ({ user, onUpdateUsage, onUpgrade }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [totalDbSaved, setTotalDbSaved] = useState(0);
  const [totalScrapedCount, setTotalScrapedCount] = useState(0);
  const [config, setConfig] = useState<ScraperConfig>({
    startPoint: '1580000',
    recordCount: 50,
    includeCarriers: true,
    includeBrokers: false,
    onlyAuthorized: true,
    useMockData: false,
    useProxy: true,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [scrapedData, setScrapedData] = useState<CarrierData[]>([]);
  const [progress, setProgress] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierData | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const taskIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevExtractedRef = useRef(0);
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [logs]);
  useEffect(() => {
    const reconnect = async () => {
      for (let attempt = 1; attempt <= RECONNECT_ATTEMPTS; attempt++) {
        try {
          const active = await getActiveTask('scraper');
          if (active.task_id && active.task) {
            const status = active.task;
            if (status.status === 'running' || status.status === 'stopping') {
              taskIdRef.current = active.task_id;
              localStorage.setItem(TASK_ID_KEY, active.task_id);
              setIsRunning(true);
              setLogs(status.logs);
              setProgress(status.progress);
              setTotalDbSaved(status.dbSaved);
              setTotalScrapedCount(status.scrapedCount || status.extracted || 0);
              prevExtractedRef.current = status.extracted || 0;
              if (status.recentData && status.recentData.length > 0) {
                setScrapedData(status.recentData);
              }
              startPolling(active.task_id);
              return;
            }
          }
          // No active task from backend – try localStorage fallback
          const savedTaskId = localStorage.getItem(TASK_ID_KEY);
          if (savedTaskId) {
            const status = await getScraperStatus(savedTaskId);
            if (status && (status.status === 'running' || status.status === 'stopping')) {
              taskIdRef.current = savedTaskId;
              setIsRunning(true);
              setLogs(status.logs);
              setProgress(status.progress);
              setTotalDbSaved(status.dbSaved);
              setTotalScrapedCount(status.scrapedCount || status.extracted || 0);
              prevExtractedRef.current = status.extracted || 0;
              if (status.recentData && status.recentData.length > 0) {
                setScrapedData(status.recentData);
              }
              startPolling(savedTaskId);
              return;
            } else {
              // Task is no longer running, clean up
              localStorage.removeItem(TASK_ID_KEY);
            }
          }
          return; // Backend responded fine, just no active task
        } catch {
          // Network error – retry after delay
          if (attempt < RECONNECT_ATTEMPTS) {
            await new Promise(r => setTimeout(r, RECONNECT_DELAY_MS));
          }
        }
      }
    };
    reconnect();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);
  const startPolling = (taskId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const status = await getScraperStatus(taskId);
      if (!status) return;
      setLogs(status.logs);
      setProgress(status.progress);
      setTotalDbSaved(status.dbSaved);
      if (status.recentData && status.recentData.length > 0) {
        setScrapedData(status.recentData);
      }
      setTotalScrapedCount(status.scrapedCount || status.extracted || 0);
      const newExtracted = status.extracted || 0;
      if (newExtracted > prevExtractedRef.current) {
        onUpdateUsage(newExtracted - prevExtractedRef.current);
        prevExtractedRef.current = newExtracted;
      }
      if (status.status === 'completed' || status.status === 'stopped') {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setIsRunning(false);
        taskIdRef.current = null;
        localStorage.removeItem(TASK_ID_KEY);
        const fullData = await getScraperData(taskId);
        if (fullData && fullData.length > 0) {
          setScrapedData(fullData);
        }
      }
    }, POLL_INTERVAL);
  };
  const toggleRun = async () => {
    if (isRunning) {
      if (taskIdRef.current) {
        await stopScraperTask(taskIdRef.current);
        setLogs(prev => [...prev, 'Stop signal sent to server...']);
      }
    } else {
      if (user.recordsExtractedToday >= user.dailyLimit) {
        setShowUpgradeModal(true);
        return;
      }
      setIsRunning(true);
      prevExtractedRef.current = 0;
      setTotalDbSaved(0);
      setTotalScrapedCount(0);
      setScrapedData([]);
      setProgress(0);
      setLogs([
        'Initializing Server-Side High-Speed Scraper...',
        `Mode: Server-Side Direct (no proxy hop)`,
        `Targeting ${config.recordCount} records starting at MC# ${config.startPoint}`,
        'DB auto-sync every 500 records (30s pause on sync)',
      ]);
      try {
        const result = await startScraperTask({
          startPoint: config.startPoint,
          recordCount: config.recordCount,
          includeCarriers: config.includeCarriers,
          includeBrokers: config.includeBrokers,
          onlyAuthorized: config.onlyAuthorized,
        });
        taskIdRef.current = result.task_id;
        localStorage.setItem(TASK_ID_KEY, result.task_id);
        setLogs(prev => [...prev, `Task ${result.task_id} started on server`]);
        startPolling(result.task_id);
      } catch (e: any) {
        setIsRunning(false);
        setLogs(prev => [...prev, `[Error] Failed to start server task: ${e.message}`]);
      }
    }
  };
  const handleDownload = async () => {
    if (taskIdRef.current) {
      const fullData = await getScraperData(taskIdRef.current);
      if (fullData && fullData.length > 0) {
        downloadCSV(fullData);
        return;
      }
    }
    if (scrapedData.length === 0) return;
    downloadCSV(scrapedData);
  };
  return (
    <div className="p-6 lg:p-8 h-screen flex flex-col overflow-hidden relative animate-fade-up" style={{opacity:0,animationFillMode:"forwards"}}>
      {selectedCarrier && (
        <div className="absolute inset-0 bg-[#0C0E14]/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#1A1C27] border border-white/[0.08] rounded-[var(--radius-lg,20px)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/[0.08] flex justify-between items-center bg-[#13151E]/80">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedCarrier.legalName}</h2>
                <p className="text-[var(--text-secondary)]">MC# {selectedCarrier.mcNumber} | DOT# {selectedCarrier.dotNumber}</p>
              </div>
              <button
                onClick={() => setSelectedCarrier(null)}
                className="p-2 hover:bg-white/[0.06] rounded-full text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <Pause className="rotate-45" size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0F1118] p-6 rounded-[var(--radius-md,14px)] border border-white/[0.08] flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Safety Rating</span>
                  <div className={`text-2xl font-black px-4 py-2 rounded-lg ${
                    selectedCarrier.safetyRating === 'SATISFACTORY' ? 'bg-green-500/20 text-green-400' :
                    selectedCarrier.safetyRating === 'UNSATISFACTORY' ? 'bg-red-500/20 text-[var(--red-text)]' :
                    'bg-[#1A1C27] text-[var(--text-primary)]'
                  }`}>
                    {selectedCarrier.safetyRating || 'N/A'}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-2">Date: {selectedCarrier.safetyRatingDate || 'N/A'}</span>
                </div>
                <div className="bg-[#0F1118] p-6 rounded-[var(--radius-md,14px)] border border-white/[0.08] flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Authority Status</span>
                  <div className={`text-lg font-bold px-3 py-1 rounded-lg ${
                    selectedCarrier.status.includes('AUTHORIZED') && !selectedCarrier.status.includes('NOT AUTHORIZED')
                      ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-[var(--red-text)]'
                  }`}>
                    {selectedCarrier.status}
                  </div>
                </div>
                <div className="bg-[#0F1118] p-6 rounded-[var(--radius-md,14px)] border border-white/[0.08] flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Contact Info</span>
                  <div className="text-white font-medium truncate w-full">{selectedCarrier.email || 'No Email'}</div>
                  <div className="text-[var(--text-secondary)] text-sm">{selectedCarrier.phone}</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-violet-400" />
                  BASIC Performance Scores
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedCarrier.basicScores?.map((score, i) => (
                    <div key={i} className="bg-[#0F1118]/50 border border-white/[0.06] p-4 rounded-[var(--radius-md,14px)]">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 truncate" title={score.category}>
                        {score.category}
                      </div>
                      <div className="text-xl font-mono text-white">{score.measure}</div>
                    </div>
                  ))}
                  {(!selectedCarrier.basicScores || selectedCarrier.basicScores.length === 0) && (
                    <div className="col-span-full py-8 text-center text-[var(--text-faint)] bg-[#0F1118]/50 rounded-[var(--radius-md,14px)] border border-dashed border-white/[0.06]">
                      No BASIC score data available for this carrier.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-green-400" />
                  Out of Service (OOS) Rates
                </h3>
                <div className="overflow-hidden rounded-[var(--radius-md,14px)] border border-white/[0.08]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0F1118] text-[var(--text-secondary)]">
                      <tr>
                        <th className="p-4 font-medium">Inspection Type</th>
                        <th className="p-4 font-medium">OOS %</th>
                        <th className="p-4 font-medium">National Avg %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] bg-[#0F1118]/50">
                      {selectedCarrier.oosRates?.map((rate, i) => (
                        <tr key={i}>
                          <td className="p-4 text-white font-medium">{rate.type}</td>
                          <td className="p-4 text-violet-400 font-mono">{rate.oosPercent}</td>
                          <td className="p-4 text-[var(--text-muted)] font-mono">{rate.nationalAvg}</td>
                        </tr>
                      ))}
                      {(!selectedCarrier.oosRates || selectedCarrier.oosRates.length === 0) && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-[var(--text-faint)]">No OOS data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/[0.08] bg-[#13151E]/80 flex justify-end">
              <button
                onClick={() => setSelectedCarrier(null)}
                className="px-6 py-2 bg-slate-700 hover:bg-white/[0.08] text-white rounded-lg font-bold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <div className="absolute inset-0 bg-[#0C0E14]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1C27] border border-white/[0.08] p-8 rounded-[var(--radius-lg,20px)] max-w-md text-center shadow-2xl">
            <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-violet-400">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              You've hit your limit of {user.dailyLimit.toLocaleString()} records. Upgrade your plan to extract unlimited data.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowUpgradeModal(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-white">Close</button>
              <button onClick={onUpgrade} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold">View Plans</button>
            </div>
          </div>
        </div>
      )}
      {isRunning && totalDbSaved > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-violet-900/90 border border-violet-500/50 backdrop-blur-md rounded-[var(--radius-lg,20px)] px-8 py-4 flex items-center gap-4 shadow-2xl">
          <Database size={20} className="text-violet-400 animate-pulse" />
          <div>
            <p className="text-white font-bold text-sm">Server syncing to DB...</p>
            <p className="text-violet-300 text-xs">{totalDbSaved} records saved (30s pause on sync)</p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="heading-display text-3xl text-white mb-2">Live Scraper</h1>
          <p className="text-[var(--text-secondary)]">Automated FMCSA Extraction Engine</p>
        </div>
        <div className="flex gap-4">
          {scrapedData.length > 0 && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 bg-[#1A1C27] hover:bg-white/[0.06] text-white rounded-[var(--radius-md,14px)] font-medium transition-all"
            >
              <Download size={20} />
              Export CSV
            </button>
          )}
          <button
            onClick={toggleRun}
            className={`flex items-center gap-2 px-8 py-3 rounded-[var(--radius-md,14px)] font-bold transition-all shadow-lg shadow-indigo-500/25 ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {isRunning ? <><Pause size={20} /> Stop</> : <><Play size={20} /> Start Extraction</>}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto pr-2">
          <div className="bg-[#13151E]/80 border border-white/[0.08] p-6 rounded-[var(--radius-lg,20px)] space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="text-violet-400" />
              Search Parameters
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Start MC Number</label>
                <input
                  type="text"
                  value={config.startPoint}
                  onChange={(e) => setConfig({ ...config, startPoint: e.target.value })}
                  className="w-full bg-[#0F1118] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  placeholder="e.g. 1580000"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Number of Records</label>
                <input
                  type="number"
                  value={config.recordCount}
                  onChange={(e) => setConfig({ ...config, recordCount: parseInt(e.target.value) })}
                  className="w-full bg-[#0F1118] border border-white/[0.08] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  disabled={isRunning}
                />
              </div>
              <div className="bg-[#0F1118] p-4 rounded-[var(--radius-md,14px)] border border-white/[0.08]">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">Connection Mode</label>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className={config.useProxy ? 'text-green-400' : 'text-[var(--text-faint)]'} />
                      <span className={`text-sm ${config.useProxy ? 'text-white' : 'text-[var(--text-secondary)]'}`}>Use Secure Proxy</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.useProxy}
                      onChange={(e) => setConfig({ ...config, useProxy: e.target.checked })}
                      className="w-4 h-4 rounded border-white/[0.1] text-violet-600 bg-[#0F1118]"
                      disabled={isRunning}
                    />
                  </label>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {config.useProxy
                      ? 'Routes requests through our servers. Best for compatibility.'
                      : 'Direct connection. Requires VPN and CORS extension. Fastest.'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Target Entities</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeCarriers}
                      onChange={(e) => setConfig({ ...config, includeCarriers: e.target.checked })}
                      className="w-4 h-4 rounded border-white/[0.1] text-violet-600 focus:ring-violet-500 bg-[#0F1118]"
                      disabled={isRunning}
                    />
                    <span className="text-white">Carriers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeBrokers}
                      onChange={(e) => setConfig({ ...config, includeBrokers: e.target.checked })}
                      className="w-4 h-4 rounded border-white/[0.1] text-violet-600 focus:ring-violet-500 bg-[#0F1118]"
                      disabled={isRunning}
                    />
                    <span className="text-white">Brokers</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-white/[0.08]">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={config.onlyAuthorized}
                    onChange={(e) => setConfig({ ...config, onlyAuthorized: e.target.checked })}
                    className="w-4 h-4 rounded border-white/[0.1] text-violet-600 focus:ring-violet-500 bg-[#0F1118]"
                    disabled={isRunning}
                  />
                  <span className="text-white">Only Authorized Status</span>
                </label>
                <div className="bg-[#0F1118] p-3 rounded-lg border border-white/[0.08] opacity-50">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[var(--text-secondary)]">Mock Mode (Simulation)</span>
                    <input
                      type="checkbox"
                      checked={config.useMockData}
                      onChange={(e) => setConfig({ ...config, useMockData: e.target.checked })}
                      className="w-4 h-4 rounded border-white/[0.1] text-violet-600 bg-[#0F1118]"
                      disabled={isRunning}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#13151E]/80 border border-white/[0.08] p-6 rounded-[var(--radius-lg,20px)]">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Batch Progress</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="progress-track h-2.5 mb-6">
              <div
                className="progress-fill-violet h-2.5 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/[0.08] pt-4">
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-xs">Daily Limit Usage</span>
                <div className="flex items-center gap-1">
                  <span className={`font-bold ${user.recordsExtractedToday >= user.dailyLimit ? 'text-[var(--red-text)]' : 'text-white'}`}>
                    {user.recordsExtractedToday.toLocaleString()}
                  </span>
                  <span className="text-[var(--text-muted)]">/ {user.dailyLimit.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[var(--text-muted)] text-xs">Batch Extracted</span>
                <span className="text-white font-bold">{scrapedData.length}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                <Database size={13} className={isRunning ? 'text-violet-400 animate-pulse' : 'text-[var(--text-muted)]'} />
                <span>{isRunning ? 'Server syncing...' : 'DB Synced'}</span>
              </div>
              <span className="text-white font-bold text-sm">{totalDbSaved.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
          <div className="flex-1 rounded-[var(--radius-lg,20px)] border border-white/[0.06] font-mono text-sm p-4 overflow-y-auto custom-scrollbar relative" style={{background:"#080A10"}}>
            <div className="absolute top-0 left-0 right-0 backdrop-blur p-2 border-b border-white/[0.06] flex items-center justify-between px-4 sticky z-10" style={{background:"rgba(8,10,16,0.97)"}}>
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-[var(--text-secondary)]" />
                <span className="text-[var(--text-secondary)] text-xs">System Console</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-green-500" />
                <span className="text-[10px] text-green-500">Server-Side Direct</span>
              </div>
            </div>
            <div className="mt-8 space-y-1">
              {logs.length === 0 && <span className="text-[var(--text-faint)] italic">Ready to initialize...</span>}
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`pb-1 border-b border-slate-900/50 ${
                    log.includes('[Error]') || log.includes('[Fail]') ? 'text-[var(--red-text)]' :
                    log.includes('[Success]') ? 'text-green-400' :
                    log.includes('LIMIT REACHED') ? 'text-red-500 font-bold' :
                    log.includes('DB Sync') || log.includes('Pausing') ? 'text-violet-300' :
                    'text-[var(--text-primary)]'
                  }`}
                >
                  <span className="opacity-50 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
          <div className="h-72 bg-[#13151E]/80 border border-white/[0.08] rounded-[var(--radius-lg,20px)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/[0.08] bg-[#1A1C27]/80 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Live Results Preview</h3>
              <span className="text-xs text-[var(--text-muted)]">{isRunning ? totalScrapedCount : scrapedData.length} records found</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-[var(--text-secondary)]">
                <thead className="text-white sticky top-0" style={{background:"#0F1118"}}>
                  <tr>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">MC#</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Legal Name</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Rating</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Email</th>
                    <th className="p-3 font-medium text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {scrapedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[var(--text-faint)]">No data extracted yet.</td>
                    </tr>
                  ) : (
                    scrapedData.slice().reverse().map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.04] transition-colors group">
                        <td className="p-3 font-mono text-white">{row.mcNumber}</td>
                        <td className="p-3 truncate max-w-[150px]" title={row.legalName}>{row.legalName}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.safetyRating === 'SATISFACTORY' ? 'bg-green-500/20 text-green-300' :
                            row.safetyRating === 'UNSATISFACTORY' ? 'bg-red-500/20 text-red-300' :
                            'bg-slate-700 text-[var(--text-secondary)]'
                          }`}>
                            {row.safetyRating || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          {row.status.includes('AUTHORIZED') && !row.status.includes('NOT AUTHORIZED') ? (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 size={14} />
                              <span className="text-[10px]">Auth</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[var(--red-text)]">
                              <AlertCircle size={14} />
                              <span className="text-[10px]">Not Auth</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 truncate max-w-[150px]" title={row.email}>{row.email || '-'}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedCarrier(row)}
                            className="text-xs text-violet-400 hover:text-violet-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
