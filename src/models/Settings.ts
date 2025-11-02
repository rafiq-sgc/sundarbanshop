import mongoose, { Schema, Document } from 'mongoose'

export interface ISettings extends Document {
  _id: string
  category: string
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  description?: string
  isPublic: boolean
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

const settingsSchema = new Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    // index removed, see schema.index below
    enum: {
      values: [
        'general', 'store', 'payment', 'shipping', 'tax', 
        'email', 'notification', 'chat', 'loyalty', 'security',
        'analytics', 'seo', 'social', 'api', 'theme'
      ],
      message: 'Invalid settings category'
    }
  },
  key: {
    type: String,
    required: [true, 'Key is required'],
    trim: true,
    lowercase: true,
    // index removed, see schema.index below
  },
  value: {
    type: Schema.Types.Mixed,
    required: [true, 'Value is required']
  },
  type: {
    type: String,
    enum: {
      values: ['string', 'number', 'boolean', 'json', 'array'],
      message: 'Invalid value type'
    },
    required: [true, 'Type is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Composite unique index for category + key
settingsSchema.index({ category: 1, key: 1 }, { unique: true })

// Indexes for better performance
settingsSchema.index({ category: 1, isPublic: 1 })
settingsSchema.index({ isPublic: 1 })

// Validate value type matches declared type
settingsSchema.pre('save', function(next) {
  const valueType = typeof this.value
  
  switch (this.type) {
    case 'string':
      if (valueType !== 'string') {
        return next(new Error('Value must be a string'))
      }
      break
    case 'number':
      if (valueType !== 'number') {
        return next(new Error('Value must be a number'))
      }
      break
    case 'boolean':
      if (valueType !== 'boolean') {
        return next(new Error('Value must be a boolean'))
      }
      break
    case 'array':
      if (!Array.isArray(this.value)) {
        return next(new Error('Value must be an array'))
      }
      break
    case 'json':
      if (valueType !== 'object' || Array.isArray(this.value)) {
        return next(new Error('Value must be a JSON object'))
      }
      break
  }
  
  next()
})

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema)

