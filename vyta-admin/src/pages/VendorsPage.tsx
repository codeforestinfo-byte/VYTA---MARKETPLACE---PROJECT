import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/src/api/admin';
import DataTable from '@/src/components/DataTable';
import Modal from '@/src/components/Modal';
import type { Vendor, VendorDocument } from '@/src/types';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getVendors();
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    try {
      const docs = await adminApi.getVendorDocuments(vendor.id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    }
    setShowModal(true);
  };

  const handleVerify = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.verifyVendor(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.rejectVendor(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const columns = [
    { key: 'business_name', header: 'Business Name', sortable: true },
    { key: 'full_name', header: 'Owner', sortable: true, render: (v: Vendor) => v.full_name || '-' },
    { key: 'contact_mobile', header: 'Mobile', render: (v: Vendor) => v.contact_mobile || '-' },
    { key: 'onboarding_status', header: 'Status', sortable: true, render: (v: Vendor) => (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
        v.onboarding_status === 'approved' ? 'bg-green-100 text-green-800' :
        v.onboarding_status === 'rejected' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>{v.onboarding_status}</span>
    )},
    { key: 'current_balance', header: 'Balance', sortable: true, render: (v: Vendor) => `$${Number(v.current_balance).toLocaleString()}` },
    { key: 'actions', header: 'Actions', render: (v: Vendor) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleView(v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="View">
          <Eye className="h-4 w-4" />
        </button>
        {v.onboarding_status === 'pending' && (
          <>
            <button
              onClick={() => handleVerify(v.id)}
              disabled={actionLoading === v.id}
              className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 disabled:opacity-40"
              title="Approve"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleReject(v.id)}
              disabled={actionLoading === v.id}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 disabled:opacity-40"
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
        <span className="text-sm text-gray-500">{vendors.length} vendors</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={vendors}
          searchKeys={['business_name', 'full_name', 'contact_mobile', 'email']}
          onRowClick={handleView}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Vendor Details" maxWidth="max-w-3xl">
        {selectedVendor && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Business Name</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.business_name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Owner</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.full_name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mobile</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.contact_mobile || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Emirates ID</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.emirates_id || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Balance</label>
                <p className="text-sm font-medium text-gray-900">${Number(selectedVendor.current_balance).toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Address</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.address || '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Description</label>
                <p className="text-sm font-medium text-gray-900">{selectedVendor.description || '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" /> KYC Documents
              </h3>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.document_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{doc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedVendor.onboarding_status === 'pending' && (
                <>
                  <button
                    onClick={() => { handleVerify(selectedVendor.id); setShowModal(false); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Approve Vendor
                  </button>
                  <button
                    onClick={() => { handleReject(selectedVendor.id); setShowModal(false); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Reject Vendor
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
