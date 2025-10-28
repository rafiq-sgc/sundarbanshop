'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { frontendCategoryService } from '@/services/frontend/product.service'

interface Category {
  _id: string
  name: string
  slug: string
  image?: string
  description?: string
}

const colorGradients = [
  'from-green-500 to-emerald-600',
  'from-blue-500 to-cyan-600',
  'from-red-500 to-rose-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-fuchsia-600',
  'from-indigo-500 to-purple-600',
  'from-teal-500 to-green-600',
  'from-yellow-500 to-orange-600',
  'from-gray-500 to-slate-600'
]

export default function FeaturedCategories() {
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

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600">
              Explore our wide range of products
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg aspect-square"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600">
            Explore our wide range of products
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const colorClass = colorGradients[index % colorGradients.length]
            return (
              <Link href={`/shop?category=${category.slug}`} key={category._id}>
                <Card className="group relative overflow-hidden aspect-square shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={category.image || '/images/categories/default.jpg'}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${colorClass} opacity-80 group-hover:opacity-90 transition-opacity duration-300 rounded-lg`}></div>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white z-10">
                    <h3 className="text-lg md:text-xl font-bold text-center mb-2 group-hover:scale-110 transition-transform duration-300">
                      {category.name}
                    </h3>
                    <p className="text-sm text-white/90 text-center mb-3">
                      {category.description || 'Explore products'}
                    </p>
                    <div className="flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Shop Now
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            asChild
          >
            <Link href="/shop">
              View All Categories
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

