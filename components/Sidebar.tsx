import React from 'react';
import { LayoutDashboard, Truck, CreditCard, Settings, Terminal, LogOut, ShieldAlert, Database, Rocket, ChevronRight } from 'lucide-react';
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
    { id: 'dashboard',      label: 'Dashboard',        icon: LayoutDashboard, adminOnly: false, group: 'main' },
    { id: 'scraper',        label: 'Live Scraper',      icon: Terminal,        adminOnly: true,  group: 'main', live: true },
    { id: 'carrier-search', label: 'Carrier Database',  icon: Database,        adminOnly: false, group: 'main' },
    { id: 'new-venture',    label: 'New Ventures',      icon: Rocket,          adminOnly: false, group: 'main' },
    { id: 'fmcsa-register', label: 'FMCSA Register',    icon: Database,        adminOnly: false, group: 'main' },
    { id: 'subscription',   label: 'Subscription',      icon: CreditCard,      adminOnly: false, group: 'tools' },
    { id: 'settings',       label: 'Settings',          icon: Settings,        adminOnly: true,  group: 'tools' },
    { id: 'admin',          label: 'Admin Panel',       icon: ShieldAlert,     adminOnly: true,  group: 'tools' },
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
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 12,
          border: isActive ? '1px solid rgba(124,92,252,0.25)' : '1px solid transparent',
          background: isActive ? 'linear-gradient(135deg, rgba(124,92,252,0.18), rgba(124,92,252,0.07))' : 'transparent',
          boxShadow: isActive ? '0 0 16px rgba(124,92,252,0.08)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textAlign: 'left',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isActive ? 'rgba(124,92,252,0.2)' : 'transparent',
          transition: 'all 0.2s ease',
        }}>
          <Icon size={15} color={isActive ? '#A78BFA' : '#475569'} />
        </div>
        <span style={{
          flex: 1, fontSize: 13, fontWeight: 500,
          color: isActive ? '#E2E8F0' : '#64748B',
          fontFamily: 'DM Sans, sans-serif',
          transition: 'color 0.2s',
        }}>
          {item.label}
        </span>
        {item.live && isAdmin && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.7)', animation: 'pulseDot 2s ease-in-out infinite' }} />
        )}
        {item.id === 'admin' && (
          <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 9, padding: '2px 6px', borderRadius: 5, fontWeight: 700, letterSpacing: '0.05em' }}>ADM</span>
        )}
        {isActive && <ChevronRight size={13} color="rgba(167,139,250,0.5)" />}
      </button>
    );
  };

  return (
    <aside style={{
      width: 240, display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'fixed', left: 0, top: 0, zIndex: 10,
      background: 'linear-gradient(180deg, #0F1118 0%, #0C0E14 60%, #0F1118 100%)',
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Top accent */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.7), rgba(167,139,250,0.4), transparent)' }} />

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,92,252,0.35)', flexShrink: 0 }}>
          <Truck size={16} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'white', lineHeight: 1 }}>FreightIntel</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.8)', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'rgba(52,211,153,0.8)', fontWeight: 500 }}>Live</span>
          </div>
        </div>
      </div>

      <div style={{ margin: '0 16px', height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 12 }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }} className="scrollbar-hide">
        <div style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 12px', marginBottom: 6 }}>Navigation</div>
        {mainItems.map(item => <NavItem key={item.id} item={item} />)}

        {toolItems.length > 0 && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '12px 4px' }} />
            <div style={{ fontSize: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 12px', marginBottom: 6 }}>Tools</div>
            {toolItems.map(item => <NavItem key={item.id} item={item} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ background: 'rgba(124,92,252,0.07)', border: '1px solid rgba(124,92,252,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,92,252,0.5), rgba(167,139,250,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'white', flexShrink: 0 }}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: '#9B7EFD', fontWeight: 500, textTransform: 'capitalize' }}>{user.plan}</span>
                {user.role === 'admin' && (
                  <span style={{ fontSize: 9, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
