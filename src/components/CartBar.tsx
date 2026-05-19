import { useState } from 'react'
import { ShoppingBag, ChevronUp, X, Plus, Minus, ArrowRight } from 'lucide-react'
import { useMenu } from '@/store/MenuContext'
import { AuthPopup } from '@/components/AuthPopup'
import { api, getCustomerToken } from '@/lib/api'
import { cn } from '@/lib/utils'
import { constants } from '@/data/constants'
import { useNavigate } from 'react-router-dom'

export function CartBar() {
  const { cart, cartTotal, cartCount, updateQuantity, clearCart, restaurant, setLastOrderNo } = useMenu()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const placeOrder = async () => {
    if (!restaurant) return
    setIsSubmitting(true)
    setError('')
    try {
      const result = await api.customerOrders.place(restaurant.id, {
        items: cart.map((item) => ({ itemId: item.id, quantity: item.quantity })),
      })
      setLastOrderNo(result.orderNo)
      clearCart()
      setIsExpanded(false)
      navigate('/confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmOrder = () => {
    if (cart.length === 0) return
    if (!getCustomerToken()) {
      setShowAuthPopup(true)
      return
    }
    placeOrder()
  }

  const handleAuthSuccess = () => {
    placeOrder()
  }

  if (cartCount === 0 && !isExpanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3 text-gray-400">
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm">Your cart is empty</span>
          </div>
          <span className="text-sm text-gray-400">Add items to order</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-lg">Your Order ({cartCount} items)</h3>
              <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[40vh] px-5 py-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-contain bg-gray-50 rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-sm text-gray-500">{constants.currency}{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-yellow-400 rounded-lg hover:bg-yellow-500 active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
              {error && (
                <p className="text-sm text-red-600 mb-3">{error}</p>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-lg">{constants.currency}{cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full py-4 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : (
                  <>Confirm Order <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg z-40">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => setIsExpanded(true)} className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-black" />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-lg">{constants.currency}{cartTotal.toFixed(2)}</p>
            </div>
            <ChevronUp className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
          </button>

          <button
            onClick={handleConfirmOrder}
            disabled={cartCount === 0 || isSubmitting}
            className={cn(
              'ml-4 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
              cartCount > 0 && !isSubmitting
                ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Order
          </button>
        </div>
      </div>

      <AuthPopup open={showAuthPopup} onOpenChange={setShowAuthPopup} onSuccess={handleAuthSuccess} />
    </>
  )
}
