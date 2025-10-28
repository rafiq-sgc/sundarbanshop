import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailTemplate extends Document {
  name: string
  slug: string // unique identifier (auto-generated from name)
  subject: string // For emails only
  type: 'email' | 'sms'
  category: 'order' | 'marketing' | 'notification' | 'support' | 'account'
  content: string // HTML for emails, plain text for SMS
  variables: string[] // Available variables like {{order_number}}
  isActive: boolean
  isDefault: boolean // System default template
  lastUsed?: Date
  usageCount: number
  
  // Email specific
  preheader?: string // Email preview text
  fromName?: string
  fromEmail?: string
  replyTo?: string
  
  // SMS specific
  smsLength?: number
  
  // Metadata
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200
    },
    type: {
      type: String,
      required: true,
      enum: ['email', 'sms'],
      default: 'email'
    },
    category: {
      type: String,
      required: true,
      enum: ['order', 'marketing', 'notification', 'support', 'account'],
      default: 'notification'
    },
    content: {
      type: String,
      required: true
    },
    variables: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    lastUsed: Date,
    usageCount: {
      type: Number,
      default: 0
    },
    
    // Email specific
    preheader: {
      type: String,
      maxlength: 100
    },
    fromName: String,
    fromEmail: String,
    replyTo: String,
    
    // SMS specific
    smsLength: Number,
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Indexes
EmailTemplateSchema.index({ slug: 1 })
EmailTemplateSchema.index({ type: 1, category: 1 })
EmailTemplateSchema.index({ isActive: 1 })

// Pre-save hook to generate slug
EmailTemplateSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Extract variables from content
  const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
  const variables = new Set<string>()
  let match
  
  while ((match = variableRegex.exec(this.content)) !== null) {
    variables.add(match[1])
  }
  
  if (this.subject) {
    while ((match = variableRegex.exec(this.subject)) !== null) {
      variables.add(match[1])
    }
  }
  
  this.variables = Array.from(variables)
  
  // Calculate SMS length
  if (this.type === 'sms') {
    this.smsLength = this.content.length
  }
  
  next()
})

const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema)

export default EmailTemplate
