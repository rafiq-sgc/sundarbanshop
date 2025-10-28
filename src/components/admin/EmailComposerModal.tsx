'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { 
  X, 
  Send, 
  Loader2, 
  Mail, 
  FileText, 
  Eye, 
  Code,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { emailService } from '@/services/email'
import { emailTemplates, replaceTemplateVariables, getTemplateById, type EmailTemplate } from '@/lib/email-templates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  toName: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  replyTo: z.string().email().optional().or(z.literal('')),
})

type EmailFormData = z.infer<typeof emailSchema>

interface EmailComposerModalProps {
  isOpen: boolean
  onClose: () => void
  defaultRecipient?: {
    email: string
    name?: string
  }
  bulkRecipients?: Array<{
    email: string
    name?: string
  }>
  defaultSubject?: string
  onSuccess?: () => void
}

export default function EmailComposerModal({ 
  isOpen, 
  onClose, 
  defaultRecipient,
  bulkRecipients,
  defaultSubject,
  onSuccess 
}: EmailComposerModalProps) {
  const [sending, setSending] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [previewMode, setPreviewMode] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const isBulkEmail = bulkRecipients && bulkRecipients.length > 0

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema) as any,
    defaultValues: {
      to: defaultRecipient?.email || '',
      toName: defaultRecipient?.name || '',
      subject: defaultSubject || '',
      body: '',
      cc: '',
      bcc: '',
      priority: 'normal' as const,
      replyTo: '',
    }
  })

  // Update recipient when prop changes
  useEffect(() => {
    if (defaultRecipient) {
      form.setValue('to', defaultRecipient.email)
      form.setValue('toName', defaultRecipient.name || '')
    }
  }, [defaultRecipient, form])

  // Update subject when prop changes
  useEffect(() => {
    if (defaultSubject) {
      form.setValue('subject', defaultSubject)
    }
  }, [defaultSubject, form])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = getTemplateById(templateId)
    
    if (template) {
      // Get default variables
      const defaultVariables: Record<string, string> = {
        name: form.getValues('toName') || 'Customer',
        email: form.getValues('to'),
        storeName: 'Sundarban Shop',
        shopUrl: 'http://localhost:3000',
        supportEmail: 'sundarbanshop.com@gmail.com',
      }

      const processedSubject = replaceTemplateVariables(template.subject, defaultVariables)
      const processedBody = replaceTemplateVariables(template.body, defaultVariables)

      form.setValue('subject', processedSubject)
      form.setValue('body', processedBody)
      
      toast.success(`Template "${template.name}" loaded!`)
    }
  }

  const handlePreview = () => {
    const body = form.getValues('body')
    setPreviewHtml(body)
    setPreviewMode(true)
  }

  const onSubmit = async (data: EmailFormData) => {
    console.log('Sending email with data:', data)
    setSending(true)
    
    try {
      // Determine recipients
      const recipients = isBulkEmail 
        ? bulkRecipients!
        : [{ email: data.to, name: data.toName }]

      console.log(`Sending to ${recipients.length} recipient(s)`)

      // For bulk emails, send individually with personalized content
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        
        try {
          // Update progress
          setSendingProgress(Math.round(((i + 1) / recipients.length) * 100))

          // Replace {{name}} and {{email}} in body and subject for each recipient
          const personalizedSubject = data.subject
            .replace(/{{name}}/g, recipient.name || 'Customer')
            .replace(/{{email}}/g, recipient.email)

          const personalizedBody = data.body
            .replace(/{{name}}/g, recipient.name || 'Customer')
            .replace(/{{email}}/g, recipient.email)

          const emailData = {
            to: {
              email: recipient.email,
              name: recipient.name,
            },
            subject: personalizedSubject,
            body: personalizedBody,
            cc: data.cc ? [{ email: data.cc }] : undefined,
            bcc: data.bcc ? [{ email: data.bcc }] : undefined,
            priority: data.priority,
            replyTo: data.replyTo || undefined,
            templateId: selectedTemplate || undefined,
          }

          await emailService.send(emailData)
          successCount++
          
          // Small delay to avoid rate limiting
          if (recipients.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error: any) {
          console.error(`Failed to send email to ${recipient.email}:`, error)
          failCount++
        }
      }

      // Reset progress
      setSendingProgress(0)

      // Show result
      if (failCount === 0) {
        toast.success(`Email sent successfully to ${successCount} recipient(s)!`)
      } else if (successCount === 0) {
        toast.error(`Failed to send all emails`)
      } else {
        toast.success(`Sent to ${successCount} recipient(s). ${failCount} failed.`)
      }
      
      form.reset()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error(error.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-white z-10 border-b">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {isBulkEmail ? 'Bulk Email' : 'Compose Email'}
            </CardTitle>
            {isBulkEmail && (
              <p className="text-sm text-gray-500 mt-1">
                Sending to {bulkRecipients.length} recipient(s)
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="compose">
                <FileText className="h-4 w-4 mr-2" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Sparkles className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emailTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer hover:border-green-500 transition-all ${
                      selectedTemplate === template.id ? 'border-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{template.name}</span>
                        <Badge variant={
                          template.category === 'transactional' ? 'default' :
                          template.category === 'marketing' ? 'secondary' :
                          template.category === 'notification' ? 'outline' :
                          'destructive'
                        }>
                          {template.category}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">How to use templates:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Select a template by clicking on it</li>
                    <li>The template will be loaded into the compose area</li>
                    <li>Variables like {`{{name}}`} will be auto-filled</li>
                    <li>You can customize the content before sending</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* Compose Tab */}
            <TabsContent value="compose">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                  {/* Recipient Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Recipient Details
                    </h3>
                    
                    {isBulkEmail ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-medium text-blue-900 mb-2">
                          Bulk Email Recipients ({bulkRecipients.length})
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {bulkRecipients.map((recipient, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {recipient.name || recipient.email}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-blue-700 mt-2">
                          💡 Use {`{{name}}`} and {`{{email}}`} for personalization
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control as any}
                          name="to"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>To (Email) *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="customer@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control as any}
                          name="toName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recipient Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name="cc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CC (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="cc@example.com" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Carbon copy (visible to recipient)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="bcc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BCC (Optional)</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="bcc@example.com" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Blind carbon copy (hidden from recipient)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Email Content */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Email Content
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject *</FormLabel>
                            <FormControl>
                              <Input placeholder="Email subject" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="high">🔴 High</SelectItem>
                                <SelectItem value="normal">⚪ Normal</SelectItem>
                                <SelectItem value="low">🔵 Low</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control as any}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Body (HTML) *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your email content here... (HTML supported)"
                              className="min-h-[300px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            You can use HTML for formatting. Variables: {`{{name}}, {{email}}, {{storeName}}`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const currentBody = form.getValues('body')
                          form.setValue('body', currentBody.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
                        }}
                      >
                        <Code className="mr-2 h-4 w-4" />
                        Show HTML Code
                      </Button>
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Options</h3>
                    
                    <FormField
                      control={form.control as any}
                      name="replyTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reply-To Email (Optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="reply@ekomart.com" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Replies will be sent to this address instead of the default sender
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sending Progress (for bulk emails) */}
                  {sending && isBulkEmail && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">
                          Sending emails...
                        </span>
                        <span className="text-sm text-blue-700">{sendingProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sendingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      {selectedTemplate && (
                        <Badge variant="outline">
                          Template: {getTemplateById(selectedTemplate)?.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={sending}>
                        {sending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isBulkEmail ? `Sending (${sendingProgress}%)...` : 'Sending...'}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            {isBulkEmail ? `Send to ${bulkRecipients.length} Recipients` : 'Send Email'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          {/* Preview Modal */}
          {previewMode && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
              <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-xl font-semibold">Email Preview</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Subject:</p>
                      <p className="font-semibold">{form.getValues('subject')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To:</p>
                      <p className="font-semibold">{form.getValues('to')}</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                      className="prose max-w-none"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setPreviewMode(false)}>
                      Close Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

