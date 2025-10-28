import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IApiKey extends Document {
  _id: string
  name: string
  key: string
  secret: string
  service: string
  permissions: string[]
  isActive: boolean
  environment: 'development' | 'staging' | 'production'
  lastUsed?: Date
  usageCount: number
  expiresAt?: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
  verifySecret(candidateSecret: string): Promise<boolean>
}

const apiKeySchema = new Schema({
  name: {
    type: String,
    required: [true, 'API key name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  secret: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    index: true
  },
  permissions: [{
    type: String,
    trim: true,
    enum: {
      values: [
        'read', 'write', 'delete',
        'products.read', 'products.write', 'products.delete',
        'orders.read', 'orders.write', 'orders.delete',
        'customers.read', 'customers.write',
        'reports.read', 'webhooks.create'
      ],
      message: 'Invalid permission'
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  environment: {
    type: String,
    enum: {
      values: ['development', 'staging', 'production'],
      message: 'Invalid environment'
    },
    default: 'development'
  },
  lastUsed: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  expiresAt: {
    type: Date,
    index: true
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
apiKeySchema.index({ key: 1, isActive: 1 })
apiKeySchema.index({ service: 1, isActive: 1 })
apiKeySchema.index({ isActive: 1, expiresAt: 1 })
apiKeySchema.index({ createdBy: 1 })

// Hash secret before saving
apiKeySchema.pre('save', async function(next) {
  if (!this.isModified('secret')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.secret = await bcrypt.hash(this.secret, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Generate API key before saving
apiKeySchema.pre('save', function(next) {
  if (!this.key) {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 15)
    this.key = `ak_${timestamp}${randomStr}`
  }
  next()
})

// Verify secret
apiKeySchema.methods.verifySecret = async function(candidateSecret: string): Promise<boolean> {
  return bcrypt.compare(candidateSecret, this.secret)
}

export default mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', apiKeySchema)

