import mongoose, { Schema, Document } from 'mongoose'

export interface IChatSettings extends Document {
  // General Settings
  chatEnabled: boolean
  autoAssign: boolean
  maxChatsPerAgent: number
  workingHours: {
    enabled: boolean
    start: string
    end: string
    timezone?: string
    days?: string[] // ['monday', 'tuesday', ...]
  }
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  soundAlerts: boolean
  desktopNotifications: boolean
  notificationEmail?: string
  
  // Auto Response
  autoGreeting: boolean
  greetingMessage: string
  autoAwayMessage: boolean
  awayMessage: string
  autoCloseMessage: boolean
  closeMessage?: string
  responseDelay?: number // seconds before auto-greeting
  
  // Customer Experience
  showAgentTyping: boolean
  showAgentAvatar: boolean
  allowFileUploads: boolean
  maxFileSize: number // MB
  requestFeedback: boolean
  feedbackOptions?: string[]
  chatWidgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  chatWidgetColor?: string
  
  // Routing
  routingMethod: 'round-robin' | 'least-active' | 'random' | 'manual'
  priorityRouting: boolean
  skillBasedRouting: boolean
  transferEnabled?: boolean
  maxWaitTime?: number // minutes
  
  // Security
  requireEmail: boolean
  requireName: boolean
  blockAnonymous: boolean
  rateLimit: number // messages per minute
  spamProtection: boolean
  allowedDomains?: string[]
  blockedIPs?: string[]
  
  // Advanced
  offlineMode?: 'hide' | 'show-message' | 'email-form'
  sessionTimeout?: number // minutes
  inactivityTimeout?: number // minutes
  maxMessageLength?: number
  enableTypingIndicator?: boolean
  enableReadReceipts?: boolean
  
  // Metadata
  updatedBy?: mongoose.Types.ObjectId
  updatedAt: Date
  createdAt: Date
}

const ChatSettingsSchema = new Schema<IChatSettings>(
  {
    // General Settings
    chatEnabled: {
      type: Boolean,
      default: true
    },
    autoAssign: {
      type: Boolean,
      default: true
    },
    maxChatsPerAgent: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    workingHours: {
      enabled: {
        type: Boolean,
        default: true
      },
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    
    // Notification Settings
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    soundAlerts: {
      type: Boolean,
      default: true
    },
    desktopNotifications: {
      type: Boolean,
      default: true
    },
    notificationEmail: String,
    
    // Auto Response
    autoGreeting: {
      type: Boolean,
      default: true
    },
    greetingMessage: {
      type: String,
      default: 'Hi! How can we help you today?'
    },
    autoAwayMessage: {
      type: Boolean,
      default: true
    },
    awayMessage: {
      type: String,
      default: 'Our team is currently offline. Please leave a message and we\'ll get back to you soon!'
    },
    autoCloseMessage: {
      type: Boolean,
      default: false
    },
    closeMessage: String,
    responseDelay: {
      type: Number,
      default: 2
    },
    
    // Customer Experience
    showAgentTyping: {
      type: Boolean,
      default: true
    },
    showAgentAvatar: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    },
    requestFeedback: {
      type: Boolean,
      default: true
    },
    feedbackOptions: [{
      type: String
    }],
    chatWidgetPosition: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right'
    },
    chatWidgetColor: {
      type: String,
      default: '#10b981'
    },
    
    // Routing
    routingMethod: {
      type: String,
      enum: ['round-robin', 'least-active', 'random', 'manual'],
      default: 'round-robin'
    },
    priorityRouting: {
      type: Boolean,
      default: true
    },
    skillBasedRouting: {
      type: Boolean,
      default: false
    },
    transferEnabled: {
      type: Boolean,
      default: true
    },
    maxWaitTime: {
      type: Number,
      default: 5
    },
    
    // Security
    requireEmail: {
      type: Boolean,
      default: true
    },
    requireName: {
      type: Boolean,
      default: true
    },
    blockAnonymous: {
      type: Boolean,
      default: false
    },
    rateLimit: {
      type: Number,
      default: 10,
      min: 1,
      max: 60
    },
    spamProtection: {
      type: Boolean,
      default: true
    },
    allowedDomains: [{
      type: String
    }],
    blockedIPs: [{
      type: String
    }],
    
    // Advanced
    offlineMode: {
      type: String,
      enum: ['hide', 'show-message', 'email-form'],
      default: 'show-message'
    },
    sessionTimeout: {
      type: Number,
      default: 30
    },
    inactivityTimeout: {
      type: Number,
      default: 10
    },
    maxMessageLength: {
      type: Number,
      default: 1000
    },
    enableTypingIndicator: {
      type: Boolean,
      default: true
    },
    enableReadReceipts: {
      type: Boolean,
      default: true
    },
    
    // Metadata
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

const ChatSettings = mongoose.models.ChatSettings || mongoose.model<IChatSettings>('ChatSettings', ChatSettingsSchema)

export default ChatSettings

