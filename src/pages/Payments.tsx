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
  const [form, setForm] = useState({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [paymentsData, clientsData] = await Promise.all([
        api.getPayments(),
        api.getClients()
      ]);
      setPayments(paymentsData);
      setClients(clientsData);
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
      await api.createPayment({
        client_id: Number(form.client_id),
        amount: Number(form.amount),
        payment_date: form.payment_date,
        method: form.method,
        reference: form.reference || undefined,
      });
      toast.success('Payment recorded');
      setForm({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '' });
      setShowForm(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save payment');
    } finally {
      setSubmitting(false);
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
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Payment'}
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
            <button type="submit" disabled={submitting} className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Payment'}
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
              <div className="font-bold text-green-600">₹{p.amount.toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}