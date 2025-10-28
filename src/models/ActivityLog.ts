import mongoose, { Schema, Document } from 'mongoose'

export interface IActivityLog extends Document {
  _id: string
  user: string
  action: string
  entity: string
  entityId?: string
  description: string
  ipAddress?: string
  userAgent?: string
  changes?: {
    before?: any
    after?: any
  }
  metadata?: any
  createdAt: Date
}

const activityLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    uppercase: true,
    index: true,
    enum: {
      values: [
        'LOGIN', 'LOGOUT', 
        'CREATE', 'UPDATE', 'DELETE', 'VIEW',
        'APPROVE', 'REJECT', 'ASSIGN',
        'UPLOAD', 'DOWNLOAD', 'EXPORT',
        'SEND', 'RECEIVE',
        'ENABLE', 'DISABLE'
      ],
      message: 'Invalid action type'
    }
  },
  entity: {
    type: String,
    required: [true, 'Entity is required'],
    trim: true,
    index: true,
    enum: {
      values: [
        'User', 'Product', 'Category', 'Order', 'Review',
        'Coupon', 'Refund', 'BlogPost', 'Banner', 'Collection',
        'GiftCard', 'Warehouse', 'StockTransfer', 'EmailCampaign',
        'SupportTicket', 'ChatConversation', 'Transaction',
        'Settings', 'Notification'
      ],
      message: 'Invalid entity type'
    }
  },
  entityId: {
    type: Schema.Types.ObjectId
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Indexes for better performance
activityLogSchema.index({ user: 1, createdAt: -1 })
activityLogSchema.index({ action: 1, entity: 1, createdAt: -1 })
activityLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 })
activityLogSchema.index({ createdAt: -1 })

// TTL index to auto-delete logs older than 1 year
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 })

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', activityLogSchema)

