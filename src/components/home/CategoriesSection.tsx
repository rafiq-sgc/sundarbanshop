'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Coffee, 
  Fish, 
  Cookie, 
  Pill, 
  IceCream, 
  ShoppingBag, 
  Package,
  Croissant,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState, useRef } from 'react'

const categories = [
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable',
    image: '/images/products/product-1.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-2',
    image: '/images/products/product-2.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-3',
    image: '/images/products/product-3.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-4',
    image: '/images/products/product-4.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-5',
    image: '/images/products/product-5.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-6',
    image: '/images/products/product-6.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-7',
    image: '/images/products/product-7.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-8',
    image: '/images/products/product-8.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-9',
    image: '/images/products/product-9.jpg',
    href: '/shop?category=organic-vegetable'
  },
  {
    name: 'Organic Vegetable',
    slug: 'organic-vegetable-10',
    image: '/images/products/product-10.jpg',
    href: '/shop?category=organic-vegetable'
  }
]

export default function CategoriesSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      const currentScroll = scrollContainerRef.current.scrollLeft
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Categories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our wide range of product categories and find exactly what you need
          </p>
        </div>

        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              canScrollLeft 
                ? 'text-gray-700 hover:text-green-600 hover:bg-green-50' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
              canScrollRight 
                ? 'text-gray-700 hover:text-green-600 hover:bg-green-50' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Horizontal Scrolling Container */}
          <div 
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={category.href}
                className="group flex-shrink-0"
              >
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-48 h-64 overflow-hidden border border-gray-100 group-hover:border-green-200">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
