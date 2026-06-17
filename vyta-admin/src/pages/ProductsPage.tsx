import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/src/api/admin';
import DataTable from '@/src/components/DataTable';
import Modal from '@/src/components/Modal';
import type { Product } from '@/src/types';
import { Edit, Trash2 } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEdit = (product: Product) => {
    setEditProduct({ ...product });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editProduct) return;
    try {
      await adminApi.updateProduct(editProduct.id, editProduct);
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminApi.deleteProduct(id);
      await load();
    } catch (err) {
      console.error(err);
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
    { key: 'name', header: 'Product Name', sortable: true },
    { key: 'vendor_name', header: 'Vendor', sortable: true, render: (p: Product) => p.vendor_name || 'N/A' },
    { key: 'price', header: 'Price', sortable: true, render: (p: Product) => `$${Number(p.price).toFixed(2)}` },
    { key: 'stock_quantity', header: 'Stock', sortable: true },
    { key: 'is_available', header: 'Status', render: (p: Product) => (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
        p.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>{p.is_available ? 'Active' : 'Hidden'}</span>
    )},
    { key: 'actions', header: 'Actions', render: (p: Product) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <span className="text-sm text-gray-500">{products.length} products</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DataTable
          columns={columns}
          data={products}
          searchKeys={['name', 'vendor_name']}
        />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Edit Product">
        {editProduct && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editProduct.name}
                onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  value={editProduct.stock_quantity}
                  onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editProduct.description}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                checked={editProduct.is_available}
                onChange={(e) => setEditProduct({ ...editProduct, is_available: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_available" className="text-sm text-gray-700">Product is available</label>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                Save Changes
              </button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
