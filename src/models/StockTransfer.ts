import mongoose, { Schema, Document } from 'mongoose'

export interface ITransferItem {
  product: string
  quantity: number
  notes?: string
}

export interface IStockTransfer extends Document {
  _id: string
  transferNumber: string
  fromWarehouse: string
  toWarehouse: string
  items: ITransferItem[]
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  requestedBy: string
  approvedBy?: string
  completedBy?: string
  requestedDate: Date
  approvedDate?: Date
  completedDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const transferItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false })

const stockTransferSchema = new Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  fromWarehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Source warehouse is required'],
    index: true
  },
  toWarehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Destination warehouse is required'],
    index: true
  },
  items: {
    type: [transferItemSchema],
    required: true,
    validate: {
      validator: function(items: ITransferItem[]) {
        return items && items.length > 0
      },
      message: 'At least one item is required'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: Date,
  completedDate: Date,
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
})

// Indexes
stockTransferSchema.index({ transferNumber: 1 })
stockTransferSchema.index({ status: 1, createdAt: -1 })
stockTransferSchema.index({ fromWarehouse: 1, status: 1 })
stockTransferSchema.index({ toWarehouse: 1, status: 1 })

// Generate transfer number before saving
stockTransferSchema.pre('save', async function(next) {
  if (this.isNew && !this.transferNumber) {
    const count = await mongoose.models.StockTransfer.countDocuments()
    this.transferNumber = `TRF${String(count + 1).padStart(6, '0')}`
  }
  next()
})

export default mongoose.models.StockTransfer || mongoose.model<IStockTransfer>('StockTransfer', stockTransferSchema)
