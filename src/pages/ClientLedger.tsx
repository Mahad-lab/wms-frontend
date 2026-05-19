import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order, Client } from '../types';

export function ClientLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<Order[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getClientLedger(+id).then(setLedger);
    api.getClients().then(cs => {
      const c = cs.find(c => c.id === +id);
      if (c) setClient(c);
    });
  }, [id]);

  const totalDue = ledger.at(-1)?.balance_due ?? 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-blue-600 mb-4">← Back</button>
      <h1 className="text-2xl font-bold mb-2">{client?.name || 'Client'} Ledger</h1>
      {client?.phone && <p className="text-gray-500 mb-4">{client.phone}</p>}

      <div className="bg-yellow-50 p-3 rounded mb-4">
        Current Balance: <strong>₹{totalDue.toFixed(1)}</strong>
      </div>

      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-right">Old Bal</th>
            <th className="p-2 text-right">Total</th>
            <th className="p-2 text-right">Paid</th>
            <th className="p-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map(o => (
            <tr key={o.id} className="border-t">
              <td className="p-2">{o.order_date}</td>
              <td className="p-2 text-right">₹{o.old_balance.toFixed(1)}</td>
              <td className="p-2 text-right">₹{o.current_total.toFixed(1)}</td>
              <td className="p-2 text-right">₹{o.paid.toFixed(1)}</td>
              <td className={`p-2 text-right font-bold ${o.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{o.balance_due.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}