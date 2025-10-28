import mongoose, { Schema, Document } from 'mongoose'

export interface IBanner extends Document {
  _id: string
  title: string
  description?: string
  image: string
  mobileImage?: string
  link?: string
  linkText?: string
  position: 'hero' | 'top' | 'middle' | 'bottom' | 'sidebar'
  isActive: boolean
  sortOrder: number
  startDate?: Date
  endDate?: Date
  clicks: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const bannerSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Image is required'],
    trim: true
  },
  mobileImage: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    trim: true
  },
  linkText: {
    type: String,
    trim: true,
    maxlength: [50, 'Link text cannot exceed 50 characters']
  },
  position: {
    type: String,
    enum: {
      values: ['hero', 'top', 'middle', 'bottom', 'sidebar'],
      message: 'Invalid banner position'
    },
    required: [true, 'Position is required'],
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date,
    index: true
  },
  clicks: {
    type: Number,
    default: 0,
    min: 0
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
bannerSchema.index({ position: 1, isActive: 1, sortOrder: 1 })
bannerSchema.index({ isActive: 1, endDate: 1 })
bannerSchema.index({ position: 1, isActive: 1, startDate: 1, endDate: 1 })

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', bannerSchema)

