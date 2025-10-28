import mongoose, { Schema, Document } from 'mongoose'

export interface IMediaUsage {
  type: 'product' | 'blog' | 'banner' | 'category'
  entityId: string
}

export interface IMediaAsset extends Document {
  _id: string
  name: string
  filename: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  width?: number
  height?: number
  folder?: string
  tags: string[]
  altText?: string
  uploadedBy: string
  usedIn: IMediaUsage[]
  createdAt: Date
  updatedAt: Date
}

const mediaUsageSchema = new Schema({
  type: {
    type: String,
    enum: ['product', 'blog', 'banner', 'category'],
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true
  }
}, { _id: false })

const mediaAssetSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true,
    lowercase: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'Size cannot be negative']
  },
  width: {
    type: Number,
    min: 0
  },
  height: {
    type: Number,
    min: 0
  },
  folder: {
    type: String,
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  altText: {
    type: String,
    trim: true,
    maxlength: [200, 'Alt text cannot exceed 200 characters']
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  usedIn: [mediaUsageSchema]
}, {
  timestamps: true
})

// Indexes for better performance
mediaAssetSchema.index({ filename: 1 })
mediaAssetSchema.index({ folder: 1, createdAt: -1 })
mediaAssetSchema.index({ tags: 1 })
mediaAssetSchema.index({ mimeType: 1 })
mediaAssetSchema.index({ uploadedBy: 1, createdAt: -1 })
mediaAssetSchema.index({ createdAt: -1 })

// Text index for search
mediaAssetSchema.index({ name: 'text', altText: 'text', tags: 'text' })

export default mongoose.models.MediaAsset || mongoose.model<IMediaAsset>('MediaAsset', mediaAssetSchema)

