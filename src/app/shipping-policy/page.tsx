import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Truck, Package, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Shipping Policy</li>
          </ol>
        </nav>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <Truck className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Policy</h1>
            <p className="text-gray-600">Fast, reliable delivery to your doorstep</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Shipping Methods</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <Package className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Standard Shipping</h3>
                <p className="text-sm text-gray-600 mb-2">3-5 business days</p>
                <p className="font-bold text-green-600">$5.99</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Truck className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Express Shipping</h3>
                <p className="text-sm text-gray-600 mb-2">1-2 business days</p>
                <p className="font-bold text-blue-600">$12.99</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <MapPin className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Local Pickup</h3>
                <p className="text-sm text-gray-600 mb-2">Same day</p>
                <p className="font-bold text-purple-600">FREE</p>
              </div>
            </div>

            <h2>Free Shipping</h2>
            <p>Enjoy free standard shipping on all orders over $100!</p>

            <h2>Processing Time</h2>
            <p>Orders are processed within 1-2 business days. You'll receive a confirmation email once your order ships.</p>

            <h2>Tracking</h2>
            <p>Track your order anytime using the tracking link in your shipping confirmation email.</p>

            <h2>International Shipping</h2>
            <p>Currently, we only ship within the United States. International shipping coming soon!</p>

            <h2>Shipping Restrictions</h2>
            <p>We cannot ship to P.O. boxes. Some products may have shipping restrictions due to size or regulatory requirements.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
