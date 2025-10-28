import mongoose, { Schema, Document } from 'mongoose'

export interface ICollectionRules {
  categories?: string[]
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  onSale?: boolean
}

export interface ICollection extends Document {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  products: string[]
  type: 'manual' | 'automated'
  rules?: ICollectionRules
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  metaTitle?: string
  metaDescription?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const collectionRulesSchema = new Schema({
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  minPrice: {
    type: Number,
    min: 0
  },
  maxPrice: {
    type: Number,
    min: 0
  },
  featured: {
    type: Boolean
  },
  onSale: {
    type: Boolean
  }
}, { _id: false })

const collectionSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    trim: true
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  type: {
    type: String,
    enum: {
      values: ['manual', 'automated'],
      message: 'Type must be manual or automated'
    },
    default: 'manual'
  },
  rules: collectionRulesSchema,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
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
collectionSchema.index({ slug: 1 })
collectionSchema.index({ isActive: 1, isFeatured: 1 })
collectionSchema.index({ isActive: 1, sortOrder: 1 })
collectionSchema.index({ type: 1, isActive: 1 })

// Auto-generate slug from name if not provided
collectionSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
  next()
})

export default mongoose.models.Collection || mongoose.model<ICollection>('Collection', collectionSchema)

