import React from 'react';
import { LayoutDashboard, Truck, CreditCard, Settings, Terminal, LogOut, ShieldAlert, Database, ShieldCheck, Rocket, ChevronRight } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, user, onLogout }) => {
  const isAdmin = user.role === 'admin';
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, group: 'main' },
    { id: 'scraper', label: 'Live Scraper', icon: Terminal, adminOnly: true, group: 'main' },
    { id: 'carrier-search', label: 'Carrier Database', icon: Database, adminOnly: false, group: 'main' },
    { id: 'new-venture', label: 'New Ventures', icon: Rocket, adminOnly: false, group: 'main' },
    { id: 'fmcsa-register', label: 'FMCSA Register', icon: Database, adminOnly: false, group: 'main' },
    { id: 'insurance-scraper', label: 'Insurance Scraper', icon: ShieldCheck, adminOnly: true, group: 'tools' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, adminOnly: false, group: 'tools' },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true, group: 'tools' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, adminOnly: true, group: 'tools' },
  ];

  const navItems = allNavItems.filter(item => isAdmin || !item.adminOnly);
  const mainItems = navItems.filter(i => i.group === 'main');
  const toolItems = navItems.filter(i => i.group === 'tools');

  const NavItem = ({ item }: { item: typeof navItems[0]; key?: string }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setCurrentView(item.id as ViewState)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
          isActive
            ? 'nav-active text-indigo-300'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
        }`}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-slate-600 group-hover:text-slate-300 group-hover:bg-white/[0.06]'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium flex-1 text-left ${isActive ? 'text-slate-200' : ''}`}>
          {item.label}
        </span>
        {item.id === 'scraper' && isAdmin && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"></span>
        )}
        {item.id === 'admin' && (
          <span className="bg-red-500/80 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wide">ADM</span>
        )}
        {isActive && (
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />
        )}
      </button>
    );
  };

  return (
    <aside className="w-60 sidebar-bg flex flex-col h-screen fixed left-0 top-0 z-10">
      {/* Top accent line */}
      <div className="h-px accent-line w-full" />

      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-white tracking-tight">FreightIntel</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] text-emerald-400/80 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.04] mb-3" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {mainItems.map(item => <NavItem key={item.id} item={item} />)}

        {toolItems.length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3">Tools</p>
            </div>
            {toolItems.map(item => <NavItem key={item.id} item={item} />)}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-indigo-400 font-medium">{user.plan}</span>
                {user.role === 'admin' && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md font-bold">Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] w-full transition-all rounded-lg group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
