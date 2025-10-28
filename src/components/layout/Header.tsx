'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCartAPI } from '@/store/cart-api-context'
import { useWishlist } from '@/store/wishlist-context'
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X,
  ChevronDown,
  Phone,
  ChevronUp,
  GitCompare
} from 'lucide-react'
import { frontendCategoryService } from '@/services/frontend/product.service'

interface Category {
  _id: string
  name: string
  slug: string
  icon?: string
}

const defaultIcons = ["👗", "👔", "💻", "🏠", "💊", "⚽", "🍼", "🛒", "💄", "📱", "🎮", "👕", "👖", "👟", "👜", "⌚"]

export default function Header() {
  const { data: session } = useSession()
  const { cartCount } = useCartAPI()
  const { items: wishlistItems } = useWishlist()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const cartItemCount = cartCount
  const wishlistCount = wishlistItems.length

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop', hasDropdown: true },
    { name: 'Stores', href: '/stores', hasDropdown: true },
    { name: 'Pages', href: '/pages', hasDropdown: true },
    { name: 'Flash Deals', href: '/shop?flash=true' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' }
  ]

  return (
    <header className="bg-white sticky top-0 z-50">
      {/* Top Header Bar - Light Blue Background */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xl">Z</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Zenis</span>
            </Link>

            {/* Middle: Search Component */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-6">
              <div className="flex w-full">
                {/* Categories Dropdown */}
                <select className="bg-gray-100 border border-gray-300 rounded-l-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search your product..."
                  className="flex-1 border-t border-b border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                {/* Search Button */}
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-r-lg transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right: Utilities */}
            <div className="flex items-center gap-4">
              {/* Hotline */}
              <div className="hidden lg:flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Hotline: +(402) 763 282 46</span>
              </div>

              {/* Language Selector */}
              <select className="hidden lg:block bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none">
                <option>English</option>
                <option>Bangla</option>
                <option>Hindi</option>
              </select>

              {/* Currency Selector */}
              <select className="hidden lg:block bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 focus:outline-none">
                <option>USD</option>
                <option>BDT</option>
                <option>EUR</option>
              </select>

              {/* Compare Icon */}
              <Link href="/compare" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
                <GitCompare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  3
                </span>
              </Link>

              {/* Wishlist */}
              <Link href="/dashboard/wishlist" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Profile */}
              {session ? (
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-5 h-5" />
                  <span className="hidden md:block text-sm">{session.user.name || 'User'}</span>
                </div>
              ) : (
                <Link href="/auth/signin" className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors">
                  <User className="w-5 h-5" />
                  <span className="hidden md:block text-sm">Login</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar - White Background */}
      <div className="bg-white border-b border-gray-200">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            {/* Left: Browse Categories Button */}
            <button
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                isCategoryMenuOpen 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span>Browse Categories</span>
              <ChevronUp className={`w-4 h-4 transition-transform ${isCategoryMenuOpen ? '' : 'rotate-180'}`} />
            </button>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-1 text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
                >
                  {link.name}
                  {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Category Menu Dropdown */}
      {isCategoryMenuOpen && (
        <div className="bg-white border-b border-gray-200 shadow-lg">
          <div className="container py-4">
            <div className="grid lg:grid-cols-1 gap-0">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                categories.map((category, index) => (
                  <Link
                    key={category._id}
                    href={`/shop?category=${category.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 group"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg group-hover:bg-orange-100 transition-colors">
                      {category.icon || defaultIcons[index % defaultIcons.length]}
                    </div>
                    <span className="flex-1 text-gray-700 group-hover:text-orange-600 transition-colors">
                      {category.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-orange-600 rotate-[-90deg] transition-colors" />
                  </Link>
                ))
              )}
              <Link
                href="/shop"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors mt-2"
              >
                <span className="flex-1 text-orange-600 font-semibold">View All Categories</span>
                <ChevronDown className="w-4 h-4 text-orange-600 rotate-[-90deg]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container py-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex">
                <select className="bg-gray-100 border border-gray-300 rounded-l-lg px-3 py-2 text-sm">
                  <option>All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search your product..."
                  className="flex-1 border-t border-b border-gray-300 px-3 py-2 text-sm"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block py-2 text-gray-700 hover:text-orange-600"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
