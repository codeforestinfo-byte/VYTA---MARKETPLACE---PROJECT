import { X, Mail, Calendar, Shield, Clock, CheckCircle2, XCircle, Activity, Globe, Smartphone, Monitor, EyeOff, Terminal } from 'lucide-react';
import type { AdminUserResponse, AuditLogResponse, AdminSessionResponse } from '../api/types';

interface UserDetailModalProps {
  user: AdminUserResponse;
  auditLogs?: AuditLogResponse[];
  sessions?: AdminSessionResponse[];
  onRevokeSession?: (sessionId: string) => void;
  onClose: () => void;
}

const ADMIN_ROLES: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  support_agent: { label: 'Support Agent', color: 'bg-green-100 text-green-800 border-green-200' },
  content_manager: { label: 'Content Manager', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  finance: { label: 'Finance', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

function getDeviceIcon(ua: string | null) {
  if (!ua) return Globe;
  const l = ua.toLowerCase();
  if (l.includes('iphone') || l.includes('android') || l.includes('mobile')) return Smartphone;
  if (l.includes('mac') || l.includes('windows') || l.includes('linux')) return Monitor;
  return Globe;
}

function getDeviceName(ua: string | null) {
  if (!ua) return 'Unknown Device';
  const l = ua.toLowerCase();
  if (l.includes('iphone')) return 'iPhone';
  if (l.includes('android')) return 'Android';
  if (l.includes('mac')) return 'Mac';
  if (l.includes('windows')) return 'Windows';
  if (l.includes('linux')) return 'Linux';
  return ua.slice(0, 50);
}

export default function UserDetailModal({ user, auditLogs = [], sessions = [], onRevokeSession, onClose }: UserDetailModalProps) {
  const roleInfo = ADMIN_ROLES[user.store_role || ''] || { label: user.store_role || 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' };

  const actionColors: Record<string, string> = {
    create: 'bg-emerald-500', update: 'bg-blue-500', deactivate: 'bg-red-500',
    hard_delete: 'bg-red-700', reactivate: 'bg-teal-500', login: 'bg-purple-500', logout: 'bg-gray-500',
  };
  const actionBgColors: Record<string, string> = {
    create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    update: 'bg-blue-50 text-blue-700 border-blue-200',
    deactivate: 'bg-red-50 text-red-700 border-red-200',
    hard_delete: 'bg-red-100 text-red-800 border-red-300',
    reactivate: 'bg-teal-50 text-teal-700 border-teal-200',
    login: 'bg-purple-50 text-purple-700 border-purple-200',
    logout: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-3xl border border-aws-border shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-aws-border bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aws-blue-accent to-blue-700 flex items-center justify-center text-[14px] font-bold text-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-aws-heading">{user.name}</h2>
              <p className="text-[12px] text-aws-text-secondary">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 hover:text-black transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${roleInfo.color}`}>
              <Shield size={13} className="mr-1.5" />{roleInfo.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${user.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {user.is_active ? <CheckCircle2 size={13} className="mr-1.5" /> : <XCircle size={13} className="mr-1.5" />}
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${user.mfa_enabled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              <Shield size={13} className="mr-1.5" />2FA {user.mfa_enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${user.email_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <Mail size={13} className="mr-1.5" />{user.email_verified ? 'Verified' : 'Unverified'}
            </span>
          </div>

          {/* Account Info */}
          <div className="border-t border-aws-border pt-5">
            <h3 className="text-[13px] font-semibold text-aws-text-secondary uppercase tracking-wider mb-3">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3.5">
                <div className="flex items-center space-x-2 text-[11px] text-aws-text-secondary font-medium uppercase tracking-wide mb-1">
                  <Mail size={12} /><span>Email</span>
                </div>
                <p className="text-[13px] font-medium text-aws-heading">{user.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3.5">
                <div className="flex items-center space-x-2 text-[11px] text-aws-text-secondary font-medium uppercase tracking-wide mb-1">
                  <Shield size={12} /><span>Role</span>
                </div>
                <p className="text-[13px] font-medium text-aws-heading">{roleInfo.label}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3.5">
                <div className="flex items-center space-x-2 text-[11px] text-aws-text-secondary font-medium uppercase tracking-wide mb-1">
                  <Calendar size={12} /><span>Created</span>
                </div>
                <p className="text-[13px] font-medium text-aws-heading">{new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3.5">
                <div className="flex items-center space-x-2 text-[11px] text-aws-text-secondary font-medium uppercase tracking-wide mb-1">
                  <Clock size={12} /><span>Last Login</span>
                </div>
                <p className="text-[13px] font-medium text-aws-heading">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Details */}
          <div className="border-t border-aws-border pt-5">
            <h3 className="text-[13px] font-semibold text-aws-text-secondary uppercase tracking-wider mb-3">Security Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-aws-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {user.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                </div>
                <p className="text-[18px] font-bold text-aws-heading">{user.is_active ? 'Active' : 'Inactive'}</p>
                <p className="text-[11px] text-aws-text-secondary mt-0.5">Account Status</p>
              </div>
              <div className="border border-aws-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.mfa_enabled ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                    <Shield size={16} />
                  </div>
                </div>
                <p className="text-[18px] font-bold text-aws-heading">{user.mfa_enabled ? 'Enabled' : 'Off'}</p>
                <p className="text-[11px] text-aws-text-secondary mt-0.5">Multi-Factor Auth</p>
              </div>
              <div className="border border-aws-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.email_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Mail size={16} />
                  </div>
                </div>
                <p className="text-[18px] font-bold text-aws-heading">{user.email_verified ? 'Verified' : 'Unverified'}</p>
                <p className="text-[11px] text-aws-text-secondary mt-0.5">Email Verification</p>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="border-t border-aws-border pt-5">
            <h3 className="text-[13px] font-semibold text-aws-text-secondary uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Activity size={14} className="text-aws-blue-accent" />
              <span>Activity Feed</span>
              {auditLogs.length > 0 && <span className="text-[11px] font-normal text-gray-400">({auditLogs.length} events)</span>}
            </h3>
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-[13px] bg-gray-50 rounded-lg">
                <Activity size={20} className="mx-auto mb-1 text-gray-300" />
                <span>No activity recorded for this admin.</span>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-gray-200" />
                <div className="space-y-0 max-h-[240px] overflow-y-auto pr-2">
                  {auditLogs.map((log) => {
                    const dotColor = actionColors[log.action.toLowerCase()] || 'bg-gray-400';
                    const actionBadge = actionBgColors[log.action.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
                    return (
                      <div key={log.id} className="relative flex items-start pb-4 last:pb-0">
                        <div className={`relative z-10 w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-white shadow-sm shrink-0 mt-0.5`} />
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${actionBadge}`}>{log.action}</span>
                            {log.resource_id && <span className="text-[10px] font-mono text-gray-400">#{log.resource_id.slice(0, 8)}</span>}
                          </div>
                          <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-mono text-gray-400">
                              <Globe size={9} /><span>{log.ip_address || '—'}</span>
                            </span>
                            <span className="inline-flex items-center space-x-1 text-[10px] text-gray-400">
                              <Clock size={9} /><span>{new Date(log.created_at).toLocaleString()}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="border-t border-aws-border pt-5">
            <h3 className="text-[13px] font-semibold text-aws-text-secondary uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Terminal size={14} className="text-aws-blue-accent" />
              <span>Sessions</span>
              {sessions.length > 0 && <span className="text-[11px] font-normal text-gray-400">({sessions.filter(s => s.is_active).length} active)</span>}
            </h3>
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-[13px] bg-gray-50 rounded-lg">
                <Terminal size={20} className="mx-auto mb-1 text-gray-300" />
                <span>No sessions found for this admin.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => {
                  const DeviceIcon = getDeviceIcon(s.user_agent);
                  return (
                    <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-aws-border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${s.is_active ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                          <DeviceIcon size={16} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-[13px] font-semibold text-aws-heading">{getDeviceName(s.user_agent)}</p>
                            {s.is_active ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-semibold">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-[11px] text-gray-400 mt-0.5">
                            <span className="font-mono">{s.ip_address || '—'}</span>
                            <span className="flex items-center space-x-1"><Clock size={9} /><span>{new Date(s.last_activity).toLocaleString()}</span></span>
                          </div>
                        </div>
                      </div>
                      {s.is_active && onRevokeSession && (
                        <button onClick={() => onRevokeSession(s.id)}
                          className="inline-flex items-center space-x-1 text-red-500 hover:text-red-700 text-[11px] font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors shrink-0">
                          <EyeOff size={11} /><span>Terminate</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="flex justify-end px-6 py-4 border-t border-aws-border bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
