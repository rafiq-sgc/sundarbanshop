import mongoose, { Schema, Document } from 'mongoose'

export interface IChatMessage {
  sender: 'customer' | 'agent'
  senderName: string
  message: string
  attachments?: string[]
  read: boolean
  timestamp: Date
}

export interface IChatCustomer {
  name: string
  email: string
  userId?: string
  avatar?: string
}

export interface IChatConversation extends Document {
  _id: string
  conversationId: string
  customer: IChatCustomer
  agent?: string
  status: 'active' | 'pending' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  subject: string
  tags: string[]
  messages: IChatMessage[]
  firstResponseTime?: number
  avgResponseTime?: number
  totalMessages: number
  unreadCount: number
  satisfaction?: number
  feedback?: string
  resolvedAt?: Date
  lastMessageAt: Date
  createdAt: Date
  updatedAt: Date
}

const chatMessageSchema = new Schema({
  sender: {
    type: String,
    enum: ['customer', 'agent'],
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
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
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

const chatCustomerSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String,
    trim: true
  }
}, { _id: false })

const chatConversationSchema = new Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: chatCustomerSchema,
    required: true
  },
  agent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'pending', 'resolved'],
      message: 'Invalid status'
    },
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Invalid priority'
    },
    default: 'medium'
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  messages: [chatMessageSchema],
  firstResponseTime: {
    type: Number,
    min: 0
  },
  avgResponseTime: {
    type: Number,
    min: 0
  },
  totalMessages: {
    type: Number,
    default: 0,
    min: 0
  },
  unreadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  resolvedAt: {
    type: Date
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
chatConversationSchema.index({ conversationId: 1 })
chatConversationSchema.index({ 'customer.email': 1, status: 1 })
chatConversationSchema.index({ agent: 1, status: 1 })
chatConversationSchema.index({ status: 1, lastMessageAt: -1 })
chatConversationSchema.index({ status: 1, priority: 1 })
chatConversationSchema.index({ createdAt: -1 })
chatConversationSchema.index({ tags: 1, status: 1 })

// Generate conversation ID before saving
chatConversationSchema.pre('save', async function(next) {
  if (!this.conversationId) {
    const count = await mongoose.model('ChatConversation').countDocuments()
    this.conversationId = `CHAT-${String(count + 1).padStart(8, '0')}`
  }
  next()
})

// Update counters and timestamps when messages change
chatConversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.totalMessages = this.messages.length
    this.unreadCount = this.messages.filter(m => !m.read).length
    this.lastMessageAt = new Date()
    
    // Calculate response times
    const agentMessages = this.messages.filter(m => m.sender === 'agent')
    if (agentMessages.length > 0 && !this.firstResponseTime) {
      const firstCustomerMsg = this.messages.find(m => m.sender === 'customer')
      const firstAgentMsg = agentMessages[0]
      if (firstCustomerMsg && firstAgentMsg) {
        this.firstResponseTime = Math.floor(
          (firstAgentMsg.timestamp.getTime() - firstCustomerMsg.timestamp.getTime()) / 1000
        )
      }
    }
  }
  
  // Update resolvedAt when status changes to resolved
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date()
  }
  
  next()
})

export default mongoose.models.ChatConversation || mongoose.model<IChatConversation>('ChatConversation', chatConversationSchema)

