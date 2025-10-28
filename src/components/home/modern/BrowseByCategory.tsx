'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { frontendCategoryService } from '@/services/frontend/product.service'

interface Category {
  _id: string
  name: string
  slug: string
  image?: string
  icon?: string
}

export default function BrowseByCategory() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await frontendCategoryService.getCategories('root')
        if (response.success && response.data) {
          setCategories(response.data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(categories.length / 6))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(categories.length / 6)) % Math.ceil(categories.length / 6))
  }

  const visibleCategories = categories.slice(currentIndex * 6, (currentIndex + 1) * 6)

  if (loading) {
    return (
      <section className="py-6 bg-gray-50">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-20 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 bg-gray-50">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Browse by Category</h2>
          <div className="flex gap-2">
            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
          {visibleCategories.map((category) => (
            <Link 
              key={category._id}
              href={`/shop?category=${category.slug}`}
              className="group"
            >
              <Card className="hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="flex flex-col items-center p-2.5 sm:p-3">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-1.5 sm:mb-2">
                    <Image
                      src={category.image || category.icon || '/images/products/product-1.jpg'}
                      alt={category.name}
                      fill
                      className="object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 text-center line-clamp-2">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

