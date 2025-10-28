import mongoose, { Schema, Document } from 'mongoose'

export interface ITicketMessage {
  sender: string
  senderType: 'customer' | 'agent'
  message: string
  attachments?: string[]
  isInternal: boolean
  sentAt: Date
}

export interface ISupportTicket extends Document {
  _id: string
  ticketNumber: string
  user: string
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed'
  description: string
  attachments?: string[]
  assignedTo?: string
  messages: ITicketMessage[]
  tags: string[]
  relatedOrder?: string
  resolvedAt?: Date
  closedAt?: Date
  lastResponseAt: Date
  createdAt: Date
  updatedAt: Date
}

const ticketMessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'agent'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    type: String,
    trim: true
  }],
  isInternal: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

const supportTicketSchema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Invalid priority'
    },
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'in-progress', 'waiting-customer', 'resolved', 'closed'],
      message: 'Invalid status'
    },
    default: 'open',
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  attachments: [{
    type: String,
    trim: true
  }],
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  messages: [ticketMessageSchema],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  relatedOrder: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  lastResponseAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
supportTicketSchema.index({ ticketNumber: 1 })
supportTicketSchema.index({ user: 1, status: 1 })
supportTicketSchema.index({ assignedTo: 1, status: 1 })
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 })
supportTicketSchema.index({ category: 1, status: 1 })
supportTicketSchema.index({ tags: 1, status: 1 })

// Generate ticket number before saving
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments()
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

// Update timestamps based on status changes
supportTicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date()
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = now
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = now
    }
  }
  
  // Update lastResponseAt when new message is added
  if (this.isModified('messages')) {
    this.lastResponseAt = new Date()
  }
  
  next()
})

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema)

