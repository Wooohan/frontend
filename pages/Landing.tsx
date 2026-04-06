import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ChevronRight, Check, Shield, Zap, Lock, ArrowRight, Star,
  BarChart2, Database, Mail, Download, Filter, Search,
  ShieldCheck, TrendingUp, Users, FileText, Bell, Globe,
  ChevronDown, X, Layers, Activity, MapPin, Phone
} from 'lucide-react';
import { User } from '../types';
import { updateUserInSupabase, isIPBlocked } from '../services/userService';
import { loginUser, registerUser } from '../services/backendApiService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface LandingProps {
  onLogin: (user: User) => void;
}

const useCounter = (target: number, duration = 1800, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
};

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: open ? 'rgba(79,70,229,0.08)' : 'rgba(13,21,38,0.8)', textAlign: 'left', cursor: 'pointer', border: 'none', color: '#E2E8F0', transition: 'background 0.2s' }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>{q}</span>
        <ChevronDown size={18} style={{ color: '#6366F1', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0, marginLeft: 16 }} />
      </button>
      {open && (
        <div style={{ padding: '0 24px 20px', background: 'rgba(13,21,38,0.6)', color: '#94A3B8', fontSize: 14, lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countersStarted, setCountersStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCountersStarted(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setEmail(''); setPassword(''); setName(''); setError(null);
  }, [authMode]);

  const c1 = useCounter(4200000, 2000, countersStarted);
  const c2 = useCounter(1000, 1500, countersStarted);
  const c3 = useCounter(10, 1200, countersStarted);

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
      } catch { clientIp = ''; }
      if (clientIp) {
        const blocked = await isIPBlocked(clientIp);
        if (blocked) { setError("Your IP address has been blocked. Please contact support."); return; }
      }
      if (authMode === 'register') {
        if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
        if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) { setError("Password must contain at least one letter and one number."); return; }
      }
      if (authMode === 'login') {
        const result = await loginUser(email, password);
        if (!result) { setError("Invalid email or password. Please try again."); return; }
        const row = result.user;
        const loggedInUser: User = {
          id: row.user_id, name: row.name, email: row.email, role: row.role, plan: row.plan,
          dailyLimit: row.daily_limit, records_extracted_today: row.records_extracted_today,
          lastActive: 'Now', ipAddress: row.ip_address || clientIp, isOnline: true, isBlocked: row.is_blocked || false,
        };
        if (loggedInUser.isBlocked) { setError("Your account has been blocked. Please contact support."); return; }
        updateUserInSupabase({ ...loggedInUser, isOnline: true, lastActive: 'Now', ipAddress: clientIp || loggedInUser.ipAddress }).catch(console.error);
        onLogin(loggedInUser);
      } else {
        const result = await registerUser(name, email.toLowerCase(), password, `user-${Date.now()}`, clientIp);
        if (!result) { setError("Failed to create account. Email may already be in use."); return; }
        const row = result.user;
        const createdUser: User = {
          id: row.user_id, name: row.name, email: row.email, role: row.role || 'user',
          plan: row.plan || 'Free', dailyLimit: row.daily_limit || 50,
          records_extracted_today: row.records_extracted_today || 0,
          lastActive: 'Now', ipAddress: row.ip_address || clientIp, isOnline: true, isBlocked: false,
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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
            <button onClick={() => setAuthMode('login')} className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all">
              Sign In
            </button>
            <button onClick={() => setAuthMode('register')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-8 text-xs font-semibold">
            <Zap className="w-3 h-3" /> Automated FMCSA Data Pipeline
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
            <button onClick={() => setAuthMode('register')} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 hover:scale-105">
              Start Free Trial <ChevronRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 rounded-xl font-semibold text-sm border border-white/[0.08] transition-all flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> View Demo
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-12">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
            </div>
            <span className="text-slate-500 text-sm">Trusted by 500+ insurance agencies</span>
          </div>
        </div>

        {/* Live UI Mockup */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-2 shadow-2xl">
            <div className="bg-[#0D1526] rounded-xl overflow-hidden border border-white/[0.05]">
              <div className="bg-white/[0.02] border-b border-white/[0.05] p-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono bg-white/[0.03] px-3 py-1 rounded-md">app.freightintel.io/database</div>
                <div className="w-10" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm font-bold text-white">Carrier Database</div>
                  <div className="flex gap-2">
                     <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] rounded-lg font-bold">ACTIVE FILTERS</div>
                     <div className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] rounded-lg font-bold">EXPORT CSV</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { mc: 'MC-123456', name: 'Summit Logistics LLC', dot: '3821944', status: 'ACTIVE' },
                    { mc: 'MC-789012', name: 'Blue Ridge Transport', dot: '2914532', status: 'ACTIVE' },
                    { mc: 'MC-345678', name: 'Horizon Freight Brokers', dot: '1823771', status: 'INACTIVE' },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] items-center">
                      <span className="text-xs font-mono text-indigo-400">{row.mc}</span>
                      <span className="text-xs text-slate-300 font-medium">{row.name}</span>
                      <span className="text-xs text-slate-500">{row.dot}</span>
                      <div className="text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${row.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 border-y border-white/[0.05] relative z-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Carriers Indexed', value: c1 >= 4200000 ? '4.2M+' : c1.toLocaleString(), icon: Database, color: 'text-indigo-400' },
            { label: 'Data Points', value: '1,000s', icon: Layers, color: 'text-emerald-400' },
            { label: 'Research Tools', value: `${c3}+`, icon: Activity, color: 'text-amber-400' },
            { label: 'Sync Frequency', value: 'Live', icon: Zap, color: 'text-blue-400' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className={`mb-3 flex justify-center ${stat.color}`}><stat.icon size={20} /></div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <div className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need to find leads</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Powerful tools built for insurance professionals who need accurate carrier data fast.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Direct Email Extraction",
                desc: "Decode protected carrier emails from FMCSA registration pages instantly.",
                icon: Mail,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
              },
              {
                title: "Authorization Filtering",
                desc: "Filter out NOT AUTHORIZED carriers to focus on active, revenue-generating leads.",
                icon: ShieldCheck,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
              },
              {
                title: "Renewal Targeting",
                desc: "Filter carriers by insurance renewal dates to catch policies before they expire.",
                icon: Bell,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
              },
              {
                title: "Safety Intelligence",
                desc: "Access BASIC scores, inspection history, and violation rates in one profile.",
                icon: Shield,
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10',
                border: 'border-indigo-500/20',
              },
              {
                title: "Bulk CSV Export",
                desc: "Export thousands of leads with full contact info and safety data to your CRM.",
                icon: Download,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
              },
              {
                title: "New Ventures",
                desc: "Target newly registered carriers — the highest converting segment for insurance.",
                icon: TrendingUp,
                color: 'text-rose-400',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/20',
              },
            ].map((f, i) => (
              <div key={i} className="p-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-indigo-500/20 transition-all group hover:bg-white/[0.04]">
                <div className={`w-12 h-12 ${f.bg} border ${f.border} rounded-xl flex items-center justify-center ${f.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-500">Everything you need to know about FreightIntel</p>
          </div>
          {[
            { q: 'What is FreightIntel?', a: 'FreightIntel is a research platform that provides instant access to FMCSA data — safety ratings, compliance history, and contact information — for over 4 million motor carriers.' },
            { q: 'How does email extraction work?', a: 'We automatically decode protected carrier emails from FMCSA records, allowing you to build outreach lists with direct contact info.' },
            { q: 'Can I export carrier data?', a: 'Yes. You can export thousands of carriers to CSV with full contact details, safety scores, and insurance information instantly.' },
          ].map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.05] relative z-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">FreightIntel</span>
          </div>
          <div className="text-slate-600 text-sm">© 2026 FreightIntel AI. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-slate-400">
            <button className="hover:text-white">Privacy</button>
            <button className="hover:text-white">Terms</button>
            <button className="hover:text-white">Support</button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(8,10,16,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="bg-[#0D1526] border border-white/[0.08] w-full max-w-md p-8 rounded-2xl shadow-2xl relative" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)' }}>
            <button onClick={() => setAuthMode(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">
              <X size={18} />
            </button>

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
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" placeholder="John Smith" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" placeholder="name@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm mt-2">
                {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              {authMode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => setAuthMode('register')} className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign up free</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-indigo-400 hover:text-indigo-300 font-semibold">Log in</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
