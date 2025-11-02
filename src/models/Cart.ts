import mongoose, { Schema, Document } from 'mongoose'

export interface ICartItemVariant {
  variantId?: string
  name?: string
  attributes?: {
    [key: string]: string
  }
  sku?: string
}

export interface ICartItem {
  product: mongoose.Types.ObjectId
  quantity: number
  price: number
  variant?: ICartItemVariant
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId
  items: ICartItem[]
  createdAt: Date
  updatedAt: Date
}

const cartItemVariantSchema = new Schema({
  variantId: { type: String },
  name: { type: String },
  attributes: { type: Map, of: String },
  sku: { type: String }
}, { _id: false })

const cartItemSchema = new Schema({
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
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be non-negative']
  },
  variant: {
    type: cartItemVariantSchema,
    required: false
  }
})

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    // index removed, see schema.index below
  },
  items: [cartItemSchema]
}, {
  timestamps: true
})

// Index for better query performance
cartSchema.index({ userId: 1 })

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema)
