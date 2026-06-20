import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import {
  Store, Plus, Download, Search, X, ChevronDown, ChevronUp,
  ChevronsUpDown, Eye, CheckCircle2, XCircle, AlertTriangle,
  FileText, ExternalLink, FilterX, Shield, Trash2, RefreshCw,
  CheckSquare, Square, Edit3, Wallet, Package, DollarSign,
  Clock, Monitor, Globe
} from 'lucide-react';
import type { RegionConfig, AccountConfig } from '../types';
import { REGIONS, ACCOUNTS } from '../data';
import {
  listVendors, getVendor, verifyVendor, rejectVendor,
  getVendorDocuments, createAdminVendor, updateAdminVendor,
  hardDeleteVendor, getVendorLedger, getVendorWithdrawals,
  getVendorProducts, getVendorAuditLogs, getVendorLoginHistory,
  getVendorSessions, revokeVendorSession,
  listAllVendorAuditLogs, listAllVendorLoginHistory, listAllVendorSessions
} from '../api/vendors';
import { listWithdrawals, approveWithdrawal, rejectWithdrawal } from '../api/withdrawals';
import type {
  VendorResponse, VendorDocumentResponse, AdminVendorCreate,
  AdminVendorUpdate, LedgerEntryResponse, ProductResponse,
  WithdrawalResponse, VendorAuditLogResponse,
  VendorLoginHistoryResponse, VendorSessionResponse
} from '../api/types';

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const PAGE_SIZES = [10, 25, 50, 100];

const sidebarManagement = [
  { name: 'Vendors', href: '/vendors', letter: 'V' },
  { name: 'Customers', href: '/customers', letter: 'C' },
  { name: 'Products', href: '/products', letter: 'P' },
  { name: 'Withdrawals', href: '/withdrawals', letter: 'W' },
  { name: 'Consultations', href: '/consultations', letter: 'N' },
  { name: 'User Management', href: '/user-management', letter: 'U' },
];

const vendorSections = [
  { id: 'vendors', label: 'Vendors', icon: <Store size={14} /> },
  { id: 'withdrawals', label: 'Withdrawals', icon: <Wallet size={14} /> },
  { id: 'audit-logs', label: 'Audit Logs', icon: <Shield size={14} /> },
  { id: 'login-history', label: 'Login History', icon: <Clock size={14} /> },
  { id: 'sessions', label: 'Sessions', icon: <Monitor size={14} /> },
];

