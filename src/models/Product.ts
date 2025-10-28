import mongoose, { Schema, Document } from 'mongoose'

export interface IProductVariant {
  name: string
  sku: string
  price: number
  comparePrice?: number
  stock: number
  attributes: {
    [key: string]: string
  }
  image?: string
  isActive: boolean
}

export interface IProductAttribute {
  name: string
  values: string[]
  isRequired: boolean
}

export interface IProduct extends Document {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  sku: string
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images: string[]
  category: string
  tags: string[]
  stock: number
  trackQuantity: boolean
  allowBackorder: boolean
  isActive: boolean
  isDigital: boolean
  isFeatured: boolean
  isOnSale: boolean
  salePrice?: number
  saleStartDate?: Date
  saleEndDate?: Date
  metaTitle?: string
  metaDescription?: string
  variants?: IProductVariant[]
  attributes?: IProductAttribute[]
  rating?: number
  reviewCount?: number
  createdAt: Date
  updatedAt: Date
}

const productVariantSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  attributes: { type: Map, of: String },
  image: { type: String },
  isActive: { type: Boolean, default: true }
})

const productAttributeSchema = new Schema({
  name: { type: String, required: true },
  values: [{ type: String }],
  isRequired: { type: Boolean, default: false }
})

const productSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'],
    trim: true
  },
  shortDescription: { 
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  comparePrice: { 
    type: Number, 
    min: 0 
  },
  costPrice: { 
    type: Number, 
    min: 0 
  },
  sku: { 
    type: String, 
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: { 
    type: String,
    trim: true
  },
  weight: { 
    type: Number, 
    min: 0 
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  images: [{ 
    type: String,
    required: [true, 'At least one image is required']
  }],
  category: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category',
    required: [true, 'Category is required']
  },
  tags: [{ 
    type: String,
    trim: true
  }],
  stock: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0
  },
  trackQuantity: { 
    type: Boolean, 
    default: true 
  },
  allowBackorder: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDigital: { 
    type: Boolean, 
    default: false 
  },
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  isOnSale: { 
    type: Boolean, 
    default: false 
  },
  salePrice: { 
    type: Number, 
    min: 0 
  },
  saleStartDate: { 
    type: Date 
  },
  saleEndDate: { 
    type: Date 
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
  variants: [productVariantSchema],
  attributes: [productAttributeSchema],
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  reviewCount: { 
    type: Number, 
    min: 0, 
    default: 0 
  }
}, {
  timestamps: true
})

// Indexes for better performance
productSchema.index({ slug: 1 })
productSchema.index({ sku: 1 })
productSchema.index({ category: 1 })
productSchema.index({ isActive: 1 })
productSchema.index({ isFeatured: 1 })
productSchema.index({ isOnSale: 1 })
productSchema.index({ price: 1 })
productSchema.index({ rating: -1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ name: 'text', description: 'text', tags: 'text' })

// Virtual for sale price calculation
productSchema.virtual('currentPrice').get(function() {
  if (this.isOnSale && this.salePrice) {
    const now = new Date()
    if ((!this.saleStartDate || this.saleStartDate <= now) && 
        (!this.saleEndDate || this.saleEndDate >= now)) {
      return this.salePrice
    }
  }
  return this.price
})

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100)
  }
  return 0
})

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true })
productSchema.set('toObject', { virtuals: true })

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema)
