import React, { useState, useEffect } from 'react';
import { Truck, ChevronRight, Check, Shield, Zap, Lock, ArrowRight, Star, BarChart2 } from 'lucide-react';
import { User } from '../types';
import { updateUserInSupabase, isIPBlocked } from '../services/userService';
import { loginUser, registerUser } from '../services/backendApiService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface LandingProps {
  onLogin: (user: User) => void;
}

export const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  }, [authMode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      let clientIp = '';
      try {
        const ipRes = await fetch(`${BACKEND_URL}/api/get-ip`);
        const ipData = await ipRes.json();
        clientIp = ipData.ip || '';
      } catch {
        clientIp = '';
      }
      if (clientIp) {
        const blocked = await isIPBlocked(clientIp);
        if (blocked) {
          setError("Your IP address has been blocked. Please contact support.");
          return;
        }
      }
      if (authMode === 'register') {
        if (password.length < 8) {
          setError("Password must be at least 8 characters long.");
          return;
        }
        if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
          setError("Password must contain at least one letter and one number.");
          return;
        }
      }
      if (authMode === 'login') {
        const result = await loginUser(email, password);
        if (!result) {
          setError("Invalid email or password. Please try again.");
          return;
        }
        const row = result.user;
        const loggedInUser: User = {
          id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role,
          plan: row.plan,
          dailyLimit: row.daily_limit,
          recordsExtractedToday: row.records_extracted_today,
          lastActive: 'Now',
          ipAddress: row.ip_address || clientIp,
          isOnline: true,
          isBlocked: row.is_blocked || false,
        };
        if (loggedInUser.isBlocked) {
          setError("Your account has been blocked. Please contact support.");
          return;
        }
        updateUserInSupabase({ ...loggedInUser, isOnline: true, lastActive: 'Now', ipAddress: clientIp || loggedInUser.ipAddress }).catch(err => console.error('Failed to sync login status:', err));
        onLogin(loggedInUser);
      } else {
        const result = await registerUser(name, email.toLowerCase(), password, `user-${Date.now()}`, clientIp);
        if (!result) {
          setError("Failed to create account. Email may already be in use.");
          return;
        }
        const row = result.user;
        const createdUser: User = {
          id: row.user_id,
          name: row.name,
          email: row.email,
          role: row.role || 'user',
          plan: row.plan || 'Free',
          dailyLimit: row.daily_limit || 50,
          recordsExtractedToday: row.records_extracted_today || 0,
          lastActive: 'Now',
          ipAddress: row.ip_address || clientIp,
          isOnline: true,
          isBlocked: false,
        };
        onLogin(createdUser);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans overflow-y-auto" style={{ background: 'linear-gradient(135deg, #080E1A 0%, #0D1526 50%, #080E1A 100%)' }}>
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-purple-600/[0.05] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 border-b border-white/[0.05]" style={{ background: 'rgba(8, 14, 26, 0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">FreightIntel</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthMode('login')}
              className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-8 text-xs font-semibold">
            <Zap className="w-3 h-3" />
            Automated FMCSA Data Pipeline
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="text-white">FMCSA Carrier Data</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">
              On Demand
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Pull carrier contacts, authority status, safety ratings, and fleet details directly from FMCSA — filtered and export-ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => setAuthMode('register')}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 hover:scale-105"
            >
              Start Free Trial <ChevronRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 rounded-xl font-semibold text-sm border border-white/[0.08] transition-all flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> View Demo
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-slate-500 text-sm">Trusted by 500+ insurance agencies</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">Everything you need to find leads</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Powerful tools built for insurance professionals who need accurate carrier data fast.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Direct Email Extraction",
                desc: "Decode protected carrier emails from FMCSA registration pages.",
                icon: Shield,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
              },
              {
                title: "Authorization Filtering",
                desc: "Filter out NOT AUTHORIZED carriers so you only see active authorities.",
                icon: Check,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
              },
              {
                title: "Batch Export",
                desc: "Export thousands of carrier records to CSV with safety ratings and contact info.",
                icon: Lock,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group hover:bg-white/[0.04]"
              >
                <div className={`w-10 h-10 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center ${f.color} mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop">
          <div
            className="bg-[#0D1526] border border-white/[0.08] w-full max-w-md p-8 rounded-2xl shadow-2xl relative"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)' }}
          >
            {/* Close */}
            <button
              onClick={() => setAuthMode(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all text-lg"
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">FreightIntel</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-slate-500 text-sm">
                {authMode === 'login' ? 'Enter your credentials to access the dashboard.' : 'Start extracting carrier data in seconds.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full input-field rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600"
                    placeholder="John Smith"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full input-field rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full input-field rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm mt-2"
              >
                {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              {authMode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => setAuthMode('register')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                    Sign up free
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                    Log in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
