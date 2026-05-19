import { Check, Home, List } from 'lucide-react'
import { useMenu } from '@/store/MenuContext'
import { useNavigate } from 'react-router-dom'

export function ConfirmationScreen() {
  const { lastOrderNo } = useMenu()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500 delay-200">
              <Check className="w-8 h-8 text-white animate-in zoom-in duration-300 delay-400" />
            </div>
          </div>
          <div className="absolute inset-0 w-24 h-24 bg-green-400/30 rounded-full animate-ping" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-in fade-in slide-in-from-bottom-4 delay-300">
          Order Placed!
        </h1>

        {lastOrderNo && (
          <p className="text-yellow-700 font-semibold text-lg mb-2 animate-in fade-in delay-350">
            {lastOrderNo}
          </p>
        )}

        <p className="text-gray-500 text-center mb-8 animate-in fade-in slide-in-from-bottom-4 delay-400">
          Your order has been received. The restaurant will confirm it shortly.
        </p>

        <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 delay-500">
          <p className="text-sm text-gray-500 text-center">
            You can track and cancel your order from the Orders screen while it's pending.
          </p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        <button
          onClick={() => navigate('/orders')}
          className="w-full py-4 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-500 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <List className="w-5 h-5" />
          View My Orders
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Back to Menu
        </button>
      </div>
    </div>
  )
}
