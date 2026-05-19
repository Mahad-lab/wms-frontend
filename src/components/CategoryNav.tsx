import { useRef, useEffect } from 'react'
import { useMenu } from '@/store/MenuContext'
import { cn } from '@/lib/utils'

export function CategoryNav() {
  const { categories, selectedCategory, setSelectedCategory } = useMenu()
  const scrollRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const selectedIndex = categories.indexOf(selectedCategory)
    const selectedElement = categoryRefs.current[selectedIndex]

    if (selectedElement && scrollRef.current) {
      const containerRect = scrollRef.current.getBoundingClientRect()
      const elementRect = selectedElement.getBoundingClientRect()
      const scrollLeft = selectedElement.offsetLeft - (containerRect.width / 2) + (elementRect.width / 2)
      scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [selectedCategory, categories])

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, index) => (
          <button
            key={category}
            ref={(el) => { categoryRefs.current[index] = el }}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
              'active:scale-95 touch-manipulation',
              selectedCategory === category
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}
