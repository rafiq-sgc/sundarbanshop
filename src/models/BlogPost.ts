import mongoose, { Schema, Document } from 'mongoose'

export interface IBlogPost extends Document {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  image?: string
  category: string
  tags: string[]
  author: string
  status: 'draft' | 'published' | 'archived'
  views: number
  featured: boolean
  metaTitle?: string
  metaDescription?: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const blogPostSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  image: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: 'Status must be draft, published, or archived'
    },
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
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
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for better performance
blogPostSchema.index({ slug: 1 })
blogPostSchema.index({ status: 1, publishedAt: -1 })
blogPostSchema.index({ category: 1, status: 1 })
blogPostSchema.index({ tags: 1, status: 1 })
blogPostSchema.index({ featured: 1, status: 1 })
blogPostSchema.index({ author: 1, status: 1 })

// Text index for search
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' })

// Auto-generate slug from title if not provided
blogPostSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  
  next()
})

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema)

