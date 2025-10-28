import mongoose, { Schema, Document } from 'mongoose'

export interface IGeneralSettings extends Document {
  // Store Information
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  storeCity: string
  storeState: string
  storeZip: string
  storeCountry: string
  storeLogo?: string
  storeFavicon?: string
  storeDescription?: string
  
  // Regional Settings
  currency: string
  language: string
  timezone: string
  dateFormat?: string
  timeFormat?: string
  
  // Tax & Shipping
  taxRate: number
  taxEnabled: boolean
  shippingFee: number
  freeShippingThreshold?: number
  
  // SEO & Meta
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  
  // Social Media
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  
  // Business Information
  businessType?: string
  registrationNumber?: string
  vatNumber?: string
  
  // Metadata
  updatedBy?: mongoose.Types.ObjectId
  updatedAt: Date
  createdAt: Date
}

const GeneralSettingsSchema = new Schema<IGeneralSettings>(
  {
    // Store Information
    storeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    storeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    storePhone: {
      type: String,
      required: true,
      trim: true
    },
    storeAddress: {
      type: String,
      required: true,
      trim: true
    },
    storeCity: {
      type: String,
      required: true,
      trim: true
    },
    storeState: {
      type: String,
      required: true,
      trim: true
    },
    storeZip: {
      type: String,
      required: true,
      trim: true
    },
    storeCountry: {
      type: String,
      required: true,
      trim: true
    },
    storeLogo: {
      type: String,
      trim: true
    },
    storeFavicon: {
      type: String,
      trim: true
    },
    storeDescription: {
      type: String,
      trim: true,
      maxlength: 500
    },
    
    // Regional Settings
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'CAD', 'AUD']
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'bn']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    timeFormat: {
      type: String,
      default: '12h',
      enum: ['12h', '24h']
    },
    
    // Tax & Shipping
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxEnabled: {
      type: Boolean,
      default: true
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    freeShippingThreshold: {
      type: Number,
      min: 0
    },
    
    // SEO & Meta
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    
    // Social Media
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String
    },
    
    // Business Information
    businessType: {
      type: String,
      enum: ['sole_proprietor', 'partnership', 'corporation', 'llc', 'other']
    },
    registrationNumber: String,
    vatNumber: String,
    
    // Metadata
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

const GeneralSettings = mongoose.models.GeneralSettings || mongoose.model<IGeneralSettings>('GeneralSettings', GeneralSettingsSchema)

export default GeneralSettings

