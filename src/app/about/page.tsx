import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Heart, Users, Award, TrendingUp, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Breadcrumb */}
        <div className="container py-6">
          <nav className="text-sm text-gray-600">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-green-600">Home</Link></li>
              <li>/</li>
              <li className="text-gray-900">About Us</li>
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-green-100 py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">About Ekomart</h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                Your trusted partner for fresh, organic groceries delivered right to your doorstep. 
                We're committed to providing the highest quality products at affordable prices.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">50K+</h3>
                <p className="text-gray-600">Happy Customers</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">5000+</h3>
                <p className="text-gray-600">Products</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">10+</h3>
                <p className="text-gray-600">Years Experience</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">98%</h3>
                <p className="text-gray-600">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-4">
                  Founded in 2015, Ekomart started with a simple mission: to make fresh, organic groceries 
                  accessible to everyone. What began as a small local store has grown into a trusted online 
                  marketplace serving thousands of families across the country.
                </p>
                <p className="mb-4">
                  We partner directly with local farmers and organic producers to bring you the freshest 
                  products at competitive prices. Our commitment to quality means every product is carefully 
                  selected and inspected before it reaches your door.
                </p>
                <p>
                  Today, we're proud to offer over 5,000 products, from fresh produce and dairy to pantry 
                  staples and specialty items. Our team works tirelessly to ensure fast delivery, excellent 
                  customer service, and a seamless shopping experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-white">
          <div className="container">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quality First</h3>
                <p className="text-gray-600">
                  We never compromise on quality. Every product meets our strict standards for freshness and excellence.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Focused</h3>
                <p className="text-gray-600">
                  Your satisfaction is our priority. We're here to ensure you have the best shopping experience.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sustainability</h3>
                <p className="text-gray-600">
                  We're committed to sustainable practices, from sourcing to packaging, to protect our planet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
              <p className="text-lg mb-8 text-green-100">
                Join thousands of satisfied customers and experience the Ekomart difference today!
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors shadow-lg"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
