import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Client, Item, Category, Order } from '../types';
import { BillPreview } from '../components/BillPreview';
import { Spinner } from '../components/ui/spinner';
import { toast } from 'sonner';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function NewOrder() {
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientId, setClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const [orderDate, setOrderDate] = useState(today());
  const [lines, setLines] = useState([{ item_name: '', category: '', rate: 0, weight: 0, unit: 'kg', id: 1 }]);
  const [paid, setPaid] = useState(0);
  const [oldBalance, setOldBalance] = useState(0);
  const [notes, setNotes] = useState('');

  const [savedOrder, setSavedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getClients(),
      api.getItems(),
      api.getCategories()
    ]).then(([clientsData, itemsData, categoriesData]) => {
      setClients(clientsData);
      setItems(itemsData);
      setCategories(categoriesData);
    }).finally(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearch(client.name);
    setShowClientList(false);
  };

  useEffect(() => {
    if (clientSearch === '' && clientId === null) return;
    if (clientSearch === '') { setClientId(null); return; }
    api.getClientLedger(clientId!).then((data: any) => {
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
    if (!clientId) {
      toast.error('Please select a client');
      return;
    }
    const validLines = lines.filter(l => l.item_name && l.weight > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setSubmitting(true);
    try {
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
      toast.success('Order created successfully');
      resetForm();
    } catch (e) {
      toast.error('Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  const resetForm = () => {
    setClientId(null);
    setClientSearch('');
    setOrderDate(today());
    setLines([{ item_name: '', category: '', rate: 0, weight: 0, unit: 'kg', id: 1 }]);
    setPaid(0);
    setOldBalance(0);
    setNotes('');
  };

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

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Order</h1>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <input
            type="text"
            placeholder="Search client..."
            value={clientSearch}
            onChange={e => { setClientSearch(e.target.value); setShowClientList(true); }}
            onFocus={() => setShowClientList(true)}
            className="border p-2 rounded w-full"
          />
          {showClientList && (clientSearch || filteredClients.length > 0) && (
            <div className="absolute top-full left-0 right-0 bg-white border rounded shadow-md max-h-48 overflow-y-auto z-10 mt-1">
              {filteredClients.length === 0 ? (
                <div className="p-2 text-gray-500">No clients found</div>
              ) : (
                filteredClients.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {c.name}
                    {c.phone && <span className="text-gray-400 text-sm ml-2">{c.phone}</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <input
          type="date"
          value={orderDate}
          onChange={e => setOrderDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {oldBalance > 0 && (
        <div className="bg-amber-50 p-3 rounded mb-4">
          Old Balance: <strong>₹{oldBalance.toFixed(1)}</strong>
        </div>
      )}

      <div className="mb-4">
        {lines.map(line => (
          <div key={line.id} className="flex gap-2 mb-2 flex-wrap items-center">
            <select
              value={line.category}
              onChange={e => handleLineChange(line.id, 'category', e.target.value)}
              className="border p-2 rounded min-w-[100px]"
            >
              <option value="">Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={line.item_name}
              onChange={e => handleLineChange(line.id, 'item_name', e.target.value)}
              className="border p-2 rounded flex-1 min-w-[150px]"
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
              className="border p-2 rounded w-[70px]"
            />

            <input
              type="number"
              placeholder="Qty"
              value={line.weight || ''}
              onChange={e => handleLineChange(line.id, 'weight', e.target.value)}
              className="border p-2 rounded w-[70px]"
            />

            <select
              value={line.unit}
              onChange={e => handleLineChange(line.id, 'unit', e.target.value)}
              className="border p-2 rounded w-[70px]"
            >
              <option value="kg">kg</option>
              <option value="dozen">dozen</option>
              <option value="piece">pc</option>
              <option value="box">box</option>
            </select>

            <span className="w-[60px] text-right">₹{(line.rate * line.weight).toFixed(0)}</span>

            <button onClick={() => removeLine(line.id)} className="text-red-600 border-none bg-none cursor-pointer text-lg">×</button>
          </div>
        ))}
        <button onClick={addLine} className="text-blue-600 bg-none border-none cursor-pointer text-sm py-2">+ Add Item</button>
      </div>

      <div className="border-t border-gray-300 pt-4">
        <div className="flex justify-between mb-2">
          <span>Current Total:</span>
          <span>₹{currentTotal.toFixed(1)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Grand Total:</span>
          <span>₹{grandTotal.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <span>Paid Now:</span>
          <input
            type="number"
            value={paid}
            onChange={e => setPaid(+e.target.value)}
            className="border p-2 rounded w-24"
          />
        </div>
        <div className="flex justify-between font-bold text-lg mb-4">
          <span>Balance Due:</span>
          <span>₹{balanceDue.toFixed(1)}</span>
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border p-2 rounded mb-4 min-h-[60px]"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer text-base"
        >
          {submitting ? 'Saving...' : 'Save & Generate Bill'}
        </button>
      </div>

      {savedOrder && (
        <BillPreview order={savedOrder} onClose={() => setSavedOrder(null)} />
      )}
    </div>
  );
}