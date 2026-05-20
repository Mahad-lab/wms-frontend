import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Item, Category } from '../types';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyDescription } from '../components/ui/empty';
import { toast } from 'sonner';

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '', category_id: 0, default_unit: 'kg' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, categoriesData] = await Promise.all([
        api.getItems(),
        api.getCategories()
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (e) {
      setError('Failed to load items');
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (form.id) {
        await fetch(`/api/items/${form.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            name: form.name,
            category_id: form.category_id || null,
            default_unit: form.default_unit,
          })
        });
        toast.success('Item updated');
      } else {
        await api.createItem({
          name: form.name,
          category_id: form.category_id || undefined,
          default_unit: form.default_unit,
        });
        toast.success('Item created');
      }
      setForm({ id: 0, name: '', category_id: 0, default_unit: 'kg' });
      setShowForm(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save item');
    } finally {
      setSubmitting(false);
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
    try {
      await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Item deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete item');
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadData} className="text-blue-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Items</h1>
        <button onClick={() => { setShowForm(!showForm); setForm({ id: 0, name: '', category_id: 0, default_unit: 'kg' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}>
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
          <div className="grid gap-3 max-w-sm">
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
            <button type="submit" disabled={submitting} className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
              {submitting ? 'Saving...' : (form.id ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <Empty>
          <EmptyDescription>No items yet. Add your first item to get started.</EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
              <div>
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-gray-500">{i.category_name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{i.default_unit}</span>
                <button onClick={() => startEdit(i)} className="text-blue-600 text-sm">Edit</button>
                <button onClick={() => deleteItem(i.id)} className="text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}