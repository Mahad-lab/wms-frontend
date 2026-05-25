import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Client, Payment } from '../types';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyDescription } from '../components/ui/empty';
import { toast } from 'sonner';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orders, setOrders] = useState<{ id: number; client_name: string }[]>([]);
  const [form, setForm] = useState({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '', note: '', order_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [paymentsData, clientsData, ordersData] = await Promise.all([
        api.getPayments(),
        api.getClients(),
        api.getOrders()
      ]);
      setPayments(paymentsData);
      setClients(clientsData);
      setOrders(ordersData.map((o: any) => ({ id: o.id, client_name: o.client_name })));
    } catch (e) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id || !form.amount) {
      toast.error('Please select a client and enter an amount');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.editPayment(editingId, {
          client_id: Number(form.client_id),
          amount: Number(form.amount),
          payment_date: form.payment_date,
          method: form.method,
          reference: form.reference || undefined,
          note: form.note || undefined,
        });
        toast.success('Payment updated');
      } else {
        await api.createPayment({
          client_id: Number(form.client_id),
          amount: Number(form.amount),
          payment_date: form.payment_date,
          method: form.method,
          reference: form.reference || undefined,
          note: form.note || undefined,
          order_id: form.order_id ? Number(form.order_id) : undefined,
        });
        toast.success('Payment recorded');
      }
      setForm({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '', note: '', order_id: '' });
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (e) {
      toast.error(editingId ? 'Failed to update payment' : 'Failed to save payment');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(p: Payment) {
    setForm({
      client_id: String(p.client_id),
      amount: String(p.amount),
      payment_date: p.payment_date,
      method: p.method,
      reference: p.reference || '',
      note: p.note || '',
      order_id: '',
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function deletePayment(id: number) {
    if (!confirm('Delete this payment?')) return;
    try {
      await api.deletePayment(id);
      toast.success('Payment deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete payment');
    }
  }

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '', note: '', order_id: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editingId ? 'Cancel Edit' : (showForm ? 'Cancel' : '+ Add Payment')}
        </button>
      </div>

      <div className="bg-green-50 p-3 rounded mb-4">
        Total Received: <strong>₹{totalReceived.toFixed(1)}</strong>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
          <div className="grid gap-3 max-w-sm">
            <select
              value={form.client_id}
              onChange={e => setForm({ ...form, client_id: e.target.value })}
              className="border p-2 rounded"
              required
            >
              <option value="">Select Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="date"
              value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })}
              className="border p-2 rounded"
            />
            <select
              value={form.method}
              onChange={e => setForm({ ...form, method: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
            <input
              type="text"
              placeholder="Reference (optional)"
              value={form.reference}
              onChange={e => setForm({ ...form, reference: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="border p-2 rounded"
            />
            {!editingId && (
              <select
                value={form.order_id}
                onChange={e => setForm({ ...form, order_id: e.target.value })}
                className="border p-2 rounded"
              >
                <option value="">No specific order</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>Order #{o.id} - {o.client_name}</option>
                ))}
              </select>
            )}
            <button type="submit" disabled={submitting} className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Saving...' : (editingId ? 'Update Payment' : 'Save Payment')}
            </button>
          </div>
        </form>
      )}

      {payments.length === 0 ? (
        <Empty>
          <EmptyDescription>No payments yet.</EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
              <div>
                <div className="font-medium">{p.client_name}</div>
                <div className="text-sm text-gray-500">
                  {p.payment_date} · {p.method}{p.reference ? ` · ${p.reference}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-bold text-green-600">₹{p.amount.toFixed(1)}</div>
                <button onClick={() => startEdit(p)} className="text-blue-600 text-sm">Edit</button>
                <button onClick={() => deletePayment(p.id)} className="text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
