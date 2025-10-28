import mongoose, { Schema, Document } from 'mongoose'

export interface IShippingMethod {
  name: string
  description?: string
  deliveryTime?: string
  type: 'flat-rate' | 'weight-based' | 'price-based' | 'free'
  rate: number
  minOrder?: number
  maxWeight?: number
  isActive: boolean
}

export interface IShippingZone extends Document {
  _id: string
  name: string
  countries: string[]
  states?: string[]
  zipCodes?: string[]
  methods: IShippingMethod[]
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  getApplicableMethod(orderTotal: number, weight: number): IShippingMethod | null
}

const shippingMethodSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Method name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  deliveryTime: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['flat-rate', 'weight-based', 'price-based', 'free'],
      message: 'Invalid shipping method type'
    },
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative']
  },
  minOrder: {
    type: Number,
    min: 0
  },
  maxWeight: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false })

const shippingZoneSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  countries: {
    type: [{
      type: String,
      trim: true,
      uppercase: true
    }],
    validate: {
      validator: function(countries: string[]) {
        return countries && countries.length > 0
      },
      message: 'At least one country is required'
    }
  },
  states: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  zipCodes: [{
    type: String,
    trim: true
  }],
  methods: {
    type: [shippingMethodSchema],
    validate: {
      validator: function(methods: IShippingMethod[]) {
        return methods && methods.length > 0
      },
      message: 'At least one shipping method is required'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Indexes for better performance
shippingZoneSchema.index({ countries: 1, isActive: 1 })
shippingZoneSchema.index({ isActive: 1, sortOrder: 1 })

// Get applicable shipping method based on order details
shippingZoneSchema.methods.getApplicableMethod = function(
  orderTotal: number, 
  weight: number
): IShippingMethod | null {
  const activeMethods = this.methods.filter((m: IShippingMethod) => m.isActive)
  
  for (const method of activeMethods) {
    // Check minimum order requirement
    if (method.minOrder && orderTotal < method.minOrder) continue
    
    // Check weight limit
    if (method.maxWeight && weight > method.maxWeight) continue
    
    // Free shipping conditions
    if (method.type === 'free' && method.minOrder && orderTotal >= method.minOrder) {
      return method
    }
    
    return method
  }
  
  return activeMethods[0] || null
}

export default mongoose.models.ShippingZone || mongoose.model<IShippingZone>('ShippingZone', shippingZoneSchema)

