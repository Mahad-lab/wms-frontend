import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, X, Clock, ChefHat, CheckCircle, Package, Ban, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ApiOrder } from '@/types'
import { constants } from '@/data/constants'
import { useNavigate } from 'react-router-dom'

type OrderFilter = 'all' | 'pending' | 'accepted' | 'completed'

export function OrdersScreen() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await api.customerOrders.myOrders()
      setOrders(result)
    } catch {
      // not logged in or error — show empty
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleCancel = async (orderNo: string) => {
    setCancelling(orderNo)
    try {
      const updated = await api.customerOrders.cancel(orderNo)
      setOrders((prev) => prev.map((o) => o.orderNo === orderNo ? updated : o))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setCancelling(null)
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true
    return o.status === filter
  })

  const statusIcon = (status: ApiOrder['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted': return <ChefHat className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <X className="w-4 h-4" />
      case 'cancelled': return <Ban className="w-4 h-4" />
    }
  }

  const statusColor = (status: ApiOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-700 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const statusLabel = (status: ApiOrder['status']) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'accepted': return 'Preparing'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      case 'cancelled': return 'Cancelled'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-500">Track your orders</p>
            </div>
          </div>
          <button onClick={fetchOrders} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-[73px] z-40">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['all', 'pending', 'accepted', 'completed'] as OrderFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all capitalize',
                filter === f ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f}
              {f === 'pending' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="ml-2 bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-4 pb-8">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' ? 'Your orders will appear here' : `No ${filter} orders`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{order.orderNo}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                    statusColor(order.status)
                  )}>
                    {statusIcon(order.status)}
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}× {item.name}</span>
                      <span className="text-gray-900">{constants.currency}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.rejectReason && (
                  <p className="text-xs text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg">
                    Reason: {order.rejectReason}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="font-bold text-lg">{constants.currency}{order.total.toFixed(2)}</span>
                </div>

                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(order.orderNo)}
                    disabled={cancelling === order.orderNo}
                    className="w-full mt-4 py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    {cancelling === order.orderNo ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
