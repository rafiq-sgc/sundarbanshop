'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import NotificationCenter from './NotificationCenter'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Home,
  Tag,
  TrendingUp,
  Mail,
  FileText,
  Layers,
  ShoppingBag,
  Megaphone,
  Gift,
  Truck,
  CreditCard,
  Boxes,
  UserCog,
  MessageSquare,
  Calendar,
  Warehouse,
  Image,
  Key,
  Upload,
  Download,
  Star,
  ClipboardList,
  Receipt,
  Folder
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

interface MenuItem {
  title: string
  icon: any
  href?: string
  badge?: number
  subItems?: {
    title: string
    href: string
    badge?: number
  }[]
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin'
    },
    {
      title: 'Products',
      icon: Package,
      subItems: [
        { title: 'All Products', href: '/admin/products' },
        { title: 'Add New', href: '/admin/products/new' },
        { title: 'Import/Export', href: '/admin/products/import-export' },
        { title: 'Collections', href: '/admin/products/collections' },
        { title: 'Reviews', href: '/admin/reviews' }
      ]
    },
    {
      title: 'Categories',
      icon: Folder,
      href: '/admin/categories'
    },
    {
      title: 'Orders',
      icon: ShoppingCart,
      badge: 8,
      subItems: [
        { title: 'All Orders', href: '/admin/orders', badge: 8 },
        { title: 'Pending', href: '/admin/orders?status=pending', badge: 3 },
        { title: 'Processing', href: '/admin/orders?status=processing', badge: 5 },
        { title: 'Completed', href: '/admin/orders?status=completed' },
        { title: 'Refunds', href: '/admin/orders/refunds' }
      ]
    },
    {
      title: 'Customers',
      icon: Users,
      subItems: [
        { title: 'All Customers', href: '/admin/customers' },
        { title: 'Support Tickets', href: '/admin/customers/tickets', badge: 2 },
        { title: 'Customer Groups', href: '/admin/customers/groups' },
        { title: 'Reviews & Ratings', href: '/admin/customers/reviews' }
      ]
    },
    {
      title: 'Support',
      icon: MessageSquare,
      subItems: [
        { title: 'Live Chat', href: '/admin/support/chat', badge: 3 },
        { title: 'Chat Analytics', href: '/admin/support/analytics' },
        { title: 'Chat Logs', href: '/admin/support/logs' },
        { title: 'Canned Responses', href: '/admin/support/templates' },
        { title: 'Chat Settings', href: '/admin/support/settings' },
        { title: 'Support Tickets', href: '/admin/customers/tickets', badge: 2 }
      ]
    },
    {
      title: 'Inventory',
      icon: Boxes,
      subItems: [
        { title: 'Stock Management', href: '/admin/inventory' },
        { title: 'Inventory Adjustments', href: '/admin/inventory/adjustments' },
        { title: 'Low Stock Alerts', href: '/admin/inventory/alerts', badge: 4 },
        { title: 'Warehouses', href: '/admin/warehouses' },
        { title: 'Stock Transfers', href: '/admin/warehouses/transfers' }
      ]
    },
    {
      title: 'Marketing',
      icon: Megaphone,
      subItems: [
        { title: 'Coupons', href: '/admin/marketing/coupons' },
        { title: 'Email Campaigns', href: '/admin/marketing/emails' },
        { title: 'Loyalty Program', href: '/admin/marketing/loyalty' },
        { title: 'Gift Cards', href: '/admin/marketing/gift-cards' },
        { title: 'Abandoned Carts', href: '/admin/abandoned-carts' }
      ]
    },
    {
      title: 'Finance',
      icon: DollarSign,
      subItems: [
        { title: 'Revenue', href: '/admin/finance/revenue' },
        { title: 'Transactions', href: '/admin/finance/transactions' },
        { title: 'Profit & Loss', href: '/admin/finance/profit-loss' }
      ]
    },
    {
      title: 'Reports',
      icon: BarChart3,
      subItems: [
        { title: 'Sales Reports', href: '/admin/reports/sales' },
        { title: 'Product Reports', href: '/admin/reports/products' },
        { title: 'Customer Reports', href: '/admin/reports/customers' },
        { title: 'Inventory Reports', href: '/admin/reports/inventory' },
        { title: 'Custom Reports', href: '/admin/reports/custom' }
      ]
    },
    {
      title: 'Content',
      icon: FileText,
      subItems: [
        { title: 'Blog Posts', href: '/admin/content/blog' },
        { title: 'Banners & Sliders', href: '/admin/content/banners' },
        { title: 'Media Gallery', href: '/admin/content/media' }
      ]
    },
    {
      title: 'Shipping',
      icon: Truck,
      subItems: [
        { title: 'Shipping Methods', href: '/admin/settings/shipping' },
        { title: 'Shipping Zones', href: '/admin/shipping/zones' }
      ]
    },
    {
      title: 'Settings',
      icon: Settings,
      subItems: [
        { title: 'General', href: '/admin/settings/general' },
        { title: 'Payments', href: '/admin/settings/payments' },
        { title: 'Tax Settings', href: '/admin/settings/tax' },
        { title: 'Templates', href: '/admin/settings/templates' },
        { title: 'Integrations', href: '/admin/settings/integrations' },
        { title: 'Admin Users', href: '/admin/settings/users' },
        { title: 'Activity Logs', href: '/admin/activity-logs' }
      ]
    }
  ]

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          sidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-64'
        }`}
      >
        <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Sundarban Shop</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.title}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <details className="group">
                      <summary className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                        </div>
                      </summary>
                      <div className="mt-1 ml-8 space-y-1">
                        {item.subItems?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              isActive(subItem.href)
                                ? 'bg-green-50 text-green-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span>{subItem.title}</span>
                            {subItem.badge && (
                              <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50">
              <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Desktop sidebar toggle - Always shows menu icon */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search Bar */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, orders, customers..."
                    className="w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {session?.user?.name || 'Admin'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {session?.user?.name || 'Admin User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{session?.user?.email}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                          {session?.user?.role || 'Admin'}
                        </span>
                      </div>
                      <Link
                        href="/admin/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <Link
                        href="/"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Home className="w-4 h-4" />
                        <span>View Store</span>
                      </Link>
                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
