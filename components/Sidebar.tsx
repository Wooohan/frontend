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

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return (
      <button
        onClick={() => setCurrentView(item.id as ViewState)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 nav-item relative ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-violet-500/20 text-violet-400'
            : 'text-slate-600 group-hover:text-slate-300'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium flex-1 text-left ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>
          {item.label}
        </span>
        {item.id === 'scraper' && isAdmin && (
          <span className="dot-live"></span>
        )}
        {item.id === 'admin' && (
          <span className="bg-red-500/80 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wide">ADM</span>
        )}
        {isActive && (
          <ChevronRight className="w-3.5 h-3.5 text-violet-400/60" />
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
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', boxShadow: '0 4px 16px rgba(124,92,252,0.35)'}}>
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="heading-display text-[15px] text-white tracking-tight">FreightIntel</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="dot-live" style={{width:6,height:6}}></span>
            <span className="text-[10px] text-emerald-400/80 font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/[0.04] mb-3" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        <p className="section-label px-3 mb-2">Navigation</p>
        {mainItems.map(item => <NavItem key={item.id} item={item} />)}

        {toolItems.length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <p className="section-label px-3">Tools</p>
            </div>
            {toolItems.map(item => <NavItem key={item.id} item={item} />)}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="rounded-2xl p-3 mb-2" style={{background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)'}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, rgba(124,92,252,0.4), rgba(167,139,250,0.2))'}}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate heading-display">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-violet-400 font-medium capitalize">{user.plan}</span>
                {user.role === 'admin' && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md font-bold">Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] w-full transition-all rounded-xl group"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:text-red-400 transition-colors" />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
