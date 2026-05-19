import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Client, Item, Category, Order } from '../types';
import { BillPreview } from '../components/BillPreview';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function NewOrder() {
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [clientId, setClientId] = useState<number | null>(null);
  const [orderDate, setOrderDate] = useState(today());
  const [lines, setLines] = useState([{ item_name: '', category: '', rate: 0, weight: 0, unit: 'kg', id: 1 }]);
  const [paid, setPaid] = useState(0);
  const [oldBalance, setOldBalance] = useState(0);
  const [notes, setNotes] = useState('');

  const [savedOrder, setSavedOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.getClients().then(setClients);
    api.getItems().then(setItems);
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!clientId) return;
    api.getClientLedger(clientId).then((data: any) => {
      const orders = data.orders || [];
      const payments = data.payments || [];
      const lastOrder = orders.at(-1);
      if (!lastOrder) {
        setOldBalance(0);
        return;
      }
      const lastOrderTime = lastOrder.created_at || '';
      const paymentsAfter = payments
        .filter((p: any) => p.created_at > lastOrderTime)
        .reduce((s: number, p: any) => s + p.amount, 0);
      setOldBalance(lastOrder.balance_due - paymentsAfter);
    });
  }, [clientId]);

  const currentTotal = lines.reduce((s, l) => s + (l.rate * l.weight || 0), 0);
  const grandTotal = oldBalance + currentTotal;
  const balanceDue = grandTotal - paid;

  async function handleSubmit() {
    if (!clientId) return alert('Select a client');
    const validLines = lines.filter(l => l.item_name && l.weight > 0);
    if (validLines.length === 0) return alert('Add at least one item');

    const order = await api.createOrder({
      client_id: clientId,
      order_date: orderDate,
      paid,
      notes: notes || undefined,
      lines: validLines.map((l, i) => ({
        item_name: l.item_name,
        category: l.category,
        rate: Number(l.rate),
        weight: Number(l.weight),
        unit: l.unit,
        sort_order: i,
      })),
    });
    setSavedOrder(order);
  }

  const handleLineChange = (id: number, field: string, value: string) => {
    setLines(lines.map(l => {
      if (l.id !== id) return l;
      let updated: typeof l;
      if (field === 'rate' || field === 'weight') {
        updated = { ...l, [field]: value === '' ? 0 : Number(value) };
      } else {
        updated = { ...l, [field]: value };
      }
      if (field === 'category') {
        updated.item_name = '';
      }
      if (field === 'item_name') {
        const item = items.find(i => i.name === value);
        if (item) updated.unit = item.default_unit;
      }
      return updated;
    }));
  };

  const addLine = () => {
    setLines([...lines, { item_name: '', category: '', rate: 0, weight: 0, unit: 'kg', id: Date.now() }]);
  };

  const removeLine = (id: number) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const filteredItems = (line: typeof lines[0]) => {
    if (!line.category) {
      const usedItems = lines.filter(l => l.id !== line.id && l.item_name).map(l => l.item_name);
      return items.filter(i => !usedItems.includes(i.name));
    }
    const cat = categories.find(c => c.name === line.category);
    const categoryItems = items.filter(i => i.category_id === cat?.id);
    const usedItems = lines.filter(l => l.id !== line.id && l.item_name).map(l => l.item_name);
    return categoryItems.filter(i => !usedItems.includes(i.name));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Order</h1>

      <div className="flex gap-4 mb-4">
        <select
          value={clientId ?? ''}
          onChange={e => setClientId(Number(e.target.value) || null)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1 }}
        >
          <option value="">Select Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={orderDate}
          onChange={e => setOrderDate(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      {oldBalance > 0 && (
        <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
          Old Balance: <strong>₹{oldBalance.toFixed(1)}</strong>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        {lines.map(line => (
          <div key={line.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={line.category}
              onChange={e => handleLineChange(line.id, 'category', e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '100px' }}
            >
              <option value="">Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={line.item_name}
              onChange={e => handleLineChange(line.id, 'item_name', e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', flex: 1, minWidth: '150px' }}
            >
              <option value="">Item</option>
              {filteredItems(line).map(i => (
                <option key={i.id} value={i.name}>{i.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Rate"
              value={line.rate || ''}
              onChange={e => handleLineChange(line.id, 'rate', e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '70px' }}
            />

            <input
              type="number"
              placeholder="Qty"
              value={line.weight || ''}
              onChange={e => handleLineChange(line.id, 'weight', e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '70px' }}
            />

            <select
              value={line.unit}
              onChange={e => handleLineChange(line.id, 'unit', e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '70px' }}
            >
              <option value="kg">kg</option>
              <option value="dozen">dozen</option>
              <option value="piece">pc</option>
              <option value="box">box</option>
            </select>

            <span style={{ width: '60px', textAlign: 'right' }}>₹{(line.rate * line.weight).toFixed(0)}</span>

            <button onClick={() => removeLine(line.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
        ))}
        <button onClick={addLine} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '8px 0' }}>+ Add Item</button>
      </div>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Current Total:</span>
          <span>₹{currentTotal.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <span>Paid Now:</span>
          <input
            type="number"
            value={paid}
            onChange={e => setPaid(+e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100px' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
          <span>Balance Due:</span>
          <span>₹{balanceDue.toFixed(1)}</span>
        </div>
        <button
          onClick={handleSubmit}
          style={{ background: '#16a34a', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
        >
          Save & Generate Bill
        </button>
      </div>

      {savedOrder && (
        <BillPreview order={savedOrder} onClose={() => setSavedOrder(null)} />
      )}
    </div>
  );
}