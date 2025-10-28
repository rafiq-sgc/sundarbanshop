'use client'

import { useState, useEffect, useMemo } from 'react'
import { templatesService, type Template } from '@/services/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Star, Tag, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (content: string) => void
  context?: {
    customerName?: string
    agentName?: string
    orderNumber?: string
    [key: string]: string | undefined
  }
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
  context = {}
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'greeting', label: 'Greeting' },
    { value: 'orders', label: 'Orders' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'refunds', label: 'Refunds' },
    { value: 'technical', label: 'Technical' },
    { value: 'closing', label: 'Closing' },
  ]

  // Fetch templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen, selectedCategory])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const result = await templatesService.getTemplates(selectedCategory, searchQuery)
      
      if (result.success && result.data) {
        setTemplates(result.data.templates)
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

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates
    
    const query = searchQuery.toLowerCase()
    return templates.filter(
      (template) =>
        template.title.toLowerCase().includes(query) ||
        template.content.toLowerCase().includes(query) ||
        template.shortcut?.toLowerCase().includes(query)
    )
  }, [templates, searchQuery])

  // Replace variables in template content
  const replaceVariables = (content: string, context: Record<string, string | undefined>): string => {
    let processedContent = content
    
    // Replace each variable with context value or keep the placeholder
    Object.keys(context).forEach((key) => {
      if (context[key]) {
        const regex = new RegExp(`\\{${key}\\}`, 'g')
        processedContent = processedContent.replace(regex, context[key]!)
      }
    })
    
    return processedContent
  }

  const handleSelectTemplate = async (template: Template) => {
    try {
      // Replace variables with context values
      const processedContent = replaceVariables(template.content, context)
      
      // Call the callback with processed content
      onSelectTemplate(processedContent)
      
      // Increment usage count
      await templatesService.incrementUsage(template.id)
      
      // Close the dialog
      onClose()
      
      toast.success('Template inserted!')
    } catch (error) {
      console.error('Error inserting template:', error)
      toast.error('Failed to insert template')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Template</DialogTitle>
          <DialogDescription>
            Choose a quick response template to insert into your message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Templates List */}
          <div className="border rounded-lg max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No templates found
              </div>
            ) : (
              <div className="divide-y">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{template.title}</h4>
                        {template.isFavorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        {template.usageCount} uses
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {template.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.shortcut && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {template.shortcut}
                        </Badge>
                      )}
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex items-center gap-1">
                          {template.variables.map((variable, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {`{${variable}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

