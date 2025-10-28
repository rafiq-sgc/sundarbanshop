import mongoose, { Schema, Document } from 'mongoose'

export interface IAdjustmentItem {
  product: string
  previousQuantity: number
  newQuantity: number
  difference: number
}

export interface IInventoryAdjustment extends Document {
  _id: string
  adjustmentNumber: string
  warehouse: string
  items: IAdjustmentItem[]
  type: 'stock_count' | 'damaged' | 'lost' | 'found' | 'correction' | 'other'
  reason: string
  adjustedBy: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const adjustmentItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: [0, 'Previous quantity cannot be negative']
  },
  newQuantity: {
    type: Number,
    required: true,
    min: [0, 'New quantity cannot be negative']
  },
  difference: {
    type: Number,
    required: true
  }
}, { _id: false })

const inventoryAdjustmentSchema = new Schema({
  adjustmentNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  warehouse: {
    type: Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required'],
    index: true
  },
  items: {
    type: [adjustmentItemSchema],
    required: true,
    validate: {
      validator: function(items: IAdjustmentItem[]) {
        return items && items.length > 0
      },
      message: 'At least one item is required'
    }
  },
  type: {
    type: String,
    enum: ['stock_count', 'damaged', 'lost', 'found', 'correction', 'other'],
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  adjustedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
})

// Indexes
inventoryAdjustmentSchema.index({ adjustmentNumber: 1 })
inventoryAdjustmentSchema.index({ warehouse: 1, status: 1 })
inventoryAdjustmentSchema.index({ type: 1, createdAt: -1 })
inventoryAdjustmentSchema.index({ status: 1, createdAt: -1 })

// Generate adjustment number before saving
inventoryAdjustmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.adjustmentNumber) {
    const count = await mongoose.models.InventoryAdjustment.countDocuments()
    this.adjustmentNumber = `ADJ${String(count + 1).padStart(6, '0')}`
  }
  next()
})

export default mongoose.models.InventoryAdjustment || mongoose.model<IInventoryAdjustment>('InventoryAdjustment', inventoryAdjustmentSchema)

