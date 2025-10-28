'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AdminLayout from '@/components/admin/AdminLayout'
import { templatesService, type Template, type TemplateStats } from '@/services/admin'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  MessageSquare,
  Clock,
  Star,
  Loader2,
  Tag,
  TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Zod Schema for Template Form
const templateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(2000, 'Content must be less than 2000 characters'),
  category: z.enum(['general', 'greeting', 'orders', 'shipping', 'refunds', 'technical', 'closing']),
  shortcut: z.string().optional().refine(
    (val) => !val || val.startsWith('/'),
    'Shortcut must start with /'
  ),
})

type TemplateFormData = z.infer<typeof templateSchema>

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'greeting', label: 'Greeting' },
  { value: 'orders', label: 'Orders' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'refunds', label: 'Refunds' },
  { value: 'technical', label: 'Technical' },
  { value: 'closing', label: 'Closing' },
  { value: 'general', label: 'General' },
]

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    greeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    orders: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    shipping: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    refunds: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    technical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    closing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  }
  return colors[category] || colors.general
}

export default function ChatTemplatesPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<TemplateStats | null>(null)

  // React Hook Form
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      shortcut: '',
    },
  })

  // Fetch templates
  const fetchTemplates = async () => {
    if (!isAuthorized) return
    
    try {
      setLoading(true)
      const result = await templatesService.getTemplates(categoryFilter, searchQuery)
      
      if (result.success && result.data) {
        setTemplates(result.data.templates)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to fetch templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  // Load templates on mount and when filters change
  useEffect(() => {
    if (isAuthorized) {
      fetchTemplates()
    }
  }, [isAuthorized, categoryFilter])

  // Debounced search
  useEffect(() => {
    if (!isAuthorized) return
    
    const timer = setTimeout(() => {
      fetchTemplates()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleAdd = () => {
    setEditingTemplate(null)
    form.reset({
      title: '',
      content: '',
      category: 'general',
      shortcut: '',
    })
    setShowModal(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    form.reset({
      title: template.title,
      content: template.content,
      category: template.category as any,
      shortcut: template.shortcut || '',
    })
    setShowModal(true)
  }

  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const result = await templatesService.updateTemplate(editingTemplate.id, data)
        
        if (result.success) {
          toast.success('Template updated successfully!')
          await fetchTemplates()
          setShowModal(false)
          form.reset()
        } else {
          toast.error(result.message || 'Failed to update template')
        }
      } else {
        // Create new template
        const result = await templatesService.createTemplate(data)
        
        if (result.success) {
          toast.success('Template created successfully!')
          await fetchTemplates()
          setShowModal(false)
          form.reset()
        } else {
          toast.error(result.message || 'Failed to create template')
        }
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTemplate) return

    try {
      const result = await templatesService.deleteTemplate(deleteTemplate.id)
      
      if (result.success) {
        toast.success('Template deleted successfully!')
        await fetchTemplates()
      } else {
        toast.error(result.message || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    } finally {
      setDeleteTemplate(null)
    }
  }

  const toggleFavorite = async (template: Template) => {
    try {
      const result = await templatesService.toggleFavorite(template.id)
      
      if (result.success) {
        // Update local state optimistically
        setTemplates(prev => prev.map(t => 
          t.id === template.id ? { ...t, isFavorite: result.data?.isFavorite ?? !t.isFavorite } : t
        ))
      } else {
        toast.error(result.message || 'Failed to toggle favorite')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Failed to toggle favorite')
    }
  }

  const copyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content)
      toast.success('Template copied to clipboard!')
      
      // Increment usage count
      await templatesService.incrementUsage(template.id)
      
      // Update local state
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      ))
    } catch (error) {
      console.error('Error copying template:', error)
      toast.error('Failed to copy template')
    }
  }

  // Show loading or unauthorized state
  if (authLoading || (loading && templates.length === 0)) {
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
    return null // Will redirect in useAdminAuth
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Canned Responses</h1>
            <p className="text-muted-foreground mt-2">
              Manage quick response templates for faster support
            </p>
          </div>
          <Button onClick={handleAdd} size="default">
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.favorites || 0}</div>
              <p className="text-xs text-muted-foreground">
                Marked as favorite
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsage || 0}</div>
              <p className="text-xs text-muted-foreground">
                Times templates used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgUsage || 0}</div>
              <p className="text-xs text-muted-foreground">
                Per template
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Templates</CardTitle>
            <CardDescription>Search and filter templates by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={categoryFilter === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Create your first template to get started with quick responses
              </p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleFavorite(template)}
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    template.isFavorite
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.shortcut && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {template.shortcut}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {template.usageCount} uses
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap line-clamp-4">
                    {template.content}
                  </p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.variables.map((variable, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyTemplate(template)}
                            className="flex-1"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy to clipboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTemplate(template)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete template</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? 'Update your template details below.'
                  : 'Create a new quick response template for faster support.'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Welcome Message" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your template content..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Use variables: {'{agent_name}'}, {'{customer_name}'}, {'{order_number}'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="greeting">Greeting</SelectItem>
                            <SelectItem value="orders">Orders</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                            <SelectItem value="refunds">Refunds</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="closing">Closing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortcut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shortcut</FormLabel>
                        <FormControl>
                          <Input placeholder="/shortcut" className="font-mono" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Optional quick command
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>{editingTemplate ? 'Update' : 'Create'} Template</>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the template "{deleteTemplate?.title}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
