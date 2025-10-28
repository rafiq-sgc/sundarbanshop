import mongoose, { Schema, Document } from 'mongoose'

export interface ILoyaltyTransaction {
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
  points: number
  order?: string
  description: string
  expiryDate?: Date
  date: Date
}

export interface ILoyaltyReward {
  code: string
  name: string
  pointsCost: number
  redeemedAt: Date
  expiresAt: Date
  used: boolean
}

export interface ILoyaltyProgram extends Document {
  _id: string
  user: string
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  lifetimePoints: number
  transactions: ILoyaltyTransaction[]
  rewards: ILoyaltyReward[]
  createdAt: Date
  updatedAt: Date
  earnPoints(points: number, orderId: string, description: string): Promise<void>
  redeemPoints(points: number, description: string): Promise<void>
  updateTier(): void
}

const loyaltyTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'adjusted'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

const loyaltyRewardSchema = new Schema({
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  pointsCost: {
    type: Number,
    required: true,
    min: 0
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const loyaltyProgramSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true,
    index: true
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  tier: {
    type: String,
    enum: {
      values: ['bronze', 'silver', 'gold', 'platinum'],
      message: 'Invalid tier'
    },
    default: 'bronze',
    index: true
  },
  lifetimePoints: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [loyaltyTransactionSchema],
  rewards: [loyaltyRewardSchema]
}, {
  timestamps: true
})

// Indexes for better performance
loyaltyProgramSchema.index({ user: 1 })
loyaltyProgramSchema.index({ tier: 1, points: -1 })

// Earn points
loyaltyProgramSchema.methods.earnPoints = async function(
  points: number, 
  orderId: string, 
  description: string
): Promise<void> {
  this.points += points
  this.lifetimePoints += points
  this.transactions.push({
    type: 'earned',
    points,
    order: orderId,
    description,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    date: new Date()
  })
  this.updateTier()
  await this.save()
}

// Redeem points
loyaltyProgramSchema.methods.redeemPoints = async function(
  points: number, 
  description: string
): Promise<void> {
  if (points > this.points) {
    throw new Error('Insufficient points balance')
  }
  
  this.points -= points
  this.transactions.push({
    type: 'redeemed',
    points: -points,
    description,
    date: new Date()
  })
  this.updateTier()
  await this.save()
}

// Update tier based on lifetime points
loyaltyProgramSchema.methods.updateTier = function(): void {
  if (this.lifetimePoints >= 10000) {
    this.tier = 'platinum'
  } else if (this.lifetimePoints >= 5000) {
    this.tier = 'gold'
  } else if (this.lifetimePoints >= 2000) {
    this.tier = 'silver'
  } else {
    this.tier = 'bronze'
  }
}

// Auto-update tier on save
loyaltyProgramSchema.pre('save', function(next) {
  if (this.isModified('lifetimePoints')) {
    (this as any).updateTier()
  }
  next()
})

export default mongoose.models.LoyaltyProgram || mongoose.model<ILoyaltyProgram>('LoyaltyProgram', loyaltyProgramSchema)

