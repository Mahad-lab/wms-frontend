import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Category } from '../types';
import { Spinner } from '../components/ui/spinner';
import { Empty, EmptyDescription } from '../components/ui/empty';
import { toast } from 'sonner';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: 0, name: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (e) {
      setError('Failed to load categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (form.id) {
        await api.updateCategory(form.id, { name: form.name });
        toast.success('Category updated');
      } else {
        await api.createCategory({ name: form.name });
        toast.success('Category created');
      }
      setForm({ id: 0, name: '' });
      setShowForm(false);
      loadData();
    } catch (e) {
      toast.error('Failed to save category');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(category: Category) {
    setForm({ id: category.id, name: category.name });
    setShowForm(true);
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      loadData();
    } catch (e) {
      toast.error('Failed to delete category');
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
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => { setShowForm(!showForm); setForm({ id: 0, name: '' }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
          <div className="flex gap-3 max-w-sm">
            <input
              placeholder="Category Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border p-2 rounded flex-1"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (form.id ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <Empty>
          <EmptyDescription>No categories yet. Add your first category to get started.</EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-2">
          {categories.map(c => (
            <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
              <span className="font-medium">{c.name}</span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(c)} className="text-blue-600 text-sm hover:underline">Edit</button>
                <button onClick={() => deleteCategory(c.id)} className="text-red-600 text-sm hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}