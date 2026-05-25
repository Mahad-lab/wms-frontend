import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Client } from '../types';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyDescription } from '../components/ui/empty';

export function ClientLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ orders: any[]; payments: any[] }>({ orders: [], payments: [] });
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getClientLedger(+id) as Promise<any>,
      api.getClients()
    ]).then(([ledgerData, clients]) => {
      setData(ledgerData);
      const c = clients.find(c => c.id === +id);
      if (c) setClient(c);
    }).finally(() => setLoading(false));
  }, [id]);

  const allItems = [
    ...data.orders.map(o => ({ ...o, date: o.order_date, type: 'order' })),
    ...data.payments.map(p => ({ ...p, type: 'payment' }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  const itemsWithBalance = allItems.map(item => {
    if (item.type === 'order') {
      runningBalance += item.current_total;
      runningBalance -= item.paid;
    } else {
      runningBalance -= item.amount;
    }
    return { ...item, balance: runningBalance };
  });

  const currentBalance = itemsWithBalance.at(-1)?.balance ?? 0;

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-blue-600 bg-none border-none cursor-pointer mb-4 hover:underline">← Back</button>
      <h1 className="text-2xl font-bold mb-2">{client?.name || 'Client'} Ledger</h1>
      {client?.phone && <p className="text-gray-500 mb-4">{client.phone}</p>}

      <div className="bg-amber-50 p-3 rounded mb-4">
        Current Balance: <strong>₹{currentBalance.toFixed(1)}</strong>
      </div>

      {itemsWithBalance.length === 0 ? (
        <Empty>
          <EmptyDescription>No transactions yet.</EmptyDescription>
        </Empty>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithBalance.map(item => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="p-2">{item.date}</td>
                <td className="p-2">
                  {item.type === 'order' ? (
                    <span className="bg-blue-100 px-2 py-1 rounded text-xs">Order</span>
                  ) : (
                    <span className="bg-green-100 px-2 py-1 rounded text-xs">Payment</span>
                  )}
                </td>
                <td className="p-2 text-right text-gray-700">
                  {item.type === 'order' ? `₹${item.current_total?.toFixed(1)}` : `-₹${item.amount.toFixed(1)}`}
                </td>
                <td className="p-2 text-right font-bold text-red-600">
                  ₹{item.balance.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}