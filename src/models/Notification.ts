import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  type: 'order' | 'payment' | 'account' | 'promotion' | 'system'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'account', 'promotion', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1 })
notificationSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema)
