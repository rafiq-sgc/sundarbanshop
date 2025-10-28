'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  X,
  Check,
  ShoppingCart,
  Package,
  AlertTriangle,
  Users,
  DollarSign,
  MessageSquare,
  Settings,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'

interface Notification {
  id: string
  type: 'order' | 'product' | 'customer' | 'system' | 'payment' | 'review'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchNotifications()
    
    // Simulate real-time notifications
    const interval = setInterval(() => {
      // In production, this would be WebSocket
      fetchNotifications()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = () => {
    // Mock notifications
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'order',
        title: 'New Order Received',
        message: 'Order #ORD-105 for $89.99 from John Doe',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/admin/orders/105'
      },
      {
        id: '2',
        type: 'product',
        title: 'Low Stock Alert',
        message: 'Organic Honey is running low (5 units remaining)',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        link: '/admin/inventory'
      },
      {
        id: '3',
        type: 'customer',
        title: 'New Customer Registration',
        message: 'Jane Smith just created an account',
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        link: '/admin/customers'
      },
      {
        id: '4',
        type: 'review',
        title: 'New Product Review',
        message: 'Fresh Organic Milk received a 5-star review',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        link: '/admin/reviews'
      },
      {
        id: '5',
        type: 'payment',
        title: 'Payment Failed',
        message: 'Order #ORD-104 payment failed - retry required',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        link: '/admin/orders/104'
      }
    ]

    setNotifications(mockNotifications)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5" />
      case 'product':
        return <Package className="w-5 h-5" />
      case 'customer':
        return <Users className="w-5 h-5" />
      case 'payment':
        return <DollarSign className="w-5 h-5" />
      case 'review':
        return <MessageSquare className="w-5 h-5" />
      case 'system':
        return <Settings className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-600'
      case 'product':
        return 'bg-orange-100 text-orange-600'
      case 'customer':
        return 'bg-purple-100 text-purple-600'
      case 'payment':
        return 'bg-green-100 text-green-600'
      case 'review':
        return 'bg-yellow-100 text-yellow-600'
      case 'system':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter)

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-30 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'order', 'product', 'customer', 'payment', 'review'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                      filter === tab
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${getIconColor(notification.type)} flex-shrink-0 h-fit`}>
                          {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                            </span>

                            <div className="flex gap-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Mark all as read
                </button>
                <button
                  onClick={() => setNotifications([])}
                  className="flex-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
