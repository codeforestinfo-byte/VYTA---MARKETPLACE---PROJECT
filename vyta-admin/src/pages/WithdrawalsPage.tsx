import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import {
  Wallet, Search, X, RefreshCw, CheckCircle2, XCircle,
  Shield, FilterX, ChevronDown, ChevronUp, ChevronsUpDown
} from 'lucide-react';
import type { RegionConfig, AccountConfig } from '../types';
import { REGIONS, ACCOUNTS } from '../data';
import { listWithdrawals, approveWithdrawal, rejectWithdrawal } from '../api/withdrawals';
import { listVendors } from '../api/vendors';
import type { WithdrawalResponse, VendorResponse } from '../api/types';

const PAGE_SIZES = [10, 25, 50, 100];

const sidebarManagement = [
  { name: 'Vendors', href: '/vendors', letter: 'V' },
  { name: 'Customers', href: '/customers', letter: 'C' },
  { name: 'Products', href: '/products', letter: 'P' },
  { name: 'Withdrawals', href: '/withdrawals', letter: 'W' },
  { name: 'Consultations', href: '/consultations', letter: 'N' },
  { name: 'User Management', href: '/user-management', letter: 'U' },
];

export default function WithdrawalsPage() {
  const [activeRegion] = useState<RegionConfig>(REGIONS[0]);
  const [activeAccount] = useState<AccountConfig>(ACCOUNTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { addToast, toastContainer } = useToast();

  const [withdrawals, setWithdrawals] = useState<WithdrawalResponse[]>([]);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [search, setSearch] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);

  // Confirm
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; variant: 'danger' | 'warning' | 'info';
    confirmLabel?: string; onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  // Vendor name map
  const vendorMap = new Map<string, string>();
  for (const v of vendors) vendorMap.set(v.id, v.business_name);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wdData, vData] = await Promise.all([
        listWithdrawals({ status: statusFilter || undefined }),
        listVendors({ limit: 200 }),
      ]);
      setWithdrawals(wdData);
      setVendors(vData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filter + sort
  const filteredWithdrawals = withdrawals
    .filter(wd => {
      const vendorName = vendorMap.get(wd.vendor_id) || '';
      if (search && !vendorName.toLowerCase().includes(search.toLowerCase())) return false;
      if (vendorSearch && !vendorName.toLowerCase().includes(vendorSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'amount':
          cmp = Number(a.amount) - Number(b.amount);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'created_at':
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const total = filteredWithdrawals.length;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;
  const paginated = filteredWithdrawals.slice(skip, skip + limit);

  const handleSort = (column: string) => {
    if (sortBy === column) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
    setSkip(0);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronsUpDown size={11} className="text-gray-300 ml-1" />;
    return sortOrder === 'asc'
      ? <ChevronUp size={11} className="text-aws-blue-accent ml-1" />
      : <ChevronDown size={11} className="text-aws-blue-accent ml-1" />;
  };

  const clearFilters = () => {
    setStatusFilter('');
    setVendorSearch('');
    setSearch('');
    setSkip(0);
  };

  const hasActiveFilters = statusFilter || vendorSearch || search;

  const handleApprove = async (wd: WithdrawalResponse) => {
    setActionLoading(true);
    try {
      await approveWithdrawal(wd.id);
      addToast('success', 'Withdrawal approved successfully');
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (wd: WithdrawalResponse) => {
    setActionLoading(true);
    try {
      await rejectWithdrawal(wd.id);
      addToast('success', 'Withdrawal rejected');
      setConfirmState(prev => ({ ...prev, open: false }));
      fetchData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const formatBalance = (b: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(b);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length;

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
                      item.href === '/withdrawals' ? 'text-aws-blue-accent bg-blue-50 font-semibold' : 'text-[#414d5c] hover:text-aws-blue-accent'
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

          <h1 className="section-title" style={{ marginTop: 0 }}>Withdrawals</h1>

          {/* ─── STAT CARDS ─── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            {loading && !withdrawals.length ? (
              <div style={{ fontSize: 11, color: '#999', padding: '12px 8px' }}>Loading stats...</div>
            ) : (
              <>
                <div className="data-card" style={{ flex: '1 0 100px', minWidth: 110 }}>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#232f3e', lineHeight: 1.2 }}>{withdrawals.length}</div>
                    <div style={{ fontSize: 10, color: '#414d5c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 4 }}>total requests</div>
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

          {/* ─── TABLE ─── */}
          <div className="data-card" style={{ marginBottom: 16 }}>
            <div className="data-card-header">
              <h3>Withdrawal Requests</h3>
              <div className="flex items-center space-x-2">
                <button onClick={fetchData} className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-aws-text-secondary hover:bg-gray-200 rounded transition-colors">
                  <RefreshCw size={12} /><span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px] max-w-[260px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search vendor name..."
                    value={search} onChange={e => { setSearch(e.target.value); setSkip(0); }}
                    className="w-full pl-8 pr-7 py-1.5 text-[12px] border border-[#eaeded] rounded focus:outline-none focus:border-aws-blue-accent focus:ring-1 focus:ring-aws-blue-accent/20 bg-white" />
                  {search && <button onClick={() => { setSearch(''); setSkip(0); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
                </div>

                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSkip(0); }}
                  className="text-[12px] border border-[#eaeded] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-aws-blue-accent min-w-[120px]">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="inline-flex items-center space-x-1 px-2 py-1.5 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                    <FilterX size={12} /><span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="data-card-body">
              {loading && !withdrawals.length ? (
                <div style={{ padding: '12px 8px', fontSize: 11, color: '#999' }}>Loading withdrawals...</div>
              ) : error ? (
                <div style={{ padding: '12px 8px', fontSize: 11, color: '#c00' }}>Error: {error}</div>
              ) : filteredWithdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px 8px', fontSize: 12 }}>
                  <Wallet size={24} className="mx-auto mb-2 text-gray-300" />
                  <p>No withdrawal requests found.</p>
                  {hasActiveFilters && <p className="text-[11px] mt-1">Try adjusting your filters.</p>}
                </div>
              ) : (
                <table className="dense-data-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>vendor</th>
                      <th className="cursor-pointer select-none" onClick={() => handleSort('amount')}>
                        <span className="inline-flex items-center">amount<SortIcon column="amount" /></span>
                      </th>
                      <th className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                        <span className="inline-flex items-center">status<SortIcon column="status" /></span>
                      </th>
                      <th>bank details</th>
                      <th className="cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                        <span className="inline-flex items-center">created<SortIcon column="created_at" /></span>
                      </th>
                      <th>processed</th>
                      <th style={{ width: 90 }}>actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((wd) => {
                      const vendorName = vendorMap.get(wd.vendor_id) || wd.vendor_id.slice(0, 8) + '...';
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
                          <td style={{ fontSize: 10, maxWidth: 200 }}>
                            <span className="truncate block text-gray-600" style={{ maxWidth: 200 }}>
                              {wd.bank_details
                                ? (wd.bank_details as Record<string, unknown>).bank_name
                                  ? `${(wd.bank_details as Record<string, unknown>).bank_name} - ${(wd.bank_details as Record<string, unknown>).account_number || ''}`
                                  : JSON.stringify(wd.bank_details).slice(0, 80)
                                : '\u2014'}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                            {new Date(wd.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#666' }}>
                            {wd.processed_at ? new Date(wd.processed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014'}
                          </td>
                          <td>
                            {wd.status === 'pending' && (
                              <div className="flex items-center space-x-1">
                                <button onClick={() => {
                                  setConfirmState({
                                    open: true, title: 'Approve Withdrawal',
                                    message: `Approve withdrawal of ${formatBalance(Number(wd.amount))} for ${vendorName}? This will deduct from their balance.`,
                                    variant: 'info', confirmLabel: 'Approve',
                                    onConfirm: () => handleApprove(wd),
                                  });
                                }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Approve">
                                  <CheckCircle2 size={14} />
                                </button>
                                <button onClick={() => {
                                  setConfirmState({
                                    open: true, title: 'Reject Withdrawal',
                                    message: `Reject withdrawal of ${formatBalance(Number(wd.amount))} for ${vendorName}?`,
                                    variant: 'danger', confirmLabel: 'Reject',
                                    onConfirm: () => handleReject(wd),
                                  });
                                }} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                                  <XCircle size={14} />
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

            {/* Pagination */}
            {total > 0 && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid #eaeded', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#555' }}>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px]">Rows per page:</span>
                  <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setSkip(0); }}
                    className="text-[11px] border border-[#eaeded] rounded px-1.5 py-1 bg-white focus:outline-none">
                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-[11px] text-gray-400 ml-2">{skip + 1}\u2013{Math.min(skip + limit, total)} of {total}</span>
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

        </main>
      </div>

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
