import { useState } from 'react';
import { Shield } from 'lucide-react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    alert('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input
                type="text"
                defaultValue="VYTA Fitness Marketplace"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                defaultValue="support@vytafitness.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                defaultValue="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security</p>
                </div>
              </div>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-100">
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
