import mongoose, { Schema, Document } from 'mongoose'

export interface ITaxRate extends Document {
  _id: string
  name: string
  country: string
  state?: string
  zipCode?: string
  rate: number
  type: 'percentage' | 'fixed'
  isActive: boolean
  priority: number
  applyToShipping: boolean
  createdAt: Date
  updatedAt: Date
  calculateTax(amount: number): number
}

const taxRateSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Tax name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    uppercase: true,
    index: true
  },
  state: {
    type: String,
    trim: true,
    uppercase: true,
    index: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Rate cannot be negative'],
    max: [100, 'Rate cannot exceed 100%']
  },
  type: {
    type: String,
    enum: {
      values: ['percentage', 'fixed'],
      message: 'Type must be percentage or fixed'
    },
    default: 'percentage'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  applyToShipping: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes for better performance
taxRateSchema.index({ country: 1, state: 1, isActive: 1 })
taxRateSchema.index({ country: 1, isActive: 1, priority: -1 })
taxRateSchema.index({ isActive: 1, priority: -1 })

// Calculate tax amount
taxRateSchema.methods.calculateTax = function(amount: number): number {
  if (this.type === 'percentage') {
    return Math.round((amount * this.rate / 100) * 100) / 100
  } else {
    return this.rate
  }
}

// Validate percentage rate
taxRateSchema.pre('save', function(next) {
  if (this.type === 'percentage' && this.rate > 100) {
    next(new Error('Percentage rate cannot exceed 100%'))
  } else {
    next()
  }
})

export default mongoose.models.TaxRate || mongoose.model<ITaxRate>('TaxRate', taxRateSchema)

