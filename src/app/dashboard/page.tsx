'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useCart } from '@/store/cart-context'
import { useWishlist } from '@/store/wishlist-context'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { 
  Package, 
  ShoppingBag, 
  Heart, 
  User, 
  MapPin, 
  CreditCard,
  Bell,
  Settings,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { getCartItemCount } = useCart()
  const { items: wishlistItems } = useWishlist()

  const cartCount = getCartItemCount()
  const wishlistCount = wishlistItems.length

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const dashboardItems = [
    {
      title: 'My Orders',
      description: 'Track your orders and view order history',
      icon: Package,
      href: '/dashboard/orders',
      color: 'bg-blue-500'
    },
    {
      title: 'Shopping Cart',
      description: 'Review items in your cart',
      icon: ShoppingBag,
      href: '/cart',
      color: 'bg-green-500'
    },
    {
      title: 'Wishlist',
      description: 'View your saved favorite items',
      icon: Heart,
      href: '/dashboard/wishlist',
      color: 'bg-red-500'
    },
    {
      title: 'Profile',
      description: 'Manage your personal information',
      icon: User,
      href: '/dashboard/profile',
      color: 'bg-purple-500'
    },
    {
      title: 'Addresses',
      description: 'Manage your shipping addresses',
      icon: MapPin,
      href: '/dashboard/addresses',
      color: 'bg-orange-500'
    },
    {
      title: 'Payment Methods',
      description: 'Manage your payment information',
      icon: CreditCard,
      href: '/dashboard/payment',
      color: 'bg-indigo-500'
    },
    {
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      href: '/dashboard/notifications',
      color: 'bg-yellow-500'
    },
    {
      title: 'Settings',
      description: 'Account and privacy settings',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'bg-gray-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.name}!
          </h1>
          <p className="text-gray-600">
            Manage your account and track your orders
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-xs text-green-600 mt-2">+2 this month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Cart Items</p>
            <p className="text-3xl font-bold text-gray-900">{cartCount}</p>
            <Link href="/cart" className="text-xs text-green-600 mt-2 hover:underline block">
              View cart →
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Wishlist Items</p>
            <p className="text-3xl font-bold text-gray-900">{wishlistCount}</p>
            <Link href="/dashboard/wishlist" className="text-xs text-red-600 mt-2 hover:underline block">
              View wishlist →
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900">$1,248</p>
            <p className="text-xs text-gray-500 mt-2">Lifetime value</p>
          </div>
        </div>

        {/* Dashboard Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 ${item.color} rounded-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #ORD-001
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Dec 15, 2023
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Delivered
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $89.99
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href="/dashboard/orders/ORD-001"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #ORD-002
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Dec 10, 2023
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Processing
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $45.50
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href="/dashboard/orders/ORD-002"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
