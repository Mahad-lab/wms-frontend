import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Item, Category } from '../types';

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', category_id: 0, default_unit: 'kg' });

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    api.getItems().then(setItems);
    api.getCategories().then(setCategories);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.id) {
      // Edit - would need update API
      // For now just show alert
      alert('Edit functionality - implement PUT endpoint');
    } else {
      api.createItem({
        name: form.name,
        category_id: form.category_id || undefined,
        default_unit: form.default_unit,
      }).then(() => {
        setForm({ id: 0, name: '', category_id: 0, default_unit: 'kg' });
        setShowForm(false);
        loadData();
      });
    }
  }

  function startEdit(item: Item) {
    setForm({
      id: item.id,
      name: item.name,
      category_id: item.category_id || 0,
      default_unit: item.default_unit,
    });
    setShowForm(true);
  }

  async function deleteItem(id: number) {
    if (!confirm('Delete this item?')) return;
    // Would need delete endpoint - for now implement it
    await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    loadData();
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Items</h1>
        <button onClick={() => { setShowForm(!showForm); setForm({ id: 0, name: '', category_id: 0, default_unit: 'kg' }); }}
          style={{ background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '16px', borderRadius: '4px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
            <input
              placeholder="Item Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              required
            />
            <select
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: +e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value={0}>Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={form.default_unit}
              onChange={e => setForm({ ...form, default_unit: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="kg">kg</option>
              <option value="dozen">dozen</option>
              <option value="piece">piece</option>
              <option value="box">box</option>
            </select>
            <button type="submit" style={{ background: '#16a34a', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {form.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '8px' }}>
        {items.map(i => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div>
              <div style={{ fontWeight: '500' }}>{i.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{i.category_name}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#666' }}>{i.default_unit}</span>
              <button onClick={() => startEdit(i)} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Edit</button>
              <button onClick={() => deleteItem(i.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}