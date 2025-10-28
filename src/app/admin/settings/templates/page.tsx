'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Mail,
  MessageSquare,
  Plus,
  Edit,
  Copy,
  Eye,
  Search,
  Filter,
  Trash2,
  Loader2,
  Send,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { emailTemplateService, type EmailTemplate, type TemplateStats } from '@/services/settings'
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
  DialogTrigger,
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { Label } from '@radix-ui/react-label'

// Zod schema for template form
const templateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  subject: z.string().max(200).optional().or(z.literal('')),
  type: z.enum(['email', 'sms']),
  category: z.enum(['order', 'marketing', 'notification', 'support', 'account']),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  isActive: z.boolean().default(true),
  preheader: z.string().max(100).optional().or(z.literal('')),
  fromName: z.string().optional().or(z.literal('')),
  fromEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  replyTo: z.string().email('Invalid email').optional().or(z.literal('')),
})

type TemplateFormData = z.infer<typeof templateSchema>

export default function EmailTemplatesPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [stats, setStats] = useState<TemplateStats>({ total: 0, email: 0, sms: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema) as any,
    defaultValues: {
      name: '',
      subject: '',
      type: 'email',
      category: 'notification',
      content: '',
      isActive: true,
      preheader: '',
      fromName: '',
      fromEmail: '',
      replyTo: '',
    },
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchTemplates()
    }
  }, [isAuthorized, searchTerm, filterType, filterCategory])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const result = await emailTemplateService.getTemplates({
        search: searchTerm || undefined,
        type: filterType !== 'all' ? filterType : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
      })

      if (result.success && result.data) {
        setTemplates(result.data.templates)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TemplateFormData) => {
    try {
      let result
      
      if (selectedTemplate) {
        // Update existing template
        result = await emailTemplateService.updateTemplate(selectedTemplate._id, data)
      } else {
        // Create new template
        result = await emailTemplateService.createTemplate(data)
      }

      if (result.success) {
        toast.success(selectedTemplate ? 'Template updated successfully!' : 'Template created successfully!')
        setShowCreateDialog(false)
        setShowEditDialog(false)
        form.reset()
        setSelectedTemplate(null)
        fetchTemplates()
      } else {
        toast.error(result.message || 'Failed to save template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    form.reset({
      name: template.name,
      subject: template.subject || '',
      type: template.type,
      category: template.category,
      content: template.content,
      isActive: template.isActive,
      preheader: template.preheader || '',
      fromName: template.fromName || '',
      fromEmail: template.fromEmail || '',
      replyTo: template.replyTo || '',
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await emailTemplateService.deleteTemplate(id)

      if (result.success) {
        toast.success('Template deleted successfully!')
        setDeleteId(null)
        fetchTemplates()
      } else {
        toast.error(result.message || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const result = await emailTemplateService.toggleActive(id, !isActive)

      if (result.success) {
        toast.success(`Template ${!isActive ? 'activated' : 'deactivated'} successfully!`)
        fetchTemplates()
      } else {
        toast.error(result.message || 'Failed to toggle template')
      }
    } catch (error) {
      console.error('Error toggling template:', error)
      toast.error('Failed to toggle template')
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Template content copied to clipboard!')
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'order':
        return 'bg-blue-100 text-blue-700'
      case 'marketing':
        return 'bg-purple-100 text-purple-700'
      case 'notification':
        return 'bg-green-100 text-green-700'
      case 'support':
        return 'bg-orange-100 text-orange-700'
      case 'account':
        return 'bg-pink-100 text-pink-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || template.type === filterType
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory

    return matchesSearch && matchesType && matchesCategory
  })

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Email & SMS Templates</h1>
              <p className="text-muted-foreground mt-2">
                Manage automated email and SMS templates for system notifications
              </p>
            </div>
            <Button onClick={() => {
              setSelectedTemplate(null)
              form.reset()
              setShowCreateDialog(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">SMS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.sms}</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
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
                    placeholder="Search templates by name or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No templates found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || filterType !== 'all' || filterCategory !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first template'}
                </p>
                {!searchTerm && filterType === 'all' && filterCategory === 'all' && (
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template._id} className={!template.isActive ? 'opacity-60' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          template.type === 'email' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {template.type === 'email' ? (
                            <Mail className={`w-5 h-5 ${
                              template.type === 'email' ? 'text-blue-600' : 'text-green-600'
                            }`} />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          {template.subject && (
                            <p className="text-sm text-muted-foreground">
                              Subject: {template.subject}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className={getCategoryBadgeColor(template.category)}>
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                        </Badge>
                        <Badge variant={template.type === 'email' ? 'default' : 'secondary'}>
                          {template.type.toUpperCase()}
                        </Badge>
                        {template.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {template.isDefault && (
                          <Badge variant="outline" className="border-orange-500 text-orange-700">
                            System Default
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Used {template.usageCount} times
                        </span>
                        {template.variables.length > 0 && (
                          <span>
                            Variables: {template.variables.slice(0, 3).join(', ')}
                            {template.variables.length > 3 && ` +${template.variables.length - 3} more`}
                          </span>
                        )}
                        {template.lastUsed && (
                          <span>
                            Last used: {format(new Date(template.lastUsed), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(template.content)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(template._id, template.isActive)}
                      >
                        {template.isActive ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      {!template.isDefault && (
                        <AlertDialog open={deleteId === template._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteId(template._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(template._id)}>
                                Delete
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

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          setShowEditDialog(open)
          if (!open) {
            form.reset()
            setSelectedTemplate(null)
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate ? 'Update the template details below' : 'Create a new email or SMS template'}
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
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Order Confirmation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="order">Order</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="notification">Notification</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('type') === 'email' && (
                  <>
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Your Order #{{order_number}} is Confirmed" {...field} />
                          </FormControl>
                          <FormDescription>
                            Use {"{{variable_name}}"} for dynamic content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="fromName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Sundarban Shop" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fromEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="noreply@ekomart.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="replyTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reply To</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="support@ekomart.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('type') === 'email' ? 'Email Content (HTML) *' : 'SMS Content *'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={form.watch('type') === 'email'
                            ? '<p>Hi {{customer_name}},</p><p>Your order #{{order_number}} has been confirmed...</p>'
                            : 'Hi {{customer_name}}! Your order {{order_number}} is confirmed. Track: {{tracking_url}}'
                          }
                          className="resize-none font-mono text-sm"
                          rows={12}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Available variables: {"{{customer_name}}, {{order_number}}, {{order_total}}, {{tracking_url}}, {{product_name}}"}
                      </FormDescription>
                      {form.watch('type') === 'sms' && (
                        <p className="text-xs text-muted-foreground">
                          Character count: {field.value?.length || 0} (SMS limit: 160 chars per message)
                        </p>
                      )}
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
                      setShowEditDialog(false)
                      form.reset()
                      setSelectedTemplate(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {selectedTemplate ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {selectedTemplate ? 'Update Template' : 'Create Template'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                Preview of {selectedTemplate?.type} template
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-gray-700 capitalize">{selectedTemplate.type}</p>
                </div>

                {selectedTemplate.subject && (
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <p className="text-sm text-gray-700">{selectedTemplate.subject}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  {selectedTemplate.type === 'email' ? (
                    <div 
                      className="mt-2 p-4 border rounded-lg bg-white"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                    />
                  ) : (
                    <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap">{selectedTemplate.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Character count: {selectedTemplate.smsLength || selectedTemplate.content.length}
                      </p>
                    </div>
                  )}
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Available Variables</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <Badge key={variable} variant="outline">
                          {"{{" + variable + "}}"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowPreviewDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
