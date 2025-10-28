import mongoose, { Schema, Document } from 'mongoose'

export interface IPaymentGateway {
  name: string // 'bkash', 'nagad', 'sslcommerz', 'cod', 'rocket', 'upay'
  displayName: string
  enabled: boolean
  isDefault: boolean
  config: {
    // bKash
    bkashAppKey?: string
    bkashAppSecret?: string
    bkashUsername?: string
    bkashPassword?: string
    bkashBaseURL?: string
    
    // Nagad
    nagadMerchantId?: string
    nagadMerchantKey?: string
    nagadBaseURL?: string
    
    // SSLCommerz
    sslcommerzStoreId?: string
    sslcommerzStorePassword?: string
    sslcommerzBaseURL?: string
    
    // Rocket
    rocketMerchantNumber?: string
    rocketMerchantPin?: string
    
    // Upay
    upayMerchantId?: string
    upayMerchantKey?: string
    
    // Cash on Delivery
    codInstructions?: string
    codMaxAmount?: number
    codAreas?: string[]
  }
  fees?: {
    fixed?: number
    percentage?: number
  }
  minimumAmount?: number
  maximumAmount?: number
  supportedCurrencies?: string[]
  logo?: string
  description?: string
  sortOrder?: number
}

export interface IPaymentSettings extends Document {
  // General Payment Settings
  currency: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  decimalPlaces: number
  thousandSeparator: string
  decimalSeparator: string
  
  // Payment Gateways
  gateways: IPaymentGateway[]
  
  // Payment Options
  acceptedPaymentMethods: string[]
  requireBillingAddress: boolean
  requirePhoneNumber: boolean
  saveCardDetails: boolean
  
  // Refund Settings
  autoRefundEnabled: boolean
  refundProcessingDays: number
  partialRefundAllowed: boolean
  
  // Security
  sslEnabled: boolean
  fraudDetectionEnabled: boolean
  requireCVV: boolean
  
  // Transaction Settings
  transactionPrefix: string // e.g., "TXN-"
  invoicePrefix: string // e.g., "INV-"
  
  // Mobile Banking (Bangladesh)
  mobileBankingEnabled: boolean
  mobileBankingNote?: string
  
  // Metadata
  updatedBy?: mongoose.Types.ObjectId
  updatedAt: Date
  createdAt: Date
}

const PaymentGatewaySchema = new Schema<IPaymentGateway>({
  name: {
    type: String,
    required: true,
    enum: ['bkash', 'nagad', 'sslcommerz', 'cod', 'rocket', 'upay']
  },
  displayName: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  config: {
    // bKash
    bkashAppKey: String,
    bkashAppSecret: String,
    bkashUsername: String,
    bkashPassword: String,
    bkashBaseURL: String,
    
    // Nagad
    nagadMerchantId: String,
    nagadMerchantKey: String,
    nagadBaseURL: String,
    
    // SSLCommerz
    sslcommerzStoreId: String,
    sslcommerzStorePassword: String,
    sslcommerzBaseURL: String,
    
    // Rocket
    rocketMerchantNumber: String,
    rocketMerchantPin: String,
    
    // Upay
    upayMerchantId: String,
    upayMerchantKey: String,
    
    // COD
    codInstructions: String,
    codMaxAmount: Number,
    codAreas: [String]
  },
  fees: {
    fixed: Number,
    percentage: Number
  },
  minimumAmount: Number,
  maximumAmount: Number,
  supportedCurrencies: [String],
  logo: String,
  description: String,
  sortOrder: Number
}, { _id: false })

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    // General Payment Settings
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'GBP']
    },
    currencySymbol: {
      type: String,
      default: '৳'
    },
    currencyPosition: {
      type: String,
      default: 'before',
      enum: ['before', 'after']
    },
    decimalPlaces: {
      type: Number,
      default: 2,
      min: 0,
      max: 4
    },
    thousandSeparator: {
      type: String,
      default: ','
    },
    decimalSeparator: {
      type: String,
      default: '.'
    },
    
    // Payment Gateways
    gateways: [PaymentGatewaySchema],
    
    // Payment Options
    acceptedPaymentMethods: [{
      type: String
    }],
    requireBillingAddress: {
      type: Boolean,
      default: true
    },
    requirePhoneNumber: {
      type: Boolean,
      default: true
    },
    saveCardDetails: {
      type: Boolean,
      default: false
    },
    
    // Refund Settings
    autoRefundEnabled: {
      type: Boolean,
      default: false
    },
    refundProcessingDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 30
    },
    partialRefundAllowed: {
      type: Boolean,
      default: true
    },
    
    // Security
    sslEnabled: {
      type: Boolean,
      default: true
    },
    fraudDetectionEnabled: {
      type: Boolean,
      default: true
    },
    requireCVV: {
      type: Boolean,
      default: true
    },
    
    // Transaction Settings
    transactionPrefix: {
      type: String,
      default: 'TXN-'
    },
    invoicePrefix: {
      type: String,
      default: 'INV-'
    },
    
    // Mobile Banking
    mobileBankingEnabled: {
      type: Boolean,
      default: true
    },
    mobileBankingNote: String,
    
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

const PaymentSettings = mongoose.models.PaymentSettings || mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema)

export default PaymentSettings

