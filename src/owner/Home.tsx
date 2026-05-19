import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { api } from '@/lib/api'
import {
  Package, ShoppingCart, CheckCircle, LogOut, Plus, Trash2,
  ChevronDown, ChevronUp, ToggleLeft, ToggleRight, X, Check,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ApiOrder } from '@/types'

type Tab = 'orders' | 'catalog'
type OrderFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected'

interface CatalogCategory {
  id: string
  name: string
  nameUrdu?: string
  position: number
  items: CatalogItem[]
}

interface CatalogItem {
  id: string
  name: string
  nameUrdu?: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  categoryId: string
}

// Per-customer stats computed from orders list
function customerStats(orders: ApiOrder[], customerId: string) {
  const mine = orders.filter((o) => o.customerId === customerId)
  return {
    total: mine.length,
    completed: mine.filter((o) => o.status === 'completed').length,
  }
}

export function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('orders')

  // ─── Orders ───────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const result = await api.orders.list()
      setOrders(result)
    } catch (err) {
      console.error(err)
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateOrderStatus = async (
    orderNo: string,
    status: 'accepted' | 'completed' | 'rejected',
    rejectReason?: string
  ) => {
    setActionLoading(orderNo + status)
    try {
      const updated = await api.orders.updateStatus(orderNo, status, rejectReason)
      setOrders((prev) => prev.map((o) => o.orderNo === orderNo ? updated : o))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Catalog ──────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  // Add category form
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  // Add item form state: keyed by categoryId
  const [itemForms, setItemForms] = useState<Record<string, {
    name: string; price: string; description: string; imageUrl: string; open: boolean
  }>>({})

  const fetchCatalog = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const result = await api.catalog.getCategories()
      setCategories(result)
    } catch (err) {
      console.error(err)
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'catalog') fetchCatalog()
  }, [tab, fetchCatalog])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setAddingCat(true)
    try {
      await api.catalog.createCategory({ name: newCatName.trim() })
      setNewCatName('')
      fetchCatalog()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setAddingCat(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return
    try {
      await api.catalog.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleAddItem = async (categoryId: string) => {
    const form = itemForms[categoryId]
    if (!form?.name.trim() || !form?.price) return
    try {
      await api.catalog.createItem({
        categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl.trim() || undefined,
      })
      setItemForms((prev) => ({ ...prev, [categoryId]: { name: '', price: '', description: '', imageUrl: '', open: false } }))
      fetchCatalog()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  const handleToggleAvailability = async (item: CatalogItem) => {
    try {
      await api.catalog.updateItem(item.id, { isAvailable: !item.isAvailable })
      fetchCatalog()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return
    try {
      await api.catalog.deleteItem(itemId)
      fetchCatalog()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const filteredOrders = orders.filter((o) => orderFilter === 'all' || o.status === orderFilter)
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  const statusBadge = (status: ApiOrder['status']) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-700',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/owner/login') }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-full"><ShoppingCart className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-xl font-bold">{orders.filter(o => o.status === 'completed').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full"><Package className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex gap-2 bg-white rounded-lg shadow p-1">
          {(['orders', 'catalog'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-yellow-400 text-black' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t}
              {t === 'orders' && pendingCount > 0 && (
                <span className="ml-2 bg-black text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        {/* ── Orders Tab ── */}
        {tab === 'orders' && (
          <div>
            {/* Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(['all', 'pending', 'accepted', 'completed', 'rejected'] as OrderFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                    orderFilter === f ? 'bg-black text-white' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={fetchOrders}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No {orderFilter === 'all' ? '' : orderFilter} orders</div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const stats = order.customer ? customerStats(orders, order.customer.id) : null
                  return (
                    <div key={order.id} className="bg-white rounded-xl shadow p-4">
                      {/* Order header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNo}</p>
                          <p className="text-sm text-gray-500">
                            {order.customer?.name || 'Guest'}
                            {order.customer?.sid && <span className="text-gray-400"> · {order.customer.sid}</span>}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Customer stats */}
                      {stats && (
                        <div className="flex gap-3 mb-3">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            {stats.total} total order{stats.total !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            {stats.completed} completed
                          </span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}× {item.name}</span>
                            <span className="text-gray-900">Rs {(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {order.customerNote && (
                        <p className="text-xs text-gray-500 italic mb-3">Note: {order.customerNote}</p>
                      )}

                      {order.rejectReason && (
                        <p className="text-xs text-red-600 mb-3 bg-red-50 px-2 py-1 rounded">
                          Reason: {order.rejectReason}
                        </p>
                      )}

                      <div className="flex justify-between font-medium text-sm pt-2 border-t border-gray-100 mb-3">
                        <span>Total</span>
                        <span>Rs {order.total.toFixed(0)}</span>
                      </div>

                      {/* Actions */}
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateOrderStatus(order.orderNo, 'rejected')}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.orderNo, 'accepted')}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                        </div>
                      )}

                      {order.status === 'accepted' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateOrderStatus(order.orderNo, 'rejected', 'Cancelled by restaurant')}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.orderNo, 'completed')}
                            disabled={!!actionLoading}
                            className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Complete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Catalog Tab ── */}
        {tab === 'catalog' && (
          <div>
            {/* Add category */}
            <form onSubmit={handleAddCategory} className="bg-white rounded-xl shadow p-4 mb-4 flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="submit"
                disabled={addingCat || !newCatName.trim()}
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>

            {catalogLoading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No categories yet. Add one above.</div>
            ) : (
              <div className="space-y-4">
                {categories.map((cat) => {
                  const isExpanded = expandedCat === cat.id
                  const itemForm = itemForms[cat.id] || { name: '', price: '', description: '', imageUrl: '', open: false }

                  return (
                    <div key={cat.id} className="bg-white rounded-xl shadow overflow-hidden">
                      {/* Category header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <button
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          <span className="font-semibold text-gray-900">{cat.name}</span>
                          <span className="text-xs text-gray-400">{cat.items.length} items</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isExpanded && (
                        <div>
                          {/* Items list */}
                          {cat.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">Rs {item.price}</p>
                              </div>
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`transition ${item.isAvailable ? 'text-green-500' : 'text-gray-300'}`}
                                title={item.isAvailable ? 'Available — click to hide' : 'Hidden — click to show'}
                              >
                                {item.isAvailable
                                  ? <ToggleRight className="w-6 h-6" />
                                  : <ToggleLeft className="w-6 h-6" />
                                }
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* Add item toggle */}
                          {!itemForm.open ? (
                            <button
                              onClick={() => setItemForms((prev) => ({
                                ...prev,
                                [cat.id]: { ...itemForm, open: true },
                              }))}
                              className="w-full px-4 py-3 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2 transition"
                            >
                              <Plus className="w-4 h-4" /> Add item
                            </button>
                          ) : (
                            <div className="px-4 py-3 space-y-2 bg-gray-50">
                              <div className="flex gap-2">
                                <input
                                  placeholder="Item name *"
                                  value={itemForm.name}
                                  onChange={(e) => setItemForms((prev) => ({ ...prev, [cat.id]: { ...itemForm, name: e.target.value } }))}
                                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                                <input
                                  placeholder="Price *"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={itemForm.price}
                                  onChange={(e) => setItemForms((prev) => ({ ...prev, [cat.id]: { ...itemForm, price: e.target.value } }))}
                                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                />
                              </div>
                              <input
                                placeholder="Description"
                                value={itemForm.description}
                                onChange={(e) => setItemForms((prev) => ({ ...prev, [cat.id]: { ...itemForm, description: e.target.value } }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                              <input
                                placeholder="Image URL"
                                value={itemForm.imageUrl}
                                onChange={(e) => setItemForms((prev) => ({ ...prev, [cat.id]: { ...itemForm, imageUrl: e.target.value } }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAddItem(cat.id)}
                                  disabled={!itemForm.name.trim() || !itemForm.price}
                                  className="flex-1 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                  <Check className="w-4 h-4" /> Save
                                </button>
                                <button
                                  onClick={() => setItemForms((prev) => ({ ...prev, [cat.id]: { ...itemForm, open: false } }))}
                                  className="py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
