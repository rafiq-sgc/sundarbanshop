import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  _id: string
  name: string
  email?: string | null
  password?: string | null
  role: 'user' | 'admin'
  avatar?: string
  phone?: string | null
  address?: Array<{
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }>
  paymentMethods?: Array<{
    type: 'card' | 'bkash' | 'nagad' | 'rocket' | 'bank'
    isDefault: boolean
    cardNumber?: string
    cardHolderName?: string
    expiryDate?: string
    accountNumber?: string
    accountName?: string
    bankName?: string
    accountHolderName?: string
    routingNumber?: string
  }>
  customerType: 'online' | 'phone' | 'walkin'
  canLogin: boolean
  createdBy?: string
  notes?: string
  isActive: boolean
  emailVerified: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
  canAccessWebsite(): boolean
}

const addressSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
})

const paymentMethodSchema = new Schema({
  type: { 
    type: String, 
    enum: ['card', 'bkash', 'nagad', 'rocket', 'bank'],
    required: true 
  },
  isDefault: { type: Boolean, default: false },
  // Card fields
  cardNumber: { type: String },
  cardHolderName: { type: String },
  expiryDate: { type: String },
  // Mobile wallet fields
  accountNumber: { type: String },
  accountName: { type: String },
  // Bank fields
  bankName: { type: String },
  accountHolderName: { type: String },
  routingNumber: { type: String }
})

const userSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    unique: true,
    sparse: true, // Allows multiple null/undefined values
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    default: null
  },
  password: { 
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    default: null
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  avatar: { 
    type: String,
    default: null
  },
  phone: { 
    type: String,
    unique: true,
    sparse: true, // Allows multiple null/undefined values
    trim: true,
    default: null
  },
  address: [addressSchema],
  paymentMethods: [paymentMethodSchema],
  customerType: {
    type: String,
    enum: ['online', 'phone', 'walkin'],
    default: 'online',
    required: true
  },
  canLogin: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  lastLogin: { 
    type: Date 
  }
}, {
  timestamps: true
})

// Index for better query performance (removed duplicate email index)
userSchema.index({ role: 1 })
userSchema.index({ customerType: 1 })

// Custom validation: At least one of email or phone must be provided
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    this.invalidate('email', 'Either email or phone number is required')
    this.invalidate('phone', 'Either email or phone number is required')
  }
  next()
})

// Hash password before saving (only if password exists and is modified)
userSchema.pre('save', async function(next) {
  // Skip if password doesn't exist or hasn't been modified
  if (!this.password || !this.isModified('password')) {
    return next()
  }
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Compare password method (handle null passwords)
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false // No password = can't login
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if customer can access website
userSchema.methods.canAccessWebsite = function(): boolean {
  return this.canLogin && !!this.email && !!this.password && this.emailVerified
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema)
