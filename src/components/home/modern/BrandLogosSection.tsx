'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

const brands = [
  { id: 1, name: 'Fresh Farm', logo: '/images/brands/fresh-farm.png' },
  { id: 2, name: 'Organic Valley', logo: '/images/brands/organic-valley.png' },
  { id: 3, name: 'Green Fields', logo: '/images/brands/green-fields.png' },
  { id: 4, name: 'Natural Choice', logo: '/images/brands/natural-choice.png' },
  { id: 5, name: 'Farm Fresh', logo: '/images/brands/farm-fresh.png' },
  { id: 6, name: 'Pure Organic', logo: '/images/brands/pure-organic.png' }
]

export default function BrandLogosSection() {
  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Trusted by Premium Brands
          </h3>
          <p className="text-sm text-gray-500">
            We partner with leading organic and fresh produce suppliers
          </p>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="hover:border-green-300 hover:shadow-md transition-all duration-300 group"
            >
              <CardContent className="flex items-center justify-center p-4">
                <div className="relative w-full h-12 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Want to become a partner?{' '}
            <a href="/contact" className="text-green-600 font-semibold hover:text-green-700">
              Contact Us
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

