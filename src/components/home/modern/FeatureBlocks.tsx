'use client'

import { ShoppingBag, Headphones, Shield, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    id: 1,
    icon: ShoppingBag,
    title: 'Return & Refund',
    description: 'Money back guarantee',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  {
    id: 2,
    icon: Headphones,
    title: 'Quality Support',
    description: 'Always online 24/7',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 3,
    icon: Shield,
    title: 'Secure Payment',
    description: '100% off on subscribing',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 4,
    icon: Gift,
    title: 'Daily Offers',
    description: '20% off on subscribing',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600'
  }
]

export default function FeatureBlocks() {
  return (
    <section className="py-3 sm:py-4 bg-white">
      <div className="container">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.id}
                className={`${feature.bgColor} border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
              >
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className={`${feature.iconColor} p-2 rounded-lg bg-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-1">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

