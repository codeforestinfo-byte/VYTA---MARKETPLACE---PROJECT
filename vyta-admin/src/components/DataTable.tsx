import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchKeys,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search || !searchKeys) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  return (
    <div>
      {searchable && (
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left py-3 px-4 font-medium text-gray-600 ${
                    col.sortable ? 'cursor-pointer hover:text-gray-900 select-none' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key && (
                      <span className="text-xs">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                  No data found
                </td>
              </tr>
            ) : (
              paged.map((item, i) => (
                <tr
                  key={(item.id as string) || i}
                  className={`border-b border-gray-100 ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4">
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
