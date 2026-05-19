import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Item, Category } from '../types';

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category_id: 0, default_unit: 'kg' });

  useEffect(() => {
    api.getItems().then(setItems);
    api.getCategories().then(setCategories);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.createItem({
      name: form.name,
      category_id: form.category_id || undefined,
      default_unit: form.default_unit,
    });
    setForm({ name: '', category_id: 0, default_unit: 'kg' });
    setShowForm(false);
    api.getItems().then(setItems);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Items</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
          <div className="grid gap-3">
            <input
              placeholder="Item Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <select
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: +e.target.value })}
              className="border p-2 rounded"
            >
              <option value={0}>Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={form.default_unit}
              onChange={e => setForm({ ...form, default_unit: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="kg">kg</option>
              <option value="dozen">dozen</option>
              <option value="piece">piece</option>
              <option value="box">box</option>
            </select>
            <button type="submit" className="bg-green-600 text-white py-2 rounded">Create</button>
          </div>
        </form>
      )}

      <div className="grid gap-2">
        {items.map(i => (
          <div key={i.id} className="flex justify-between bg-white p-3 rounded shadow-sm">
            <div>
              <div className="font-medium">{i.name}</div>
              <div className="text-sm text-gray-500">{i.category_name}</div>
            </div>
            <div className="text-gray-500">{i.default_unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}