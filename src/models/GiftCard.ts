import mongoose, { Schema, Document } from 'mongoose'

export interface IGiftCardTransaction {
  type: 'credit' | 'debit'
  amount: number
  order?: string
  description: string
  date: Date
}

export interface IGiftCard extends Document {
  _id: string
  code: string
  initialAmount: number
  currentBalance: number
  currency: string
  purchasedBy?: string
  recipientEmail?: string
  recipientName?: string
  message?: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  expiryDate?: Date
  transactions: IGiftCardTransaction[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
  debit(amount: number, orderId: string, description: string): Promise<void>
  credit(amount: number, description: string): Promise<void>
}

const giftCardTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

const giftCardSchema = new Schema({
  code: {
    type: String,
    required: [true, 'Gift card code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
    minlength: [8, 'Code must be at least 8 characters'],
    maxlength: [20, 'Code cannot exceed 20 characters']
  },
  initialAmount: {
    type: Number,
    required: [true, 'Initial amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currentBalance: {
    type: Number,
    required: true,
    min: [0, 'Balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  purchasedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  recipientName: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'used', 'expired', 'cancelled'],
      message: 'Invalid status'
    },
    default: 'active',
    index: true
  },
  expiryDate: {
    type: Date,
    index: true
  },
  transactions: [giftCardTransactionSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
giftCardSchema.index({ code: 1, status: 1 })
giftCardSchema.index({ status: 1, expiryDate: 1 })
giftCardSchema.index({ purchasedBy: 1 })
giftCardSchema.index({ recipientEmail: 1 })

// Debit from gift card
giftCardSchema.methods.debit = async function(amount: number, orderId: string, description: string): Promise<void> {
  if (this.status !== 'active') {
    throw new Error('Gift card is not active')
  }
  
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = 'expired'
    await this.save()
    throw new Error('Gift card has expired')
  }
  
  if (amount > this.currentBalance) {
    throw new Error('Insufficient gift card balance')
  }
  
  this.currentBalance -= amount
  this.transactions.push({
    type: 'debit',
    amount,
    order: orderId,
    description,
    date: new Date()
  })
  
  if (this.currentBalance === 0) {
    this.status = 'used'
  }
  
  await this.save()
}

// Credit to gift card
giftCardSchema.methods.credit = async function(amount: number, description: string): Promise<void> {
  this.currentBalance += amount
  this.transactions.push({
    type: 'credit',
    amount,
    description,
    date: new Date()
  })
  
  if (this.status === 'used' && this.currentBalance > 0) {
    this.status = 'active'
  }
  
  await this.save()
}

// Generate random gift card code
giftCardSchema.pre('save', function(next) {
  if (!this.code) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    this.code = code
  }
  
  // Set initial balance
  if (this.isNew) {
    this.currentBalance = this.initialAmount
  }
  
  next()
})

export default mongoose.models.GiftCard || mongoose.model<IGiftCard>('GiftCard', giftCardSchema)

