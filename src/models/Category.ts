import mongoose, { Schema, Document } from 'mongoose'

export interface ICategoryAttribute {
  name: string
  type: 'select' | 'multiselect' | 'text' | 'number' | 'color'
  values?: string[]
  isRequired: boolean
  displayOrder: number
}

export interface ICategory extends Document {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent?: string | ICategory
  children?: ICategory[]
  attributeTemplates?: ICategoryAttribute[]
  isActive: boolean
  sortOrder: number
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
}

const categoryAttributeSchema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['select', 'multiselect', 'text', 'number', 'color'],
    default: 'select'
  },
  values: [{ type: String }],
  isRequired: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 }
}, { _id: false })

const categorySchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
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
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: { 
    type: String 
  },
  parent: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category',
    default: null
  },
  attributeTemplates: [categoryAttributeSchema],
  isActive: { 
    type: Boolean, 
    default: true 
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
  }
}, {
  timestamps: true
})

// Indexes for better performance
categorySchema.index({ slug: 1 })
categorySchema.index({ parent: 1 })
categorySchema.index({ isActive: 1 })
categorySchema.index({ sortOrder: 1 })

// Virtual for children
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
})

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true })
categorySchema.set('toObject', { virtuals: true })

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)
