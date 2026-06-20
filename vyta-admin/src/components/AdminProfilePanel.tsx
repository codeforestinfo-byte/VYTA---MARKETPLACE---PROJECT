import { useState, useEffect } from 'react';
import { Save, RefreshCw, Monitor, X, CheckCircle2, Shield, Smartphone, Key, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';
import { getAdminProfile, updateAdminProfile, getMySessions, revokeMySession, setupAdminMFA, verifyAdminMFASetup, disableAdminMFA } from '../api/adminManagement';
import type { AdminProfileResponse, AdminSessionResponse } from '../api/types';

export default function AdminProfilePanel() {
  const [profile, setProfile] = useState<AdminProfileResponse | null>(null);
  const [sessions, setSessions] = useState<AdminSessionResponse[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', current_password: '', new_password: '' });
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; provisioning_uri: string; qr_code_url: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const { addToast, toastContainer } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prof, sess] = await Promise.all([getAdminProfile(), getMySessions()]);
      setProfile(prof);
      setSessions(sess);
      setForm({ name: prof.name, email: prof.email, current_password: '', new_password: '' });
      setMfaEnabled(prof.mfa_enabled);
    } catch (err) {
      addToast('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    try {
      const updated = await updateAdminProfile({
        name: form.name !== profile?.name ? form.name : undefined,
        email: form.email !== profile?.email ? form.email : undefined,
        current_password: form.current_password || undefined,
        new_password: form.new_password || undefined,
      });
      setProfile(updated);
      setEditing(false);
      addToast('success', 'Profile updated');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeMySession(id);
      addToast('success', 'Session revoked');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to revoke session');
    }
  };

  const handleSetupMFA = async () => {
    try {
      const data = await setupAdminMFA();
      setMfaSetup(data);
      setMfaCode('');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to setup 2FA');
    }
  };

  const handleVerifyMFA = async () => {
    if (mfaCode.length !== 6) return;
    setMfaVerifying(true);
    try {
      await verifyAdminMFASetup(mfaCode);
      addToast('success', '2FA enabled successfully');
      setMfaSetup(null);
      setMfaCode('');
      setMfaEnabled(true);
      if (profile) setProfile({ ...profile, mfa_enabled: true });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      await disableAdminMFA();
      addToast('success', '2FA disabled');
      setMfaEnabled(false);
      if (profile) setProfile({ ...profile, mfa_enabled: false });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to disable 2FA');
    }
  };

  if (loading) return <div className="data-card p-6 text-center text-gray-400 text-sm">Loading profile...</div>;
  if (!profile) return <div className="data-card p-6 text-center text-gray-400 text-sm">Failed to load profile</div>;

  return (
    <div className="space-y-4">
      {toastContainer}

      <div className="data-card">
        <div className="data-card-header">
          <h3>My Profile</h3>
          <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs px-3 py-1.5">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        <div className="p-4">
          {editing ? (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <hr className="border-gray-200" />
              <p className="text-[11px] text-gray-500 font-semibold">Change Password (optional)</p>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Current Password</label>
                <input type="password" value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">New Password</label>
                <input type="password" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                  className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full" />
              </div>
              <button onClick={handleSave} className="btn-primary text-xs px-4 py-1.5">
                <Save size={12} className="mr-1" />Save Changes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <div><span className="text-[11px] font-semibold text-gray-500 block">Name</span><span className="text-sm">{profile.name}</span></div>
              <div><span className="text-[11px] font-semibold text-gray-500 block">Email</span><span className="text-sm">{profile.email}</span></div>
              <div><span className="text-[11px] font-semibold text-gray-500 block">Role</span>
                <span className="flex items-center space-x-1.5">
                  <span className="text-sm capitalize">{profile.store_role?.replace('_', ' ') || 'Admin'}</span>
                  {profile.store_role === 'super_admin' && (
                    <span className="text-[10px] font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 rounded">Super Admin</span>
                  )}
                </span>
              </div>
              <div><span className="text-[11px] font-semibold text-gray-500 block">Status</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div><span className="text-[11px] font-semibold text-gray-500 block">Email Verified</span>
                {profile.email_verified ? <CheckCircle2 size={16} className="text-green-600" /> : <X size={16} className="text-red-500" />}
              </div>
              <div><span className="text-[11px] font-semibold text-gray-500 block">2FA</span>
                {mfaEnabled ? <CheckCircle2 size={16} className="text-green-600" /> : <X size={16} className="text-red-500" />}
              </div>
              {profile.last_login && <div><span className="text-[11px] font-semibold text-gray-500 block">Last Login</span><span className="text-sm">{new Date(profile.last_login).toLocaleString()}</span></div>}
              <div><span className="text-[11px] font-semibold text-gray-500 block">Created</span><span className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>Two-Factor Authentication (2FA)</h3>
        </div>
        <div className="p-4">
          {mfaSetup ? (
            <div className="max-w-md space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Smartphone size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">Scan this QR code with your authenticator app</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">Use Microsoft Authenticator, Google Authenticator, or any TOTP-compatible app.</p>
                </div>
              </div>

              <div className="flex justify-center bg-white border border-gray-200 rounded-lg p-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaSetup.provisioning_uri)}`}
                  alt="QR Code for 2FA"
                  className="w-48 h-48"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-gray-500 mb-1">Or enter this key manually:</p>
                <div className="flex items-center space-x-2">
                  <code className="text-xs font-mono bg-white border border-gray-200 rounded px-2 py-1.5 flex-1 select-all">{mfaSetup.secret}</code>
                  <button onClick={() => { navigator.clipboard.writeText(mfaSetup.secret); addToast('info', 'Secret copied'); }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold shrink-0">Copy</button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 block mb-1">Enter 6-digit code from app</label>
                <div className="flex space-x-2">
                  <input value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="text-sm border border-gray-300 rounded px-2 py-1.5 w-28 text-center font-mono font-bold tracking-widest" />
                  <button onClick={handleVerifyMFA} disabled={mfaCode.length !== 6 || mfaVerifying}
                    className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
                    {mfaVerifying ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                  <button onClick={() => setMfaSetup(null)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between max-w-md">
              <div className="flex items-center space-x-3">
                <Shield size={20} className={mfaEnabled ? 'text-green-600' : 'text-gray-400'} />
                <div>
                  <p className="text-sm font-medium">{mfaEnabled ? '2FA is enabled' : '2FA is not enabled'}</p>
                  <p className="text-[11px] text-gray-500">
                    {mfaEnabled
                      ? 'You will be prompted for a code from your authenticator app on each login.'
                      : 'Add an extra layer of security to your account.'}
                  </p>
                </div>
              </div>
              {mfaEnabled ? (
                <button onClick={handleDisableMFA} className="btn-warning text-xs px-3 py-1.5">
                  <Shield size={12} className="mr-1" />Disable 2FA
                </button>
              ) : (
                <button onClick={handleSetupMFA} className="btn-primary text-xs px-3 py-1.5">
                  <Smartphone size={12} className="mr-1" />Setup 2FA
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h3>My Sessions ({sessions.length})</h3>
          <button onClick={fetchData} className="btn-secondary text-xs px-2 py-1"><RefreshCw size={12} /></button>
        </div>
        <table className="data-table">
          <thead><tr><th>Status</th><th>IP Address</th><th>User Agent</th><th>Last Activity</th><th className="w-16">Action</th></tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="text-xs">{s.ip_address || '-'}</td>
                <td className="text-xs max-w-[200px] truncate">{s.user_agent || '-'}</td>
                <td className="text-xs text-gray-500">{new Date(s.last_activity).toLocaleString()}</td>
                <td>{s.is_active && <button onClick={() => handleRevokeSession(s.id)} className="text-red-500 hover:text-red-700 text-[10px] font-semibold">Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
