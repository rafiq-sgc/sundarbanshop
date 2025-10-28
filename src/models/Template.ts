import mongoose, { Schema, Document } from 'mongoose'

export interface ITemplate extends Document {
  title: string
  content: string
  category: string
  shortcut?: string
  variables?: string[]
  usageCount: number
  isFavorite: boolean
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TemplateSchema = new Schema<ITemplate>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['general', 'greeting', 'orders', 'shipping', 'refunds', 'technical', 'closing'],
      default: 'general'
    },
    shortcut: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    variables: [{
      type: String
    }],
    usageCount: {
      type: Number,
      default: 0
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Index for faster searches
TemplateSchema.index({ title: 'text', content: 'text' })
TemplateSchema.index({ category: 1 })
TemplateSchema.index({ isFavorite: 1 })

const Template = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema)

export default Template

