import React, { useState, useEffect } from 'react';
import { Users, Activity, DollarSign, Server, Edit2, Save, X, Search, Ban, UserPlus, Shield, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { User, BlockedIP } from '../types';
import {
  fetchUsersFromSupabase,
  createUserInSupabase,
  updateUserInSupabase,
  deleteUserFromSupabase,
  fetchBlockedIPsFromSupabase,
  blockIPInSupabase,
  unblockIPInSupabase
} from '../services/userService';

const formatLastActive = (lastActive: string): string => {
  if (!lastActive || lastActive === 'Never') return 'Inactive';
  if (lastActive === 'Now') return 'Now';
  const date = new Date(lastActive);
  if (isNaN(date.getTime())) return lastActive;
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec/60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec/3600)}h ago`;
  return `${Math.floor(diffSec/86400)}d ago`;
};

const inputCls = 'input-field w-full px-3 py-2 text-sm';
const labelCls = 'block section-label mb-1.5';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'blocked' | 'add'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPlan, setNewUserPlan] = useState<'Free' | 'Starter' | 'Pro' | 'Enterprise'>('Free');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [blockIpAddress, setBlockIpAddress] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, blockedIPsData] = await Promise.all([fetchUsersFromSupabase(), fetchBlockedIPsFromSupabase()]);
      setUsers(usersData);
      setBlockedIPs(blockedIPsData);
    } catch { showMessage('error', 'Failed to load data'); }
    setIsLoading(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const activeUsers = users.filter(u => u.isOnline).length;
  const totalRevenue = users.reduce((acc, u) => u.plan === 'Pro' ? acc + 149 : u.plan === 'Enterprise' ? acc + 499 : acc, 0);

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const userToUpdate = users.find(u => u.id === editingId);
      if (!userToUpdate) return;
      const updated = { ...userToUpdate, ...editForm };
      await updateUserInSupabase(updated);
      setUsers(users.map(u => u.id === editingId ? updated : u));
      setEditingId(null);
      setEditForm({});
      showMessage('success', 'User updated successfully');
    } catch { showMessage('error', 'Failed to update user'); }
    setIsSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUserFromSupabase(userId);
      setUsers(users.filter(u => u.id !== userId));
      showMessage('success', 'User deleted');
    } catch { showMessage('error', 'Failed to delete user'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        plan: newUserPlan,
        dailyLimit: newUserPlan === 'Pro' ? 50000 : newUserPlan === 'Enterprise' ? 999999 : 1000,
        recordsExtractedToday: 0,
        lastActive: 'Never',
        ipAddress: '',
        isOnline: false,
        isBlocked: false,
      };
      await createUserInSupabase(newUser, newUserPassword);
      setUsers([...users, newUser]);
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserPlan('Free'); setNewUserRole('user');
      showMessage('success', 'User created successfully');
      setActiveTab('users');
    } catch { showMessage('error', 'Failed to create user'); }
    setIsSaving(false);
  };

  const handleBlockIP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await blockIPInSupabase(blockIpAddress, blockReason);
      setBlockedIPs([...blockedIPs, { ip: blockIpAddress, reason: blockReason, blockedAt: new Date().toISOString() }]);
      setBlockIpAddress(''); setBlockReason('');
      showMessage('success', 'IP blocked');
    } catch { showMessage('error', 'Failed to block IP'); }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await unblockIPInSupabase(ip);
      setBlockedIPs(blockedIPs.filter(b => b.ip !== ip));
      showMessage('success', 'IP unblocked');
    } catch { showMessage('error', 'Failed to unblock IP'); }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statCards = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'var(--accent)' },
    { label: 'Active Now', value: activeUsers, icon: Activity, color: 'var(--green)' },
    { label: 'MRR', value: `$${totalRevenue}`, icon: DollarSign, color: 'var(--amber)' },
    { label: 'Blocked IPs', value: blockedIPs.length, icon: Ban, color: 'var(--red)' },
  ];

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'blocked', label: 'Blocked IPs', icon: Ban },
    { id: 'add', label: 'Add User', icon: UserPlus },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="heading-display text-2xl text-white">Admin Panel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage users, billing, and access control</p>
        </div>
        <button onClick={loadData} className="btn-ghost p-2.5 rounded-xl">
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl animate-slide-in" style={{
          background: message.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `1px solid ${message.type === 'success' ? 'var(--green-border)' : 'var(--red-border)'}`,
          color: message.type === 'success' ? 'var(--green-text)' : 'var(--red-text)',
        }}>
          {message.type === 'success' ? <CheckCircle size={14} className="inline mr-2" /> : <X size={14} className="inline mr-2" />}
          {message.text}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: `${s.color}18` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <p className="section-label mb-1">{s.label}</p>
            <p className="heading-display text-2xl text-white">{isLoading ? <span className="skeleton inline-block w-12 h-7" /> : s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'var(--bg-nav)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === t.id ? 'var(--bg-card)' : 'transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: activeTab === t.id ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: activeTab === t.id ? 'var(--shadow-card)' : 'none',
            }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="input-field w-full pl-9 pr-3 py-2 text-sm" />
            </div>
            <p className="text-sm ml-auto" style={{ color: 'var(--text-muted)' }}>{filtered.length} users</p>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="animate-spin mr-3" /> Loading users...
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {['User', 'Plan', 'Role', 'Last Active', 'Records Today', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left section-label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="table-row">
                      {editingId === u.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-field px-2 py-1 text-sm w-full" />
                          </td>
                          <td className="px-4 py-3">
                            <select value={editForm.plan || 'Free'} onChange={e => setEditForm({ ...editForm, plan: e.target.value as any })}
                              className="input-field px-2 py-1 text-sm">
                              {['Free', 'Starter', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select value={editForm.role || 'user'} onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                              className="input-field px-2 py-1 text-sm">
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" value={editForm.dailyLimit || 0} onChange={e => setEditForm({ ...editForm, dailyLimit: parseInt(e.target.value) })}
                              className="input-field px-2 py-1 text-sm w-24" />
                          </td>
                          <td colSpan={2} />
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={handleSaveEdit} disabled={isSaving} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                                <Save size={12} /> Save
                              </button>
                              <button onClick={() => { setEditingId(null); setEditForm({}); }} className="btn-ghost px-3 py-1.5 text-xs">
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: 'var(--gradient-accent)' }}>
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{u.name}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{
                              background: u.plan === 'Pro' ? 'var(--accent-dim)' : u.plan === 'Enterprise' ? 'var(--amber-dim)' : 'var(--bg-hover)',
                              color: u.plan === 'Pro' ? 'var(--accent-light)' : u.plan === 'Enterprise' ? 'var(--amber-text)' : 'var(--text-secondary)',
                            }}>{u.plan}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{
                              background: u.role === 'admin' ? 'var(--red-dim)' : 'var(--bg-hover)',
                              color: u.role === 'admin' ? 'var(--red-text)' : 'var(--text-muted)',
                            }}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{formatLastActive(u.lastActive)}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {u.recordsExtractedToday?.toLocaleString() || 0}
                            <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>/ {u.dailyLimit?.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="dot-live" style={{ background: u.isOnline ? 'var(--green-text)' : 'var(--text-faint)', boxShadow: u.isOnline ? '0 0 6px rgba(52,211,153,0.6)' : 'none', animation: u.isOnline ? undefined : 'none' }} />
                              <span className="text-xs" style={{ color: u.isOnline ? 'var(--green-text)' : 'var(--text-muted)' }}>{u.isOnline ? 'Online' : 'Offline'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditingId(u.id); setEditForm({ name: u.name, plan: u.plan, role: u.role, dailyLimit: u.dailyLimit }); }}
                                className="btn-ghost p-1.5 rounded-lg"><Edit2 size={13} /></button>
                              <button onClick={() => handleDeleteUser(u.id)} className="btn-danger p-1.5 rounded-lg"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === 'blocked' && (
        <div className="space-y-4">
          <form onSubmit={handleBlockIP} className="card p-5 flex gap-3 items-end">
            <div className="flex-1">
              <label className={labelCls}>IP Address</label>
              <input type="text" placeholder="192.168.1.1" value={blockIpAddress} onChange={e => setBlockIpAddress(e.target.value)} required className={inputCls} />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Reason</label>
              <input type="text" placeholder="Abuse, spam, etc." value={blockReason} onChange={e => setBlockReason(e.target.value)} className={inputCls} />
            </div>
            <button type="submit" className="btn-danger px-5 py-2 text-sm rounded-xl flex items-center gap-2">
              <Ban size={14} /> Block IP
            </button>
          </form>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid var(--border)' }}>
                <tr>
                  {['IP Address', 'Reason', 'Blocked At', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left section-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockedIPs.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No blocked IPs</td></tr>
                ) : blockedIPs.map((b, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--red-text)' }}>{b.ip}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{b.reason || '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{b.blockedAt ? new Date(b.blockedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleUnblockIP(b.ip)} className="btn-ghost px-3 py-1 text-xs rounded-lg flex items-center gap-1.5">
                        <CheckCircle size={12} /> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Tab */}
      {activeTab === 'add' && (
        <div className="card p-6 max-w-lg">
          <h3 className="heading-display text-lg text-white mb-5">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input value={newUserName} onChange={e => setNewUserName(e.target.value)} required placeholder="John Smith" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required placeholder="john@company.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required placeholder="Min 8 characters" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Plan</label>
                <select value={newUserPlan} onChange={e => setNewUserPlan(e.target.value as any)} className={inputCls}>
                  {['Free', 'Starter', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className={inputCls}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
              <UserPlus size={15} /> {isSaving ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
