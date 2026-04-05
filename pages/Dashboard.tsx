import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { Users, Database, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, MoreHorizontal } from 'lucide-react';
import { DashboardStats, fetchDashboardStatsFromBackend } from '../services/backendApiService';

interface DashboardProps {
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-white">{payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
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
    { name: 'Authorized', value: activeCarriers, color: '#34d399' },
    { name: 'Not Auth', value: notAuthorized, color: '#f87171' },
    { name: 'Other', value: other, color: '#fbbf24' },
  ];

  const statCards = [
    {
      label: 'Total in DB',
      value: totalScraped.toLocaleString(),
      icon: Database,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      trend: '+2.4%',
      up: true,
    },
    {
      label: 'Active Carriers',
      value: activeCarriers.toLocaleString(),
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      trend: '+5.1%',
      up: true,
    },
    {
      label: 'Brokers',
      value: brokers.toLocaleString(),
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      trend: '+1.2%',
      up: true,
    },
    {
      label: 'Email Rate',
      value: `${emailRate}%`,
      icon: TrendingUp,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      trend: '-0.3%',
      up: false,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? 'Loading carrier data...' : `${totalScraped.toLocaleString()} carriers loaded from database`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${
            loading
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
            {loading ? 'Loading...' : 'System Operational'}
          </div>
          <button className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`stat-card bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/20 cursor-default`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} border ${stat.border}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <button className="text-slate-600 hover:text-slate-400 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white tracking-tight">
                {loading ? (
                  <span className="inline-block w-20 h-7 bg-slate-800 rounded-lg animate-pulse" />
                ) : stat.value}
              </p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{stat.trend}</span>
                <span className="text-slate-600 font-normal ml-1">vs last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">Authority Status Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Carrier authorization distribution</p>
            </div>
          </div>
          {totalScraped === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-600">
              <Database className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No carrier data available. Run the scraper to populate.</p>
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entityData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {entityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-white">Quick Stats</h3>
            <p className="text-xs text-slate-500 mt-0.5">Database enrichment metrics</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'With Safety Rating', value: stats?.with_safety_rating ?? 0, color: 'bg-blue-500' },
              { label: 'With Insurance', value: stats?.with_insurance ?? 0, color: 'bg-emerald-500' },
              { label: 'With Inspections', value: stats?.with_inspections ?? 0, color: 'bg-purple-500' },
              { label: 'With Crashes', value: stats?.with_crashes ?? 0, color: 'bg-red-500' },
            ].map((item, i) => {
              const pct = totalScraped > 0 ? Math.round((item.value / totalScraped) * 100) : 0;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                    <span className="text-xs font-bold text-white">{loading ? '—' : item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: loading ? '0%' : `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
