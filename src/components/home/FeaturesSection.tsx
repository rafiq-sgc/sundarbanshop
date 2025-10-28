import { 
  Truck, 
  RotateCcw, 
  DollarSign, 
  Headphones,
  Shield,
  Clock
} from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Wide Assortment',
    description: 'Orders $50 or more',
    color: 'text-blue-600'
  },
  {
    icon: RotateCcw,
    title: 'Easy Return Policy',
    description: 'Orders $50 or more',
    color: 'text-green-600'
  },
  {
    icon: DollarSign,
    title: 'Best Prices & Offers',
    description: 'Orders $50 or more',
    color: 'text-yellow-600'
  },
  {
    icon: Headphones,
    title: 'Support 24/7',
    description: 'Orders $50 or more',
    color: 'text-purple-600'
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'Safe & secure checkout',
    color: 'text-red-600'
  },
  {
    icon: Clock,
    title: 'Fast Delivery',
    description: 'Same day delivery available',
    color: 'text-indigo-600'
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Ekomart?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We provide the best grocery shopping experience with premium quality and excellent service
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl mb-6 group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-110">
                <feature.icon className={`w-10 h-10 ${feature.color}`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-green-600 transition-colors">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
