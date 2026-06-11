import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vendor_id: '', name: '', description: '', price: '', stock_quantity: '0', image_url: '',
  });

  const fetchProducts = () => {
    setLoading(true);
    api('/admin/products')
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchVendors = () => {
    api('/admin/vendors').then(setVendors).catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock_quantity: parseInt(form.stock_quantity) || 0,
          image_url: form.image_url || null,
        }),
      });
      toast.success('Product created');
      setShowForm(false);
      setForm({ vendor_id: '', name: '', description: '', price: '', stock_quantity: '0', image_url: '' });
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await api(`/admin/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_available: !product.is_available }),
      });
      toast.success(`Product ${product.is_available ? 'disabled' : 'enabled'}`);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Products</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <h3 className="font-semibold text-gray-900">New Product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <select name="vendor_id" className="input-field" value={form.vendor_id} onChange={handleChange} required>
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input type="text" name="name" className="input-field" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" step="0.01" name="price" className="input-field" value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input type="number" name="stock_quantity" className="input-field" value={form.stock_quantity} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={2} className="input-field" value={form.description} onChange={handleChange} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
              <input type="url" name="image_url" className="input-field" value={form.image_url} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Product</button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Vendor</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 text-gray-600">{p.vendor_business_name}</td>
                  <td className="py-3">${parseFloat(p.price).toFixed(2)}</td>
                  <td className="py-3">{p.stock_quantity}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.is_available ? 'Available' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        className={`text-xs px-2 py-1 rounded font-medium ${p.is_available ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                      >
                        {p.is_available ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs px-2 py-1 rounded font-medium bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
