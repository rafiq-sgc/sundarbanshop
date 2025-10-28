'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { emailCampaignService, type EmailCampaign, type EmailCampaignStats } from '@/services/email-campaign.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Mail,
  Send,
  Eye,
  Edit,
  Copy,
  Trash2,
  Users,
  BarChart3,
  TrendingUp,
  MousePointer,
  Calendar,
  Tag,
  Loader2,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Pause
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
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

// Zod schema
const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  type: z.enum(['newsletter', 'promotional', 'transactional', 'abandoned-cart']),
  recipientType: z.enum(['all', 'segment', 'custom']),
  customEmails: z.string().optional(),
  scheduledAt: z.string().optional().or(z.literal('')),
})

type CampaignFormData = z.infer<typeof campaignSchema>

export default function EmailMarketingPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [stats, setStats] = useState<EmailCampaignStats>({ total: 0, draft: 0, scheduled: 0, sent: 0, totalSent: 0, totalOpened: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sendId, setSendId] = useState<string | null>(null)

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: {
      name: '',
      subject: '',
      content: '',
      type: 'newsletter',
      recipientType: 'all',
      customEmails: '',
      scheduledAt: '',
    },
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchCampaigns()
    }
  }, [isAuthorized, typeFilter, statusFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchCampaigns()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const result = await emailCampaignService.getCampaigns({
        search: searchTerm || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined
      })

      if (result.success && result.data) {
        setCampaigns(result.data.campaigns)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to load campaigns')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData: any = {
        name: data.name,
        subject: data.subject,
        content: data.content,
        type: data.type,
        recipients: {
          type: data.recipientType,
          emails: data.recipientType === 'custom' && data.customEmails
            ? data.customEmails.split(',').map(e => e.trim()).filter(e => e)
            : undefined
        },
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt || undefined
      }

      let result
      if (selectedCampaign) {
        result = await emailCampaignService.updateCampaign(selectedCampaign._id, campaignData)
      } else {
        result = await emailCampaignService.createCampaign(campaignData)
      }

      if (result.success) {
        toast.success(selectedCampaign ? 'Campaign updated!' : 'Campaign created!')
        setShowCreateDialog(false)
        setShowEditDialog(false)
        form.reset()
        setSelectedCampaign(null)
        fetchCampaigns()
      } else {
        toast.error(result.message || 'Failed to save campaign')
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
      toast.error('Failed to save campaign')
    }
  }

  const handleEdit = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign)
    form.reset({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      type: campaign.type,
      recipientType: campaign.recipients.type,
      customEmails: campaign.recipients.emails?.join(', ') || '',
      scheduledAt: campaign.scheduledAt ? format(new Date(campaign.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await emailCampaignService.deleteCampaign(id)

      if (result.success) {
        toast.success('Campaign deleted successfully!')
        setDeleteId(null)
        fetchCampaigns()
      } else {
        toast.error(result.message || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  const handleSend = async (id: string) => {
    try {
      const result = await emailCampaignService.sendCampaign(id)

      if (result.success) {
        toast.success('Campaign is being sent!')
        setSendId(null)
        fetchCampaigns()
      } else {
        toast.error(result.message || 'Failed to send campaign')
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      toast.error('Failed to send campaign')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const result = await emailCampaignService.duplicateCampaign(id)

      if (result.success) {
        toast.success('Campaign duplicated successfully!')
        fetchCampaigns()
      } else {
        toast.error(result.message || 'Failed to duplicate campaign')
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      toast.error('Failed to duplicate campaign')
    }
  }

  const handleViewDetails = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign)
    setShowDetailsDialog(true)
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading email campaigns...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage email marketing campaigns
              </p>
            </div>
            <Button onClick={() => {
              form.reset()
              setSelectedCampaign(null)
              setShowCreateDialog(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Emails Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{stats.totalOpened.toLocaleString()}</p>
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
                    placeholder="Search campaigns by name or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={typeFilter || 'all'} onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="abandoned-cart">Abandoned Cart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchCampaigns} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No campaigns found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || typeFilter || statusFilter
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first email campaign'}
                </p>
                {!searchTerm && !typeFilter && !statusFilter && (
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {campaigns.map((campaign) => {
              const metrics = emailCampaignService.getMetrics(campaign)
              
              return (
                <Card key={campaign._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold">{campaign.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{campaign.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={emailCampaignService.getStatusColor(campaign.status)}>
                              {campaign.status === 'draft' && <Edit className="w-3 h-3 mr-1" />}
                              {campaign.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                              {campaign.status === 'sent' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {campaign.status === 'sending' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                              {campaign.status}
                            </Badge>
                            <Badge variant="outline" className={emailCampaignService.getTypeColor(campaign.type)}>
                              {campaign.type}
                            </Badge>
                          </div>
                        </div>

                        {/* Stats for sent campaigns */}
                        {campaign.status === 'sent' && campaign.stats.sent > 0 && (
                          <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-500">Sent</p>
                              <p className="text-lg font-bold">{campaign.stats.sent.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Opened</p>
                              <p className="text-lg font-bold text-blue-600">
                                {campaign.stats.opened.toLocaleString()}
                                <span className="text-xs text-gray-500 ml-1">({metrics.openRate}%)</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Clicked</p>
                              <p className="text-lg font-bold text-green-600">
                                {campaign.stats.clicked.toLocaleString()}
                                <span className="text-xs text-gray-500 ml-1">({metrics.clickRate}%)</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Bounced</p>
                              <p className="text-lg font-bold text-red-600">
                                {campaign.stats.bounced.toLocaleString()}
                                <span className="text-xs text-gray-500 ml-1">({metrics.bounceRate}%)</span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Date info */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {campaign.scheduledAt && campaign.status === 'scheduled' && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Scheduled: {format(new Date(campaign.scheduledAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          )}
                          {campaign.sentAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Sent: {format(new Date(campaign.sentAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Recipients: {campaign.recipients.type === 'custom' && campaign.recipients.emails 
                              ? campaign.recipients.emails.length 
                              : campaign.recipients.type}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(campaign)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>

                          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(campaign)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          )}

                          {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                            <AlertDialog open={sendId === campaign._id} onOpenChange={(open) => !open && setSendId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSendId(campaign._id)}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Send Now
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Send campaign now?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will send "{campaign.name}" to all recipients immediately.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleSend(campaign._id)}>
                                    Send Campaign
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(campaign._id)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Duplicate
                          </Button>

                          {campaign.status !== 'sent' && campaign.status !== 'sending' && (
                            <AlertDialog open={deleteId === campaign._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeleteId(campaign._id)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1 text-red-600" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(campaign._id)}>
                                    Delete Campaign
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          setShowEditDialog(open)
          if (!open) {
            form.reset()
            setSelectedCampaign(null)
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </DialogTitle>
              <DialogDescription>
                {selectedCampaign ? 'Update campaign details' : 'Create a new email marketing campaign'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Summer Sale 2025" {...field} />
                        </FormControl>
                        <FormDescription>Internal name for this campaign</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="newsletter">Newsletter</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="abandoned-cart">Abandoned Cart</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 🎉 Exclusive 50% Off This Weekend!" {...field} />
                      </FormControl>
                      <FormDescription>What customers will see in their inbox</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your email content here (HTML supported)..."
                          className="resize-none font-mono text-sm"
                          rows={12}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        HTML content for the email body
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipients *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Subscribers</SelectItem>
                            <SelectItem value="segment">Segment (Custom Filter)</SelectItem>
                            <SelectItem value="custom">Custom Email List</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Send</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Leave blank to save as draft</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('recipientType') === 'custom' && (
                  <FormField
                    control={form.control}
                    name="customEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Addresses</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="email1@example.com, email2@example.com, email3@example.com"
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of email addresses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setShowEditDialog(false)
                      form.reset()
                      setSelectedCampaign(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {selectedCampaign ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {selectedCampaign ? (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Campaign
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                          </>
                        )}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign Details</DialogTitle>
              <DialogDescription>Complete campaign information and statistics</DialogDescription>
            </DialogHeader>

            {selectedCampaign && (
              <div className="space-y-6">
                {/* Campaign Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Campaign Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {selectedCampaign.name}</p>
                    <p><strong>Subject:</strong> {selectedCampaign.subject}</p>
                    <p><strong>Type:</strong> <Badge className={emailCampaignService.getTypeColor(selectedCampaign.type)}>{selectedCampaign.type}</Badge></p>
                    <p><strong>Status:</strong> <Badge className={emailCampaignService.getStatusColor(selectedCampaign.status)}>{selectedCampaign.status}</Badge></p>
                    <p><strong>Recipients:</strong> {selectedCampaign.recipients.type}</p>
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Email Content</h3>
                  <div 
                    className="bg-white border rounded-lg p-4 max-h-64 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selectedCampaign.content }}
                  />
                </div>

                {/* Statistics (if sent) */}
                {selectedCampaign.status === 'sent' && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Campaign Statistics</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Emails Sent</span>
                        <span className="font-bold">{selectedCampaign.stats.sent.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Delivered</span>
                        <span className="font-bold">{selectedCampaign.stats.delivered.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Opened</span>
                        <span className="font-bold text-blue-600">
                          {selectedCampaign.stats.opened.toLocaleString()} 
                          ({emailCampaignService.getMetrics(selectedCampaign).openRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Clicked</span>
                        <span className="font-bold text-green-600">
                          {selectedCampaign.stats.clicked.toLocaleString()} 
                          ({emailCampaignService.getMetrics(selectedCampaign).clickRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Bounced</span>
                        <span className="font-bold text-red-600">
                          {selectedCampaign.stats.bounced.toLocaleString()} 
                          ({emailCampaignService.getMetrics(selectedCampaign).bounceRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Unsubscribed</span>
                        <span className="font-bold text-orange-600">
                          {selectedCampaign.stats.unsubscribed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
