import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { adminApi } from '@/src/api/admin';

const reports = [
  { key: 'sales', label: 'Sales Report', description: 'Overview of all sales transactions' },
  { key: 'vendors', label: 'Vendors Report', description: 'Vendor performance and stats' },
  { key: 'orders', label: 'Orders Report', description: 'Complete order history' },
  { key: 'revenue', label: 'Revenue Report', description: 'Revenue breakdown by period' },
  { key: 'withdrawals', label: 'Withdrawals Report', description: 'Withdrawal transaction history' },
];

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, format: 'csv' | 'excel' | 'pdf') => {
    setExporting(`${type}-${format}`);
    // Simulate export - in production, connect to a real export endpoint
    await new Promise((r) => setTimeout(r, 1000));

    let data: unknown[] = [];
    const filename = `${type}-report.${format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'}`;

    try {
      switch (type) {
        case 'vendors':
          data = await adminApi.getVendors();
          break;
        case 'orders':
          data = await adminApi.getOrders();
          break;
        case 'withdrawals':
          data = await adminApi.getWithdrawals();
          break;
        default:
          data = [];
      }
    } catch {
      // proceed with empty data
    }

    if (format === 'csv' && data.length > 0) {
      const headers = Object.keys(data[0] as Record<string, unknown>);
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = (row as Record<string, unknown>)[h];
              return val != null ? `"${String(val).replace(/"/g, '""')}"` : '';
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    setExporting(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.key} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{report.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
              </div>
              <div className="p-2 bg-indigo-50 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport(report.key, 'csv')}
                disabled={exporting === `${report.key}-csv`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                CSV
              </button>
              <button
                onClick={() => handleExport(report.key, 'excel')}
                disabled={exporting === `${report.key}-excel`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                <FileDown className="h-3.5 w-3.5" />
                Excel
              </button>
              <button
                onClick={() => handleExport(report.key, 'pdf')}
                disabled={exporting === `${report.key}-pdf`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
