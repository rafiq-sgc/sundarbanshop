import mongoose, { Schema, Document } from 'mongoose'

export interface IChatMessage {
  sender: 'customer' | 'admin'
  senderName: string
  senderAvatar?: string
  message: string
  timestamp: Date
  read: boolean
  attachments?: string[]
}

export interface IChatConversation extends Document {
  customerId: mongoose.Types.ObjectId
  customerName: string
  customerEmail: string
  customerAvatar?: string
  status: 'active' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  subject: string
  lastMessage: string
  lastMessageTime: Date
  unreadAdminCount: number // Unread by admin
  unreadCustomerCount: number // Unread by customer
  assignedTo?: string
  messages: IChatMessage[]
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

const chatMessageSchema = new Schema<IChatMessage>({
  sender: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderAvatar: String,
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  attachments: [String]
}, { _id: true })

const chatConversationSchema = new Schema<IChatConversation>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerAvatar: String,
  status: {
    type: String,
    enum: ['active', 'pending', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: true
  },
  lastMessage: {
    type: String,
    required: true
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadAdminCount: {
    type: Number,
    default: 0
  },
  unreadCustomerCount: {
    type: Number,
    default: 0
  },
  assignedTo: String,
  messages: [chatMessageSchema],
  tags: [String]
}, {
  timestamps: true
})

// Indexes for better query performance
chatConversationSchema.index({ customerId: 1 })
chatConversationSchema.index({ status: 1 })
chatConversationSchema.index({ lastMessageTime: -1 })
chatConversationSchema.index({ 'messages.timestamp': -1 })

// Update lastMessage and lastMessageTime when adding messages
chatConversationSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1]
    this.lastMessage = lastMsg.message
    this.lastMessageTime = lastMsg.timestamp
  }
  next()
})

export default mongoose.models.ChatConversation || mongoose.model<IChatConversation>('ChatConversation', chatConversationSchema)

