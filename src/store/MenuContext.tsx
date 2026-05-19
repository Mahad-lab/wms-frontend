import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Product, CartItem, View, ApiRestaurant } from '@/types'
import { api } from '@/lib/api'

const RESTAURANT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || ''

interface MenuContextType {
  restaurant: ApiRestaurant | null
  isLoadingMenu: boolean
  categories: string[]

  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartCount: number

  lastOrderNo: string | null
  setLastOrderNo: (no: string | null) => void

  currentView: View
  setCurrentView: (view: View) => void

  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null)
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentView, setCurrentView] = useState<View>('menu')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [lastOrderNo, setLastOrderNo] = useState<string | null>(null)

  useEffect(() => {
    if (!RESTAURANT_SLUG) {
      setIsLoadingMenu(false)
      return
    }
    api.menu.get(RESTAURANT_SLUG)
      .then(setRestaurant)
      .catch(console.error)
      .finally(() => setIsLoadingMenu(false))
  }, [])

  const categories = ['All', ...(restaurant?.categories.map(c => c.name) ?? [])]

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId))
      return
    }
    setCart((prev) =>
      prev.map((item) => item.id === productId ? { ...item, quantity } : item)
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <MenuContext.Provider
      value={{
        restaurant,
        isLoadingMenu,
        categories,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        lastOrderNo,
        setLastOrderNo,
        currentView,
        setCurrentView,
        selectedCategory,
        setSelectedCategory,
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}
