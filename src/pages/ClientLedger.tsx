import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Client } from '../types';

export function ClientLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ orders: any[]; payments: any[] }>({ orders: [], payments: [] });
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!id) return;
    (api.getClientLedger(+id) as any).then(setData);
    api.getClients().then(cs => {
      const c = cs.find(c => c.id === +id);
      if (c) setClient(c);
    });
  }, [id]);

  const allItems = [
    ...data.orders.map(o => ({ ...o, date: o.order_date, type: 'order' })),
    ...data.payments.map(p => ({ ...p, type: 'payment' }))
  ].sort((a, b) => a.date.localeCompare(b.date));

  let runningBalance = 0;
  const itemsWithBalance = allItems.map(item => {
    if (item.type === 'order') {
      runningBalance = item.balance_due;
    } else {
      runningBalance -= item.amount;
    }
    return { ...item, balance: runningBalance };
  });

  const currentBalance = itemsWithBalance.at(-1)?.balance ?? 0;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>← Back</button>
      <h1 className="text-2xl font-bold mb-2">{client?.name || 'Client'} Ledger</h1>
      {client?.phone && <p style={{ color: '#666', marginBottom: '16px' }}>{client.phone}</p>}

      <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
        Current Balance: <strong>₹{currentBalance.toFixed(1)}</strong>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {itemsWithBalance.map(item => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '8px' }}>{item.date}</td>
              <td style={{ padding: '8px' }}>
                {item.type === 'order' ? (
                  <span style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Order</span>
                ) : (
                  <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>Payment</span>
                )}
              </td>
              <td style={{ padding: '8px', textAlign: 'right', color: item.type === 'payment' ? '#16a34a' : '#374151' }}>
                {item.type === 'order' ? `₹${item.current_total?.toFixed(1)}` : `-₹${item.amount.toFixed(1)}`}
              </td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: item.balance > 0 ? '#dc2626' : '#16a34a' }}>
                ₹{item.balance.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}