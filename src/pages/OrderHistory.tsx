import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Order } from '../types';
import { BillPreview } from '../components/BillPreview';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyDescription } from '../components/ui/empty';
import { toast } from 'sonner';

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({ client_id: '', from: '', to: '' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingPayment, setEditingPayment] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getClients(),
      api.getOrders()
    ]).then(([clientsData, ordersData]) => {
      setClients(clientsData.map(c => ({ id: c.id, name: c.name })));
      setOrders(ordersData);
    }).finally(() => setLoading(false));
  }, []);

  function loadOrders(params = {}) {
    setLoading(true);
    api.getOrders(params).then(setOrders).finally(() => setLoading(false));
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
    if (isNaN(paid) || paid < 0) {
      toast.error('Invalid amount');
      return;
    }
    try {
      await api.updatePayment(orderId, paid);
      setEditingPayment(null);
      setPaymentAmount('');
      loadOrders();
      toast.success('Payment updated');
    } catch (e) {
      toast.error('Failed to update payment');
    }
  }

  async function viewOrder(order: Order) {
    const full = await api.getOrder(order.id);
    setSelectedOrder(full);
  }

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
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
        <button onClick={applyFilters} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Filter</button>
      </div>

      {orders.length === 0 ? (
        <Empty>
          <EmptyDescription>No orders found. Create your first order to see it here.</EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm flex-wrap gap-2">
              <div>
                <div className="font-medium">{o.client_name}</div>
                <div className="text-sm text-gray-500">{o.order_date}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Order: ₹{o.current_total?.toFixed(1) ?? o.grand_total.toFixed(1)}</div>
                <div className="font-medium">Till: ₹{o.balance_due.toFixed(1)}</div>
                {o.balance_due <= 0 && <div className="text-sm text-green-600">Paid</div>}
              </div>
              <div className="flex gap-2 items-center">
                {editingPayment === o.id ? (
                  <>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="Amount"
                      className="border p-1 rounded w-20"
                    />
                    <button onClick={() => updatePayment(o.id)} className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700">Save</button>
                    <button onClick={() => { setEditingPayment(null); setPaymentAmount(''); }} className="text-gray-500 bg-none border-none cursor-pointer">×</button>
                  </>
                ) : (
                  <button onClick={() => { setEditingPayment(o.id); setPaymentAmount(String(o.paid)); }} className="text-blue-600 text-sm">Update Payment</button>
                )}
                <button onClick={() => viewOrder(o)} className="text-blue-600 text-sm">View</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && <BillPreview order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}