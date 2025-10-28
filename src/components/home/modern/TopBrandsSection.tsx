'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

const brands = [
  { id: 1, name: 'Coca-Cola', logo: '/images/products/product-1.jpg' },
  { id: 2, name: 'FedEx', logo: '/images/products/product-2.jpg' },
  { id: 3, name: 'Apple', logo: '/images/products/product-3.jpg' },
  { id: 4, name: 'GONG', logo: '/images/products/product-4.jpg' },
  { id: 5, name: 'SONY', logo: '/images/products/product-5.jpg' },
  { id: 6, name: 'IBM', logo: '/images/products/product-6.jpg' },
]

export default function TopBrandsSection() {
  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="container">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Top Brands</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="hover:bg-gray-100 transition-colors"
            >
              <CardContent className="flex items-center justify-center p-3 sm:p-4">
                <div className="relative w-full h-12 sm:h-16 opacity-60 hover:opacity-100 transition-opacity">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

