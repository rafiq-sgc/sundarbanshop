'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bell,
  BellOff,
  Trash2,
  CheckCheck,
  ShoppingCart,
  CreditCard,
  User,
  Megaphone,
  Settings,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { notificationService, type Notification } from '@/services/dashboard'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/notifications')
    } else if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const result = await notificationService.getNotifications()
      if (result.success && result.data) {
        setNotifications(result.data)
        setUnreadCount(result.unreadCount || 0)
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      toast.error(error.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId)
      if (result.success) {
        await fetchNotifications()
      }
    } catch (error: any) {
      console.error('Error marking as read:', error)
      toast.error(error.message || 'Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead()
      if (result.success) {
        toast.success('All notifications marked as read')
        await fetchNotifications()
      }
    } catch (error: any) {
      console.error('Error marking all as read:', error)
      toast.error(error.message || 'Failed to mark all as read')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const result = await notificationService.deleteNotification(notificationId)
      if (result.success) {
        toast.success('Notification deleted')
        await fetchNotifications()
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      toast.error(error.message || 'Failed to delete notification')
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) {
      return
    }

    try {
      const result = await notificationService.deleteAllNotifications()
      if (result.success) {
        toast.success('All notifications deleted')
        await fetchNotifications()
      }
    } catch (error: any) {
      console.error('Error deleting all notifications:', error)
      toast.error(error.message || 'Failed to delete all notifications')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-blue-600" />
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-600" />
      case 'account':
        return <User className="w-5 h-5 text-purple-600" />
      case 'promotion':
        return <Megaphone className="w-5 h-5 text-orange-600" />
      case 'system':
        return <Settings className="w-5 h-5 text-gray-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/dashboard" className="hover:text-green-600">Dashboard</Link></li>
            <li>/</li>
            <li className="text-gray-900">Notifications</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-green-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-2">Stay updated with your account activities</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={handleDeleteAll}
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            All ({notifications.length})
          </Button>
          <Button
            onClick={() => setFilter('unread')}
            variant={filter === 'unread' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <BellOff className="w-4 h-4" />
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification._id}
                className={`transition-all hover:shadow-md ${
                  notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`mt-1 p-2 rounded-full ${
                      notification.read ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            notification.read ? 'text-gray-900' : 'text-blue-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              notification.type === 'order' ? 'bg-blue-100 text-blue-700' :
                              notification.type === 'payment' ? 'bg-green-100 text-green-700' :
                              notification.type === 'account' ? 'bg-purple-100 text-purple-700' :
                              notification.type === 'promotion' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {notification.type}
                            </span>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button variant="outline" size="sm" className="text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        )}
                        {!notification.read && (
                          <Button
                            onClick={() => handleMarkAsRead(notification._id)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <CheckCheck className="w-3 h-3 mr-1" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(notification._id)}
                          variant="outline"
                          size="sm"
                          className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

