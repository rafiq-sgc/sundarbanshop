import mongoose, { Schema, Document } from 'mongoose'

export interface ICouponUsage {
  user: string
  usedAt: Date
  orderNumber: string
}

export interface ICoupon extends Document {
  _id: string
  code: string
  description?: string
  type: 'percentage' | 'fixed'
  value: number
  minimumPurchase: number
  maximumDiscount?: number
  usageLimit?: number
  usageCount: number
  perUserLimit?: number
  usedBy: ICouponUsage[]
  applicableProducts?: string[]
  applicableCategories?: string[]
  excludedProducts?: string[]
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isValid(userId?: string): Promise<{ valid: boolean; message?: string }>
  canUserUse(userId: string): boolean
}

const couponUsageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  },
  orderNumber: {
    type: String,
    required: true
  }
}, { _id: false })

const couponSchema = new Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [50, 'Coupon code cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['percentage', 'fixed'],
      message: 'Type must be either percentage or fixed'
    },
    required: [true, 'Discount type is required']
  },
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Value cannot be negative']
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase cannot be negative']
  },
  maximumDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1']
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  perUserLimit: {
    type: Number,
    min: [1, 'Per user limit must be at least 1']
  },
  usedBy: [couponUsageSchema],
  applicableProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better performance
couponSchema.index({ code: 1, isActive: 1 })
couponSchema.index({ isActive: 1, endDate: 1 })
couponSchema.index({ 'usedBy.user': 1 })

// Validate percentage value
couponSchema.pre('save', function(next) {
  if (this.type === 'percentage' && this.value > 100) {
    next(new Error('Percentage discount cannot exceed 100%'))
  } else {
    next()
  }
})

// Check if coupon is valid
couponSchema.methods.isValid = async function(userId?: string): Promise<{ valid: boolean; message?: string }> {
  // Check if active
  if (!this.isActive) {
    return { valid: false, message: 'Coupon is not active' }
  }

  // Check date validity
  const now = new Date()
  if (this.startDate && now < this.startDate) {
    return { valid: false, message: 'Coupon is not yet valid' }
  }
  if (this.endDate && now > this.endDate) {
    return { valid: false, message: 'Coupon has expired' }
  }

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' }
  }

  // Check per user limit
  if (userId && this.perUserLimit) {
    const userUsageCount = this.usedBy.filter(
      (usage: any) => usage.user.toString() === userId
    ).length
    if (userUsageCount >= this.perUserLimit) {
      return { valid: false, message: 'You have reached the usage limit for this coupon' }
    }
  }

  return { valid: true }
}

// Check if user can use coupon
couponSchema.methods.canUserUse = function(userId: string): boolean {
  if (!this.perUserLimit) return true
  
  const userUsageCount = this.usedBy.filter(
    (usage: any) => usage.user.toString() === userId
  ).length
  
  return userUsageCount < this.perUserLimit
}

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema)

