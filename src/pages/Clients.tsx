import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Client } from '../types';

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  function loadClients() {
    api.getClients().then(setClients);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await api.updateClient(editingId, form);
    } else {
      await api.createClient(form);
    }
    setForm({ name: '', phone: '', address: '' });
    setShowForm(false);
    setEditingId(null);
    loadClients();
  }

  function startEdit(c: Client) {
    setForm({ name: c.name, phone: c.phone || '', address: c.address || '' });
    setEditingId(c.id);
    setShowForm(true);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', phone: '', address: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded">
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
          <div className="grid gap-3">
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              placeholder="Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="border p-2 rounded"
            />
            <button type="submit" className="bg-green-600 text-white py-2 rounded">
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {clients.map(c => (
          <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
            <div>
              <div className="font-medium">{c.name}</div>
              {c.phone && <div className="text-sm text-gray-500">{c.phone}</div>}
            </div>
            <div className="text-right">
              <div className={`font-bold ${(c.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{(c.current_balance || 0).toFixed(1)}
              </div>
              <button onClick={() => startEdit(c)} className="text-blue-600 text-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}