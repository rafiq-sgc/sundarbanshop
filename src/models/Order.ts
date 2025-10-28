import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItemVariant {
  variantId?: string
  name?: string
  attributes?: {
    [key: string]: string
  }
  sku?: string
}

export interface IOrderItem {
  product: string
  name: string
  sku: string
  price: number
  quantity: number
  total: number
  variant?: IOrderItemVariant
}

export interface IOrder extends Document {
  _id: string
  orderNumber: string
  user?: string // Optional for guest orders
  guestEmail?: string // Email for guest orders
  items: IOrderItem[]
  shippingAddress: {
    name: string
    phone: string
    email?: string // Optional email field
    address: string
    city: string
    state?: string
    zipCode?: string
    country: string
  }
  billingAddress?: {
    name: string
    phone: string
    email?: string
    address: string
    city: string
    state?: string
    zipCode?: string
    country: string
  }
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  notes?: string
  trackingNumber?: string
  shippedAt?: Date
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

const orderItemVariantSchema = new Schema({
  variantId: { type: String },
  name: { type: String },
  attributes: { type: Map, of: String },
  sku: { type: String }
}, { _id: false })

const orderItemSchema = new Schema({
  product: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product',
    required: false // Allow null for custom items
  },
  name: { 
    type: String, 
    required: true 
  },
  sku: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  variant: {
    type: orderItemVariantSchema,
    required: false
  }
})

const addressSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { 
    type: String, 
    required: false,
    validate: {
      validator: function(v: string) {
        // Only validate email if provided
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v)
      },
      message: 'Please enter a valid email address'
    }
  },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { 
    type: String, 
    required: false
  },
  zipCode: { 
    type: String, 
    required: false
  },
  country: { type: String, required: true }
})

const orderSchema = new Schema({
  orderNumber: { 
    type: String, 
    required: false,  // Will be set by pre-save hook
    unique: true,
    uppercase: true,
    sparse: true
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Optional for guest orders
  },
  guestEmail: {
    type: String,
    required: false,
    validate: {
      validator: function(v: string) {
        // Only validate email if provided
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v)
      },
      message: 'Please enter a valid email address'
    }
  },
  items: [orderItemSchema],
  shippingAddress: { 
    type: addressSchema, 
    required: true 
  },
  billingAddress: addressSchema,
  paymentMethod: { 
    type: String, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  tax: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  shipping: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  discount: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    required: true,
    default: 'USD'
  },
  notes: { 
    type: String 
  },
  trackingNumber: { 
    type: String 
  },
  shippedAt: { 
    type: Date 
  },
  deliveredAt: { 
    type: Date 
  }
}, {
  timestamps: true
})

// Indexes for better performance (removed duplicate orderNumber index)
orderSchema.index({ user: 1 })
orderSchema.index({ orderStatus: 1 })
orderSchema.index({ paymentStatus: 1 })
orderSchema.index({ createdAt: -1 })

// Generate order number before validation
orderSchema.pre('validate', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

export default mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)
