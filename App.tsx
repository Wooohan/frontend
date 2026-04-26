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
import { ViewState, User, CarrierData } from './types';
import { Settings as SettingsIcon } from 'lucide-react';
import { updateUserInSupabase } from './services/userService';
import { logoutUser } from './services/backendApiService';
import { fetchCarriersFromSupabase, CarrierFiltersSupabase } from './services/supabaseClient';
import { ErrorBoundary } from './components/ErrorBoundary';
const SettingsPage: React.FC<{ user: User }> = ({ user }) => (
  <div className="p-8 max-w-2xl mx-auto animate-fade-in">
    <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Settings</h2>
    <p className="text-slate-400 text-sm mb-6">Manage your account preferences</p>
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-1 shadow-sm">
      {[
        { label: 'Email', value: user.email },
        { label: 'Role', value: user.role },
        { label: 'Plan', value: user.plan },
        { label: 'Daily Limit', value: `${user.dailyLimit.toLocaleString()} records` },
      ].map((item, i, arr) => (
        <div key={i} className={`flex justify-between items-center py-3.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
          <span className="text-slate-500 text-sm">{item.label}</span>
          <span className="text-slate-800 text-sm font-medium capitalize">{item.value}</span>
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
  
  const [allCarriers, setAllCarriers] = useState<CarrierData[]>([]);
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(false);
  useEffect(() => {
    if (user) {
      handleCarrierSearch({});
    }
  }, [user]);
  const handleCarrierSearch = async (filters: CarrierFiltersSupabase) => {
    try {
      setIsLoadingCarriers(true);
      const result = await fetchCarriersFromSupabase(filters);
      setAllCarriers(result.data || []);
    } catch (error) {
      console.error("Failed to fetch carriers with filters:", error);
    } finally {
      setIsLoadingCarriers(false);
    }
  };
  useEffect(() => {
    if (user) {
      localStorage.setItem('hussfix_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hussfix_user');
    }
  }, [user]);
  useEffect(() => {
    localStorage.setItem('hussfix_view', currentView);
  }, [currentView]);
  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView(userData.role === 'admin' ? 'admin' : 'dashboard');
  };
  const handleLogout = () => {
    if (user) {
      updateUserInSupabase({ ...user, isOnline: false, lastActive: new Date().toISOString() })
        .catch(err => console.error('Failed to sync logout status:', err));
    }
    logoutUser();
    setUser(null);
    localStorage.removeItem('hussfix_user');
    localStorage.removeItem('hussfix_view');
    setCurrentView('dashboard');
  };
  const handleUpdateUsage = (count: number) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      recordsExtractedToday: user.recordsExtractedToday + count
    };
    setUser(updatedUser);
  };
  const handleUpdateCarriers = (updatedData: CarrierData[]) => {
    setAllCarriers(updatedData);
  };
  const handleViewChange = (view: ViewState) => {
    const isAdmin = user?.role === 'admin';
    const adminOnlyViews: ViewState[] = ['scraper', 'insurance-scraper', 'settings', 'admin'];
    
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
        return (
          <Scraper 
            user={user} 
            onUpdateUsage={handleUpdateUsage}
            onUpgrade={() => setCurrentView('subscription')}
          />
        );
      case 'carrier-search':
        return (
          <CarrierSearch 
            onNavigateToInsurance={() => { if(isAdmin) setCurrentView('insurance-scraper'); }} 
          />
        );
      case 'new-venture':
        return <NewVenture user={user} />;
      case 'fmcsa-register':
        return <FMCSARegister />;
      case 'insurance-scraper':
        return (
          <InsuranceScraper 
            carriers={allCarriers} 
            onUpdateCarriers={handleUpdateCarriers} 
            autoStart={false}
          />
        );
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
  if (!user) {
    return <Landing onLogin={handleLogin} />
  }
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen text-slate-700 font-sans selection:bg-blue-500/20" style={{ background: '#F8FAFC' }}>
        <Sidebar 
          currentView={currentView} 
          setCurrentView={handleViewChange} 
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 ml-60 relative h-screen overflow-y-auto overflow-x-hidden">
          {user && renderContent()}
        </main>
      </div>
    </ErrorBoundary>
  );
};
export default App;
