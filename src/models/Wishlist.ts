import mongoose, { Schema, Document } from 'mongoose'

export interface IWishlistItem {
  product: string
  addedAt: Date
}

export interface IWishlist extends Document {
  _id: string
  user: string
  items: IWishlistItem[]
  createdAt: Date
  updatedAt: Date
}

const wishlistItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true,
    index: true
  },
  items: [wishlistItemSchema]
}, {
  timestamps: true
})

// Index for better performance
wishlistSchema.index({ 'items.product': 1 })
wishlistSchema.index({ user: 1, 'items.product': 1 })

// Limit wishlist items to 100
wishlistSchema.pre('save', function(next) {
  if (this.items.length > 100) {
    next(new Error('Wishlist cannot exceed 100 items'))
  } else {
    next()
  }
})

export default mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', wishlistSchema)

