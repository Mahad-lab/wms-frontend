import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Client } from '../types';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyDescription } from '../components/ui/empty';
import { toast } from 'sonner';

export function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (e) {
      setError('Failed to load clients');
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateClient(editingId, form);
        toast.success('Client updated');
      } else {
        await api.createClient(form);
        toast.success('Client created');
      }
      setForm({ name: '', phone: '', address: '' });
      setShowForm(false);
      setEditingId(null);
      loadClients();
    } catch (e) {
      toast.error('Failed to save client');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(c: Client) {
    setForm({ name: c.name, phone: c.phone || '', address: c.address || '' });
    setEditingId(c.id);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadClients} className="text-blue-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', phone: '', address: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}>
          {editingId ? 'Cancel Edit' : (showForm ? 'Cancel' : '+ Add Client')}
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
            <button type="submit" disabled={submitting} className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      )}

      {clients.length === 0 ? (
        <Empty>
          <EmptyDescription>No clients yet. Add your first client to get started.</EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-2">
          {editingId ? null : clients.map(c => (
            <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
              <div>
                <div className="font-medium">{c.name}</div>
                {c.phone && <div className="text-sm text-gray-500">{c.phone}</div>}
                {c.address && <div className="text-sm text-gray-500">{c.address}</div>}
              </div>
              <div className="text-right">
                <div className={`font-bold ${(c.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{(c.current_balance || 0).toFixed(1)}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => navigate(`/ledger/${c.id}`)} className="text-blue-600 text-sm">Ledger</button>
                  <button onClick={() => startEdit(c)} className="text-blue-600 text-sm">Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}