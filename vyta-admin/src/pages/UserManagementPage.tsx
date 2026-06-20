import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import UserDetailModal from '../components/UserDetailModal';
import RolePermissionsPanel from '../components/RolePermissionsPanel';
import InvitationPanel from '../components/InvitationPanel';
import AdminProfilePanel from '../components/AdminProfilePanel';
import ForceActionsPanel from '../components/ForceActionsPanel';
import AccountLockoutPanel from '../components/AccountLockoutPanel';
import ApprovalPanel from '../components/ApprovalPanel';
import ActivityTimeline from '../components/ActivityTimeline';
import AuditLogRetentionPanel from '../components/AuditLogRetentionPanel';
import SessionPolicyPanel from '../components/SessionPolicyPanel';
import BulkImportPanel from '../components/BulkImportPanel';
import IPAllowlistPanel from '../components/IPAllowlistPanel';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield, Users, ClipboardList, History, Monitor, Plus, Download,
  ChevronDown, ChevronUp, ChevronsUpDown, Search, X, CheckSquare,
  Square, Trash2, RotateCcw, Edit3, MoreVertical, Eye, AlertTriangle,
  FilterX, RefreshCw, ToggleLeft, ToggleRight, Globe, Smartphone, Laptop,
  Key, Mail, Lock, UserCheck, Activity, Upload, Clock, UserPlus
} from 'lucide-react';
import type { RegionConfig, AccountConfig } from '../types';
import { REGIONS, ACCOUNTS } from '../data';
import {
  listAdminUsers, getAdminUser, createAdminUser, updateAdminUser,
  deactivateAdminUser, reactivateAdminUser, hardDeleteAdminUser,
  downloadAdminUsersCsv, listAuditLogs, listLoginHistory,
  listAdminSessions, revokeAdminSession
} from '../api/adminUsers';
import { getDashboardStats } from '../api/dashboard';
import type {
  AdminUserResponse, AdminUserCreate, AdminUserUpdate,
  DashboardStats, AuditLogResponse, LoginHistoryResponse, AdminSessionResponse
} from '../api/types';

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'finance', label: 'Finance' },
];

const PAGE_SIZES = [10, 25, 50, 100];

