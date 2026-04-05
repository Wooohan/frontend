import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Users, Database, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, MoreHorizontal, Truck, Shield } from 'lucide-react';
import { DashboardStats, fetchDashboardStatsFromBackend } from '../services/backendApiService';

interface DashboardProps {
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{background:'#1A1C27', border:'1px solid rgba(124,92,252,0.2)', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 30px rgba(0,0,0,0.4)'}}>
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">{payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// Mini sparkline area chart for card
const MiniSparkline = ({ color }: { color: string }) => {
  const data = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15];
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / 15) * 100}`).join(' ');
  const fillPoints = `0,100 ${points} 100,100`;
  return (
    <svg viewBox="0 0 100 50" className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sg-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ isLoading: parentLoading }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const data = await fetchDashboardStatsFromBackend();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const loading = isLoading || parentLoading;
  const totalScraped = stats?.total ?? 0;
  const activeCarriers = stats?.active_carriers ?? 0;
  const brokers = stats?.brokers ?? 0;
  const emailRate = stats?.email_rate ?? '0';
  const notAuthorized = stats?.not_authorized ?? 0;
  const other = stats?.other ?? 0;

  const entityData = [
    { name: 'May', value: Math.round(activeCarriers * 0.6) },
    { name: 'Jun', value: Math.round(activeCarriers * 0.3) },
    { name: 'Jul', value: Math.round(activeCarriers * 0.5) },
    { name: 'Aug', value: Math.round(activeCarriers * 0.8) },
    { name: 'Sep', value: activeCarriers, active: true },
    { name: 'Oct', value: Math.round(activeCarriers * 1.1) },
    { name: 'Nov', value: Math.round(activeCarriers * 0.45) },
  ];

  const statCards = [
    {
      label: 'Total in Database',
      value: totalScraped.toLocaleString(),
      subValue: 'records',
      icon: Database,
      color: '#7C5CFC',
      trend: '+2.4%',
      up: true,
      sparkColor: '#7C5CFC',
    },
    {
      label: 'Active Carriers',
      value: activeCarriers.toLocaleString(),
      subValue: 'authorized',
      icon: Truck,
      color: '#10b981',
      trend: '+5.1%',
      up: true,
      sparkColor: '#10b981',
    },
    {
      label: 'Brokers',
      value: brokers.toLocaleString(),
      subValue: 'registered',
      icon: Users,
      color: '#f59e0b',
      trend: '+1.2%',
      up: true,
      sparkColor: '#f59e0b',
    },
    {
      label: 'Email Coverage',
      value: `${emailRate}%`,
      subValue: 'with contact',
      icon: Activity,
      color: '#ef4444',
      trend: '-0.3%',
      up: false,
      sparkColor: '#ef4444',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-up" style={{opacity: 0, animationFillMode: 'forwards'}}>
      {/* Background decorative orbs */}
      <div className="glow-orb" style={{width:400, height:400, background:'rgba(124,92,252,0.06)', top:-100, right:-100, animationDelay:'0s'}} />
      <div className="glow-orb" style={{width:300, height:300, background:'rgba(16,185,129,0.04)', bottom:200, left:-50, animationDelay:'3s'}} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
        <div>
          <h1 className="heading-display text-2xl text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1 font-light">
            {loading ? 'Syncing carrier data...' : `${totalScraped.toLocaleString()} carriers loaded`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
            loading
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            <span className="dot-live" style={{width:6,height:6, background: loading ? '#f59e0b' : '#34d399', boxShadow: loading ? '0 0 8px rgba(245,158,11,0.7)' : '0 0 8px rgba(52,211,153,0.7)'}}></span>
            {loading ? 'Syncing...' : 'System Operational'}
          </div>
          <button className="btn-ghost p-2 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card p-5 cursor-default">
            {/* Colored dot top right */}
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl" style={{background: `${stat.color}15`}}>
                <stat.icon className="w-4 h-4" style={{color: stat.color}} />
              </div>
              <button className="text-slate-700 hover:text-slate-500 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">
              <p className="text-slate-500 text-xs font-medium mb-1">{stat.label}</p>
              <p className="heading-display text-2xl text-white tracking-tight">
                {loading ? <span className="skeleton inline-block w-20 h-7" /> : stat.value}
              </p>
              <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{stat.trend}</span>
                <span className="text-slate-600 font-normal ml-1">vs last month</span>
              </div>
            </div>

            {/* Sparkline */}
            <MiniSparkline color={stat.sparkColor} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart — Analytics style from ref */}
        <div className="lg:col-span-2 card p-6" style={{background:'#F4F3FF', color:'#1a1628'}}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="heading-display text-xl font-bold" style={{color:'#1a1628'}}>Analytics</h3>
              <p className="text-sm mt-0.5" style={{color:'rgba(26,22,40,0.5)'}}>
                Optimize your carrier pipeline
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{color:'#1a1628', fontFamily:'Syne,sans-serif'}}>
                {loading ? '—' : totalScraped.toLocaleString()}
                <span className="text-sm font-normal opacity-50">.00</span>
              </p>
            </div>
          </div>

          {totalScraped === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center" style={{color:'rgba(26,22,40,0.3)'}}>
              <Database className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Run the scraper to populate carrier data.</p>
            </div>
          ) : (
            <div className="h-[220px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entityData} barSize={36} barGap={6}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(26,22,40,0.45)', fontSize: 12, fontFamily: 'DM Sans' }} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,92,252,0.08)', radius: 8 }} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {entityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.active ? '#8B5CF6' : 'rgba(139,92,246,0.25)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick Stats — dark card */}
        <div className="card p-6 flex flex-col">
          <div className="mb-5">
            <h3 className="heading-display text-base text-white">Data Enrichment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Coverage across all records</p>
          </div>
          <div className="flex-1 space-y-4">
            {[
              { label: 'Safety Rating', value: stats?.with_safety_rating ?? 0, fillClass: 'progress-fill-violet' },
              { label: 'Insurance Data', value: stats?.with_insurance ?? 0, fillClass: 'progress-fill-green' },
              { label: 'Inspections', value: stats?.with_inspections ?? 0, fillClass: 'progress-fill-violet' },
              { label: 'Crash Records', value: stats?.with_crashes ?? 0, fillClass: 'progress-fill-red' },
            ].map((item, i) => {
              const pct = totalScraped > 0 ? Math.round((item.value / totalScraped) * 100) : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <span className="text-xs font-bold text-white">{loading ? '—' : `${pct}%`}</span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div className={`h-full ${item.fillClass}`} style={{ width: loading ? '0%' : `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-600">{loading ? '—' : item.value.toLocaleString()} records</p>
                </div>
              );
            })}
          </div>

          {/* Status breakdown */}
          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            <p className="section-label mb-3">Authority Status</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Auth.', value: activeCarriers, color: '#10b981' },
                { label: 'Not Auth', value: notAuthorized, color: '#ef4444' },
                { label: 'Other', value: other, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-2.5 text-center" style={{background:'rgba(255,255,255,0.03)'}}>
                  <div className="text-sm font-bold" style={{color: s.color}}>{loading ? '—' : s.value.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
