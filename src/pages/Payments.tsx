import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Client, Payment } from '../types';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '' });

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    api.getPayments().then(setPayments);
    api.getClients().then(setClients);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id || !form.amount) return alert('Select client and enter amount');

    await api.createPayment({
      client_id: Number(form.client_id),
      amount: Number(form.amount),
      payment_date: form.payment_date,
      method: form.method,
      reference: form.reference || undefined,
    });

    setForm({ client_id: '', amount: '', payment_date: today(), method: 'cash', reference: '' });
    setShowForm(false);
    loadData();
  }

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded">
          {showForm ? 'Cancel' : '+ Add Payment'}
        </button>
      </div>

      <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
        Total Received: <strong>₹{totalReceived.toFixed(1)}</strong>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '16px', borderRadius: '4px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
            <select
              value={form.client_id}
              onChange={e => setForm({ ...form, client_id: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
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
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              required
            />
            <input
              type="date"
              value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <select
              value={form.method}
              onChange={e => setForm({ ...form, method: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
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
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button type="submit" style={{ background: '#16a34a', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Save Payment
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '8px' }}>
        {payments.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{p.client_name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {p.payment_date} · {p.method}{p.reference ? ` · ${p.reference}` : ''}
              </div>
            </div>
            <div style={{ fontWeight: 'bold', color: '#16a34a' }}>₹{p.amount.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}