const ROLE_BADGES: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  support_agent: 'bg-green-100 text-green-800 border-green-200',
  content_manager: 'bg-orange-100 text-orange-800 border-orange-200',
  finance: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function UserManagementPage() {
  const { adminUser } = useAuth();
  const isSuperAdmin = adminUser?.store_role === 'super_admin';

  const [activeRegion] = useState<RegionConfig>(REGIONS[0]);
  const [activeAccount] = useState<AccountConfig>(ACCOUNTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('admin-users');

  const { addToast, toastContainer } = useToast();

  // Data
  const [adminUsers, setAdminUsers] = useState<AdminUserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryResponse[]>([]);
  const [loginHistoryTotal, setLoginHistoryTotal] = useState(0);
  const [sessions, setSessions] = useState<AdminSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('');
  const [mfaFilter, setMfaFilter] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');

  // Sort & pagination (admin users)
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);

  // Login history filters & pagination
  const [lhSuccessFilter, setLhSuccessFilter] = useState('');
  const [lhAdminFilter, setLhAdminFilter] = useState('');
  const [lhSkip, setLhSkip] = useState(0);
  const [lhLimit, setLhLimit] = useState(50);

  // Audit log filters
  const [alActionFilter, setAlActionFilter] = useState('');
  const [alResourceFilter, setAlResourceFilter] = useState('');

  // Sessions state & filters
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessActiveFilter, setSessActiveFilter] = useState('all');
  const [sessAdminFilter, setSessAdminFilter] = useState('');
  const [sessSkip, setSessSkip] = useState(0);
  const [sessLimit, setSessLimit] = useState(50);

  // Selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserResponse | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserResponse | null>(null);
  const [detailUserLogs, setDetailUserLogs] = useState<AuditLogResponse[]>([]);
  const [detailUserSessions, setDetailUserSessions] = useState<AdminSessionResponse[]>([]);

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info';
    confirmLabel?: string; onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{
    open: boolean; user: AdminUserResponse | null; typedName: string;
  }>({ open: false, user: null, typedName: '' });

  // Create form
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', store_role: 'admin' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit form
  const [editForm, setEditForm] = useState({ name: '', store_role: 'admin' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const fetchAdminUsers = useCallback(async (opts?: { resetSkip?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        created_after: createdAfter || undefined,
        created_before: createdBefore || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        skip: opts?.resetSkip ? 0 : skip,
        limit,
      });
      setAdminUsers(res.items);
      setTotal(res.total);
      if (opts?.resetSkip) setSkip(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, emailVerifiedFilter, mfaFilter, createdAfter, createdBefore, sortBy, sortOrder, skip, limit]);

  const fetchLoginHistoryData = useCallback(async (opts?: { append?: boolean }) => {
    setLoginHistoryLoading(true);
    try {
      const data = await listLoginHistory({
        admin_id: lhAdminFilter || undefined,
        success: lhSuccessFilter ? lhSuccessFilter === 'true' : undefined,
        skip: lhSkip,
        limit: lhLimit,
      });
      setLoginHistory(Array.isArray(data) ? data : []);
      setLoginHistoryTotal(opts?.append ? loginHistoryTotal : (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error('Failed to fetch login history:', err);
      setLoginHistory([]);
      setLoginHistoryTotal(0);
    } finally {
      setLoginHistoryLoading(false);
    }
  }, [lhAdminFilter, lhSuccessFilter, lhSkip, lhLimit, loginHistoryTotal]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, stats, logs, history, sess] = await Promise.all([
        listAdminUsers({
          search: search || undefined, role: roleFilter || undefined,
          status: statusFilter || undefined, created_after: createdAfter || undefined,
          created_before: createdBefore || undefined, sort_by: sortBy, sort_order: sortOrder,
          skip, limit,
        }),
        getDashboardStats(),
        listAuditLogs({ limit: 100 }),
        listLoginHistory({ limit: 100 }),
        listAdminSessions({ active_only: false, limit: 100 }),
      ]);
      setAdminUsers(usersRes.items);
      setTotal(usersRes.total);
      setDashboardStats(stats);
      setAuditLogs(logs);
      setLoginHistory(history);
      setLoginHistoryTotal(history.length);
      setSessions(sess);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, createdAfter, createdBefore, sortBy, sortOrder, skip, limit]);

  const adminNameMap = useCallback(() => {
    const map = new Map<string, string>();
    for (const u of adminUsers) map.set(u.id, u.name);
    return map;
  }, [adminUsers]);

  useEffect(() => {
    let cancelled = false;
    fetchAllData().then(() => {});
    return () => { cancelled = true; };
  }, [fetchAllData]);

  const fetchSessionsData = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const showActiveOnly = sessActiveFilter === 'active_only';
      const showInactiveOnly = sessActiveFilter === 'inactive_only';
      const data = await listAdminSessions({
        admin_id: sessAdminFilter || undefined,
        active_only: showActiveOnly ? true : undefined,
        skip: sessSkip,
        limit: sessLimit,
      });
      let filtered = Array.isArray(data) ? data : [];
      if (showInactiveOnly) {
        filtered = filtered.filter(s => !s.is_active);
      }
      setSessions(filtered);
      setSessionsTotal(filtered.length);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
      setSessionsTotal(0);
    } finally {
      setSessionsLoading(false);
    }
  }, [sessAdminFilter, sessActiveFilter, sessSkip, sessLimit]);

  useEffect(() => {
    if (activeSection === 'login-history') {
      fetchLoginHistoryData();
    } else if (activeSection === 'sessions') {
      fetchSessionsData();
    }
  }, [activeSection, fetchLoginHistoryData, fetchSessionsData]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronsUpDown size={11} className="text-gray-300 ml-1" />;
    return sortOrder === 'asc'
      ? <ChevronUp size={11} className="text-aws-blue-accent ml-1" />
      : <ChevronDown size={11} className="text-aws-blue-accent ml-1" />;
  };

  const handleSearch = () => {
    setSkip(0);
    fetchAdminUsers({ resetSkip: true });
  };

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setSkip(0);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setEmailVerifiedFilter('');
    setMfaFilter('');
    setCreatedAfter('');
    setCreatedBefore('');
    setSkip(0);
  };

  const hasActiveFilters = search || roleFilter || statusFilter || emailVerifiedFilter || mfaFilter || createdAfter || createdBefore;

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedUsers.size === adminUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(adminUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // CRUD Handlers
  const handleCreateUser = async () => {
    const errors: Record<string, string> = {};
    if (!createForm.name.trim()) errors.name = 'Name is required';
    if (!createForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(createForm.email)) errors.email = 'Invalid email';
    if (!createForm.password) errors.password = 'Password is required';
    else if (createForm.password.length < 6) errors.password = 'Min 6 characters';
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setActionLoading(true);
    try {
      await createAdminUser({
        email: createForm.email.trim(),
        password: createForm.password,
        name: createForm.name.trim(),
        store_role: createForm.store_role,
      });
      addToast('success', `Admin user "${createForm.name}" created successfully`);
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', store_role: 'admin' });
      setCreateErrors({});
      fetchAdminUsers({ resetSkip: true });
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: AdminUserResponse) => {
    setEditUser(user);
    setEditForm({ name: user.name, store_role: user.store_role || 'admin' });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = 'Name is required';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setActionLoading(true);
    try {
      const body: AdminUserUpdate = { name: editForm.name.trim() };
      if (editForm.store_role !== (editUser.store_role || 'admin')) {
        body.store_role = editForm.store_role;
      }
      await updateAdminUser(editUser.id, body);
      addToast('success', `User "${editForm.name}" updated successfully`);
      setEditModalOpen(false);
      setEditUser(null);
      fetchAdminUsers();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (user: AdminUserResponse) => {
    setActionLoading(true);
    try {
      await deactivateAdminUser(user.id);
      addToast('success', `"${user.name}" deactivated successfully`);
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchAdminUsers();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (user: AdminUserResponse) => {
    setActionLoading(true);
    try {
      await reactivateAdminUser(user.id);
      addToast('success', `"${user.name}" reactivated successfully`);
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchAdminUsers();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteConfirm.user) return;
    if (hardDeleteConfirm.typedName !== hardDeleteConfirm.user.name) return;
    setActionLoading(true);
    try {
      await hardDeleteAdminUser(hardDeleteConfirm.user.id);
      addToast('success', `"${hardDeleteConfirm.user.name}" permanently deleted`);
      setHardDeleteConfirm({ open: false, user: null, typedName: '' });
      fetchAdminUsers();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk handlers
  const handleBulkDeactivate = async () => {
    setActionLoading(true);
    let success = 0, failed = 0;
    for (const id of selectedUsers) {
      try { await deactivateAdminUser(id); success++; }
      catch { failed++; }
    }
    setConfirmState(prev => ({ ...prev, open: false }));
    setSelectedUsers(new Set());
    if (failed > 0) addToast('warning', `Deactivated ${success} users, ${failed} failed`);
    else addToast('success', `Deactivated ${success} users successfully`);
    fetchAdminUsers();
    setActionLoading(false);
  };

  const handleBulkReactivate = async () => {
    setActionLoading(true);
    let success = 0, failed = 0;
    for (const id of selectedUsers) {
      try { await reactivateAdminUser(id); success++; }
      catch { failed++; }
    }
    setConfirmState(prev => ({ ...prev, open: false }));
    setSelectedUsers(new Set());
    if (failed > 0) addToast('warning', `Reactivated ${success} users, ${failed} failed`);
    else addToast('success', `Reactivated ${success} users successfully`);
    fetchAdminUsers();
    setActionLoading(false);
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    let success = 0, failed = 0;
    for (const id of selectedUsers) {
      try {
        await deactivateAdminUser(id);
        await hardDeleteAdminUser(id);
        success++;
      } catch { failed++; }
    }
    setConfirmState(prev => ({ ...prev, open: false }));
    setSelectedUsers(new Set());
    if (failed > 0) addToast('warning', `Deleted ${success} users, ${failed} failed`);
    else addToast('success', `Deleted ${success} users permanently`);
    fetchAdminUsers();
    setActionLoading(false);
  };

  // Detail view
  const openDetailView = async (user: AdminUserResponse) => {
    setDetailUser(user);
    try {
      const [logs, sess] = await Promise.all([
        listAuditLogs({ admin_id: user.id, limit: 50 }),
        listAdminSessions({ admin_id: user.id, active_only: false, limit: 50 }),
      ]);
      setDetailUserLogs(logs);
      setDetailUserSessions(sess);
    } catch {
      setDetailUserLogs([]);
      setDetailUserSessions([]);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeAdminSession(sessionId);
      addToast('success', 'Session revoked successfully');
      const sess = await listAdminSessions({ admin_id: detailUser!.id, active_only: false, limit: 50 });
      setDetailUserSessions(sess);
      fetchAllData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  // Stats
  const activeCount = adminUsers.filter(u => u.is_active).length;
  const inactiveCount = adminUsers.filter(u => !u.is_active).length;
  const mfaCount = adminUsers.filter(u => u.mfa_enabled).length;
  const verifiedCount = adminUsers.filter(u => u.email_verified).length;
  const activeSessions = sessions.filter(s => s.is_active).length;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  // ─── RENDER ─────────────────────────────────────────

  const sidebarManagement = [
    { name: 'Vendors', href: '/vendors', letter: 'V' },
    { name: 'Customers', href: '/customers', letter: 'C' },
    { name: 'Products', href: '/products', letter: 'P' },
    { name: 'Withdrawals', href: '/withdrawals', letter: 'W' },
    { name: 'Consultations', href: '/consultations', letter: 'N' },
    { name: 'User Management', href: '/user-management', letter: 'U' },
  ];

  const SUPER_ADMIN_SECTIONS = ['role-permissions', 'force-actions', 'approvals', 'audit-retention', 'session-policy', 'bulk-import', 'ip-allowlist'];

  const userMgmtSections = [
    { id: 'admin-users', label: 'Admin Users', icon: <Users size={14} /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <ClipboardList size={14} /> },
    { id: 'login-history', label: 'Login History', icon: <History size={14} /> },
    { id: 'sessions', label: 'Sessions', icon: <Monitor size={14} /> },
    { id: 'my-profile', label: 'My Profile', icon: <UserCheck size={14} /> },
    { id: 'role-permissions', label: 'Permissions', icon: <Key size={14} /> },
    { id: 'invitations', label: 'Invitations', icon: <Mail size={14} /> },
    { id: 'force-actions', label: 'Force Actions', icon: <Lock size={14} /> },
    { id: 'account-lockouts', label: 'Lockouts', icon: <Shield size={14} /> },
    { id: 'approvals', label: 'Approvals', icon: <UserPlus size={14} /> },
    { id: 'activity-timeline', label: 'Activity Timeline', icon: <Activity size={14} /> },
    { id: 'audit-retention', label: 'Audit Export & Retention', icon: <Clock size={14} /> },
    { id: 'session-policy', label: 'Session Policy', icon: <Monitor size={14} /> },
    { id: 'bulk-import', label: 'Bulk Import', icon: <Upload size={14} /> },
    { id: 'ip-allowlist', label: 'IP Allowlist', icon: <Globe size={14} /> },
  ].filter(s => isSuperAdmin || !SUPER_ADMIN_SECTIONS.includes(s.id));

  return (
    <div className="h-screen bg-aws-body-bg flex flex-col font-sans antialiased overflow-hidden">
      <Header
        activeAccount={activeAccount}
        setActiveAccount={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenExplorer={() => {}}
      />
      <SubHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {toastContainer}

      <div className="flex-1 flex relative overflow-y-auto">

        {/* ─── SIDEBAR ─── */}
        <aside className="bg-white border-r border-[#eaeded] shrink-0 w-56 sticky top-0 flex flex-col overflow-y-auto">
          <div>
            <ul className="py-2.5 space-y-1">
              <li>
                <a href="/" className="flex items-center px-3.5 py-2 hover:bg-gray-100 text-[#232f3e] hover:text-black transition-colors duration-150 rounded mx-1" title="Dashboard">
                  <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase shrink-0">D</span>
                  <span className="font-semibold text-[13px] tracking-tight">Dashboard</span>
                </a>
              </li>
              <li>
                <a href="/orders" className="flex items-center px-3.5 py-2 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors duration-150 rounded mx-1" title="Orders">
                  <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase shrink-0">O</span>
                  <span className="font-medium text-[13px] tracking-tight">Orders</span>
                </a>
              </li>
            </ul>

            <span className="block h-px bg-[#eaeded] mx-2 my-2" />

            <div className="px-3.5 py-1 text-gray-400 font-extrabold text-[10px] uppercase tracking-wide flex items-center space-x-2">
              <Shield size={12} className="text-amber-500 shrink-0 fill-amber-500" />
              <span>Management</span>
            </div>

            <ul className="py-1 space-y-0.5">
              {sidebarManagement.map((item) => (
                <li key={item.name}>
                  <a href={item.href}
                    className={`flex items-center px-3.5 py-1.5 hover:bg-gray-50 text-[13px] transition-colors duration-150 rounded mx-1 pl-4 ${
                      item.href === '/user-management' ? 'text-aws-blue-accent bg-blue-50 font-semibold' : 'text-[#414d5c] hover:text-aws-blue-accent'
                    }`}
                    title={item.name}
                  >
                    <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase">{item.letter}</span>
                    <span className="font-medium tracking-tight truncate">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 dashboard-content-area">

          <h1 className="section-title" style={{ marginTop: 0 }}>User Management</h1>

          {/* ─── STAT CARDS ─── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {loading && !adminUsers.length ? (
              <div style={{ fontSize: 11, color: '#999', padding: '12px 8px' }}>Loading stats...</div>
            ) : (
              <>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{total}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>total admins</div>
                  </div>
                </div>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{activeCount}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>active</div>
                  </div>
                </div>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{inactiveCount}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>inactive</div>
                  </div>
                </div>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{mfaCount}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>2fa enabled</div>
                  </div>
                </div>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{verifiedCount}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>email verified</div>
                  </div>
                </div>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{activeSessions}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>active sessions</div>
                  </div>
                </div>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{auditLogs.length}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>audit events</div>
                  </div>
                </div>
                {dashboardStats && (
                  <>
                    <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                      <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{dashboardStats.total_customers}</div>
                        <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>customers</div>
                      </div>
                    </div>
                    <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                      <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{dashboardStats.total_vendors}</div>
                        <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>vendors</div>
                      </div>
                    </div>
                    <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                      <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{dashboardStats.total_orders}</div>
                        <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>orders</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* ─── SIDE NAV + DATA PANEL ─── */}
          <div className="flex" style={{ gap: 0 }}>

            {/* Side Corner Nav */}
            <nav className="bg-white border border-[#eaeded] rounded-[2px] shrink-0 self-start" style={{ width: 160, marginRight: 12 }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
                {userMgmtSections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => setActiveSection(sec.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '8px 12px', border: 'none',
                        background: activeSection === sec.id ? '#f0f5ff' : 'transparent',
                        color: activeSection === sec.id ? '#0073bb' : '#414d5c',
                        fontWeight: activeSection === sec.id ? 600 : 400, fontSize: 12,
                        cursor: 'pointer', textAlign: 'left',
                        borderLeft: activeSection === sec.id ? '2px solid #0073bb' : '2px solid transparent',
                      }}
                    >
                      {sec.icon}
                      <span>{sec.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Data Panel */}
            <div className="flex-1" style={{ minWidth: 0 }}>

              {/* ════════════════════════════════════════════
                  ADMIN USERS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'admin-users' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Admin Users</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { fetchAdminUsers(); }} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors" title="Refresh">
                        <RefreshCw size={12} /><span>Refresh</span>
                      </button>
                      {total > 0 && (
                        <button onClick={() => downloadAdminUsersCsv({
                          search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined,
                        })} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors" title="Export CSV">
                          <Download size={12} /><span>Export</span>
                        </button>
                      )}
                      <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center space-x-1 px-3 py-1.5 text-[12px] font-bold text-white bg-aws-blue-accent hover:bg-blue-700 rounded transition-colors">
                        <Plus size={13} /><span>Add User</span>
                      </button>
                    </div>
                  </div>

                  {/* ─── FILTER BAR ─── */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[180px] max-w-[260px]">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" placeholder="Search name or email..."
                          value={search} onChange={e => setSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                          className="w-full pl-8 pr-7 py-1.5 text-[12px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 bg-white"
                        />
                        {search && (
                          <button onClick={() => { setSearch(''); setSkip(0); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <select value={roleFilter} onChange={e => handleFilterChange(setRoleFilter, e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[110px]">
                        <option value="">All Roles</option>
                        {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>

                      <select value={statusFilter} onChange={e => handleFilterChange(setStatusFilter, e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[100px]">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>

                      <select value={emailVerifiedFilter} onChange={e => handleFilterChange(setEmailVerifiedFilter, e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[100px]">
                        <option value="">Email: All</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                      </select>

                      <select value={mfaFilter} onChange={e => handleFilterChange(setMfaFilter, e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[90px]">
                        <option value="">2FA: All</option>
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>

                      <input type="date" value={createdAfter} onChange={e => handleFilterChange(setCreatedAfter, e.target.value)}
                        placeholder="Created after"
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[130px]" title="Created after" />

                      <input type="date" value={createdBefore} onChange={e => handleFilterChange(setCreatedBefore, e.target.value)}
                        placeholder="Created before"
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[130px]" title="Created before" />

                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                          <FilterX size={12} /><span>Clear</span>
                        </button>
                      )}
                    </div>

                    {/* Active filter tags */}
                    {hasActiveFilters && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mr-1">Filters:</span>
                        {search && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-medium">Search: {search}
                          <button onClick={() => { setSearch(''); setSkip(0); }}><X size={10} /></button></span>}
                        {roleFilter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-medium">Role: {ADMIN_ROLES.find(r => r.value === roleFilter)?.label}
                          <button onClick={() => { setRoleFilter(''); setSkip(0); }}><X size={10} /></button></span>}
                        {statusFilter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-medium">Status: {statusFilter}
                          <button onClick={() => { setStatusFilter(''); setSkip(0); }}><X size={10} /></button></span>}
                        {emailVerifiedFilter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-medium">Email: {emailVerifiedFilter}
                          <button onClick={() => { setEmailVerifiedFilter(''); setSkip(0); }}><X size={10} /></button></span>}
                        {mfaFilter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-medium">2FA: {mfaFilter}
                          <button onClick={() => { setMfaFilter(''); setSkip(0); }}><X size={10} /></button></span>}
                        {createdAfter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-medium">After: {createdAfter}
                          <button onClick={() => { setCreatedAfter(''); setSkip(0); }}><X size={10} /></button></span>}
                        {createdBefore && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-medium">Before: {createdBefore}
                          <button onClick={() => { setCreatedBefore(''); setSkip(0); }}><X size={10} /></button></span>}
                      </div>
                    )}
                  </div>

                  {/* ─── BULK ACTION BAR ─── */}
                  {selectedUsers.size > 0 && (
                    <div className="bulk-action-bar" style={{ padding: '8px 12px', background: '#f0f5ff', borderBottom: '1px solid #d0e2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="text-[12px] font-medium text-aws-blue-accent">
                        <CheckSquare size={13} className="inline mr-1" />
                        {selectedUsers.size} of {adminUsers.length} selected
                      </span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => {
                          setConfirmState({
                            open: true, title: 'Bulk Reactivate',
                            message: `Reactivate ${selectedUsers.size} selected user(s)?`,
                            variant: 'info', confirmLabel: 'Reactivate All',
                            onConfirm: handleBulkReactivate,
                          });
                        }} disabled={actionLoading} className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 disabled:opacity-50 transition-colors">
                          <RotateCcw size={12} /><span>Reactivate</span>
                        </button>
                        <button onClick={() => {
                          setConfirmState({
                            open: true, title: 'Bulk Deactivate',
                            message: `Deactivate ${selectedUsers.size} selected user(s)?`,
                            variant: 'warning', confirmLabel: 'Deactivate All',
                            onConfirm: handleBulkDeactivate,
                          });
                        }} disabled={actionLoading} className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 disabled:opacity-50 transition-colors">
                          <ToggleRight size={12} /><span>Deactivate</span>
                        </button>
                        {isSuperAdmin && <button onClick={() => {
                          setConfirmState({
                            open: true, title: 'Bulk Delete',
                            message: `Permanently delete ${selectedUsers.size} selected user(s)? This action cannot be undone.`,
                            variant: 'danger', confirmLabel: 'Delete All',
                            onConfirm: handleBulkDelete,
                          });
                        }} disabled={actionLoading} className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors">
                          <Trash2 size={12} /><span>Delete</span>
                        </button>}
                        <button onClick={() => setSelectedUsers(new Set())} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-200 rounded transition-colors">
                          <X size={12} /><span>Clear</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── TABLE ─── */}
                  <div className="data-card-body">
                    {loading && !adminUsers.length ? (
                      <div style={{ padding: '12px 8px', fontSize: 11, color: '#999' }}>Loading users...</div>
                    ) : error ? (
                      <div style={{ padding: '12px 8px', fontSize: 11, color: '#c00' }}>Error: {error}</div>
                    ) : adminUsers.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Users size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No admin users found.</p>
                        {hasActiveFilters && <p className="text-[11px] mt-1">Try adjusting your filters.</p>}
                        <button onClick={() => setCreateModalOpen(true)} className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 text-[12px] font-bold text-white bg-aws-blue-accent hover:bg-blue-700 rounded transition-colors">
                          <Plus size={13} /><span>Add First User</span>
                        </button>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 32 }}>
                              <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                {selectedUsers.size === adminUsers.length
                                  ? <CheckSquare size={13} className="text-aws-blue-accent" />
                                  : <Square size={13} />}
                              </button>
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                              <span className="inline-flex items-center">name<SortIcon column="name" /></span>
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('email')}>
                              <span className="inline-flex items-center">email<SortIcon column="email" /></span>
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('store_role')}>
                              <span className="inline-flex items-center">role<SortIcon column="store_role" /></span>
                            </th>
                            <th>status</th>
                            <th>2fa</th>
                            <th>email verified</th>
                            <th>last login</th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                              <span className="inline-flex items-center">created<SortIcon column="created_at" /></span>
                            </th>
                            <th style={{ width: 80 }}>actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((user) => {
                            const isSelected = selectedUsers.has(user.id);
                            return (
                              <tr key={user.id} className="cursor-pointer" onClick={() => openDetailView(user)}>
                                <td onClick={e => e.stopPropagation()}>
                                  <button onClick={() => toggleSelectUser(user.id)} className="text-gray-400 hover:text-gray-600">
                                    {isSelected
                                      ? <CheckSquare size={13} className="text-aws-blue-accent" />
                                      : <Square size={13} />}
                                  </button>
                                </td>
                                <td style={{ fontWeight: 600 }}>{user.name}</td>
                                <td style={{ fontSize: 11, color: '#555' }}>{user.email}</td>
                                <td>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_BADGES[user.store_role || ''] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                    {user.store_role || user.role}
                                  </span>
                                </td>
                                <td>
                                  <span className={`inline-flex items-center space-x-1 text-[11px] font-medium ${user.is_active ? 'text-emerald-700' : 'text-red-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span>{user.is_active ? 'active' : 'inactive'}</span>
                                  </span>
                                </td>
                                <td style={{ fontSize: 11 }}>{user.mfa_enabled ? 'enabled' : 'disabled'}</td>
                                <td style={{ fontSize: 11 }}>{user.email_verified ? 'yes' : 'no'}</td>
                                <td style={{ fontSize: 11, color: '#666' }}>
                                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : '\u2014'}
                                </td>
                                <td style={{ fontSize: 11, color: '#666' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => openDetailView(user)}
                                      className="p-1 text-gray-400 hover:text-aws-blue-accent hover:bg-blue-50 rounded transition-colors" title="View details">
                                      <Eye size={13} />
                                    </button>
                                    <button onClick={() => openEditModal(user)}
                                      className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit user">
                                      <Edit3 size={13} />
                                    </button>
                                    {user.is_active ? (
                                      <button onClick={() => {
                                        setConfirmState({
                                          open: true, title: 'Deactivate User',
                                          message: `Are you sure you want to deactivate "${user.name}"? They will lose access to the admin panel.`,
                                          variant: 'warning', confirmLabel: 'Deactivate',
                                          onConfirm: () => handleDeactivate(user),
                                        });
                                      }} className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Deactivate">
                                        <ToggleRight size={13} />
                                      </button>
                                    ) : (
                                      <button onClick={() => {
                                        setConfirmState({
                                          open: true, title: 'Reactivate User',
                                          message: `Reactivate "${user.name}"? They will regain access to the admin panel.`,
                                          variant: 'info', confirmLabel: 'Reactivate',
                                          onConfirm: () => handleReactivate(user),
                                        });
                                      }} className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Reactivate">
                                        <RotateCcw size={13} />
                                      </button>
                                    )}
                                    {isSuperAdmin && <button onClick={() => setHardDeleteConfirm({ open: true, user, typedName: '' })}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Permanently delete">
                                      <Trash2 size={13} />
                                    </button>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* ─── PAGINATION ─── */}
                  {total > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #eaeded', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px]">Rows per page:</span>
                        <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setSkip(0); }}
                          className="text-[11px] border border-[#eaeded] rounded px-1.5 py-1 bg-white focus:outline-none">
                          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-[11px] text-gray-400 ml-2">
                          {skip + 1}\u2013{Math.min(skip + limit, total)} of {total}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => setSkip(0)} disabled={skip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">First</button>
                        <button onClick={() => setSkip(Math.max(0, skip - limit))} disabled={skip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
                        <span className="px-2 py-1 text-[11px] font-medium">{currentPage} / {totalPages}</span>
                        <button onClick={() => setSkip(Math.min((totalPages - 1) * limit, skip + limit))} disabled={skip + limit >= total}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                        <button onClick={() => setSkip((totalPages - 1) * limit)} disabled={skip + limit >= total}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Last</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════
                  AUDIT LOGS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'audit-logs' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Audit Logs</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => {
                        listAuditLogs({ limit: 100 }).then(setAuditLogs).catch(() => {});
                      }} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                        <RefreshCw size={12} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>
                  <div className="data-card-body">
                    {loading ? (
                      <div style={{ padding: '12px 8px', fontSize: 11, color: '#999' }}>Loading audit logs...</div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>admin</th>
                            <th>action</th>
                            <th>resource type</th>
                            <th>resource id</th>
                            <th>ip address</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '20px 8px', fontSize: 11 }}>No audit logs found.</td></tr>
                          ) : (
                            auditLogs.map((log) => (
                              <tr key={log.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{log.admin_id.slice(0, 8)}...</td>
                                <td>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    log.action === 'create' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    log.action === 'update' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    log.action === 'deactivate' ? 'bg-red-50 text-red-700 border-red-200' :
                                    log.action === 'reactivate' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                    log.action === 'hard_delete' ? 'bg-red-100 text-red-800 border-red-300' :
                                    'bg-gray-100 text-gray-700 border-gray-200'
                                  }`}>{log.action}</span>
                                </td>
                                <td style={{ fontSize: 11 }}>{log.resource_type}</td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace' }}>{log.resource_id ? log.resource_id.slice(0, 12) + '...' : '\u2014'}</td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace' }}>{log.ip_address || '\u2014'}</td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════
                  LOGIN HISTORY TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'login-history' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Login History</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setLhSkip(0); fetchLoginHistoryData(); }}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors" disabled={loginHistoryLoading}>
                        <RefreshCw size={12} className={loginHistoryLoading ? 'animate-spin' : ''} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter bar */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={lhSuccessFilter} onChange={e => { setLhSuccessFilter(e.target.value); setLhSkip(0); }}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[120px]">
                        <option value="">All Results</option>
                        <option value="true">Successful</option>
                        <option value="false">Failed</option>
                      </select>

                      <select value={lhAdminFilter} onChange={e => { setLhAdminFilter(e.target.value); setLhSkip(0); }}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[150px]">
                        <option value="">All Admins</option>
                        {adminUsers
                          .filter(u => u.is_active)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                          ))}
                      </select>

                      {(lhSuccessFilter || lhAdminFilter) && (
                        <button onClick={() => { setLhSuccessFilter(''); setLhAdminFilter(''); setLhSkip(0); }}
                          className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                          <FilterX size={12} /><span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="data-card-body">
                    {loginHistoryLoading ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading login history...
                      </div>
                    ) : loginHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <History size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No login history found.</p>
                        {(lhSuccessFilter || lhAdminFilter) && <p className="text-[11px] mt-1">Try adjusting your filters.</p>}
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>admin</th>
                            <th>status</th>
                            <th>ip address</th>
                            <th>user agent</th>
                            <th>failure reason</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.map((h) => {
                            const nameMap = adminNameMap();
                            const adminName = nameMap.get(h.admin_id) || h.admin_id.slice(0, 8) + '...';
                            const ua = h.user_agent || '';
                            const isMobile = /iphone|android|mobile/i.test(ua);
                            const isDesktop = /windows|mac|linux/i.test(ua);
                            const DeviceIcon = !ua ? Globe : isMobile ? Smartphone : isDesktop ? Laptop : Globe;
                            return (
                              <tr key={h.id}>
                                <td style={{ fontSize: 11, fontWeight: 600 }}>{adminName}</td>
                                <td>
                                  <span className={`inline-flex items-center space-x-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    h.success
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : 'text-red-700 bg-red-50 border-red-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${h.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span>{h.success ? 'Success' : 'Failed'}</span>
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                  <span title={h.ip_address || ''}>{h.ip_address || '\u2014'}</span>
                                </td>
                                <td style={{ fontSize: 11, maxWidth: 220 }}>
                                  {ua ? (
                                    <span className="inline-flex items-center space-x-1.5" title={ua}>
                                      <DeviceIcon size={12} className={`shrink-0 ${isMobile ? 'text-purple-500' : isDesktop ? 'text-blue-500' : 'text-gray-400'}`} />
                                      <span style={{
                                        maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block'
                                      }}>{ua.slice(0, 80)}{ua.length > 80 ? '...' : ''}</span>
                                    </span>
                                  ) : '\u2014'}
                                </td>
                                <td style={{ fontSize: 11 }}>
                                  {h.failure_reason ? (
                                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-medium" title={h.failure_reason}>
                                      {h.failure_reason.length > 35 ? h.failure_reason.slice(0, 35) + '...' : h.failure_reason}
                                    </span>
                                  ) : '\u2014'}
                                </td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                  <span title={new Date(h.created_at).toLocaleString()}>
                                    {new Date(h.created_at).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {loginHistory.length > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #eaeded', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px]">Rows per page:</span>
                        <select value={lhLimit} onChange={e => { setLhLimit(Number(e.target.value)); setLhSkip(0); }}
                          className="text-[11px] border border-[#eaeded] rounded px-1.5 py-1 bg-white focus:outline-none">
                          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-[11px] text-gray-400 ml-2">
                          {lhSkip + 1}\u2013{Math.min(lhSkip + lhLimit, loginHistoryTotal || loginHistory.length)} of {loginHistoryTotal || loginHistory.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => setLhSkip(0)} disabled={lhSkip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">First</button>
                        <button onClick={() => setLhSkip(Math.max(0, lhSkip - lhLimit))} disabled={lhSkip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
                        <span className="px-2 py-1 text-[11px] font-medium">
                          {Math.floor(lhSkip / lhLimit) + 1} / {Math.max(1, Math.ceil((loginHistoryTotal || loginHistory.length) / lhLimit))}
                        </span>
                        <button onClick={() => setLhSkip(lhSkip + lhLimit)} disabled={lhSkip + lhLimit >= (loginHistoryTotal || loginHistory.length)}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                        <button onClick={() => setLhSkip(Math.max(0, Math.floor(((loginHistoryTotal || loginHistory.length) - 1) / lhLimit) * lhLimit))} disabled={lhSkip + lhLimit >= (loginHistoryTotal || loginHistory.length)}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Last</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════
                  SESSIONS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'sessions' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Admin Sessions</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => { setSessSkip(0); fetchSessionsData(); }}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors" disabled={sessionsLoading}>
                        <RefreshCw size={12} className={sessionsLoading ? 'animate-spin' : ''} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter bar */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={sessActiveFilter} onChange={e => { setSessActiveFilter(e.target.value); setSessSkip(0); }}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[120px]">
                        <option value="all">All Sessions</option>
                        <option value="active_only">Active Only</option>
                        <option value="inactive_only">Inactive Only</option>
                      </select>

                      <select value={sessAdminFilter} onChange={e => { setSessAdminFilter(e.target.value); setSessSkip(0); }}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[150px]">
                        <option value="">All Admins</option>
                        {adminUsers
                          .filter(u => u.is_active)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                          ))}
                      </select>

                      {(sessActiveFilter !== 'all' || sessAdminFilter) && (
                        <button onClick={() => { setSessActiveFilter('all'); setSessAdminFilter(''); setSessSkip(0); }}
                          className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                          <FilterX size={12} /><span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="data-card-body">
                    {sessionsLoading ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading sessions...
                      </div>
                    ) : sessions.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Monitor size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No sessions found.</p>
                        {(sessActiveFilter !== 'all' || sessAdminFilter) && <p className="text-[11px] mt-1">Try adjusting your filters.</p>}
                        {sessActiveFilter === 'all' && !sessAdminFilter && <p className="text-[11px] mt-1">Sessions are created when an admin logs in successfully.</p>}
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>admin</th>
                            <th>status</th>
                            <th>ip address</th>
                            <th>user agent</th>
                            <th>last activity</th>
                            <th>created</th>
                            <th style={{ width: 70 }}>action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessions.map((s) => {
                            const nameMap = adminNameMap();
                            const adminName = nameMap.get(s.admin_id) || s.admin_id.slice(0, 8) + '...';
                            const ua = s.user_agent || '';
                            const isMobile = /iphone|android|mobile/i.test(ua);
                            const isDesktop = /windows|mac|linux/i.test(ua);
                            const DeviceIcon = !ua ? Globe : isMobile ? Smartphone : isDesktop ? Laptop : Globe;
                            return (
                              <tr key={s.id}>
                                <td style={{ fontSize: 11, fontWeight: 600 }}>{adminName}</td>
                                <td>
                                  <span className={`inline-flex items-center space-x-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    s.is_active
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : 'text-gray-500 bg-gray-50 border-gray-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                    <span>{s.is_active ? 'Active' : 'Inactive'}</span>
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                  <span title={s.ip_address || ''}>{s.ip_address || '\u2014'}</span>
                                </td>
                                <td style={{ fontSize: 11, maxWidth: 200 }}>
                                  {ua ? (
                                    <span className="inline-flex items-center space-x-1.5" title={ua}>
                                      <DeviceIcon size={12} className={`shrink-0 ${isMobile ? 'text-purple-500' : isDesktop ? 'text-blue-500' : 'text-gray-400'}`} />
                                      <span style={{
                                        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block'
                                      }}>{ua.slice(0, 60)}{ua.length > 60 ? '...' : ''}</span>
                                    </span>
                                  ) : '\u2014'}
                                </td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                  <span title={new Date(s.last_activity).toLocaleString()}>
                                    {new Date(s.last_activity).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                  <span title={new Date(s.created_at).toLocaleString()}>
                                    {new Date(s.created_at).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                  </span>
                                </td>
                                <td>
                                  {s.is_active ? (
                                    <button onClick={async () => {
                                      try {
                                        await revokeAdminSession(s.id);
                                        addToast('success', 'Session revoked successfully');
                                        fetchSessionsData();
                                      } catch (err) {
                                        addToast('error', err instanceof Error ? err.message : 'Failed to revoke session');
                                      }
                                    }} className="inline-flex items-center space-x-1 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                                      <X size={11} /><span>Revoke</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-gray-400">\u2014</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {sessions.length > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #eaeded', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px]">Rows per page:</span>
                        <select value={sessLimit} onChange={e => { setSessLimit(Number(e.target.value)); setSessSkip(0); }}
                          className="text-[11px] border border-[#eaeded] rounded px-1.5 py-1 bg-white focus:outline-none">
                          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-[11px] text-gray-400 ml-2">
                          {sessSkip + 1}\u2013{Math.min(sessSkip + sessLimit, sessionsTotal || sessions.length)} of {sessionsTotal || sessions.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => setSessSkip(0)} disabled={sessSkip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">First</button>
                        <button onClick={() => setSessSkip(Math.max(0, sessSkip - sessLimit))} disabled={sessSkip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
                        <span className="px-2 py-1 text-[11px] font-medium">
                          {Math.floor(sessSkip / sessLimit) + 1} / {Math.max(1, Math.ceil((sessionsTotal || sessions.length) / sessLimit))}
                        </span>
                        <button onClick={() => setSessSkip(sessSkip + sessLimit)} disabled={sessSkip + sessLimit >= (sessionsTotal || sessions.length)}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                        <button onClick={() => setSessSkip(Math.max(0, Math.floor(((sessionsTotal || sessions.length) - 1) / sessLimit) * sessLimit))} disabled={sessSkip + sessLimit >= (sessionsTotal || sessions.length)}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Last</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════════
                  MY PROFILE TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'my-profile' && <AdminProfilePanel />}

              {/* ════════════════════════════════════════════════
                  ROLE PERMISSIONS TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'role-permissions' && <RolePermissionsPanel />}

              {/* ════════════════════════════════════════════════
                  INVITATIONS TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'invitations' && <InvitationPanel />}

              {/* ════════════════════════════════════════════════
                  FORCE ACTIONS TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'force-actions' && <ForceActionsPanel />}

              {/* ════════════════════════════════════════════════
                  ACCOUNT LOCKOUTS TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'account-lockouts' && <AccountLockoutPanel />}

              {/* ════════════════════════════════════════════════
                  APPROVALS TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'approvals' && <ApprovalPanel />}

              {/* ════════════════════════════════════════════════
                  ACTIVITY TIMELINE TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'activity-timeline' && <ActivityTimeline />}

              {/* ════════════════════════════════════════════════
                  AUDIT EXPORT & RETENTION TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'audit-retention' && <AuditLogRetentionPanel />}

              {/* ════════════════════════════════════════════════
                  SESSION POLICY TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'session-policy' && <SessionPolicyPanel />}

              {/* ════════════════════════════════════════════════
                  BULK IMPORT TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'bulk-import' && <BulkImportPanel />}

              {/* ════════════════════════════════════════════════
                  IP ALLOWLIST TAB
              ════════════════════════════════════════════════ */}
              {activeSection === 'ip-allowlist' && <IPAllowlistPanel />}

            </div>
          </div>
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════
          CREATE USER MODAL
      ═══════════════════════════════════════════════════ */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { if (!actionLoading) setCreateModalOpen(false); }}>
          <div className="bg-white rounded-lg w-full max-w-md border border-aws-border shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Plus size={16} className="text-aws-blue-accent" />
                <h2 className="text-[15px] font-bold text-aws-heading">Add Admin User</h2>
              </div>
              <button onClick={() => setCreateModalOpen(false)} disabled={actionLoading} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Full Name</label>
                <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${createErrors.name ? 'border-red-400' : 'border-[#eaeded]'}`}
                  placeholder="John Doe" />
                {createErrors.name && <p className="text-[10px] text-red-500 mt-1">{createErrors.name}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${createErrors.email ? 'border-red-400' : 'border-[#eaeded]'}`}
                  placeholder="john@example.com" />
                {createErrors.email && <p className="text-[10px] text-red-500 mt-1">{createErrors.email}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Password</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${createErrors.password ? 'border-red-400' : 'border-[#eaeded]'}`}
                  placeholder="Min 6 characters" />
                {createErrors.password && <p className="text-[10px] text-red-500 mt-1">{createErrors.password}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Role</label>
                <select value={createForm.store_role} onChange={e => setCreateForm(f => ({ ...f, store_role: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 bg-white">
                  {ADMIN_ROLES.filter(r => isSuperAdmin || r.value !== 'super_admin').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
              <button onClick={() => setCreateModalOpen(false)} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleCreateUser} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-aws-blue-accent hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{actionLoading ? 'Creating...' : 'Create User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          EDIT USER MODAL
      ═══════════════════════════════════════════════════ */}
      {editModalOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { if (!actionLoading) { setEditModalOpen(false); setEditUser(null); } }}>
          <div className="bg-white rounded-lg w-full max-w-md border border-aws-border shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Edit3 size={16} className="text-amber-600" />
                <h2 className="text-[15px] font-bold text-aws-heading">Edit User</h2>
              </div>
              <button onClick={() => { setEditModalOpen(false); setEditUser(null); }} disabled={actionLoading} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-aws-border">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-aws-blue-accent to-blue-700 flex items-center justify-center text-[13px] font-bold text-white">
                  {editUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-aws-heading">{editUser.name}</p>
                  <p className="text-[11px] text-aws-text-secondary">{editUser.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${editErrors.name ? 'border-red-400' : 'border-[#eaeded]'}`}
                  placeholder="John Doe" />
                {editErrors.name && <p className="text-[10px] text-red-500 mt-1">{editErrors.name}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Role</label>
                <select value={editForm.store_role} onChange={e => setEditForm(f => ({ ...f, store_role: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 bg-white">
                  {ADMIN_ROLES.filter(r => isSuperAdmin || r.value !== 'super_admin').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertTriangle size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800">Email cannot be changed. Create a new user if a different email is needed.</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
              <button onClick={() => { setEditModalOpen(false); setEditUser(null); }} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleEditUser} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{actionLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          HARD DELETE CONFIRMATION (with name typing)
      ═══════════════════════════════════════════════════ */}
      {hardDeleteConfirm.open && hardDeleteConfirm.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { if (!actionLoading) setHardDeleteConfirm({ open: false, user: null, typedName: '' }); }}>
          <div className="bg-white rounded-lg w-full max-w-sm border border-aws-border shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-[15px] font-bold text-aws-heading">Permanently Delete User</h2>
              </div>
              <button onClick={() => setHardDeleteConfirm({ open: false, user: null, typedName: '' })} disabled={actionLoading} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-red-600" />
                </div>
                <div className="space-y-3">
                  <p className="text-[13px] text-aws-text-secondary leading-relaxed">
                    This will permanently delete <strong>{hardDeleteConfirm.user.name}</strong> ({hardDeleteConfirm.user.email}). This action <strong className="text-red-600">cannot be undone</strong>.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">
                      Type <span className="text-red-600 font-bold">{hardDeleteConfirm.user.name}</span> to confirm:
                    </label>
                    <input type="text" value={hardDeleteConfirm.typedName} onChange={e => setHardDeleteConfirm(prev => ({ ...prev, typedName: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-red-300 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                      placeholder={hardDeleteConfirm.user.name} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
              <button onClick={() => setHardDeleteConfirm({ open: false, user: null, typedName: '' })} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleHardDelete} disabled={actionLoading || hardDeleteConfirm.typedName !== hardDeleteConfirm.user.name}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{actionLoading ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          CONFIRM DIALOG (reusable)
      ═══════════════════════════════════════════════════ */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        loading={actionLoading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />

      {/* ═══════════════════════════════════════════════════
          USER DETAIL MODAL
      ═══════════════════════════════════════════════════ */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          auditLogs={detailUserLogs}
          sessions={detailUserSessions}
          onRevokeSession={handleRevokeSession}
          onClose={() => { setDetailUser(null); setDetailUserLogs([]); setDetailUserSessions([]); }}
        />
      )}
    </div>
  );
}
