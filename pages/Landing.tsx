import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ChevronRight, Check, Shield, Zap, ArrowRight, Star,
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
    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '1rem', overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: open ? 'rgba(79, 70, 229, 0.08)' : 'transparent', textAlign: 'left', cursor: 'pointer', border: 'none', color: '#E8EAF0', transition: 'background 0.2s' }}
      >
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 15 }}>{q}</span>
        <ChevronDown size={18} style={{ color: '#6366F1', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0, marginLeft: 16 }} />
      </button>
      {open && (
        <div style={{ padding: '0 24px 20px', color: '#94A3B8', fontSize: 14, lineHeight: 1.7 }}>
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

  const S: React.CSSProperties = { fontFamily: 'Syne, sans-serif' };

  // Common Styles based on your requirements
  const primaryButtonStyle: React.CSSProperties = {
    background: '#4F46E5',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#CBD5E1',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '1rem',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080E1A', color: '#E8EAF0', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '5%', width: 700, height: 700, background: 'rgba(79, 70, 229, 0.05)', borderRadius: '50%', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 400, height: 400, background: 'rgba(59, 130, 246, 0.03)', borderRadius: '50%', filter: 'blur(100px)' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(8, 14, 26, 0.8)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={16} color="white" />
            </div>
            <span style={{ ...S, fontSize: 17, fontWeight: 700, color: 'white' }}>FreightIntel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setAuthMode('login')} style={{ ...secondaryButtonStyle, padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500 }}>
              Sign In
            </button>
            <button onClick={() => setAuthMode('register')} style={{ ...primaryButtonStyle, padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, gap: 6 }}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 100, textAlign: 'center', padding: '140px 24px 100px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.2)', color: '#818CF8', fontSize: 12, fontWeight: 600, marginBottom: 32, letterSpacing: '0.05em' }}>
            <Zap size={12} /> AUTOMATED FMCSA DATA PIPELINE
          </div>

          <h1 style={{ ...S, fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'white' }}>Get the Full Picture</span>
            <br />
            <span style={{ color: '#6366F1' }}>Instantly.</span>
          </h1>

          <p style={{ fontSize: 18, color: '#64748B', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            The ultimate motor carrier research platform for insurance professionals. Find carriers, extract contacts, and verify authority — all in one place.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <button onClick={() => setAuthMode('register')} style={{ ...primaryButtonStyle, padding: '14px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700, gap: 8 }}>
              Start Free Trial <ChevronRight size={16} />
            </button>
            <button onClick={() => setAuthMode('login')} style={{ ...secondaryButtonStyle, padding: '14px 32px', borderRadius: 14, fontSize: 15, fontWeight: 600, gap: 8 }}>
              <BarChart2 size={16} /> Sign In
            </button>
          </div>
        </div>

        {/* Hero mockup */}
        <div style={{ maxWidth: 1000, margin: '72px auto 0', position: 'relative' }}>
          <div style={{ ...cardStyle, padding: 3, boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
            <div style={{ background: '#0F1118', borderRadius: 'calc(1rem - 3px)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#EF4444','#F59E0B','#10B981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#475569', marginLeft: 8, textAlign: 'left' }}>
                  app.freightintel.io/carrier-database
                </div>
              </div>
              {/* Mock table */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ ...S, color: 'white', fontSize: 16, fontWeight: 700 }}>Carrier Database</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ ...secondaryButtonStyle, padding: '6px 14px', borderRadius: 10, fontSize: 12 }}>Advanced Filters</div>
                    <div style={{ ...primaryButtonStyle, padding: '6px 14px', borderRadius: 10, fontSize: 12 }}>Export CSV</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 90px 80px', gap: 16, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4, textAlign: 'left' }}>
                  {['MC #','Legal Name','DOT','Status','Entity'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155' }}>{h}</span>
                  ))}
                </div>
                {[
                  { mc: 'MC-123456', name: 'Summit Logistics LLC', dot: '3821944', status: 'ACTIVE', entity: 'CARRIER', active: true },
                  { mc: 'MC-789012', name: 'Blue Ridge Transport', dot: '2914532', status: 'ACTIVE', entity: 'CARRIER', active: true },
                  { mc: 'MC-345678', name: 'Horizon Freight Brokers', dot: '1823771', status: 'INACTIVE', entity: 'BROKER', active: false },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 90px 80px', gap: 16, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', textAlign: 'left' }}>
                    <span style={{ fontSize: 12, color: '#818CF8', fontWeight: 600, fontFamily: 'monospace' }}>{row.mc}</span>
                    <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>{row.name}</span>
                    <span style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{row.dot}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: row.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: row.active ? '#34D399' : '#F87171', border: `1px solid ${row.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>{row.status}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)' }}>{row.entity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ position: 'relative', zIndex: 1, padding: '60px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
          {[
            { value: c1 >= 4200000 ? '4.2M+' : c1.toLocaleString(), label: 'Companies Indexed', icon: Database, color: '#6366F1' },
            { value: '1,000s', label: 'Data Points Per Carrier', icon: Layers, color: '#10B981' },
            { value: `${c3}+`, label: 'Pro Research Tools', icon: Activity, color: '#F59E0B' },
            { value: 'Weekly', label: 'Feature Releases', icon: Zap, color: '#EC4899' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '32px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div style={{ ...S, fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOOLS GRID ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'white', marginBottom: 16 }}>Powerful Research Tools</h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>Everything you need to find leads, verify carriers, and close more accounts.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { icon: Database, title: 'FMCSA Database', desc: '4.2M+ carriers indexed with real-time authority status, contact info, and compliance data.', color: '#6366F1', tag: 'Core' },
              { icon: Mail, title: 'Email Extraction', desc: 'Decode protected carrier emails directly from FMCSA registration pages for targeted outreach.', color: '#10B981', tag: 'Popular' },
              { icon: Bell, title: 'Renewal Targeting', desc: 'Filter carriers by insurance renewal month and target expiring policies before competitors.', color: '#F59E0B', tag: 'Hot' },
              { icon: ShieldCheck, title: 'Safety Intelligence', desc: 'Instant access to BASIC scores, inspection history, crash records, and OOS violation rates.', color: '#EC4899', tag: 'Pro' },
              { icon: Download, title: 'Bulk CSV Export', desc: 'Export thousands of filtered carrier records with full contact and compliance data instantly.', color: '#8B5CF6', tag: 'Core' },
              { icon: TrendingUp, title: 'New Ventures', desc: 'Target newly registered carriers — the highest-converting segment for commercial insurance.', color: '#F97316', tag: 'Unique' },
            ].map((f, i) => (
              <div key={i} style={{ ...cardStyle, padding: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '2px 8px', borderRadius: 6, background: `${f.color}15`, border: `1px solid ${f.color}30`, fontSize: 10, fontWeight: 700, color: f.color }}>{f.tag}</div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <div style={{ ...S, fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'white', marginBottom: 16 }}>Frequently Asked Questions</h2>
          </div>
          {[
            { q: 'What is FreightIntel?', a: 'FreightIntel is a comprehensive carrier research platform built specifically for insurance professionals. We provide access to FMCSA data for over 4 million carriers.' },
            { q: 'Can I export carrier data?', a: 'Yes — export thousands of filtered carriers to CSV with full contact details and authority status instantly.' },
            { q: 'Is there a free trial?', a: 'Yes, FreightIntel offers a free trial with access to core features. No credit card required to get started.' },
          ].map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 120px' }}>
        <div style={{ ...cardStyle, maxWidth: 780, margin: '0 auto', textAlign: 'center', padding: '72px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'rgba(79, 70, 229, 0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
          <h2 style={{ ...S, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'white', marginBottom: 20 }}>Ready to Close More Accounts?</h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <button onClick={() => setAuthMode('register')} style={{ ...primaryButtonStyle, padding: '16px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, gap: 8 }}>
              Start Free Trial <ChevronRight size={18} />
            </button>
            <button onClick={() => setAuthMode('login')} style={{ ...secondaryButtonStyle, padding: '16px 40px', borderRadius: 14, fontSize: 16, fontWeight: 600 }}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={14} color="white" />
            </div>
            <span style={{ ...S, fontSize: 15, fontWeight: 700, color: 'white' }}>FreightIntel</span>
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>© 2025 FreightIntel. All rights reserved.</div>
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {authMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(8, 10, 16, 0.9)', backdropFilter: 'blur(10px)' }}>
          <div style={{ ...cardStyle, background: '#13151E', width: '100%', maxWidth: 440, padding: 36, position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
            <button onClick={() => setAuthMode(null)} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748B', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ ...S, fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
            </div>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Smith"
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white' }} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white' }} />
              </div>
              <button type="submit" disabled={isLoading} style={{ ...primaryButtonStyle, width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, marginTop: 8 }}>
                {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
