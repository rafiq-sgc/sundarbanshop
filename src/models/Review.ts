import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  _id: string
  product: string
  user: string
  order?: string
  rating: number
  title?: string
  comment: string
  images?: string[]
  pros?: string[]
  cons?: string[]
  verifiedPurchase: boolean
  isApproved: boolean
  isFeatured: boolean
  helpfulCount: number
  unhelpfulCount: number
  response?: {
    text: string
    respondedBy: string
    respondedAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

const reviewResponseSchema = new Schema({
  text: { type: String, required: true },
  respondedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  respondedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false })

const reviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    index: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  images: [{
    type: String,
    trim: true
  }],
  pros: [{
    type: String,
    trim: true,
    maxlength: [200, 'Pro cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: [200, 'Con cannot exceed 200 characters']
  }],
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  response: reviewResponseSchema
}, {
  timestamps: true
})

// Indexes for better performance
reviewSchema.index({ product: 1, isApproved: 1 })
reviewSchema.index({ product: 1, createdAt: -1 })
reviewSchema.index({ user: 1, createdAt: -1 })
reviewSchema.index({ isApproved: 1, isFeatured: 1 })
reviewSchema.index({ product: 1, rating: -1 })

// Compound index for user and product (prevent duplicate reviews)
reviewSchema.index({ user: 1, product: 1 }, { unique: true })

// Update product rating after review save
reviewSchema.post('save', async function() {
  const Product = mongoose.model('Product')
  const reviews = await mongoose.model('Review').find({
    product: this.product,
    isApproved: true
  })
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum: number, review) => sum + review.rating, 0) / reviews.length
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length
    })
  }
})

// Update product rating after review delete
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Product = mongoose.model('Product')
    const reviews = await mongoose.model('Review').find({
      product: doc.product,
      isApproved: true
    })
    
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum: number, review) => sum + review.rating, 0) / reviews.length
      await Product.findByIdAndUpdate(doc.product, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length
      })
    } else {
      await Product.findByIdAndUpdate(doc.product, {
        rating: 0,
        reviewCount: 0
      })
    }
  }
})

export default mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema)

