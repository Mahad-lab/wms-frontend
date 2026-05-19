import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Order } from '../types';
import { BillPreview } from '../components/BillPreview';

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ client_id: '', from: '', to: '' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingPayment, setEditingPayment] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    api.getClients().then(cs => setClients(cs.map(c => ({ id: c.id, name: c.name }))));
    loadOrders();
  }, []);

  function loadOrders(params = {}) {
    api.getOrders(params).then(setOrders);
  }

  function applyFilters() {
    const p: any = {};
    if (filters.client_id) p.client_id = filters.client_id;
    if (filters.from) p.from = filters.from;
    if (filters.to) p.to = filters.to;
    loadOrders(p);
  }

  async function updatePayment(orderId: number) {
    const paid = Number(paymentAmount);
    if (isNaN(paid) || paid < 0) return alert('Invalid amount');
    await api.updatePayment(orderId, paid);
    setEditingPayment(null);
    setPaymentAmount('');
    loadOrders();
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={filters.client_id}
          onChange={e => setFilters({ ...filters, client_id: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">All Clients</option>
          {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters({ ...filters, from: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters({ ...filters, to: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={applyFilters} style={{ background: '#2563eb', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Filter</button>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {orders.map(o => (
          <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{o.client_name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{o.order_date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Total: ₹{o.grand_total.toFixed(1)}</div>
              {/* <div style={{ fontSize: '12px', color: o.balance_due > 0 ? '#dc2626' : '#16a34a' }}>
                Due: ₹{o.balance_due.toFixed(1)}
              </div> */}
              {/* <div style={{ fontSize: '12px', color: '#666' }}>
                Paid: ₹{o.paid.toFixed(1)}
              </div> */}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {editingPayment === o.id ? (
                <>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="Amount"
                    style={{ width: '80px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                  <button onClick={() => updatePayment(o.id)} style={{ background: '#16a34a', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
                  <button onClick={() => { setEditingPayment(null); setPaymentAmount(''); }} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </>
              ) : (
                <button onClick={() => { setEditingPayment(o.id); setPaymentAmount(String(o.paid)); }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Update Payment</button>
              )}
              <button onClick={async () => {
                const full = await api.getOrder(o.id);
                setSelectedOrder(full);
              }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>View</button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && <BillPreview order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}