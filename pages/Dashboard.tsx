import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { Users, Database, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, MoreHorizontal, Zap, Shield } from 'lucide-react';
import { DashboardStats, fetchDashboardStatsFromBackend } from '../services/backendApiService';

interface DashboardProps {
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-purple-500/30 rounded-xl px-4 py-3 shadow-2xl backdrop-blur">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-purple-300">{payload[0]?.value?.toLocaleString()}</p>
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
      gradient: 'from-blue-500/20 to-blue-600/10',
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
      gradient: 'from-emerald-500/20 to-emerald-600/10',
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
      gradient: 'from-purple-500/20 to-purple-600/10',
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
      gradient: 'from-indigo-500/20 to-indigo-600/10',
      trend: '-0.3%',
      up: false,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-2">
            {loading ? 'Loading carrier data...' : `${totalScraped.toLocaleString()} carriers in database`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border transition-all ${
            loading
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
            {loading ? 'Loading...' : 'System Operational'}
          </div>
          <button className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all hover:border-purple-500/20">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`stat-card premium-card group cursor-default relative overflow-hidden rounded-2xl p-6 transition-all duration-300`}
          >
            {/* Gradient background overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-5">
                <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <button className="text-slate-600 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold text-white tracking-tight mb-3">
                  {loading ? (
                    <span className="inline-block w-24 h-8 bg-slate-700/50 rounded-lg animate-pulse" />
                  ) : stat.value}
                </p>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{stat.trend}</span>
                  <span className="text-slate-500 font-normal">vs last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 premium-card rounded-2xl p-7">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h3 className="text-lg font-bold text-white">Authority Status</h3>
              <p className="text-xs text-slate-400 mt-1">Carrier authorization distribution</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          {totalScraped === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-600">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">No carrier data available</p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entityData} barSize={52}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,85,247,0.08)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {entityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="premium-card rounded-2xl p-7">
          <div className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Data Enrichment</h3>
              <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-slate-400">Database metrics</p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Safety Rating', value: stats?.with_safety_rating ?? 0, color: 'from-blue-500 to-blue-600', icon: '📊' },
              { label: 'Insurance', value: stats?.with_insurance ?? 0, color: 'from-emerald-500 to-emerald-600', icon: '🛡️' },
              { label: 'Inspections', value: stats?.with_inspections ?? 0, color: 'from-purple-500 to-purple-600', icon: '✓' },
              { label: 'Crashes', value: stats?.with_crashes ?? 0, color: 'from-red-500 to-red-600', icon: '⚠️' },
            ].map((item, i) => {
              const pct = totalScraped > 0 ? Math.round((item.value / totalScraped) * 100) : 0;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                    <span className="text-xs font-bold text-white">{loading ? '—' : item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.08]">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: loading ? '0%' : `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card rounded-2xl p-6">
          <h4 className="text-base font-bold text-white mb-4">System Health</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <span className="text-sm text-slate-300">Database Status</span>
              <span className="text-xs font-bold text-emerald-400">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <span className="text-sm text-slate-300">API Response</span>
              <span className="text-xs font-bold text-emerald-400">Normal</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <span className="text-sm text-slate-300">Last Update</span>
              <span className="text-xs font-bold text-slate-400">2 min ago</span>
            </div>
          </div>
        </div>

        <div className="premium-card rounded-2xl p-6">
          <h4 className="text-base font-bold text-white mb-4">Quick Actions</h4>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold hover:from-purple-500 hover:to-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/30">
              Run Scraper
            </button>
            <button className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-sm font-semibold hover:bg-white/[0.08] hover:border-purple-500/20 transition-all">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
