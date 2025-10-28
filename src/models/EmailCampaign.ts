import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailRecipients {
  type: 'all' | 'segment' | 'custom'
  segment?: {
    minOrders?: number
    maxOrders?: number
    minSpent?: number
    maxSpent?: number
    tags?: string[]
    registeredAfter?: Date
    registeredBefore?: Date
  }
  emails?: string[]
}

export interface IEmailStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
}

export interface IEmailCampaign extends Document {
  _id: string
  name: string
  subject: string
  content: string
  template?: string
  type: 'newsletter' | 'promotional' | 'transactional' | 'abandoned-cart'
  recipients: IEmailRecipients
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  scheduledAt?: Date
  sentAt?: Date
  stats: IEmailStats
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const emailSegmentSchema = new Schema({
  minOrders: { type: Number, min: 0 },
  maxOrders: { type: Number, min: 0 },
  minSpent: { type: Number, min: 0 },
  maxSpent: { type: Number, min: 0 },
  tags: [{ type: String, trim: true }],
  registeredAfter: { type: Date },
  registeredBefore: { type: Date }
}, { _id: false })

const emailRecipientsSchema = new Schema({
  type: {
    type: String,
    enum: ['all', 'segment', 'custom'],
    required: true
  },
  segment: emailSegmentSchema,
  emails: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { _id: false })

const emailStatsSchema = new Schema({
  sent: { type: Number, default: 0, min: 0 },
  delivered: { type: Number, default: 0, min: 0 },
  opened: { type: Number, default: 0, min: 0 },
  clicked: { type: Number, default: 0, min: 0 },
  bounced: { type: Number, default: 0, min: 0 },
  unsubscribed: { type: Number, default: 0, min: 0 }
}, { _id: false })

const emailCampaignSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Email content is required']
  },
  template: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['newsletter', 'promotional', 'transactional', 'abandoned-cart'],
      message: 'Invalid campaign type'
    },
    required: [true, 'Campaign type is required'],
    index: true
  },
  recipients: {
    type: emailRecipientsSchema,
    required: true
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'scheduled', 'sending', 'sent', 'paused'],
      message: 'Invalid status'
    },
    default: 'draft',
    index: true
  },
  scheduledAt: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date
  },
  stats: {
    type: emailStatsSchema,
    default: () => ({})
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
emailCampaignSchema.index({ type: 1, status: 1 })
emailCampaignSchema.index({ status: 1, scheduledAt: 1 })
emailCampaignSchema.index({ createdBy: 1, status: 1 })
emailCampaignSchema.index({ createdAt: -1 })

// Validate scheduled date
emailCampaignSchema.pre('save', function(next) {
  if (this.status === 'scheduled' && !this.scheduledAt) {
    next(new Error('Scheduled date is required for scheduled campaigns'))
  } else if (this.status === 'scheduled' && this.scheduledAt && this.scheduledAt < new Date()) {
    next(new Error('Scheduled date must be in the future'))
  } else {
    next()
  }
})

// Update sentAt when status changes to sent
emailCampaignSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date()
  }
  next()
})

export default mongoose.models.EmailCampaign || mongoose.model<IEmailCampaign>('EmailCampaign', emailCampaignSchema)

