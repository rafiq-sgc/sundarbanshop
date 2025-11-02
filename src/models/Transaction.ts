import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
  _id: string
  transactionNumber: string
  type: 'income' | 'expense' | 'refund'
  category: 'order' | 'refund' | 'shipping' | 'tax' | 'commission' | 'other'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  
  // Related references
  order?: mongoose.Types.ObjectId
  refund?: mongoose.Types.ObjectId
  user?: mongoose.Types.ObjectId
  
  // Payment details
  paymentMethod?: string
  paymentGateway?: string
  gatewayTransactionId?: string
  gatewayFee?: number
  netAmount?: number
  
  // Additional info
  description: string
  notes?: string
  metadata?: any
  
  // Dates
  transactionDate: Date
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense', 'refund'],
    // index removed, see schema.index below
    },
    category: {
      type: String,
      required: true,
      enum: ['order', 'refund', 'shipping', 'tax', 'commission', 'other'],
    // index removed, see schema.index below
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'BDT'
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    // index removed, see schema.index below
    },
    
    // References
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    refund: {
      type: Schema.Types.ObjectId,
      ref: 'Refund'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Payment details
    paymentMethod: String,
    paymentGateway: String,
    gatewayTransactionId: String,
    gatewayFee: {
      type: Number,
      default: 0
    },
    netAmount: Number,
    
    // Additional
    description: {
      type: String,
      required: true
    },
    notes: String,
    metadata: Schema.Types.Mixed,
    
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    // index removed, see schema.index below
    }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
TransactionSchema.index({ type: 1, status: 1, transactionDate: -1 })
TransactionSchema.index({ category: 1, transactionDate: -1 })
TransactionSchema.index({ transactionNumber: 1 })

// Pre-save hook to generate transaction number
TransactionSchema.pre('save', async function(next) {
  if (!this.transactionNumber) {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    // Count transactions today to generate sequence
    const count = await mongoose.model('Transaction').countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    this.transactionNumber = `TXN-${year}${month}${day}-${sequence}`
  }
  
  // Calculate net amount (amount - gateway fee)
  if (!this.netAmount) {
    this.netAmount = this.amount - (this.gatewayFee || 0)
  }
  
  next()
})

const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)

export default Transaction