export default function VendorsPage() {
  const [activeRegion] = useState<RegionConfig>(REGIONS[0]);
  const [activeAccount] = useState<AccountConfig>(ACCOUNTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('vendors');

  const { addToast, toastContainer } = useToast();

  // ─── Vendors State ─────────────────────────────────
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);

  // Selection
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorResponse | null>(null);
  const [detailVendor, setDetailVendor] = useState<VendorResponse | null>(null);
  const [detailDocuments, setDetailDocuments] = useState<VendorDocumentResponse[]>([]);
  const [detailLedger, setDetailLedger] = useState<LedgerEntryResponse[]>([]);
  const [detailWithdrawals, setDetailWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [detailProducts, setDetailProducts] = useState<ProductResponse[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'documents' | 'ledger' | 'withdrawals' | 'products' | 'audit-logs' | 'login-history' | 'sessions'>('info');
  const [detailAuditLogs, setDetailAuditLogs] = useState<VendorAuditLogResponse[]>([]);
  const [detailLoginHistory, setDetailLoginHistory] = useState<VendorLoginHistoryResponse[]>([]);
  const [detailSessions, setDetailSessions] = useState<VendorSessionResponse[]>([]);

  // Create form
  const [createForm, setCreateForm] = useState({ email: '', password: '', business_name: '', description: '' });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Edit form
  const [editForm, setEditForm] = useState({ business_name: '', description: '', full_name: '', contact_mobile: '', contact_landline: '', address: '', emirates_id: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Hard delete
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{
    open: boolean; vendor: VendorResponse | null; typedName: string;
  }>({ open: false, vendor: null, typedName: '' });

  // Confirm
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info';
    confirmLabel?: string; onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  // ─── Withdrawals State ─────────────────────────────
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [wdLoading, setWdLoading] = useState(false);
  const [wdStatusFilter, setWdStatusFilter] = useState('');
  const [wdVendorMap, setWdVendorMap] = useState<Map<string, string>>(new Map());

  // ─── Audit Logs (page-level) State ─────────────────
  const [allAuditLogs, setAllAuditLogs] = useState<VendorAuditLogResponse[]>([]);
  const [alLoading, setAlLoading] = useState(false);
  const [alFilter, setAlFilter] = useState('');

  // ─── Login History (page-level) State ──────────────
  const [allLoginHistory, setAllLoginHistory] = useState<VendorLoginHistoryResponse[]>([]);
  const [lhLoading, setLhLoading] = useState(false);
  const [lhFilter, setLhFilter] = useState('');

  // ─── Vendor Sessions (page-level) State ────────────
  const [allVendorSessions, setAllVendorSessions] = useState<VendorSessionResponse[]>([]);
  const [vsLoading, setVsLoading] = useState(false);
  const [vsFilter, setVsFilter] = useState('');

  // ─── Data Fetching ─────────────────────────────────
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listVendors({
        search: search || undefined,
        status: statusFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        skip,
        limit,
      });
      setVendors(data);
      setTotal(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, skip, limit]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Also fetch all vendors for vendor name resolution in withdrawals
  const [allVendorsForMap, setAllVendorsForMap] = useState<VendorResponse[]>([]);

  useEffect(() => {
    if (activeSection === 'withdrawals') {
      listVendors({ limit: 200 }).then(setAllVendorsForMap).catch(() => {});
    }
  }, [activeSection]);

  useEffect(() => {
    const map = new Map<string, string>();
    for (const v of allVendorsForMap) map.set(v.id, v.business_name);
    setWdVendorMap(map);
  }, [allVendorsForMap]);

  const fetchWithdrawals = useCallback(async () => {
    setWdLoading(true);
    try {
      const data = await listWithdrawals({ status: wdStatusFilter || undefined });
      setAllWithdrawals(data);
    } catch {
      setAllWithdrawals([]);
    } finally {
      setWdLoading(false);
    }
  }, [wdStatusFilter]);

  useEffect(() => {
    if (activeSection === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [activeSection, fetchWithdrawals]);

  // ─── Fetch audit logs ─────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setAlLoading(true);
    try {
      const data = await listAllVendorAuditLogs({ action: alFilter || undefined });
      setAllAuditLogs(data);
    } catch {
      setAllAuditLogs([]);
    } finally {
      setAlLoading(false);
    }
  }, [alFilter]);

  useEffect(() => {
    if (activeSection === 'audit-logs') {
      fetchAuditLogs();
    }
  }, [activeSection, fetchAuditLogs]);

  // ─── Fetch login history ──────────────────────────
  const fetchLoginHistory = useCallback(async () => {
    setLhLoading(true);
    try {
      const data = await listAllVendorLoginHistory({ success: lhFilter ? lhFilter === 'true' : undefined });
      setAllLoginHistory(data);
    } catch {
      setAllLoginHistory([]);
    } finally {
      setLhLoading(false);
    }
  }, [lhFilter]);

  useEffect(() => {
    if (activeSection === 'login-history') {
      fetchLoginHistory();
    }
  }, [activeSection, fetchLoginHistory]);

  // ─── Fetch vendor sessions ────────────────────────
  const fetchVendorSessions = useCallback(async () => {
    setVsLoading(true);
    try {
      const data = await listAllVendorSessions({ active_only: vsFilter !== 'inactive' });
      setAllVendorSessions(data);
    } catch {
      setAllVendorSessions([]);
    } finally {
      setVsLoading(false);
    }
  }, [vsFilter]);

  useEffect(() => {
    if (activeSection === 'sessions') {
      fetchVendorSessions();
    }
  }, [activeSection, fetchVendorSessions]);

  // Filter vendors client-side for date range (server doesn't support it)
  const filteredVendors = vendors.filter(v => {
    if (createdAfter && new Date(v.created_at) < new Date(createdAfter)) return false;
    if (createdBefore && new Date(v.created_at) > new Date(createdBefore + 'T23:59:59')) return false;
    return true;
  });

  const totalFiltered = filteredVendors.length;
  const totalPages = Math.ceil(totalFiltered / limit);
  const currentPage = Math.floor(skip / limit) + 1;
  const paginatedVendors = filteredVendors.slice(0, limit);

  // Stats
  const pendingCount = vendors.filter(v => v.onboarding_status === 'pending').length;
  const approvedCount = vendors.filter(v => v.onboarding_status === 'approved').length;
  const rejectedCount = vendors.filter(v => v.onboarding_status === 'rejected').length;

  // Sort icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronsUpDown size={11} className="text-gray-300 ml-1" />;
    return sortOrder === 'asc'
      ? <ChevronUp size={11} className="text-aws-blue-accent ml-1" />
      : <ChevronDown size={11} className="text-aws-blue-accent ml-1" />;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setSkip(0);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCreatedAfter('');
    setCreatedBefore('');
    setSkip(0);
  };

  const hasActiveFilters = search || statusFilter || createdAfter || createdBefore;

  // Selection
  const toggleSelectAll = () => {
    if (selectedVendors.size === paginatedVendors.length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(paginatedVendors.map(v => v.id)));
    }
  };

  const toggleSelectVendor = (id: string) => {
    setSelectedVendors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ─── CRUD Handlers ─────────────────────────────────
  const handleCreateVendor = async () => {
    const errors: Record<string, string> = {};
    if (!createForm.business_name.trim()) errors.business_name = 'Business name is required';
    if (!createForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(createForm.email)) errors.email = 'Invalid email';
    if (!createForm.password) errors.password = 'Password is required';
    else if (createForm.password.length < 6) errors.password = 'Min 6 characters';
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setActionLoading(true);
    try {
      const body: AdminVendorCreate = {
        email: createForm.email.trim(),
        password: createForm.password,
        business_name: createForm.business_name.trim(),
        description: createForm.description.trim() || undefined,
      };
      await createAdminVendor(body);
      addToast('success', `Vendor "${createForm.business_name}" created successfully`);
      setCreateModalOpen(false);
      setCreateForm({ email: '', password: '', business_name: '', description: '' });
      setCreateErrors({});
      fetchVendors();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (vendor: VendorResponse) => {
    setEditVendor(vendor);
    setEditForm({
      business_name: vendor.business_name,
      description: vendor.description || '',
      full_name: vendor.full_name || '',
      contact_mobile: vendor.contact_mobile || '',
      contact_landline: vendor.contact_landline || '',
      address: vendor.address || '',
      emirates_id: vendor.emirates_id || '',
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditVendor = async () => {
    if (!editVendor) return;
    const errors: Record<string, string> = {};
    if (!editForm.business_name.trim()) errors.business_name = 'Business name is required';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setActionLoading(true);
    try {
      const body: AdminVendorUpdate = {
        business_name: editForm.business_name.trim(),
        description: editForm.description.trim() || undefined,
        full_name: editForm.full_name.trim() || undefined,
        contact_mobile: editForm.contact_mobile.trim() || undefined,
        contact_landline: editForm.contact_landline.trim() || undefined,
        address: editForm.address.trim() || undefined,
        emirates_id: editForm.emirates_id.trim() || undefined,
      };
      await updateAdminVendor(editVendor.id, body);
      addToast('success', `"${editForm.business_name}" updated successfully`);
      setEditModalOpen(false);
      setEditVendor(null);
      fetchVendors();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyVendor = async (vendor: VendorResponse) => {
    setActionLoading(true);
    try {
      await verifyVendor(vendor.id);
      addToast('success', `"${vendor.business_name}" approved successfully`);
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchVendors();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to approve vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVendor = async (vendor: VendorResponse) => {
    setActionLoading(true);
    try {
      await rejectVendor(vendor.id);
      addToast('success', `"${vendor.business_name}" rejected`);
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchVendors();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to reject vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteConfirm.vendor) return;
    if (hardDeleteConfirm.typedName !== hardDeleteConfirm.vendor.business_name) return;
    setActionLoading(true);
    try {
      await hardDeleteVendor(hardDeleteConfirm.vendor.id);
      addToast('success', `"${hardDeleteConfirm.vendor.business_name}" permanently deleted`);
      setHardDeleteConfirm({ open: false, vendor: null, typedName: '' });
      setSelectedVendors(prev => { const n = new Set(prev); n.delete(hardDeleteConfirm.vendor!.id); return n; });
      fetchVendors();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete vendor');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk handlers
  const handleBulkApprove = async () => {
    setActionLoading(true);
    let success = 0, failed = 0;
    for (const id of selectedVendors) {
      try { await verifyVendor(id); success++; } catch { failed++; }
    }
    setConfirmState(prev => ({ ...prev, open: false }));
    setSelectedVendors(new Set());
    if (failed > 0) addToast('warning', `Approved ${success} vendors, ${failed} failed`);
    else addToast('success', `Approved ${success} vendors successfully`);
    fetchVendors();
    setActionLoading(false);
  };

  const handleBulkReject = async () => {
    setActionLoading(true);
    let success = 0, failed = 0;
    for (const id of selectedVendors) {
      try { await rejectVendor(id); success++; } catch { failed++; }
    }
    setConfirmState(prev => ({ ...prev, open: false }));
    setSelectedVendors(new Set());
    if (failed > 0) addToast('warning', `Rejected ${success} vendors, ${failed} failed`);
    else addToast('success', `Rejected ${success} vendors successfully`);
    fetchVendors();
    setActionLoading(false);
  };

  // Detail view
  const openDetailView = async (vendor: VendorResponse) => {
    setDetailVendor(vendor);
    setDetailLoading(true);
    setDetailDocuments([]);
    setDetailLedger([]);
    setDetailWithdrawals([]);
    setDetailProducts([]);
    setDetailAuditLogs([]);
    setDetailLoginHistory([]);
    setDetailSessions([]);
    setDetailTab('info');
    try {
      const [fullVendor, docs, ledger, wds, products, auditLogs, loginHistory, sessions] = await Promise.all([
        getVendor(vendor.id),
        getVendorDocuments(vendor.id),
        getVendorLedger(vendor.id),
        getVendorWithdrawals(vendor.id),
        getVendorProducts(vendor.id),
        getVendorAuditLogs(vendor.id),
        getVendorLoginHistory(vendor.id),
        getVendorSessions(vendor.id, false),
      ]);
      setDetailVendor(fullVendor);
      setDetailDocuments(docs);
      setDetailLedger(ledger);
      setDetailWithdrawals(wds);
      setDetailProducts(products);
      setDetailAuditLogs(auditLogs);
      setDetailLoginHistory(loginHistory);
      setDetailSessions(sessions);
    } catch {
      // partial data still set
    } finally {
      setDetailLoading(false);
    }
  };

  // Withdrawal handlers
  const handleApproveWithdrawal = async (wd: WithdrawalResponse) => {
    setActionLoading(true);
    try {
      await approveWithdrawal(wd.id);
      addToast('success', 'Withdrawal approved successfully');
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchWithdrawals();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithdrawal = async (wd: WithdrawalResponse) => {
    setActionLoading(true);
    try {
      await rejectWithdrawal(wd.id);
      addToast('success', 'Withdrawal rejected');
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchWithdrawals();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance);
  };

  // CSV export
  const exportCsv = () => {
    const header = 'Business Name,Description,Status,Balance,Email,Full Name,Contact Mobile,Created At\n';
    const rows = filteredVendors.map(v =>
      `"${v.business_name}","${v.description || ''}","${v.onboarding_status}","${v.current_balance}","${v.email || ''}","${v.full_name || ''}","${v.contact_mobile || ''}","${v.created_at}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vendors.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── RENDER ────────────────────────────────────────
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
                <a href="/" className="flex items-center px-3.5 py-2 hover:bg-gray-100 text-[#232f3e] hover:text-black transition-colors duration-150 rounded mx-1">
                  <span className="font-mono text-[9px] w-4 h-4 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 mr-2 uppercase shrink-0">D</span>
                  <span className="font-semibold text-[13px] tracking-tight">Dashboard</span>
                </a>
              </li>
              <li>
                <a href="/orders" className="flex items-center px-3.5 py-2 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors duration-150 rounded mx-1">
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
                      item.href === '/vendors' ? 'text-aws-blue-accent bg-blue-50 font-semibold' : 'text-[#414d5c] hover:text-aws-blue-accent'
                    }`}
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

          <h1 className="section-title" style={{ marginTop: 0 }}>Vendors</h1>

          {/* ─── STAT CARDS ─── */}
          {activeSection === 'vendors' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              {loading && !vendors.length ? (
                <div style={{ fontSize: 11, color: '#999', padding: '12px 8px' }}>Loading stats...</div>
              ) : (
                <>
                  <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                    <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{vendors.length}</div>
                      <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>total vendors</div>
                    </div>
                  </div>
                  <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                    <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{pendingCount}</div>
                      <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>pending</div>
                    </div>
                  </div>
                  <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                    <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{approvedCount}</div>
                      <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>approved</div>
                    </div>
                  </div>
                  <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                    <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{rejectedCount}</div>
                      <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>rejected</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── SECTION NAV ─── */}
          <div className="flex" style={{ gap: 0 }}>
            <nav className="bg-white border border-[#eaeded] rounded-[2px] shrink-0 self-start" style={{ width: 160, marginRight: 12 }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
                {vendorSections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => { setActiveSection(sec.id); setSkip(0); }}
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

            <div className="flex-1" style={{ minWidth: 0 }}>

              {/* ════════════════════════════════════════════
                  VENDORS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'vendors' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>All Vendors</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => fetchVendors()} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                        <RefreshCw size={12} /><span>Refresh</span>
                      </button>
                      {filteredVendors.length > 0 && (
                        <button onClick={exportCsv} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                          <Download size={12} /><span>Export</span>
                        </button>
                      )}
                      <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center space-x-1 px-3 py-1.5 text-[12px] font-bold text-white bg-aws-blue-accent hover:bg-blue-700 rounded transition-colors">
                        <Plus size={13} /><span>Add Vendor</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter bar */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[180px] max-w-[260px]">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" placeholder="Search name, email..."
                          value={search} onChange={e => setSearch(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && fetchVendors()}
                          className="w-full pl-8 pr-7 py-1.5 text-[12px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 bg-white"
                        />
                        {search && (
                          <button onClick={() => { setSearch(''); setSkip(0); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSkip(0); }}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[120px]">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <input type="date" value={createdAfter} onChange={e => setCreatedAfter(e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[130px]" title="Created after" />

                      <input type="date" value={createdBefore} onChange={e => setCreatedBefore(e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[130px]" title="Created before" />

                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                          <FilterX size={12} /><span>Clear</span>
                        </button>
                      )}
                    </div>

                    {hasActiveFilters && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mr-1">Filters:</span>
                        {search && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-medium">Search: {search}
                          <button onClick={() => { setSearch(''); setSkip(0); }}><X size={10} /></button></span>}
                        {statusFilter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-medium">Status: {statusFilter}
                          <button onClick={() => { setStatusFilter(''); setSkip(0); }}><X size={10} /></button></span>}
                        {createdAfter && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-medium">After: {createdAfter}
                          <button onClick={() => setCreatedAfter('')}><X size={10} /></button></span>}
                        {createdBefore && <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-medium">Before: {createdBefore}
                          <button onClick={() => setCreatedBefore('')}><X size={10} /></button></span>}
                      </div>
                    )}
                  </div>

                  {/* Bulk action bar */}
                  {selectedVendors.size > 0 && (
                    <div className="bulk-action-bar" style={{ padding: '8px 12px', background: '#f0f5ff', borderBottom: '1px solid #d0e2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="text-[12px] font-medium text-aws-blue-accent">
                        <CheckSquare size={13} className="inline mr-1" />
                        {selectedVendors.size} of {paginatedVendors.length} selected
                      </span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => {
                          setConfirmState({
                            open: true, title: 'Bulk Approve',
                            message: `Approve ${selectedVendors.size} selected vendor(s)? Documents will also be approved.`,
                            variant: 'info', confirmLabel: 'Approve All',
                            onConfirm: handleBulkApprove,
                          });
                        }} disabled={actionLoading} className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                          <CheckCircle2 size={12} /><span>Approve</span>
                        </button>
                        <button onClick={() => {
                          setConfirmState({
                            open: true, title: 'Bulk Reject',
                            message: `Reject ${selectedVendors.size} selected vendor(s)?`,
                            variant: 'danger', confirmLabel: 'Reject All',
                            onConfirm: handleBulkReject,
                          });
                        }} disabled={actionLoading} className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition-colors">
                          <XCircle size={12} /><span>Reject</span>
                        </button>
                        <button onClick={() => setSelectedVendors(new Set())} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-200 rounded transition-colors">
                          <X size={12} /><span>Clear</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Table */}
                  <div className="data-card-body">
                    {loading && !vendors.length ? (
                      <div style={{ padding: '12px 8px', fontSize: 11, color: '#999' }}>Loading vendors...</div>
                    ) : error ? (
                      <div style={{ padding: '12px 8px', fontSize: 11, color: '#c00' }}>Error: {error}</div>
                    ) : filteredVendors.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Store size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No vendors found.</p>
                        {hasActiveFilters && <p className="text-[11px] mt-1">Try adjusting your filters.</p>}
                        {!vendors.length && (
                          <button onClick={() => setCreateModalOpen(true)} className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 text-[12px] font-bold text-white bg-aws-blue-accent hover:bg-blue-700 rounded transition-colors">
                            <Plus size={13} /><span>Add First Vendor</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 32 }}>
                              <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                {selectedVendors.size === paginatedVendors.length
                                  ? <CheckSquare size={13} className="text-aws-blue-accent" />
                                  : <Square size={13} />}
                              </button>
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('business_name')}>
                              <span className="inline-flex items-center">business name<SortIcon column="business_name" /></span>
                            </th>
                            <th>email</th>
                            <th>contact</th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('onboarding_status')}>
                              <span className="inline-flex items-center">status<SortIcon column="onboarding_status" /></span>
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('current_balance')}>
                              <span className="inline-flex items-center">balance<SortIcon column="current_balance" /></span>
                            </th>
                            <th className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                              <span className="inline-flex items-center">created<SortIcon column="created_at" /></span>
                            </th>
                            <th style={{ width: 110 }}>actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVendors.map((vendor) => {
                            const isSelected = selectedVendors.has(vendor.id);
                            return (
                              <tr key={vendor.id}>
                                <td onClick={e => e.stopPropagation()}>
                                  <button onClick={() => toggleSelectVendor(vendor.id)} className="text-gray-400 hover:text-gray-600">
                                    {isSelected
                                      ? <CheckSquare size={13} className="text-aws-blue-accent" />
                                      : <Square size={13} />}
                                  </button>
                                </td>
                                <td style={{ fontWeight: 600 }}>{vendor.business_name}</td>
                                <td style={{ fontSize: 11, color: '#555' }}>{vendor.email || '\u2014'}</td>
                                <td style={{ fontSize: 11, color: '#555' }}>{vendor.contact_mobile || '\u2014'}</td>
                                <td>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGES[vendor.onboarding_status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                    {vendor.onboarding_status}
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                  <span className={Number(vendor.current_balance) > 0 ? 'text-emerald-700 font-semibold' : Number(vendor.current_balance) < 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                                    {formatBalance(Number(vendor.current_balance))}
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap' }}>
                                  {new Date(vendor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => openDetailView(vendor)}
                                      className="p-1 text-gray-400 hover:text-aws-blue-accent hover:bg-blue-50 rounded transition-colors" title="View details">
                                      <Eye size={13} />
                                    </button>
                                    <button onClick={() => openEditModal(vendor)}
                                      className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit vendor">
                                      <Edit3 size={13} />
                                    </button>
                                    {vendor.onboarding_status === 'pending' && (
                                      <>
                                        <button onClick={() => {
                                          setConfirmState({
                                            open: true, title: 'Approve Vendor',
                                            message: `Approve "${vendor.business_name}"? Documents will also be approved.`,
                                            variant: 'info', confirmLabel: 'Approve',
                                            onConfirm: () => handleVerifyVendor(vendor),
                                          });
                                        }} className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                                          <CheckCircle2 size={13} />
                                        </button>
                                        <button onClick={() => {
                                          setConfirmState({
                                            open: true, title: 'Reject Vendor',
                                            message: `Reject "${vendor.business_name}"? Documents will also be rejected.`,
                                            variant: 'danger', confirmLabel: 'Reject',
                                            onConfirm: () => handleRejectVendor(vendor),
                                          });
                                        }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                                          <XCircle size={13} />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => setHardDeleteConfirm({ open: true, vendor, typedName: '' })}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Permanently delete">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Pagination */}
                  {total > 0 && (
                    <div style={{ padding: '8px 12px', borderTop: '1px solid #eaeded', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px]">Rows per page:</span>
                        <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setSkip(0); }}
                          className="text-[11px] border border-[#eaeded] rounded px-1.5 py-1 bg-white focus:outline-none">
                          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="text-[11px] text-gray-400 ml-2">
                          {skip + 1}\u2013{Math.min(skip + limit, totalFiltered)} of {totalFiltered}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => setSkip(0)} disabled={skip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">First</button>
                        <button onClick={() => setSkip(Math.max(0, skip - limit))} disabled={skip === 0}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Prev</button>
                        <span className="px-2 py-1 text-[11px] font-medium">{currentPage} / {totalPages}</span>
                        <button onClick={() => setSkip(Math.min((totalPages - 1) * limit, skip + limit))} disabled={skip + limit >= totalFiltered}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                        <button onClick={() => setSkip((totalPages - 1) * limit)} disabled={skip + limit >= totalFiltered}
                          className="px-2 py-1 text-[11px] border border-[#eaeded] rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">Last</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════
                  WITHDRAWALS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'withdrawals' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Withdrawal Requests</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={fetchWithdrawals} disabled={wdLoading}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                        <RefreshCw size={12} className={wdLoading ? 'animate-spin' : ''} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={wdStatusFilter} onChange={e => setWdStatusFilter(e.target.value)}
                        className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[120px]">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {wdStatusFilter && (
                        <button onClick={() => setWdStatusFilter('')} className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                          <FilterX size={12} /><span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="data-card-body">
                    {wdLoading ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading withdrawals...
                      </div>
                    ) : allWithdrawals.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Wallet size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No withdrawal requests found.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>vendor</th>
                            <th>amount</th>
                            <th>status</th>
                            <th>bank details</th>
                            <th>created</th>
                            <th>processed</th>
                            <th style={{ width: 90 }}>actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allWithdrawals.map((wd) => {
                            const vendorName = wdVendorMap.get(wd.vendor_id) || wd.vendor_id.slice(0, 8) + '...';
                            return (
                              <tr key={wd.id}>
                                <td style={{ fontSize: 11, fontWeight: 600 }}>{vendorName}</td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>{formatBalance(Number(wd.amount))}</td>
                                <td>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    wd.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                    wd.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                    'bg-amber-100 text-amber-800 border-amber-200'
                                  }`}>{wd.status}</span>
                                </td>
                                <td style={{ fontSize: 10, maxWidth: 180 }}>
                                  <span className="truncate block" style={{ maxWidth: 180 }}>
                                    {wd.bank_details ? JSON.stringify(wd.bank_details).slice(0, 60) + '...' : '\u2014'}
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                  {new Date(wd.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </td>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                  {wd.processed_at ? new Date(wd.processed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                                </td>
                                <td>
                                  {wd.status === 'pending' && (
                                    <div className="flex items-center space-x-1">
                                      <button onClick={() => {
                                        setConfirmState({
                                          open: true, title: 'Approve Withdrawal',
                                          message: `Approve withdrawal of ${formatBalance(Number(wd.amount))} for ${vendorName}? This will deduct from their balance.`,
                                          variant: 'info', confirmLabel: 'Approve',
                                          onConfirm: () => handleApproveWithdrawal(wd),
                                        });
                                      }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                                        <CheckCircle2 size={13} />
                                      </button>
                                      <button onClick={() => {
                                        setConfirmState({
                                          open: true, title: 'Reject Withdrawal',
                                          message: `Reject withdrawal of ${formatBalance(Number(wd.amount))} for ${vendorName}?`,
                                          variant: 'danger', confirmLabel: 'Reject',
                                          onConfirm: () => handleRejectWithdrawal(wd),
                                        });
                                      }} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                                        <XCircle size={13} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════
                  AUDIT LOGS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'audit-logs' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Vendor Audit Logs</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={fetchAuditLogs} disabled={alLoading}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                        <RefreshCw size={12} className={alLoading ? 'animate-spin' : ''} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <select value={alFilter} onChange={e => setAlFilter(e.target.value)}
                      className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[140px]">
                      <option value="">All Actions</option>
                      <option value="login">Login</option>
                      <option value="product_created">Product Created</option>
                      <option value="product_updated">Product Updated</option>
                      <option value="withdrawal_requested">Withdrawal Requested</option>
                      <option value="withdrawal_cancelled">Withdrawal Cancelled</option>
                    </select>
                    {alFilter && (
                      <button onClick={() => setAlFilter('')} className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors ml-1">
                        <FilterX size={12} /><span>Clear</span>
                      </button>
                    )}
                  </div>

                  <div className="data-card-body">
                    {alLoading ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading audit logs...
                      </div>
                    ) : allAuditLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Shield size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No audit logs found.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>vendor id</th>
                            <th>action</th>
                            <th>resource</th>
                            <th>resource id</th>
                            <th>ip address</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allAuditLogs.map((log) => (
                            <tr key={log.id}>
                              <td style={{ fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{log.vendor_id.slice(0, 8)}...</td>
                              <td style={{ fontWeight: 600, fontSize: 11 }}>{log.action}</td>
                              <td style={{ fontSize: 11, color: '#555' }}>{log.resource_type}</td>
                              <td style={{ fontSize: 10, fontFamily: 'monospace', color: '#666' }}>{log.resource_id ? log.resource_id.slice(0, 8) + '...' : '\u2014'}</td>
                              <td style={{ fontSize: 10, color: '#777' }}>{log.ip_address || '\u2014'}</td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
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
                    <h3>Vendor Login History</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={fetchLoginHistory} disabled={lhLoading}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                        <RefreshCw size={12} className={lhLoading ? 'animate-spin' : ''} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <select value={lhFilter} onChange={e => setLhFilter(e.target.value)}
                      className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[140px]">
                      <option value="">All</option>
                      <option value="true">Success</option>
                      <option value="false">Failed</option>
                    </select>
                    {lhFilter && (
                      <button onClick={() => setLhFilter('')} className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors ml-1">
                        <FilterX size={12} /><span>Clear</span>
                      </button>
                    )}
                  </div>

                  <div className="data-card-body">
                    {lhLoading ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading login history...
                      </div>
                    ) : allLoginHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Clock size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No login history recorded.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>vendor id</th>
                            <th>status</th>
                            <th>ip address</th>
                            <th>device</th>
                            <th>reason</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allLoginHistory.map((entry) => (
                            <tr key={entry.id}>
                              <td style={{ fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{entry.vendor_id.slice(0, 8)}...</td>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  entry.success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>{entry.success ? 'Success' : 'Failed'}</span>
                              </td>
                              <td style={{ fontSize: 10, color: '#777', fontFamily: 'monospace' }}>{entry.ip_address || '\u2014'}</td>
                              <td style={{ fontSize: 11 }}>
                                {entry.user_agent ? (
                                  <span className="inline-flex items-center space-x-1 text-gray-500" title={entry.user_agent}>
                                    {/mobile|iphone|android|blackberry|iemobile|opera mini/i.test(entry.user_agent) ? (
                                      <Monitor size={11} className="text-gray-400" />
                                    ) : (
                                      <Globe size={11} className="text-gray-400" />
                                    )}
                                    <span className="text-[10px] truncate max-w-[120px] inline-block">
                                      {entry.user_agent.split(' ').slice(0, 3).join(' ') || 'Unknown'}
                                    </span>
                                  </span>
                                ) : '\u2014'}
                              </td>
                              <td style={{ fontSize: 10, color: '#888' }}>{entry.failure_reason || '\u2014'}</td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════
                  VENDOR SESSIONS TAB
              ════════════════════════════════════════════ */}
              {activeSection === 'sessions' && (
                <div className="data-card" style={{ marginBottom: 16 }}>
                  <div className="data-card-header">
                    <h3>Vendor Sessions</h3>
                    <div className="flex items-center space-x-2">
                      <button onClick={fetchVendorSessions} disabled={vsLoading}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                        <RefreshCw size={12} className={vsLoading ? 'animate-spin' : ''} /><span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
                    <select value={vsFilter} onChange={e => setVsFilter(e.target.value)}
                      className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[140px]">
                      <option value="">Active Only</option>
                      <option value="inactive">All (incl. Inactive)</option>
                    </select>
                  </div>

                  <div className="data-card-body">
                    {vsLoading ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading sessions...
                      </div>
                    ) : allVendorSessions.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                        <Monitor size={24} className="mx-auto mb-2 text-gray-300" />
                        <p>No vendor sessions found.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>vendor id</th>
                            <th>status</th>
                            <th>ip address</th>
                            <th>device</th>
                            <th>last activity</th>
                            <th>created</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {allVendorSessions.map((s) => (
                            <tr key={s.id}>
                              <td style={{ fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{s.vendor_id.slice(0, 8)}...</td>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                              </td>
                              <td style={{ fontSize: 10, color: '#777', fontFamily: 'monospace' }}>{s.ip_address || '\u2014'}</td>
                              <td style={{ fontSize: 11 }}>
                                {s.user_agent ? (
                                  <span className="inline-flex items-center space-x-1 text-gray-500" title={s.user_agent}>
                                    {/mobile|iphone|android|blackberry|iemobile|opera mini/i.test(s.user_agent) ? (
                                      <Monitor size={11} className="text-gray-400" />
                                    ) : (
                                      <Globe size={11} className="text-gray-400" />
                                    )}
                                    <span className="text-[10px] truncate max-w-[120px] inline-block">
                                      {s.user_agent.split(' ').slice(0, 3).join(' ') || 'Unknown'}
                                    </span>
                                  </span>
                                ) : '\u2014'}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(s.last_activity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(s.created_at).toLocaleDateString()}
                              </td>
                              <td>
                                {s.is_active && (
                                  <button onClick={() => {
                                    setConfirmState({
                                      open: true, title: 'Revoke Session',
                                      message: 'Revoke this vendor session? The vendor will need to log in again.',
                                      variant: 'warning', confirmLabel: 'Revoke',
                                      onConfirm: async () => {
                                        setActionLoading(true);
                                        try {
                                          await revokeVendorSession(s.vendor_id, s.id);
                                          addToast('success', 'Session revoked successfully');
                                          setConfirmState(prev => ({ ...prev, open: false }));
                                          fetchVendorSessions();
                                        } catch (err) {
                                          addToast('error', err instanceof Error ? err.message : 'Failed to revoke session');
                                        } finally {
                                          setActionLoading(false);
                                        }
                                      },
                                    });
                                  }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Revoke session">
                                    <XCircle size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════
          CREATE VENDOR MODAL
      ═══════════════════════════════════════════════════ */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { if (!actionLoading) setCreateModalOpen(false); }}>
          <div className="bg-white rounded-lg w-full max-w-md border border-aws-border shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Store size={16} className="text-aws-blue-accent" />
                <h2 className="text-[15px] font-bold text-aws-heading">Add Vendor</h2>
              </div>
              <button onClick={() => setCreateModalOpen(false)} disabled={actionLoading} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Business Name</label>
                <input type="text" value={createForm.business_name} onChange={e => setCreateForm(f => ({ ...f, business_name: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${createErrors.business_name ? 'border-red-400' : 'border-[#eaeded]'}`}
                  placeholder="Acme Corp" />
                {createErrors.business_name && <p className="text-[10px] text-red-500 mt-1">{createErrors.business_name}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Email</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${createErrors.email ? 'border-red-400' : 'border-[#eaeded]'}`}
                  placeholder="vendor@acme.com" />
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
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Description (optional)</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 resize-none"
                  rows={2} placeholder="Brief description" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
              <button onClick={() => setCreateModalOpen(false)} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleCreateVendor} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-bold text-white bg-aws-blue-accent hover:bg-blue-700 rounded-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading && (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{actionLoading ? 'Creating...' : 'Create Vendor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          EDIT VENDOR MODAL
      ═══════════════════════════════════════════════════ */}
      {editModalOpen && editVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { if (!actionLoading) { setEditModalOpen(false); setEditVendor(null); } }}>
          <div className="bg-white rounded-lg w-full max-w-md border border-aws-border shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Edit3 size={16} className="text-amber-600" />
                <h2 className="text-[15px] font-bold text-aws-heading">Edit Vendor</h2>
              </div>
              <button onClick={() => { setEditModalOpen(false); setEditVendor(null); }} disabled={actionLoading} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Business Name</label>
                <input type="text" value={editForm.business_name} onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                  className={`w-full px-3 py-2 text-[13px] border rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 ${editErrors.business_name ? 'border-red-400' : 'border-[#eaeded]'}`} />
                {editErrors.business_name && <p className="text-[10px] text-red-500 mt-1">{editErrors.business_name}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Full Name</label>
                  <input type="text" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Emirates ID</label>
                  <input type="text" value={editForm.emirates_id} onChange={e => setEditForm(f => ({ ...f, emirates_id: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Mobile</label>
                  <input type="text" value={editForm.contact_mobile} onChange={e => setEditForm(f => ({ ...f, contact_mobile: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Landline</label>
                  <input type="text" value={editForm.contact_landline} onChange={e => setEditForm(f => ({ ...f, contact_landline: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">Address</label>
                <textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#eaeded] rounded focus:outline-none resize-none" rows={2} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
              <button onClick={() => { setEditModalOpen(false); setEditVendor(null); }} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleEditVendor} disabled={actionLoading}
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
          HARD DELETE CONFIRMATION
      ═══════════════════════════════════════════════════ */}
      {hardDeleteConfirm.open && hardDeleteConfirm.vendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { if (!actionLoading) setHardDeleteConfirm({ open: false, vendor: null, typedName: '' }); }}>
          <div className="bg-white rounded-lg w-full max-w-sm border border-aws-border shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-[15px] font-bold text-aws-heading">Permanently Delete Vendor</h2>
              </div>
              <button onClick={() => setHardDeleteConfirm({ open: false, vendor: null, typedName: '' })} disabled={actionLoading} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black"><X size={16} /></button>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-red-600" />
                </div>
                <div className="space-y-3">
                  <p className="text-[13px] text-aws-text-secondary leading-relaxed">
                    This will permanently delete <strong>{hardDeleteConfirm.vendor.business_name}</strong> and all associated data (documents, transactions, withdrawals, user account). This action <strong className="text-red-600">cannot be undone</strong>.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-aws-text-secondary uppercase tracking-wide mb-1">
                      Type <span className="text-red-600 font-bold">{hardDeleteConfirm.vendor.business_name}</span> to confirm:
                    </label>
                    <input type="text" value={hardDeleteConfirm.typedName} onChange={e => setHardDeleteConfirm(prev => ({ ...prev, typedName: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-red-300 rounded focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                      placeholder={hardDeleteConfirm.vendor.business_name} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
              <button onClick={() => setHardDeleteConfirm({ open: false, vendor: null, typedName: '' })} disabled={actionLoading}
                className="px-4 py-1.5 text-[13px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleHardDelete} disabled={actionLoading || hardDeleteConfirm.typedName !== hardDeleteConfirm.vendor.business_name}
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
          VENDOR DETAIL MODAL
      ═══════════════════════════════════════════════════ */}
      {detailVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] modal-overlay" onClick={() => { setDetailVendor(null); setDetailDocuments([]); setDetailLedger([]); setDetailWithdrawals([]); setDetailProducts([]); setDetailAuditLogs([]); setDetailLoginHistory([]); setDetailSessions([]); }}>
          <div className="bg-white rounded-lg w-full max-w-3xl border border-aws-border shadow-2xl modal-content max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-aws-border bg-gray-50/50 sticky top-0 bg-gray-50/95 z-10">
              <div className="flex items-center space-x-2">
                <Store size={16} className="text-aws-blue-accent" />
                <h2 className="text-[15px] font-bold text-aws-heading">{detailVendor.business_name}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ml-2 ${STATUS_BADGES[detailVendor.onboarding_status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {detailVendor.onboarding_status}
                </span>
              </div>
              <button onClick={() => { setDetailVendor(null); setDetailDocuments([]); setDetailLedger([]); setDetailWithdrawals([]); setDetailProducts([]); setDetailAuditLogs([]); setDetailLoginHistory([]); setDetailSessions([]); }} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-black"><X size={16} /></button>
            </div>

            {/* Detail tabs */}
            <div className="flex overflow-x-auto border-b border-[#eaeded] bg-gray-50/30 px-3">
              {(['info', 'documents', 'ledger', 'withdrawals', 'products', 'audit-logs', 'login-history', 'sessions'] as const).map((tab) => (
                <button key={tab} onClick={() => setDetailTab(tab)}
                  className={`whitespace-nowrap px-2 py-2 text-[11px] font-semibold border-b-2 transition-colors capitalize ${
                    detailTab === tab ? 'border-aws-blue-accent text-aws-blue-accent' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab === 'info' && <><Store size={11} className="inline mr-1" />Info</>}
                  {tab === 'documents' && <><FileText size={11} className="inline mr-1" />Documents ({detailDocuments.length})</>}
                  {tab === 'ledger' && <><DollarSign size={11} className="inline mr-1" />Ledger ({detailLedger.length})</>}
                  {tab === 'withdrawals' && <><Wallet size={11} className="inline mr-1" />Withdrawals ({detailWithdrawals.length})</>}
                  {tab === 'products' && <><Package size={11} className="inline mr-1" />Products ({detailProducts.length})</>}
                  {tab === 'audit-logs' && <><Shield size={11} className="inline mr-1" />Audit Logs ({detailAuditLogs.length})</>}
                  {tab === 'login-history' && <><Clock size={11} className="inline mr-1" />Login History ({detailLoginHistory.length})</>}
                  {tab === 'sessions' && <><Monitor size={11} className="inline mr-1" />Sessions ({detailSessions.length})</>}
                </button>
              ))}
            </div>

            <div className="px-5 py-4">
              {detailLoading ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: '#999' }}>Loading...</div>
              ) : (
                <>
                  {/* Info Tab */}
                  {detailTab === 'info' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Business Name</p>
                        <p className="text-[13px] font-semibold text-aws-heading">{detailVendor.business_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Email</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.email || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Full Name</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.full_name || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Contact Mobile</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.contact_mobile || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Contact Landline</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.contact_landline || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Emirates ID</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.emirates_id || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Current Balance</p>
                        <p className="text-[13px] font-mono font-semibold text-emerald-700">{formatBalance(Number(detailVendor.current_balance))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Status</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGES[detailVendor.onboarding_status] || ''}`}>
                          {detailVendor.onboarding_status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Address</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.address || '\u2014'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Description</p>
                        <p className="text-[13px] text-aws-text-secondary">{detailVendor.description || '\u2014'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Created</p>
                        <p className="text-[13px] text-aws-text-secondary">{new Date(detailVendor.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Documents Tab */}
                  {detailTab === 'documents' && (
                    detailDocuments.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <FileText size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No documents uploaded.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detailDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center">
                                <FileText size={13} className="text-aws-blue-accent" />
                              </div>
                              <div>
                                <p className="text-[12px] font-medium text-aws-heading capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                                <p className="text-[10px] text-gray-400">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                doc.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                doc.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{doc.status}</span>
                              <a href={doc.document_url} target="_blank" rel="noopener noreferrer"
                                className="p-1 text-gray-400 hover:text-aws-blue-accent hover:bg-blue-50 rounded transition-colors">
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}

                  {/* Ledger Tab */}
                  {detailTab === 'ledger' && (
                    detailLedger.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <DollarSign size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No transactions found.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>type</th>
                            <th>amount</th>
                            <th>description</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailLedger.map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  entry.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {entry.type === 'credit' ? '+' : '\u2212'} {entry.type}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>
                                <span className={entry.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}>
                                  {entry.type === 'credit' ? '+' : '\u2212'}{formatBalance(Number(entry.amount))}
                                </span>
                              </td>
                              <td style={{ fontSize: 11, color: '#555' }}>{entry.description}</td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}

                  {/* Withdrawals Tab */}
                  {detailTab === 'withdrawals' && (
                    detailWithdrawals.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <Wallet size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No withdrawal requests.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>amount</th>
                            <th>status</th>
                            <th>bank details</th>
                            <th>created</th>
                            <th>processed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailWithdrawals.map((wd) => (
                            <tr key={wd.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{formatBalance(Number(wd.amount))}</td>
                              <td>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  wd.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                  wd.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                                }`}>{wd.status}</span>
                              </td>
                              <td style={{ fontSize: 10, maxWidth: 180 }}>
                                <span className="text-[10px] text-gray-600 truncate block">
                                  {wd.bank_details ? JSON.stringify(wd.bank_details).slice(0, 80) : '\u2014'}
                                </span>
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(wd.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {wd.processed_at ? new Date(wd.processed_at).toLocaleDateString() : '\u2014'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}

                  {/* Products Tab */}
                  {detailTab === 'products' && (
                    detailProducts.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <Package size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No products listed.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>name</th>
                            <th>price</th>
                            <th>stock</th>
                            <th>available</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailProducts.map((p) => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{formatBalance(Number(p.price))}</td>
                              <td style={{ fontSize: 11 }}>
                                <span className={p.stock_quantity <= 5 ? 'text-red-600 font-semibold' : 'text-gray-700'}>{p.stock_quantity}</span>
                              </td>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  p.is_available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>{p.is_available ? 'Yes' : 'No'}</span>
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(p.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}

                  {/* Audit Logs Tab */}
                  {detailTab === 'audit-logs' && (
                    detailAuditLogs.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <Shield size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No audit logs found.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>action</th>
                            <th>resource</th>
                            <th>resource id</th>
                            <th>ip address</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailAuditLogs.map((log) => (
                            <tr key={log.id}>
                              <td style={{ fontWeight: 600, fontSize: 11 }}>{log.action}</td>
                              <td style={{ fontSize: 11, color: '#555' }}>{log.resource_type}</td>
                              <td style={{ fontSize: 11, fontFamily: 'monospace', color: '#666' }}>{log.resource_id || '\u2014'}</td>
                              <td style={{ fontSize: 10, color: '#777' }}>{log.ip_address || '\u2014'}</td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}

                  {/* Login History Tab */}
                  {detailTab === 'login-history' && (
                    detailLoginHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <Clock size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No login history recorded.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>status</th>
                            <th>ip address</th>
                            <th>device</th>
                            <th>reason</th>
                            <th>created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailLoginHistory.map((entry) => (
                            <tr key={entry.id}>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  entry.success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>{entry.success ? 'Success' : 'Failed'}</span>
                              </td>
                              <td style={{ fontSize: 10, color: '#777', fontFamily: 'monospace' }}>{entry.ip_address || '\u2014'}</td>
                              <td style={{ fontSize: 11 }}>
                                {entry.user_agent ? (
                                  <span className="inline-flex items-center space-x-1 text-gray-500" title={entry.user_agent}>
                                    {/mobile|iphone|android|blackberry|iemobile|opera mini/i.test(entry.user_agent) ? (
                                      <Monitor size={11} className="text-gray-400" />
                                    ) : (
                                      <Globe size={11} className="text-gray-400" />
                                    )}
                                    <span className="text-[10px] truncate max-w-[120px] inline-block">
                                      {entry.user_agent.split(' ').slice(0, 3).join(' ') || 'Unknown'}
                                    </span>
                                  </span>
                                ) : '\u2014'}
                              </td>
                              <td style={{ fontSize: 10, color: '#888' }}>{entry.failure_reason || '\u2014'}</td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}

                  {/* Sessions Tab */}
                  {detailTab === 'sessions' && (
                    detailSessions.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '24px 0', fontSize: 11 }}>
                        <Monitor size={20} className="mx-auto mb-2 text-gray-300" />
                        <p>No sessions found.</p>
                      </div>
                    ) : (
                      <table className="dense-data-table" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>status</th>
                            <th>ip address</th>
                            <th>device</th>
                            <th>last activity</th>
                            <th>created</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailSessions.map((s) => (
                            <tr key={s.id}>
                              <td>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                              </td>
                              <td style={{ fontSize: 10, color: '#777', fontFamily: 'monospace' }}>{s.ip_address || '\u2014'}</td>
                              <td style={{ fontSize: 11 }}>
                                {s.user_agent ? (
                                  <span className="inline-flex items-center space-x-1 text-gray-500" title={s.user_agent}>
                                    {/mobile|iphone|android|blackberry|iemobile|opera mini/i.test(s.user_agent) ? (
                                      <Monitor size={11} className="text-gray-400" />
                                    ) : (
                                      <Globe size={11} className="text-gray-400" />
                                    )}
                                    <span className="text-[10px] truncate max-w-[120px] inline-block">
                                      {s.user_agent.split(' ').slice(0, 3).join(' ') || 'Unknown'}
                                    </span>
                                  </span>
                                ) : '\u2014'}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(s.last_activity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                                {new Date(s.created_at).toLocaleDateString()}
                              </td>
                              <td>
                                {s.is_active && (
                                  <button onClick={() => {
                                    setConfirmState({
                                      open: true, title: 'Revoke Session',
                                      message: 'Revoke this vendor session? The vendor will need to log in again.',
                                      variant: 'warning', confirmLabel: 'Revoke',
                                      onConfirm: async () => {
                                        setActionLoading(true);
                                        try {
                                          await revokeVendorSession(detailVendor.id, s.id);
                                          addToast('success', 'Session revoked successfully');
                                          setConfirmState(prev => ({ ...prev, open: false }));
                                          const sessions = await getVendorSessions(detailVendor.id, false);
                                          setDetailSessions(sessions);
                                        } catch (err) {
                                          addToast('error', err instanceof Error ? err.message : 'Failed to revoke session');
                                        } finally {
                                          setActionLoading(false);
                                        }
                                      },
                                    });
                                  }} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Revoke session">
                                    <XCircle size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}
                </>
              )}
            </div>

            {/* Approve/reject in detail modal for pending vendors */}
            {detailVendor.onboarding_status === 'pending' && !detailLoading && (
              <div className="flex items-center justify-end space-x-3 px-5 py-4 border-t border-aws-border bg-gray-50/50">
                <button onClick={() => {
                  setConfirmState({
                    open: true, title: 'Reject Vendor',
                    message: `Reject "${detailVendor.business_name}"?`,
                    variant: 'danger', confirmLabel: 'Reject',
                    onConfirm: () => { handleRejectVendor(detailVendor); setDetailVendor(null); },
                  });
                }} className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[12px] font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors">
                  <XCircle size={13} /><span>Reject</span>
                </button>
                <button onClick={() => {
                  setConfirmState({
                    open: true, title: 'Approve Vendor',
                    message: `Approve "${detailVendor.business_name}"?`,
                    variant: 'info', confirmLabel: 'Approve',
                    onConfirm: () => { handleVerifyVendor(detailVendor); setDetailVendor(null); },
                  });
                }} className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors">
                  <CheckCircle2 size={13} /><span>Approve</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          CONFIRM DIALOG
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
    </div>
  );
}
