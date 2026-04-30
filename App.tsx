import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Scraper } from './pages/Scraper';
import { CarrierSearch } from './pages/CarrierSearch';
import { Subscription } from './pages/Subscription';
import { Landing } from './pages/Landing';
import { AdminPanel } from './pages/AdminPanel';
import { FMCSARegister } from './pages/FMCSARegister';
import { NewVenture } from './pages/NewVenture';
import { ViewState, User } from './types';
import { updateUserInSupabase } from './services/userService';
import { logoutUser } from './services/backendApiService';
import { fetchCarriersFromSupabase, CarrierFiltersSupabase } from './services/supabaseClient';
import { ErrorBoundary } from './components/ErrorBoundary';

const SettingsPage: React.FC<{ user: User }> = ({ user }) => (
  <div className="p-8 max-w-2xl mx-auto animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
    <h2 className="heading-display text-2xl text-white mb-2">Settings</h2>
    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Manage your account preferences</p>
    <div className="card p-6 space-y-1">
      {[
        { label: 'Email', value: user.email },
        { label: 'Role', value: user.role },
        { label: 'Plan', value: user.plan },
        { label: 'Daily Limit', value: `${user.dailyLimit.toLocaleString()} records` },
      ].map((item, i, arr) => (
        <div key={i} className={`flex justify-between items-center py-3.5 ${i < arr.length - 1 ? 'border-b' : ''}`}
          style={{ borderColor: 'var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          <span className="text-white text-sm font-medium capitalize">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hussfix_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('hussfix_view');
    return (saved as ViewState) || 'dashboard';
  });

  const [isLoadingCarriers, setIsLoadingCarriers] = useState(false);

  useEffect(() => { if (user) loadCarriers(); }, [user]);

  const loadCarriers = async (filters: CarrierFiltersSupabase = {}) => {
    try {
      setIsLoadingCarriers(true);
      await fetchCarriersFromSupabase(filters);
    } catch (e) {
      console.error('Failed to fetch carriers:', e);
    } finally {
      setIsLoadingCarriers(false);
    }
  };

  useEffect(() => {
    if (user) localStorage.setItem('hussfix_user', JSON.stringify(user));
    else localStorage.removeItem('hussfix_user');
  }, [user]);

  useEffect(() => { localStorage.setItem('hussfix_view', currentView); }, [currentView]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView(userData.role === 'admin' ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    if (user) {
      updateUserInSupabase({ ...user, isOnline: false, lastActive: new Date().toISOString() })
        .catch(console.error);
    }
    logoutUser();
    setUser(null);
    localStorage.removeItem('hussfix_user');
    localStorage.removeItem('hussfix_view');
    setCurrentView('dashboard');
  };

  const handleUpdateUsage = (count: number) => {
    if (!user) return;
    setUser({ ...user, recordsExtractedToday: user.recordsExtractedToday + count });
  };

  const handleViewChange = (view: ViewState) => {
    const isAdmin = user?.role === 'admin';
    const adminOnlyViews: ViewState[] = ['scraper', 'settings', 'admin'];
    if (!isAdmin && adminOnlyViews.includes(view)) {
      setCurrentView('dashboard');
      return;
    }
    setCurrentView(view);
  };

  const renderContent = () => {
    if (!user) return null;
    const isAdmin = user.role === 'admin';
    switch (currentView) {
      case 'dashboard':
        return <Dashboard isLoading={isLoadingCarriers} />;
      case 'scraper':
        return <Scraper user={user} onUpdateUsage={handleUpdateUsage} onUpgrade={() => setCurrentView('subscription')} />;
      case 'carrier-search':
        return <CarrierSearch />;
      case 'new-venture':
        return <NewVenture user={user} />;
      case 'fmcsa-register':
        return <FMCSARegister />;
      case 'subscription':
        return <Subscription />;
      case 'settings':
        return <SettingsPage user={user} />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard isLoading={isLoadingCarriers} />;
      default:
        return <Dashboard isLoading={isLoadingCarriers} />;
    }
  };

  if (!user) return <Landing onLogin={handleLogin} />;

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>
        <Sidebar
          currentView={currentView}
          setCurrentView={handleViewChange}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 ml-60 relative h-screen overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{ background: 'var(--bg-base)' }}>
          {/* Top accent line */}
          <div style={{ position: 'fixed', top: 0, left: 240, right: 0, height: 1, background: 'var(--gradient-accent-line)', pointerEvents: 'none', zIndex: 10 }} />
          {user && renderContent()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
