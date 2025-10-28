'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AdminLayout from '@/components/admin/AdminLayout'
import { settingsService, type ChatSettings } from '@/services/admin'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import {
  Save,
  Bell,
  Clock,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Settings as SettingsIcon,
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Zod Schema for Settings Form
const settingsSchema = z.object({
  // General Settings
  chatEnabled: z.boolean(),
  autoAssign: z.boolean(),
  maxChatsPerAgent: z.number().min(1).max(20),
  workingHours: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    timezone: z.string().optional(),
    days: z.array(z.string()).optional(),
  }),
  
  // Notification Settings
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  soundAlerts: z.boolean(),
  desktopNotifications: z.boolean(),
  notificationEmail: z.string().email().optional().or(z.literal('')),
  
  // Auto Response
  autoGreeting: z.boolean(),
  greetingMessage: z.string().min(5, 'Message must be at least 5 characters'),
  autoAwayMessage: z.boolean(),
  awayMessage: z.string().min(5, 'Message must be at least 5 characters'),
  autoCloseMessage: z.boolean().optional(),
  closeMessage: z.string().optional(),
  responseDelay: z.number().min(0).max(60).optional(),
  
  // Customer Experience
  showAgentTyping: z.boolean(),
  showAgentAvatar: z.boolean(),
  allowFileUploads: z.boolean(),
  maxFileSize: z.number().min(1).max(100),
  requestFeedback: z.boolean(),
  chatWidgetPosition: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']).optional(),
  chatWidgetColor: z.string().optional(),
  
  // Routing
  routingMethod: z.enum(['round-robin', 'least-active', 'random', 'manual']),
  priorityRouting: z.boolean(),
  skillBasedRouting: z.boolean(),
  transferEnabled: z.boolean().optional(),
  maxWaitTime: z.number().min(1).max(60).optional(),
  
  // Security
  requireEmail: z.boolean(),
  requireName: z.boolean().optional(),
  blockAnonymous: z.boolean(),
  rateLimit: z.number().min(1).max(60),
  spamProtection: z.boolean(),
  
  // Advanced
  offlineMode: z.enum(['hide', 'show-message', 'email-form']).optional(),
  sessionTimeout: z.number().min(5).max(120).optional(),
  inactivityTimeout: z.number().min(1).max(60).optional(),
  maxMessageLength: z.number().min(100).max(5000).optional(),
  enableTypingIndicator: z.boolean().optional(),
  enableReadReceipts: z.boolean().optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function ChatSettingsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  // React Hook Form
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      chatEnabled: true,
      autoAssign: true,
      maxChatsPerAgent: 5,
      workingHours: {
        enabled: true,
        start: '09:00',
        end: '18:00',
        timezone: 'UTC',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      emailNotifications: true,
      pushNotifications: true,
      soundAlerts: true,
      desktopNotifications: true,
      notificationEmail: '',
      autoGreeting: true,
      greetingMessage: 'Hi! How can we help you today?',
      autoAwayMessage: true,
      awayMessage: 'Our team is currently offline. Please leave a message and we\'ll get back to you soon!',
      autoCloseMessage: false,
      closeMessage: '',
      responseDelay: 2,
      showAgentTyping: true,
      showAgentAvatar: true,
      allowFileUploads: true,
      maxFileSize: 10,
      requestFeedback: true,
      chatWidgetPosition: 'bottom-right',
      chatWidgetColor: '#10b981',
      routingMethod: 'round-robin',
      priorityRouting: true,
      skillBasedRouting: false,
      transferEnabled: true,
      maxWaitTime: 5,
      requireEmail: true,
      requireName: true,
      blockAnonymous: false,
      rateLimit: 10,
      spamProtection: true,
      offlineMode: 'show-message',
      sessionTimeout: 30,
      inactivityTimeout: 10,
      maxMessageLength: 1000,
      enableTypingIndicator: true,
      enableReadReceipts: true,
    },
  })

  // Watch for changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(form.formState.isDirty)
    })
    return () => subscription.unsubscribe()
  }, [form.watch, form.formState.isDirty])

  // Fetch settings
  const fetchSettings = async () => {
    if (!isAuthorized) return
    
    try {
      setLoading(true)
      const result = await settingsService.getSettings()
      
      if (result.success && result.data) {
        // Reset form with fetched data
        form.reset(result.data as any)
      } else {
        toast.error(result.message || 'Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  // Load settings on mount
  useEffect(() => {
    if (isAuthorized) {
      fetchSettings()
    }
  }, [isAuthorized])

  // Submit handler
  const onSubmit = async (data: SettingsFormData) => {
    try {
      const result = await settingsService.updateSettings(data)
      
      if (result.success) {
        toast.success('Settings saved successfully!')
        form.reset(data) // Reset dirty state
        setHasChanges(false)
      } else {
        toast.error(result.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  // Reset to defaults
  const handleReset = async () => {
    try {
      const result = await settingsService.resetSettings()
      
      if (result.success && result.data) {
        toast.success('Settings reset to defaults!')
        form.reset(result.data as any)
        setHasChanges(false)
        setShowResetDialog(false)
      } else {
        toast.error(result.message || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset settings')
    }
  }

  // Show loading or unauthorized state
  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
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
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Chat Settings</h1>
              <p className="text-muted-foreground mt-2">
                Configure your live chat system preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="default">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all chat settings to their default values.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Reset Settings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={form.formState.isSubmitting || !hasChanges}
                size="default"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  You have unsaved changes. Don't forget to save!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <SettingsIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic chat system configuration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="chatEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Live Chat</FormLabel>
                        <FormDescription>
                          Turn on/off the live chat widget on your website
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="autoAssign"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Assign Conversations</FormLabel>
                        <FormDescription>
                          Automatically assign new chats to available agents
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="maxChatsPerAgent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Chats Per Agent</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum concurrent chats per support agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="workingHours.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Working Hours</FormLabel>
                        <FormDescription>
                          Set business hours for chat availability
                        </FormDescription>
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

                {form.watch('workingHours.enabled') && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <FormField
                      control={form.control}
                      name="workingHours.start"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workingHours.end"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Bell className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5 flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email alerts for new messages
                          </FormDescription>
                        </div>
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

                <FormField
                  control={form.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5 flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="text-base">Push Notifications</FormLabel>
                          <FormDescription>
                            Mobile push notifications
                          </FormDescription>
                        </div>
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

                <FormField
                  control={form.control}
                  name="soundAlerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5 flex items-center gap-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="text-base">Sound Alerts</FormLabel>
                          <FormDescription>
                            Play sound for new messages
                          </FormDescription>
                        </div>
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

                <FormField
                  control={form.control}
                  name="desktopNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5 flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="text-base">Desktop Notifications</FormLabel>
                          <FormDescription>
                            Browser desktop notifications
                          </FormDescription>
                        </div>
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
              </CardContent>
            </Card>

            {/* Auto Response Messages */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Auto Response Messages</CardTitle>
                    <CardDescription>Automated messages for customers</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="autoGreeting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Welcome Greeting</FormLabel>
                        <FormDescription>
                          Send automatic greeting when chat starts
                        </FormDescription>
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

                {form.watch('autoGreeting') && (
                  <FormField
                    control={form.control}
                    name="greetingMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Greeting Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter welcome message..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This message will be sent automatically when a customer starts a chat
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                <FormField
                  control={form.control}
                  name="autoAwayMessage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Away Message</FormLabel>
                        <FormDescription>
                          Send message when team is offline
                        </FormDescription>
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

                {form.watch('autoAwayMessage') && (
                  <FormField
                    control={form.control}
                    name="awayMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Away Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter away message..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This message will be shown when all agents are offline
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Customer Experience */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Users className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle>Customer Experience</CardTitle>
                    <CardDescription>Enhance customer chat experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="showAgentTyping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Agent Typing Indicator</FormLabel>
                        <FormDescription>
                          Display when agent is typing a response
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="showAgentAvatar"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Agent Avatar</FormLabel>
                        <FormDescription>
                          Display agent profile picture in chat
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="allowFileUploads"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow File Uploads</FormLabel>
                        <FormDescription>
                          Let customers attach files in chat
                        </FormDescription>
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

                {form.watch('allowFileUploads') && (
                  <FormField
                    control={form.control}
                    name="maxFileSize"
                    render={({ field }) => (
                      <FormItem className="pl-4">
                        <FormLabel>Max File Size (MB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum file size in megabytes (1-100 MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="requestFeedback"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Request Feedback</FormLabel>
                        <FormDescription>
                          Ask for rating after chat conversation ends
                        </FormDescription>
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
              </CardContent>
            </Card>

            {/* Chat Routing */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Zap className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>Chat Routing</CardTitle>
                    <CardDescription>Configure how chats are assigned to agents</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="routingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select routing method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="round-robin">Round Robin</SelectItem>
                          <SelectItem value="least-active">Least Active</SelectItem>
                          <SelectItem value="random">Random</SelectItem>
                          <SelectItem value="manual">Manual Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How incoming chats are distributed among agents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priorityRouting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Priority Routing</FormLabel>
                        <FormDescription>
                          Route high-priority chats to agents first
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="skillBasedRouting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Skill-Based Routing</FormLabel>
                        <FormDescription>
                          Route chats based on agent skills and expertise
                        </FormDescription>
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
              </CardContent>
            </Card>

            {/* Security & Spam Protection */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Security & Spam Protection</CardTitle>
                    <CardDescription>Protect your chat from spam and abuse</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="requireEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Require Email Address</FormLabel>
                        <FormDescription>
                          Customers must provide a valid email address
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="blockAnonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Block Anonymous Users</FormLabel>
                        <FormDescription>
                          Only allow authenticated users to start chats
                        </FormDescription>
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

                <FormField
                  control={form.control}
                  name="rateLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Limit (messages/minute)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum messages a user can send per minute
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spamProtection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Spam Protection</FormLabel>
                        <FormDescription>
                          Enable automatic spam detection and prevention
                        </FormDescription>
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
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 pt-6">
              {hasChanges && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </p>
              )}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !hasChanges}
                size="lg"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  )
}
