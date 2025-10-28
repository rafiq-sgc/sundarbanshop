import mongoose, { Schema, Document } from 'mongoose'

export interface IRefundItem {
  product: string
  name: string
  sku: string
  quantity: number
  price: number
  reason: string
}

export interface IRefund extends Document {
  _id: string
  refundNumber: string
  order: string
  user: string
  items: IRefundItem[]
  reason: string
  description?: string
  amount: number
  refundMethod: 'original' | 'store-credit' | 'bank-transfer'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  images?: string[]
  adminNotes?: string
  processedBy?: string
  processedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const refundItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false })

const refundSchema = new Schema({
  refundNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required'],
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  items: {
    type: [refundItemSchema],
    validate: {
      validator: function(items: IRefundItem[]) {
        return items && items.length > 0
      },
      message: 'At least one item is required for refund'
    }
  },
  reason: {
    type: String,
    required: [true, 'Refund reason is required'],
    trim: true,
    maxlength: [100, 'Reason cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Refund amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  refundMethod: {
    type: String,
    enum: {
      values: ['original', 'store-credit', 'bank-transfer'],
      message: 'Invalid refund method'
    },
    required: [true, 'Refund method is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'completed'],
      message: 'Invalid status'
    },
    default: 'pending',
    index: true
  },
  images: [{
    type: String,
    trim: true
  }],
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for better performance
refundSchema.index({ refundNumber: 1 })
refundSchema.index({ order: 1, status: 1 })
refundSchema.index({ user: 1, status: 1 })
refundSchema.index({ status: 1, createdAt: -1 })
refundSchema.index({ createdAt: -1 })

// Generate refund number before saving
refundSchema.pre('save', async function(next) {
  if (!this.refundNumber) {
    const count = await mongoose.model('Refund').countDocuments()
    this.refundNumber = `RFD-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

// Update processedAt when status changes to approved/rejected
refundSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if ((this.status === 'approved' || this.status === 'rejected') && !this.processedAt) {
      this.processedAt = new Date()
    }
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date()
    }
  }
  next()
})

export default mongoose.models.Refund || mongoose.model<IRefund>('Refund', refundSchema)

