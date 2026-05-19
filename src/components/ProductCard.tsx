import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { useMenu } from '@/store/MenuContext';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { ResponsiveImage } from './ResponsiveImage';
import { constants } from '@/data/constants';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useMenu();
  const [isAdding, setIsAdding] = useState(false);
  
  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg active:scale-[0.98]">
      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <ResponsiveImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          priority={priority}
        />
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
          <span className="text-sm font-bold text-gray-900">{constants.currency}{product.price.toFixed(2)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">
          {product.description}
        </p>

        {/* Add to Cart Button */}
        {quantity === 0 ? (
          <button
            onClick={handleAdd}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300',
              'bg-black text-white hover:bg-gray-800 active:scale-95',
              'flex items-center justify-center gap-2',
              isAdding && 'bg-green-500 scale-95'
            )}
          >
            {isAdding ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between bg-gray-100 rounded-xl p-1">
            <button
              onClick={handleDecrement}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="w-10 h-10 flex items-center justify-center bg-yellow-400 rounded-lg shadow-sm text-black hover:bg-yellow-500 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
