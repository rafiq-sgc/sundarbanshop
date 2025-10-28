'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { abandonedCartService, type AbandonedCart, type AbandonedCartStats } from '@/services/abandoned-cart.service'
import {
  ShoppingCart,
  Mail,
  DollarSign,
  Clock,
  TrendingUp,
  RefreshCcw,
  Send,
  Eye,
  Trash2,
  Loader2,
  Search,
  AlertTriangle,
  Gift,
  Bell
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function AbandonedCartsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [stats, setStats] = useState<AbandonedCartStats>({
    total: 0,
    totalValue: 0,
    pending: 0,
    followUp: 0,
    lost: 0,
    averageValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    if (isAuthorized) {
      fetchCarts()
    }
  }, [isAuthorized, statusFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchCarts()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchCarts = async () => {
    try {
      setLoading(true)
      const result = await abandonedCartService.getAbandonedCarts({
        search: searchTerm || undefined,
        status: statusFilter || undefined
      })

      if (result.success && result.data) {
        setCarts(result.data.carts)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to load abandoned carts')
      }
    } catch (error) {
      console.error('Error fetching carts:', error)
      toast.error('Failed to load abandoned carts')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (cart: AbandonedCart) => {
    setSelectedCart(cart)
    setShowDetailsDialog(true)
  }

  const handleSendEmail = (cart: AbandonedCart) => {
    setSelectedCart(cart)
    setShowEmailDialog(true)
  }

  const handleSendRecoveryEmail = async (emailType: 'reminder' | 'discount' | 'final') => {
    if (!selectedCart) return

    try {
      setSendingEmail(true)
      const result = await abandonedCartService.sendRecoveryEmail(
        selectedCart._id,
        emailType,
        emailType === 'discount' ? 'CART10' : undefined
      )

      if (result.success) {
        toast.success(`Recovery email sent to ${selectedCart.customer.email}!`)
        setShowEmailDialog(false)
        setSelectedCart(null)
        fetchCarts()
      } else {
        toast.error(result.message || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send recovery email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await abandonedCartService.deleteCart(id)

      if (result.success) {
        toast.success('Cart deleted successfully!')
        setDeleteId(null)
        fetchCarts()
      } else {
        toast.error(result.message || 'Failed to delete cart')
      }
    } catch (error) {
      console.error('Error deleting cart:', error)
      toast.error('Failed to delete cart')
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading abandoned carts...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Abandoned Carts</h1>
              <p className="text-muted-foreground mt-2">
                Recover lost sales by reaching out to customers
              </p>
            </div>
            <Button onClick={fetchCarts} variant="outline">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Carts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {abandonedCartService.formatCurrency(stats.totalValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{stats.followUp}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-blue-600">
                {abandonedCartService.formatCurrency(stats.averageValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by customer name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carts List */}
        {carts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No abandoned carts found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || statusFilter
                    ? 'Try adjusting your filters'
                    : 'Great! No customers have abandoned their carts recently'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {carts.map((cart) => {
              const urgency = abandonedCartService.getUrgency(cart.hoursSinceAbandoned)
              
              return (
                <Card key={cart._id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Cart Items Preview */}
                      <div className="flex gap-2 md:w-48">
                        {cart.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="relative w-16 h-16 border rounded-lg overflow-hidden">
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                            {item.quantity > 1 && (
                              <div className="absolute top-0 right-0 bg-black/70 text-white text-xs px-1 rounded-bl">
                                {item.quantity}
                              </div>
                            )}
                          </div>
                        ))}
                        {cart.items.length > 3 && (
                          <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-gray-50">
                            <span className="text-xs text-gray-500">+{cart.items.length - 3}</span>
                          </div>
                        )}
                      </div>

                      {/* Cart Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{cart.customer.name}</h3>
                            <p className="text-sm text-gray-600">{cart.customer.email}</p>
                            {cart.customer.phone !== 'N/A' && (
                              <p className="text-xs text-gray-500">{cart.customer.phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {abandonedCartService.formatCurrency(cart.totalValue)}
                            </p>
                            <p className="text-xs text-gray-500">{cart.items.length} item(s)</p>
                          </div>
                        </div>

                        {/* Status and Time */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={abandonedCartService.getStatusColor(cart.recoveryStatus)}>
                            {cart.recoveryStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {cart.recoveryStatus === 'follow-up' && <Bell className="w-3 h-3 mr-1" />}
                            {cart.recoveryStatus === 'lost' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {cart.recoveryStatus.charAt(0).toUpperCase() + cart.recoveryStatus.slice(1)}
                          </Badge>
                          
                          {urgency === 'high' && (
                            <Badge variant="outline" className="border-red-500 text-red-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              High Priority
                            </Badge>
                          )}
                          
                          <span className="text-xs text-gray-500">
                            {abandonedCartService.getTimeAgo(cart.hoursSinceAbandoned)}
                          </span>
                        </div>

                        {/* Product Names */}
                        <div className="text-sm text-gray-600 mb-3">
                          {cart.items.slice(0, 2).map((item, idx) => (
                            <span key={idx}>
                              {item.product.name} (×{item.quantity})
                              {idx < Math.min(cart.items.length, 2) - 1 && ', '}
                            </span>
                          ))}
                          {cart.items.length > 2 && (
                            <span className="text-gray-500"> and {cart.items.length - 2} more</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(cart)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleSendEmail(cart)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send Recovery Email
                          </Button>

                          <AlertDialog open={deleteId === cart._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteId(cart._id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1 text-red-600" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete abandoned cart?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this cart for {cart.customer.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cart._id)}>
                                  Delete Cart
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cart Details</DialogTitle>
              <DialogDescription>Complete cart information</DialogDescription>
            </DialogHeader>

            {selectedCart && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {selectedCart.customer.name}</p>
                    <p><strong>Email:</strong> {selectedCart.customer.email}</p>
                    {selectedCart.customer.phone !== 'N/A' && (
                      <p><strong>Phone:</strong> {selectedCart.customer.phone}</p>
                    )}
                    <p><strong>Abandoned:</strong> {abandonedCartService.getTimeAgo(selectedCart.hoursSinceAbandoned)}</p>
                    <p><strong>Status:</strong> <Badge className={abandonedCartService.getStatusColor(selectedCart.recoveryStatus)}>{selectedCart.recoveryStatus}</Badge></p>
                  </div>
                </div>

                {/* Cart Items */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Cart Items ({selectedCart.items.length})</h3>
                  <div className="space-y-3">
                    {selectedCart.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                        <div className="relative w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × {abandonedCartService.formatCurrency(item.product.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {abandonedCartService.formatCurrency(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Value:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {abandonedCartService.formatCurrency(selectedCart.totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Recovery Email</DialogTitle>
              <DialogDescription>
                Choose the type of recovery email to send to {selectedCart?.customer.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                size="lg"
                onClick={() => handleSendRecoveryEmail('reminder')}
                disabled={sendingEmail}
              >
                <Mail className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Reminder Email</p>
                  <p className="text-xs text-gray-500">Gentle reminder about items in cart</p>
                </div>
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                size="lg"
                onClick={() => handleSendRecoveryEmail('discount')}
                disabled={sendingEmail}
              >
                <Gift className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Discount Offer</p>
                  <p className="text-xs text-gray-500">Send 10% discount code (CART10)</p>
                </div>
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                size="lg"
                onClick={() => handleSendRecoveryEmail('final')}
                disabled={sendingEmail}
              >
                <AlertTriangle className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Final Reminder</p>
                  <p className="text-xs text-gray-500">Last chance notification</p>
                </div>
              </Button>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailDialog(false)
                  setSelectedCart(null)
                }}
                disabled={sendingEmail}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
