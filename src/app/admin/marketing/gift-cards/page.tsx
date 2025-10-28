'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { giftCardService, type GiftCard, type GiftCardStats } from '@/services/gift-card.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Gift,
  Plus,
  Search,
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Eye,
  Ban,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  Copy,
  Calendar,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
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
import { Textarea } from '@/components/ui/textarea'
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'

// Zod schemas
const createGiftCardSchema = z.object({
  initialAmount: z.number().min(1, 'Amount must be at least ৳1'),
  recipientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  recipientName: z.string().max(100).optional().or(z.literal('')),
  message: z.string().max(500).optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  count: z.number().min(1).max(100).default(1),
})

const adjustBalanceSchema = z.object({
  amount: z.number().refine((val) => val !== 0, { message: 'Amount cannot be zero' }),
  description: z.string().min(1, 'Description is required'),
})

type CreateGiftCardFormData = z.infer<typeof createGiftCardSchema>
type AdjustBalanceFormData = z.infer<typeof adjustBalanceSchema>

export default function GiftCardsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [stats, setStats] = useState<GiftCardStats>({ 
    total: 0, active: 0, used: 0, expired: 0, cancelled: 0,
    totalValue: 0, remainingValue: 0, usedValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)

  const createForm = useForm<CreateGiftCardFormData>({
    resolver: zodResolver(createGiftCardSchema) as any,
    defaultValues: {
      initialAmount: 0,
      recipientEmail: '',
      recipientName: '',
      message: '',
      expiryDate: '',
      count: 1,
    },
  })

  const adjustForm = useForm<AdjustBalanceFormData>({
    resolver: zodResolver(adjustBalanceSchema) as any,
    defaultValues: {
      amount: 0,
      description: '',
    },
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchGiftCards()
    }
  }, [isAuthorized, statusFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchGiftCards()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchGiftCards = async () => {
    try {
      setLoading(true)
      const result = await giftCardService.getGiftCards({
        search: searchTerm || undefined,
        status: statusFilter || undefined
      })

      if (result.success && result.data) {
        setGiftCards(result.data.giftCards)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to load gift cards')
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      toast.error('Failed to load gift cards')
    } finally {
      setLoading(false)
    }
  }

  const onCreateSubmit = async (data: CreateGiftCardFormData) => {
    try {
      const result = await giftCardService.createGiftCard(data)

      if (result.success) {
        toast.success(`${data.count} gift card(s) created successfully!`)
        setShowCreateDialog(false)
        createForm.reset()
        fetchGiftCards()
      } else {
        toast.error(result.message || 'Failed to create gift card')
      }
    } catch (error) {
      console.error('Error creating gift card:', error)
      toast.error('Failed to create gift card')
    }
  }

  const onAdjustSubmit = async (data: AdjustBalanceFormData) => {
    if (!selectedCard) return

    try {
      const result = await giftCardService.adjustBalance(selectedCard._id, data.amount, data.description)

      if (result.success) {
        toast.success('Balance adjusted successfully!')
        setShowAdjustDialog(false)
        adjustForm.reset()
        setSelectedCard(null)
        fetchGiftCards()
      } else {
        toast.error(result.message || 'Failed to adjust balance')
      }
    } catch (error) {
      console.error('Error adjusting balance:', error)
      toast.error('Failed to adjust balance')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await giftCardService.deleteGiftCard(id)

      if (result.success) {
        toast.success('Gift card deleted successfully!')
        setDeleteId(null)
        fetchGiftCards()
      } else {
        toast.error(result.message || 'Failed to delete gift card')
      }
    } catch (error) {
      console.error('Error deleting gift card:', error)
      toast.error('Failed to delete gift card')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const result = await giftCardService.cancelGiftCard(id)

      if (result.success) {
        toast.success('Gift card cancelled successfully!')
        setCancelId(null)
        fetchGiftCards()
      } else {
        toast.error(result.message || 'Failed to cancel gift card')
      }
    } catch (error) {
      console.error('Error cancelling gift card:', error)
      toast.error('Failed to cancel gift card')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Gift card code "${code}" copied to clipboard!`)
  }

  const handleViewDetails = (card: GiftCard) => {
    setSelectedCard(card)
    setShowDetailsDialog(true)
  }

  const handleAdjustBalance = (card: GiftCard) => {
    setSelectedCard(card)
    adjustForm.reset({ amount: 0, description: '' })
    setShowAdjustDialog(true)
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading gift cards...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Gift Cards</h1>
              <p className="text-muted-foreground mt-2">
                Manage gift cards for customers
              </p>
            </div>
            <Button onClick={() => {
              createForm.reset()
              setShowCreateDialog(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Gift Card
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Used</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-400">{stats.used}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.expired}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{giftCardService.formatCurrency(stats.totalValue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-blue-600">{giftCardService.formatCurrency(stats.remainingValue)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Used</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-purple-600">{giftCardService.formatCurrency(stats.usedValue)}</p>
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
                    placeholder="Search by code, email, or name..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchGiftCards} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gift Cards List */}
        {giftCards.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No gift cards found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || statusFilter
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first gift card'}
                </p>
                {!searchTerm && !statusFilter && (
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Gift Card
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {giftCards.map((card) => (
              <Card key={card._id} className={card.status !== 'active' ? 'opacity-75' : ''}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Card Code */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-green-600" />
                        <p className="font-mono font-bold text-sm">{card.code}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(card.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Value Display */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                        <p className="text-3xl font-bold text-green-600">
                          {giftCardService.formatCurrency(card.currentBalance)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          of {giftCardService.formatCurrency(card.initialAmount)}
                        </p>
                      </div>
                      <Progress 
                        value={100 - giftCardService.getUsagePercentage(card)} 
                        className="mt-3 h-2"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <Badge className={giftCardService.getStatusColor(card.status)}>
                        {card.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {card.status === 'used' && <XCircle className="w-3 h-3 mr-1" />}
                        {card.status === 'expired' && <Clock className="w-3 h-3 mr-1" />}
                        {card.status === 'cancelled' && <Ban className="w-3 h-3 mr-1" />}
                        {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                      </Badge>
                      {card.expiryDate && (
                        <Badge variant="outline" className={
                          giftCardService.isExpired(card) ? 'border-red-500 text-red-700' : ''
                        }>
                          <Calendar className="w-3 h-3 mr-1" />
                          {giftCardService.isExpired(card) ? 'Expired' : 'Expires ' + format(new Date(card.expiryDate), 'MMM dd, yyyy')}
                        </Badge>
                      )}
                    </div>

                    {/* Recipient */}
                    {card.recipientEmail && (
                      <div className="text-sm">
                        <p className="text-gray-500">Recipient</p>
                        <p className="font-medium">{card.recipientName || card.recipientEmail}</p>
                        {card.recipientName && (
                          <p className="text-xs text-gray-500">{card.recipientEmail}</p>
                        )}
                      </div>
                    )}

                    {/* Transactions count */}
                    <div className="text-xs text-gray-500">
                      <p>{card.transactions.length} transaction(s)</p>
                      <p>Created: {format(new Date(card.createdAt), 'MMM dd, yyyy')}</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(card)}
                        className="w-full"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>

                      {card.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdjustBalance(card)}
                          className="w-full"
                        >
                          <ArrowUpDown className="w-3 h-3 mr-1" />
                          Adjust
                        </Button>
                      )}

                      {card.status === 'active' && (
                        <AlertDialog open={cancelId === card._id} onOpenChange={(open) => !open && setCancelId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancelId(card._id)}
                              className="w-full"
                            >
                              <Ban className="w-3 h-3 mr-1 text-red-600" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel gift card?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel gift card "{card.code}"? 
                                The remaining balance of {giftCardService.formatCurrency(card.currentBalance)} will be forfeited.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancel(card._id)}>
                                Yes, Cancel Card
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {card.transactions.length === 0 && (
                        <AlertDialog open={deleteId === card._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteId(card._id)}
                              className="w-full"
                            >
                              <Trash2 className="w-3 h-3 mr-1 text-red-600" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete gift card?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete gift card "{card.code}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(card._id)}>
                                Delete Card
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Gift Card(s)</DialogTitle>
              <DialogDescription>
                Issue new gift cards for customers
              </DialogDescription>
            </DialogHeader>

            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="initialAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Value (৳) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="1000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Gift card amount in BDT</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>Number of cards to create (1-100)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormDescription>For single card only</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="recipient@email.com" {...field} />
                        </FormControl>
                        <FormDescription>For single card only</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Leave blank for no expiry</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gift Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Happy Birthday! Enjoy shopping at Ekomart..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Personal message for the recipient (max 500 chars)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      createForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createForm.formState.isSubmitting}>
                    {createForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Gift Card{createForm.watch('count') > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gift Card Details</DialogTitle>
              <DialogDescription>Complete gift card information and transaction history</DialogDescription>
            </DialogHeader>

            {selectedCard && (
              <div className="space-y-6">
                {/* Card Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Card Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Code:</strong> <span className="font-mono">{selectedCard.code}</span></p>
                    <p><strong>Status:</strong> <Badge className={giftCardService.getStatusColor(selectedCard.status)}>{selectedCard.status}</Badge></p>
                    <p><strong>Initial Amount:</strong> {giftCardService.formatCurrency(selectedCard.initialAmount)}</p>
                    <p><strong>Current Balance:</strong> <span className="text-green-600 font-bold">{giftCardService.formatCurrency(selectedCard.currentBalance)}</span></p>
                    <p><strong>Used Amount:</strong> {giftCardService.formatCurrency(selectedCard.initialAmount - selectedCard.currentBalance)}</p>
                    {selectedCard.expiryDate && (
                      <p><strong>Expires:</strong> {format(new Date(selectedCard.expiryDate), 'PPP')}</p>
                    )}
                  </div>
                </div>

                {/* Recipient Info */}
                {selectedCard.recipientEmail && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Recipient Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {selectedCard.recipientName && <p><strong>Name:</strong> {selectedCard.recipientName}</p>}
                      <p><strong>Email:</strong> {selectedCard.recipientEmail}</p>
                      {selectedCard.message && (
                        <div>
                          <strong>Message:</strong>
                          <p className="text-sm text-gray-600 italic mt-1">"{selectedCard.message}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction History */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Transaction History ({selectedCard.transactions.length})</h3>
                  {selectedCard.transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No transactions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCard.transactions.map((txn, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {txn.type === 'credit' ? (
                                <Badge className="bg-green-100 text-green-700">+{giftCardService.formatCurrency(txn.amount)}</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700">-{giftCardService.formatCurrency(txn.amount)}</Badge>
                              )}
                              <span className="text-sm">{txn.description}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {format(new Date(txn.date), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          {txn.order && (
                            <p className="text-xs text-blue-600 mt-1">
                              Order: {txn.order.orderNumber}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Adjust Balance Dialog */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Gift Card Balance</DialogTitle>
              <DialogDescription>
                Add or subtract balance from {selectedCard?.code}
              </DialogDescription>
            </DialogHeader>

            {selectedCard && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {giftCardService.formatCurrency(selectedCard.currentBalance)}
                </p>
              </div>
            )}

            <Form {...adjustForm}>
              <form onSubmit={adjustForm.handleSubmit(onAdjustSubmit)} className="space-y-6">
                <FormField
                  control={adjustForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (৳) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Use + to add, - to subtract"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Positive to add balance, negative to subtract
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adjustForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Manual adjustment - Customer request" {...field} />
                      </FormControl>
                      <FormDescription>Reason for adjustment</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAdjustDialog(false)
                      adjustForm.reset()
                      setSelectedCard(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={adjustForm.formState.isSubmitting}>
                    {adjustForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adjusting...
                      </>
                    ) : (
                      <>
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Adjust Balance
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
