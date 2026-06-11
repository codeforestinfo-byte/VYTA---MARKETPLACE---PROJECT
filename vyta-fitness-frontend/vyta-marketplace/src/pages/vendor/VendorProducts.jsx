import { useState, useEffect } from 'react';
import { api } from '../../api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });

  const fetchProducts = () => {
    setLoading(true);
    api('/products')
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url || '',
    });
    setEditing(product.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity),
      image_url: form.image_url || undefined,
    };

    try {
      if (editing) {
        await api(`/products/${editing}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Product updated');
      } else {
        await api('/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product created');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await api(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_available: !product.is_available }),
      });
      toast.success(`Product ${product.is_available ? 'disabled' : 'enabled'}`);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary text-sm">
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 max-w-lg">
          <h3 className="font-semibold">{editing ? 'Edit Product' : 'New Product'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input type="number" min="0" className="input-field" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
            <input type="url" className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'} Product</button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-gray-500">No products yet. Add your first product.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : <span className="text-gray-400">V</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900">{p.name}</h4>
                <p className="text-sm text-gray-500">${parseFloat(p.price).toFixed(2)} &middot; Stock: {p.stock_quantity}</p>
              </div>
              <button onClick={() => handleToggleAvailability(p)} className={`text-xs px-3 py-1 rounded-full font-medium ${p.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {p.is_available ? 'Active' : 'Disabled'}
              </button>
              <button onClick={() => handleEdit(p)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
