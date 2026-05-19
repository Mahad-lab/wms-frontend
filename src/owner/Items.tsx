import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  Plus, Trash2, Edit2, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, X, Check, Upload, Package
} from 'lucide-react'
import type { ApiItem, ApiCategory } from '@/types'

interface ItemForm {
  id?: string
  categoryId: string
  name: string
  nameUrdu: string
  description: string
  price: string
  imageUrl: string
  isAvailable: boolean
  position: string
  isEditing: boolean
}

interface CategoryForm {
  name: string
  nameUrdu: string
}

const emptyForm = (categoryId: string): ItemForm => ({
  categoryId,
  name: '',
  nameUrdu: '',
  description: '',
  price: '',
  imageUrl: '',
  isAvailable: true,
  position: '0',
  isEditing: false,
})

export function Items() {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<ItemForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('')
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState<CategoryForm>({ name: '', nameUrdu: '' })

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.catalog.getCategories()
      setCategories(data)
      if (data.length > 0 && !filterCat) setFilterCat(data[0].id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [])

  const handleAddItem = (categoryId: string) => {
    setForm(emptyForm(categoryId))
  }

  const handleEditItem = (item: ApiItem) => {
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      nameUrdu: item.nameUrdu || '',
      description: item.description || '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      position: item.position?.toString() || '0',
      isEditing: true,
    })
  }

  const handleCancelForm = () => setForm(null)

  const handleImageUpload = async (file: File) => {
    if (!form) return
    setUploadingImage(true)
    try {
      const result = await api.upload.image(file)
      setForm((prev) => prev ? { ...prev, imageUrl: result.url } : null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim() || !form.categoryId || !form.price) return
    setSaving(true)
    try {
      const payload = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        nameUrdu: form.nameUrdu.trim() || undefined,
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl || undefined,
        isAvailable: form.isAvailable,
        position: parseInt(form.position) || 0,
      }
      if (form.isEditing && form.id) {
        await api.catalog.updateItem(form.id, payload)
      } else {
        await api.catalog.createItem(payload)
      }
      setForm(null)
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return
    try {
      await api.catalog.deleteItem(id)
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleToggleAvailability = async (item: ApiItem) => {
    try {
      await api.catalog.updateItem(item.id, { isAvailable: !item.isAvailable })
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catForm.name.trim()) return
    setSaving(true)
    try {
      await api.catalog.createCategory({
        name: catForm.name.trim(),
        nameUrdu: catForm.nameUrdu.trim() || undefined,
      })
      setCatForm({ name: '', nameUrdu: '' })
      setShowCatForm(false)
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const handleMoveItem = async (item: ApiItem, direction: 'up' | 'down') => {
    const cat = categories.find(c => c.id === item.categoryId)
    if (!cat) return
    const idx = cat.items.findIndex(i => i.id === item.id)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= cat.items.length) return
    const neighbor = cat.items[target]
    try {
      await Promise.all([
        api.catalog.updateItem(item.id, { position: neighbor.position ?? idx }),
        api.catalog.updateItem(neighbor.id, { position: item.position ?? idx }),
      ])
      fetchCategories()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reorder')
    }
  }

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const filteredItems = filterCat
    ? categories.find(c => c.id === filterCat)?.items || []
    : categories.flatMap(c => c.items)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <button
            onClick={() => setShowCatForm(true)}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            No categories yet.
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCat(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                    filterCat === cat.id ? 'bg-black text-white' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                  }`}
                >
                  {cat.name} ({cat.items.length})
                </button>
              ))}
            </div>

            {form ? (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {form.isEditing ? 'Edit Item' : 'New Item'}
                  </h2>
                  <button onClick={handleCancelForm} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={form.categoryId}
                      onChange={e => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Item name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (Urdu / Arabic)</label>
                    <input
                      type="text"
                      value={form.nameUrdu}
                      onChange={e => setForm({ ...form, nameUrdu: e.target.value })}
                      placeholder="اسم"
                      dir="auto"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="number"
                      value={form.position}
                      onChange={e => setForm({ ...form, position: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <div className="flex gap-2">
                      {form.imageUrl ? (
                        <div className="relative group">
                          <img src={form.imageUrl} alt="preview" className="w-14 h-14 rounded-lg object-cover border" />
                          <button
                            onClick={() => setForm({ ...form, imageUrl: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-yellow-400 transition">
                          {uploadingImage ? (
                            <span className="text-xs text-gray-400 animate-pulse">...</span>
                          ) : (
                            <Upload className="w-5 h-5 text-gray-300" />
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]) }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !form.name.trim() || !form.price}
                    className="flex-1 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save</>}
                  </button>
                  <button
                    onClick={handleCancelForm}
                    className="py-2.5 px-6 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="flex justify-end p-3 border-b border-gray-100">
                  <button
                    onClick={() => handleAddItem(filterCat || categories[0]?.id || '')}
                    disabled={!filterCat && categories.length === 0}
                    className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">No items yet</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="px-4 py-3 font-medium w-8">#</th>
                        <th className="px-4 py-3 font-medium">Image</th>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.nameUrdu && (
                              <div className="text-xs text-gray-400" dir="auto">{item.nameUrdu}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">Rs {item.price}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              {item.isAvailable ? 'Available' : 'Hidden'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleMoveItem(item, 'up')}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMoveItem(item, 'down')}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showCatForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Add Category</h2>
              <button onClick={() => setShowCatForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Category name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Urdu / Arabic)</label>
                <input
                  type="text"
                  value={catForm.nameUrdu}
                  onChange={e => setCatForm({ ...catForm, nameUrdu: e.target.value })}
                  placeholder="قسم"
                  dir="auto"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !catForm.name.trim()}
                  className="flex-1 py-2.5 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatForm(false)}
                  className="py-2.5 px-6 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}