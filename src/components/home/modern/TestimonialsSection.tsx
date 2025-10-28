'use client'

import { Star, Quote } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Ahmed',
    location: 'Dhaka, Bangladesh',
    rating: 5,
    comment: 'Amazing quality fresh produce! The organic vegetables are so fresh and the delivery is always on time. Highly recommended!',
    image: '/images/testimonials/sarah.jpg',
    product: 'Fruits & Vegetables'
  },
  {
    id: 2,
    name: 'Mohammad Rahman',
    location: 'Chittagong, Bangladesh',
    rating: 5,
    comment: 'Best online grocery store in Bangladesh. Premium quality products at affordable prices. Love the packaging and fresh delivery!',
    image: '/images/testimonials/mohammad.jpg',
    product: 'Dairy Products'
  },
  {
    id: 3,
    name: 'Fatima Khan',
    location: 'Sylhet, Bangladesh',
    rating: 5,
    comment: 'The customer service is excellent and the product quality is exceptional. Fast delivery and well-packaged items. Very satisfied!',
    image: '/images/testimonials/fatima.jpg',
    product: 'Meat & Seafood'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real reviews from satisfied customers
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <CardContent className="p-8">
                {/* Quote Icon */}
                <div className="mb-6">
                  <Quote className="w-12 h-12 text-green-600 opacity-20" />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.comment}"
                </p>

                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-green-200">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.location}
                    </p>
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      Purchased: {testimonial.product}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
              50K+
            </div>
            <div className="text-gray-600 font-semibold">
              Happy Customers
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
              4.8
            </div>
            <div className="text-gray-600 font-semibold">
              Average Rating
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
              100+
            </div>
            <div className="text-gray-600 font-semibold">
              Fresh Products
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
              24/7
            </div>
            <div className="text-gray-600 font-semibold">
              Support
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

