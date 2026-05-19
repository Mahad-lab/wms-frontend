import { useMemo } from 'react'
import { CategoryNav } from './CategoryNav'
import { ProductCard } from './ProductCard'
import { CartBar } from './CartBar'
import { useMenu } from '@/store/MenuContext'
import { ClipboardList, User } from 'lucide-react'
import type { Product } from '@/types'
import { getCustomerToken, removeCustomerToken } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export function MenuScreen() {
  const { restaurant, isLoadingMenu, selectedCategory } = useMenu()
  const navigate = useNavigate()
  const customerToken = getCustomerToken()

  const products: Product[] = useMemo(() => {
    if (!restaurant) return []
    return restaurant.categories.flatMap((cat) =>
      cat.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || '',
        image: item.imageUrl || '',
        category: cat.name,
      }))
    )
  }, [restaurant])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products
    return products.filter((p) => p.category === selectedCategory)
  }, [products, selectedCategory])

  if (isLoadingMenu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading menu...</div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Menu not available</p>
          <p className="text-sm text-gray-400 mt-1">Check VITE_RESTAURANT_SLUG is set correctly</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-500">Browse our menu</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/orders')}
              className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
              title="My Orders"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
            {customerToken ? (
              <button
                onClick={() => { removeCustomerToken(); window.location.reload() }}
                className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                title="Logout"
              >
                <User className="w-5 h-5 text-green-600" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <CategoryNav />

      <main className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {selectedCategory === 'All' ? 'All Items' : selectedCategory}
          </h2>
          <span className="text-sm text-gray-500">{filteredProducts.length} items</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <ProductCard product={product} priority={index < 6} />
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items in this category</p>
          </div>
        )}
      </main>

      <CartBar />
    </div>
  )
}
