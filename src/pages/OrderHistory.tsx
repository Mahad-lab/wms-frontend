import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Order } from '../types';
import { BillPreview } from '../components/BillPreview';

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ client_id: '', from: '', to: '' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filters.client_id}
          onChange={e => setFilters({ ...filters, client_id: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Clients</option>
          {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={e => setFilters({ ...filters, from: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => setFilters({ ...filters, to: e.target.value })}
          className="border p-2 rounded"
        />
        <button onClick={applyFilters} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
      </div>

      <div className="space-y-2">
        {orders.map(o => (
          <div key={o.id} className="flex justify-between bg-white p-3 rounded shadow-sm">
            <div>
              <div className="font-medium">{o.client_name}</div>
              <div className="text-sm text-gray-500">{o.order_date}</div>
            </div>
            <div className="text-right">
              <div>₹{o.grand_total.toFixed(1)}</div>
              <div className={`text-sm ${o.balance_due > 0 ? 'text-red-500' : 'text-green-500'}`}>
                Due: ₹{o.balance_due.toFixed(1)}
              </div>
              <button onClick={async () => {
                const full = await api.getOrder(o.id);
                setSelectedOrder(full);
              }} className="text-blue-600 text-sm">View</button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && <BillPreview order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}